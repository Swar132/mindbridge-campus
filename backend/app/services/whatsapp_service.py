import hmac
import hashlib
import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User, UserPreference
from app.models.whatsapp import WhatsAppMessage, WhatsAppConversation, WhatsAppTemplate
from app.models.ai import AIConversation, AIMessage, StudentMemory
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.services.ai_service import generate_ai_response, extract_and_update_student_memories

logger = logging.getLogger(__name__)

# Campus Counsellor Details (Standardized across MindBridge Campus)
COUNSELLOR_NAME = "Dr. Nitu Singh Bhadouria"
COUNSELLOR_LOCATION = "Counselling Room, SAC I, First Floor"
COUNSELLOR_EMAIL = "nitusingh_b@dau.ac.in"

# Meta API Graph Base
GRAPH_API_VERSION = getattr(settings, "WHATSAPP_API_VERSION", "v21.0") or "v21.0"


class WhatsAppService:
    """
    Official Meta WhatsApp Business Cloud API Integration Service.
    
    Provides:
    - Official Graph API HTTP client for outbound messages (text, interactive buttons, lists, templates)
    - Webhook validation (hub.verify_token) and HMAC-SHA256 signature verification (X-Hub-Signature-256)
    - Inbound message routing to Mindy Conversational AI, Check-in logger, and Anomaly alert resolver
    - 24-hour customer service window tracking with compliant template fallbacks
    - Opt-in, STOP / UNSUBSCRIBE / START compliance handling
    - Delivery status tracking (sent, delivered, read, failed)
    - Development and test simulation capabilities with full database persistence
    """

    @staticmethod
    def is_configured() -> bool:
        """
        Returns True only if official Meta WhatsApp Cloud API credentials are provided.
        """
        return bool(
            settings.WHATSAPP_PHONE_NUMBER_ID and 
            settings.WHATSAPP_ACCESS_TOKEN and 
            settings.WHATSAPP_BUSINESS_ACCOUNT_ID
        )

    @staticmethod
    def get_provider_status() -> Dict[str, Any]:
        """
        Returns operational status, Meta credentials check, and free tier details.
        """
        configured = WhatsAppService.is_configured()
        return {
            "is_active": configured,
            "provider": "Meta WhatsApp Business Cloud API (Official)",
            "api_version": GRAPH_API_VERSION,
            "phone_number_id": settings.WHATSAPP_PHONE_NUMBER_ID if configured else None,
            "business_account_id": settings.WHATSAPP_BUSINESS_ACCOUNT_ID if configured else None,
            "status": "active" if configured else "inactive_unconfigured",
            "webhook_verify_token_configured": bool(getattr(settings, "WHATSAPP_VERIFY_TOKEN", "")),
            "app_secret_configured": bool(getattr(settings, "WHATSAPP_APP_SECRET", "")),
            "free_allowance_info": (
                "Meta includes 1,000 free service (user-initiated) conversations per month. "
                "Outbound business-initiated notifications use pre-approved utility templates."
            ),
            "setup_guide_summary": (
                "To connect official Meta WhatsApp Cloud API: "
                "1. Create a free Meta Developer app at developers.facebook.com with WhatsApp product. "
                "2. In WhatsApp > API Setup, copy your Phone Number ID and generate a System User Access Token. "
                "3. In Webhooks, set your Callback URL to https://your-domain.com/api/whatsapp/webhook and enter your verify token. "
                "4. Configure WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID, and WHATSAPP_APP_SECRET."
            )
        }

    # -------------------------------------------------------------------------
    # Phone Number Normalization & Validation
    # -------------------------------------------------------------------------
    @staticmethod
    def clean_phone_number(phone: str, default_country: str = "+91") -> str:
        """
        Cleans and formats phone number to standard E.164.
        """
        if not phone:
            return ""
        digits = re.sub(r"[^\d+]", "", str(phone).strip())
        if not digits.startswith("+"):
            if len(digits) == 10:
                digits = f"{default_country}{digits}"
            else:
                digits = f"+{digits}"
        return digits

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """
        Validates E.164 format.
        """
        cleaned = WhatsAppService.clean_phone_number(phone)
        pattern = r"^\+[1-9]\d{7,14}$"
        return bool(re.match(pattern, cleaned))

    # -------------------------------------------------------------------------
    # Webhook Verification & HMAC Signature Validation
    # -------------------------------------------------------------------------
    @staticmethod
    def verify_webhook_challenge(hub_mode: Optional[str], hub_verify_token: Optional[str], hub_challenge: Optional[str]) -> Optional[str]:
        """
        Handles Meta's GET verification handshake.
        Returns the hub_challenge string when verified, or None.
        """
        expected_token = getattr(settings, "WHATSAPP_VERIFY_TOKEN", "mindbridge_campus_webhook_verify_token_2026")
        if hub_mode == "subscribe" and hub_verify_token == expected_token:
            logger.info("[WHATSAPP WEBHOOK] Verified subscription challenge successfully.")
            return hub_challenge
        logger.warning(f"[WHATSAPP WEBHOOK] Verification failed. Mode: {hub_mode}, Token match: {hub_verify_token == expected_token}")
        return None

    @staticmethod
    def validate_hub_signature(raw_body: bytes, signature_header: Optional[str]) -> bool:
        """
        Validates the X-Hub-Signature-256 header sent by Meta using WHATSAPP_APP_SECRET.
        """
        secret = getattr(settings, "WHATSAPP_APP_SECRET", "")
        if not secret:
            # If app secret is not yet configured, allow in development mode with log
            logger.debug("[WHATSAPP] WHATSAPP_APP_SECRET not set; signature verification bypassed in dev.")
            return True

        if not signature_header or not signature_header.startswith("sha256="):
            logger.warning("[WHATSAPP] Missing or invalid X-Hub-Signature-256 format.")
            return False

        received_hash = signature_header.replace("sha256=", "").strip()
        expected_hash = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(received_hash, expected_hash)

    # -------------------------------------------------------------------------
    # 24-Hour Customer Service Window Detection
    # -------------------------------------------------------------------------
    @staticmethod
    def is_within_24h_window(phone: str, db: Session) -> bool:
        """
        Determines if student is inside the 24-hour service window opened by their latest message.
        Inside this window, freeform text and rich interactive messages (buttons/lists) are permitted without templates.
        """
        cleaned = WhatsAppService.clean_phone_number(phone)
        conv = db.query(WhatsAppConversation).filter(WhatsAppConversation.phone_number == cleaned).first()
        if not conv or not conv.last_user_message_at:
            return False

        last_msg = conv.last_user_message_at
        if last_msg.tzinfo is None:
            last_msg = last_msg.replace(tzinfo=timezone.utc)

        diff = datetime.now(timezone.utc) - last_msg
        return diff < timedelta(hours=24)

    # -------------------------------------------------------------------------
    # Message Dispatch Core (HTTP Call to Meta or Development Fallback)
    # -------------------------------------------------------------------------
    @staticmethod
    async def _send_meta_request(payload: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Sends raw payload to Meta WhatsApp Cloud API.
        Returns: (success, wa_message_id, error_message)
        """
        if not WhatsAppService.is_configured():
            # Development/Sandbox mode: Generate deterministic mock ID
            mock_id = f"wamid.mock_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
            logger.info(f"[WHATSAPP SIMULATION] Credentials unconfigured. Simulated dispatch: {payload.get('type')}")
            return True, mock_id, None

        phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    data = res.json()
                    wa_id = data.get("messages", [{}])[0].get("id")
                    return True, wa_id, None
                else:
                    err_text = res.text
                    logger.error(f"[WHATSAPP ERROR] Meta API returned {res.status_code}: {err_text}")
                    return False, None, f"Meta API Error ({res.status_code}): {err_text[:200]}"
        except Exception as ex:
            logger.error(f"[WHATSAPP EXCEPTION] HTTP dispatch failed: {ex}")
            return False, None, str(ex)

    @staticmethod
    def _send_meta_request_sync(payload: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Synchronous Meta Graph API request for background workers, schedulers, and sync services.
        """
        if not WhatsAppService.is_configured():
            mock_id = f"wamid.mock_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
            logger.info(f"[WHATSAPP SIMULATION] Credentials unconfigured. Simulated sync dispatch: {payload.get('type')}")
            return True, mock_id, None

        phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    data = res.json()
                    wa_id = data.get("messages", [{}])[0].get("id")
                    return True, wa_id, None
                else:
                    err_text = res.text
                    logger.error(f"[WHATSAPP ERROR] Meta API returned {res.status_code}: {err_text}")
                    return False, None, f"Meta API Error ({res.status_code}): {err_text[:200]}"
        except Exception as ex:
            logger.error(f"[WHATSAPP EXCEPTION] HTTP sync dispatch failed: {ex}")
            return False, None, str(ex)

    @staticmethod
    def send_text_message_sync(
        phone_number: str,
        text_content: str,
        db: Session,
        user_id: Optional[int] = None,
        context: str = "general",
        preview_url: bool = False
    ) -> Dict[str, Any]:
        """
        Synchronous text message dispatch. Persists to whatsapp_messages.
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": text_content
            }
        }

        success, wa_id, err = WhatsAppService._send_meta_request_sync(payload)

        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="text",
            body=text_content,
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    @staticmethod
    def send_interactive_buttons_sync(
        phone_number: str,
        body_text: str,
        buttons: List[Dict[str, str]],
        db: Session,
        user_id: Optional[int] = None,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = "MindBridge Campus • Student Wellbeing",
        context: str = "general"
    ) -> Dict[str, Any]:
        """
        Synchronous Interactive Buttons message dispatch. Persists to whatsapp_messages.
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        formatted_buttons = []
        for idx, btn in enumerate(buttons[:3]):
            formatted_buttons.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", f"btn_{idx}"),
                    "title": btn.get("title", f"Option {idx+1}")[:20]
                }
            })

        action_data: Dict[str, Any] = {"buttons": formatted_buttons}
        interactive_data: Dict[str, Any] = {
            "type": "button",
            "body": {"text": body_text},
            "action": action_data
        }

        if header_text:
            interactive_data["header"] = {"type": "text", "text": header_text[:60]}
        if footer_text:
            interactive_data["footer"] = {"text": footer_text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "interactive",
            "interactive": interactive_data
        }

        success, wa_id, err = WhatsAppService._send_meta_request_sync(payload)

        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="interactive_button",
            body=body_text,
            payload=json.dumps(formatted_buttons),
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    # -------------------------------------------------------------------------
    # High-Level Outbound Message Methods
    # -------------------------------------------------------------------------
    @staticmethod
    async def send_text_message(
        phone_number: str,
        text_content: str,
        db: Session,
        user_id: Optional[int] = None,
        context: str = "general",
        preview_url: bool = False
    ) -> Dict[str, Any]:
        """
        Sends a standard text message. Persists into whatsapp_messages table.
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": text_content
            }
        }

        success, wa_id, err = await WhatsAppService._send_meta_request(payload)

        # Persist message log
        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="text",
            body=text_content,
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    @staticmethod
    async def send_interactive_buttons(
        phone_number: str,
        body_text: str,
        buttons: List[Dict[str, str]],
        db: Session,
        user_id: Optional[int] = None,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = "MindBridge Campus • Student Wellbeing",
        context: str = "general"
    ) -> Dict[str, Any]:
        """
        Sends an official Meta Interactive Button message (up to 3 quick-reply buttons).
        Example buttons: [{"id": "checkin_ok", "title": "Doing Fine 👍"}, ...]
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        # Meta restricts buttons to maximum of 3 items, titles up to 20 chars
        formatted_buttons = []
        for idx, btn in enumerate(buttons[:3]):
            formatted_buttons.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", f"btn_{idx}"),
                    "title": btn.get("title", f"Option {idx+1}")[:20]
                }
            })

        action_data: Dict[str, Any] = {"buttons": formatted_buttons}
        interactive_data: Dict[str, Any] = {
            "type": "button",
            "body": {"text": body_text},
            "action": action_data
        }

        if header_text:
            interactive_data["header"] = {"type": "text", "text": header_text[:60]}
        if footer_text:
            interactive_data["footer"] = {"text": footer_text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "interactive",
            "interactive": interactive_data
        }

        success, wa_id, err = await WhatsAppService._send_meta_request(payload)

        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="interactive_button",
            body=body_text,
            payload=json.dumps(formatted_buttons),
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    @staticmethod
    async def send_interactive_list(
        phone_number: str,
        body_text: str,
        button_label: str,
        sections: List[Dict[str, Any]],
        db: Session,
        user_id: Optional[int] = None,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = "MindBridge Campus",
        context: str = "general"
    ) -> Dict[str, Any]:
        """
        Sends an official Meta Interactive List message (up to 10 rows across sections).
        Ideal for choosing mood categories, wellbeing resource guides, or coping topics.
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        interactive_data: Dict[str, Any] = {
            "type": "list",
            "body": {"text": body_text},
            "action": {
                "button": button_label[:20],
                "sections": sections
            }
        }
        if header_text:
            interactive_data["header"] = {"type": "text", "text": header_text[:60]}
        if footer_text:
            interactive_data["footer"] = {"text": footer_text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "interactive",
            "interactive": interactive_data
        }

        success, wa_id, err = await WhatsAppService._send_meta_request(payload)

        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="interactive_list",
            body=body_text,
            payload=json.dumps(sections),
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    @staticmethod
    async def send_template_message(
        phone_number: str,
        template_name: str,
        parameters: List[str],
        db: Session,
        user_id: Optional[int] = None,
        language_code: str = "en",
        context: str = "general"
    ) -> Dict[str, Any]:
        """
        Sends a pre-approved Meta message template for business-initiated notifications
        outside the 24-hour service window.
        """
        cleaned = WhatsAppService.clean_phone_number(phone_number)
        meta_to = cleaned.replace("+", "")

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": meta_to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": str(p)} for p in parameters]
                    }
                ]
            }
        }

        success, wa_id, err = await WhatsAppService._send_meta_request(payload)

        msg_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_id,
            phone_number=cleaned,
            direction="outbound",
            message_type="template",
            body=f"Template: {template_name} (Params: {', '.join(parameters)})",
            payload=json.dumps({"template_name": template_name, "parameters": parameters}),
            status="sent" if success else "failed",
            error_message=err,
            conversation_context=context
        )
        db.add(msg_record)
        db.commit()
        db.refresh(msg_record)

        return {
            "success": success,
            "message_id": msg_record.id,
            "wa_message_id": wa_id,
            "status": msg_record.status,
            "error": err
        }

    # -------------------------------------------------------------------------
    # Inbound Webhook Event Processor (Sync & Thread-Safe)
    # -------------------------------------------------------------------------
    @staticmethod
    def process_webhook_payload(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Parses official Meta webhook callbacks.
        Handles:
        1. Delivery status updates (sent, delivered, read, failed)
        2. Inbound student messages:
           - Global commands (STOP, START, HELP)
           - Interactive button replies (1-tap check-ins, anomaly replies, Mindy triggers)
           - Natural language messages -> routed to Mindy Conversational AI
        """
        processed_count = 0
        events_handled = []

        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                
                # A. Handle Message Status Updates
                statuses = value.get("statuses", [])
                for status_obj in statuses:
                    wa_id = status_obj.get("id")
                    status_val = status_obj.get("status")  # "sent", "delivered", "read", "failed"

                    if wa_id and status_val:
                        msg = db.query(WhatsAppMessage).filter(WhatsAppMessage.wa_message_id == wa_id).first()
                        if msg:
                            msg.status = status_val
                            if status_val == "failed":
                                errors = status_obj.get("errors", [{}])
                                msg.error_code = str(errors[0].get("code", "UNKNOWN"))
                                msg.error_message = errors[0].get("message", "Delivery failed")
                            db.commit()
                            events_handled.append({"type": "status_update", "wa_id": wa_id, "status": status_val})
                            processed_count += 1

                # B. Handle Incoming Messages
                messages = value.get("messages", [])
                for msg_obj in messages:
                    res = WhatsAppService._handle_incoming_message(msg_obj, db)
                    if res:
                        events_handled.append(res)
                        processed_count += 1

        return {
            "success": True,
            "processed_count": processed_count,
            "events": events_handled
        }

    @staticmethod
    def _handle_incoming_message(msg_obj: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
        """
        Processes an individual incoming message from Meta webhook payload.
        """
        wa_msg_id = msg_obj.get("id")
        from_phone = WhatsAppService.clean_phone_number(msg_obj.get("from", ""))
        msg_type = msg_obj.get("type", "text")
        now = datetime.now(timezone.utc)

        # Deduplication check
        if wa_msg_id:
            existing = db.query(WhatsAppMessage).filter(WhatsAppMessage.wa_message_id == wa_msg_id).first()
            if existing:
                return {"type": "duplicate_skipped", "wa_id": wa_msg_id}

        # Find student by phone number
        user = db.query(User).filter(User.phone_number == from_phone).first()
        if not user:
            # Also check user_preferences.whatsapp_phone
            pref = db.query(UserPreference).filter(UserPreference.whatsapp_phone == from_phone).first()
            if pref:
                user = db.query(User).filter(User.id == pref.user_id).first()

        user_id = user.id if user else None

        # Update or create active WhatsAppConversation
        conv = db.query(WhatsAppConversation).filter(WhatsAppConversation.phone_number == from_phone).first()
        if not conv and user_id:
            conv = WhatsAppConversation(user_id=user_id, phone_number=from_phone)
            db.add(conv)
            db.commit()
            db.refresh(conv)

        if conv:
            conv.last_user_message_at = now
            db.commit()

        # Parse content based on type
        text_body = ""
        payload_data = None
        button_id = None

        if msg_type == "text":
            text_body = msg_obj.get("text", {}).get("body", "").strip()
        elif msg_type == "interactive":
            interactive = msg_obj.get("interactive", {})
            itype = interactive.get("type")
            if itype == "button_reply":
                button_obj = interactive.get("button_reply", {})
                button_id = button_obj.get("id")
                text_body = button_obj.get("title", "")
                payload_data = json.dumps({"button_id": button_id, "title": text_body})
            elif itype == "list_reply":
                list_obj = interactive.get("list_reply", {})
                button_id = list_obj.get("id")
                text_body = list_obj.get("title", "")
                payload_data = json.dumps({"list_id": button_id, "title": text_body})

        # Save inbound message log
        inbound_record = WhatsAppMessage(
            user_id=user_id,
            wa_message_id=wa_msg_id,
            phone_number=from_phone,
            direction="inbound",
            message_type=msg_type,
            body=text_body,
            payload=payload_data,
            status="delivered",
            conversation_context="student_reply"
        )
        db.add(inbound_record)
        db.commit()

        # Route the message
        # 1. Global Compliance Commands: STOP / UNSUBSCRIBE / START / HELP
        normalized_cmd = text_body.upper().strip()
        if normalized_cmd in ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"]:
            return WhatsAppService._handle_opt_out(from_phone, user, db)

        if normalized_cmd in ["START", "UNSTOP", "RESUME"]:
            return WhatsAppService._handle_opt_in(from_phone, user, db)

        if normalized_cmd in ["HELP", "INFO", "MENU"]:
            return WhatsAppService._handle_help_menu(from_phone, user, db)

        # 2. Interactive Button Replies (e.g. Check-in, Anomaly, Counsellor)
        if button_id:
            return WhatsAppService._handle_button_reply(button_id, text_body, from_phone, user, conv, db)

        # 3. Natural Language Student Message -> Mindy Conversational AI
        return WhatsAppService._handle_mindy_ai_chat(text_body, from_phone, user, conv, db)

    # -------------------------------------------------------------------------
    # Inbound Handlers (Compliance, Interactive, and AI)
    # -------------------------------------------------------------------------
    @staticmethod
    def _handle_opt_out(phone: str, user: Optional[User], db: Session) -> Dict[str, Any]:
        """Handles STOP / UNSUBSCRIBE compliance opt-out."""
        if user and user.preferences:
            user.preferences.whatsapp_enabled = False
            user.preferences.whatsapp_consent = False
            db.commit()

        msg = (
            "You have successfully opted out of MindBridge Campus WhatsApp notifications. "
            "You will not receive further reminders or reports here. "
            "Reply START at any time if you wish to re-enable them. Take care! 🌿"
        )
        WhatsAppService.send_text_message_sync(phone, msg, db, user_id=user.id if user else None, context="opt_out")
        return {"type": "opt_out", "phone": phone}

    @staticmethod
    def _handle_opt_in(phone: str, user: Optional[User], db: Session) -> Dict[str, Any]:
        """Handles START opt-in reactivation."""
        if user and user.preferences:
            user.preferences.whatsapp_enabled = True
            user.preferences.whatsapp_consent = True
            user.preferences.whatsapp_consent_at = datetime.now(timezone.utc)
            db.commit()

        msg = (
            f"Welcome back to MindBridge Campus, {user.full_name if user else 'Student'}! 🌿\n\n"
            "Your WhatsApp wellbeing companion has been reactivated. "
            "You will receive gentle daily check-in reminders and weekly summaries. "
            "You can talk to Mindy anytime by sending a message here, or reply HELP for options."
        )
        WhatsAppService.send_text_message_sync(phone, msg, db, user_id=user.id if user else None, context="opt_in")
        return {"type": "opt_in", "phone": phone}

    @staticmethod
    def _handle_help_menu(phone: str, user: Optional[User], db: Session) -> Dict[str, Any]:
        """Replies with a structured help menu & crisis helplines."""
        student_name = user.full_name if user else "Student"
        help_text = (
            f"🌿 *MindBridge Campus Wellbeing Help Guide*\n"
            f"Hello {student_name}! Here are quick things you can do:\n\n"
            "1. *Daily Check-in:* Reply with 'Check in' to log today's mood and sleep.\n"
            "2. *Mindy AI Support:* Send any thought, academic stress question, or placement concern to chat directly.\n"
            "3. *Pause Alerts:* Send 'Pause' to mute notifications for 7 days.\n"
            "4. *Stop Updates:* Send 'STOP' to opt out.\n\n"
            f"🤝 *Campus Counsellor:* {COUNSELLOR_NAME}\n"
            f"📍 {COUNSELLOR_LOCATION}\n"
            f"✉️ {COUNSELLOR_EMAIL}\n\n"
            "🚨 *24/7 National Helplines:* Tele-MANAS: 14416 (Toll-Free) | National Emergency: 112"
        )
        buttons = [
            {"id": "checkin_start", "title": "Log Check-in 🌿"},
            {"id": "talk_to_mindy", "title": "Talk to Mindy 💬"},
            {"id": "anomaly_counsellor", "title": "Campus Counsellor 🤝"}
        ]
        WhatsAppService.send_interactive_buttons_sync(
            phone_number=phone,
            body_text=help_text,
            buttons=buttons,
            db=db,
            user_id=user.id if user else None,
            context="help_menu"
        )
        return {"type": "help_menu", "phone": phone}

    @staticmethod
    def _handle_button_reply(
        button_id: str,
        button_title: str,
        phone: str,
        user: Optional[User],
        conv: Optional[WhatsAppConversation],
        db: Session
    ) -> Dict[str, Any]:
        """
        Handles interactive quick-reply button taps.
        """
        user_id = user.id if user else None
        student_name = user.full_name if user else "Student"

        # A. Daily Check-in Flow
        if button_id == "checkin_start":
            body = f"Hi {student_name}, how would you rate your overall mood today?"
            buttons = [
                {"id": "checkin_mood_great", "title": "Great 😊"},
                {"id": "checkin_mood_okay", "title": "Neutral / Okay 😐"},
                {"id": "checkin_mood_stressed", "title": "Stressed / Tired 😣"}
            ]
            WhatsAppService.send_interactive_buttons_sync(phone, body, buttons, db, user_id=user_id, context="checkin_flow")
            if conv:
                conv.current_state = "checkin_in_progress"
                db.commit()
            return {"type": "checkin_started", "phone": phone}

        elif button_id.startswith("checkin_mood_"):
            mood_choice = button_id.replace("checkin_mood_", "").capitalize()
            mood_map = {"Great": "Happy", "Okay": "Neutral", "Stressed": "Stressed"}
            final_mood = mood_map.get(mood_choice, "Neutral")
            intensity_map = {"Great": 8, "Okay": 5, "Stressed": 7}
            energy_map = {"Great": 8, "Okay": 5, "Stressed": 3}

            if user_id:
                now_utc = datetime.now(timezone.utc)
                db.add(MoodEntry(
                    user_id=user_id,
                    mood=final_mood,
                    intensity=intensity_map.get(mood_choice, 5),
                    energy_level=energy_map.get(mood_choice, 5),
                    notes="Logged via WhatsApp Interactive Check-in",
                    recorded_at=now_utc
                ))
                db.commit()

            reply = (
                f"Recorded! Your mood today has been noted as *{final_mood}*. 🌿\n\n"
                "Thank you for taking a moment for yourself today. "
                "Would you like to talk about anything with Mindy or need a quick relaxation exercise?"
            )
            buttons = [
                {"id": "talk_to_mindy", "title": "Talk to Mindy 💬"},
                {"id": "anomaly_doing_fine", "title": "All Good for Now 👍"}
            ]
            WhatsAppService.send_interactive_buttons_sync(phone, reply, buttons, db, user_id=user_id, context="checkin_complete")
            if conv:
                conv.current_state = "idle"
                db.commit()
            return {"type": "mood_logged", "mood": final_mood}

        # B. Anomaly Alert Interactive Responses
        elif button_id in ["anomaly_doing_fine", "response_doing_fine"]:
            WhatsAppService._resolve_student_latest_alert(user_id, "I'm doing fine.", db)
            reply = f"Thank you for letting us know, {student_name}! We're glad to hear you are doing fine. We've updated your check-in status and will continue supporting your daily rhythm quietly. 🌿"
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="anomaly_resolution")
            return {"type": "anomaly_resolved", "choice": "doing_fine"}

        elif button_id in ["anomaly_placements", "response_placements"]:
            WhatsAppService._resolve_student_latest_alert(user_id, "I've been stressed about placements.", db)
            reply = (
                "Placement seasons can feel intensely competitive and exhausting. "
                "Remember that your worth is far greater than any single interview round. 💙\n\n"
                "Mindy has specialized placement anxiety prompts and mock interview grounding tools ready for you. "
                "Feel free to reply with what's on your mind regarding placements, and Mindy will guide you step by step."
            )
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="placement_advice")
            return {"type": "anomaly_resolved", "choice": "placements"}

        elif button_id in ["anomaly_sleep", "response_sleep"]:
            WhatsAppService._resolve_student_latest_alert(user_id, "I'm having trouble sleeping.", db)
            reply = (
                "Sleep friction is very common during exam and project cycles. 🌙\n\n"
                "Here is a quick science-backed technique to try tonight:\n"
                "• *4-7-8 Breathing:* Inhale quietly through your nose for 4s, hold for 7s, exhale completely through mouth for 8s (repeat 4 times).\n"
                "• *Screen Reset:* Keep devices outside arm's reach 30 minutes before sleep.\n\n"
                "Reply anytime if you'd like Mindy to guide you through a calming wind-down reflection."
            )
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="sleep_advice")
            return {"type": "anomaly_resolved", "choice": "sleep"}

        elif button_id in ["anomaly_advice", "response_advice"]:
            WhatsAppService._resolve_student_latest_alert(user_id, "I'd like some advice.", db)
            reply = (
                "Here is a quick 3-step reset:\n"
                "1. *Step outside:* 2 minutes of fresh air and sunlight lowers cortisol.\n"
                "2. *Micro-task:* Pick just ONE small 10-minute task to complete.\n"
                "3. *Hydrate:* Drink a full glass of water.\n\n"
                "What is currently feeling like the biggest weight on your plate right now?"
            )
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="general_advice")
            return {"type": "anomaly_resolved", "choice": "advice"}

        elif button_id in ["anomaly_counsellor", "response_counsellor"]:
            WhatsAppService._resolve_student_latest_alert(user_id, "I'd like to speak with a counsellor.", db)
            reply = (
                f"You can connect directly and confidentially with our campus counsellor:\n\n"
                f"👤 *{COUNSELLOR_NAME}*\n"
                f"📍 *Location:* {COUNSELLOR_LOCATION}\n"
                f"✉️ *Email:* {COUNSELLOR_EMAIL}\n"
                f"🕒 *Walk-in / Slot:* Mon–Fri, 10:00 AM – 5:00 PM\n\n"
                "Booking takes under 30 seconds from your MindBridge Campus dashboard, or email directly for priority support. Your records remain 100% confidential."
            )
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="counsellor_referral")
            return {"type": "counsellor_referral", "phone": phone}

        elif button_id == "pause_notifications":
            if user and user.preferences:
                user.preferences.is_paused = True
                user.preferences.paused_until = (datetime.now(timezone.utc) + timedelta(days=7)).date()
                db.commit()
            reply = "All non-critical notifications have been paused for 7 days. Take all the quiet time you need! You can send 'START' anytime to resume early."
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="pause_confirmation")
            return {"type": "notifications_paused", "phone": phone}

        elif button_id == "talk_to_mindy":
            reply = f"Hi {student_name}! I'm Mindy. What's on your mind today? Whether it's coursework, sleep, placements, or just needing a breather, I'm here."
            WhatsAppService.send_text_message_sync(phone, reply, db, user_id=user_id, context="mindy_greeting")
            if conv:
                conv.current_state = "mindy_chat"
                db.commit()
            return {"type": "mindy_chat_prompted", "phone": phone}

        return {"type": "unknown_button", "button_id": button_id}

    @staticmethod
    def _resolve_student_latest_alert(user_id: Optional[int], response_text: str, db: Session):
        """Helper to resolve student's active anomaly alert upon WhatsApp response."""
        if not user_id:
            return
        from app.models.monitoring import WellbeingAnomalyAlert
        alert = (
            db.query(WellbeingAnomalyAlert)
            .filter(
                WellbeingAnomalyAlert.user_id == user_id,
                WellbeingAnomalyAlert.resolution_status.in_(["active", "active_monitoring"])
            )
            .order_by(WellbeingAnomalyAlert.created_at.desc())
            .first()
        )
        if alert:
            alert.student_response = response_text
            alert.student_response_at = datetime.now(timezone.utc)
            alert.resolution_status = "resolved_student_responded"
            alert.is_acknowledged = True
            db.commit()

    @staticmethod
    def _handle_mindy_ai_chat(
        user_message: str,
        phone: str,
        user: Optional[User],
        conv: Optional[WhatsAppConversation],
        db: Session
    ) -> Dict[str, Any]:
        """
        Routes natural language incoming WhatsApp messages directly to Mindy AI.
        Maintains conversational history in AIConversation and updates long-term student memory.
        """
        user_id = user.id if user else None
        if not user_id:
            reply = (
                "Welcome to MindBridge Campus! We don't recognize your phone number yet. "
                "Please connect your WhatsApp number in your MindBridge profile settings at https://mindbridge-campus-te1l.onrender.com "
                "to link your account."
            )
            WhatsAppService.send_text_message_sync(phone, reply, db, context="unlinked_phone")
            return {"type": "unlinked_phone", "phone": phone}

        # Retrieve or create active AIConversation
        ai_conv = None
        if conv and conv.ai_conversation_id:
            ai_conv = db.query(AIConversation).filter(AIConversation.id == conv.ai_conversation_id).first()

        if not ai_conv:
            ai_conv = AIConversation(
                user_id=user_id,
                title="WhatsApp Conversation with Mindy"
            )
            db.add(ai_conv)
            db.commit()
            db.refresh(ai_conv)
            if conv:
                conv.ai_conversation_id = ai_conv.id
                db.commit()

        # Build turn history from ai_messages
        past_msgs = db.query(AIMessage).filter(
            AIMessage.conversation_id == ai_conv.id
        ).order_by(AIMessage.created_at.desc()).limit(10).all()
        past_msgs.reverse()

        history = [{"role": ("user" if m.sender == "user" else "assistant"), "content": m.content} for m in past_msgs]

        # Record incoming user turn
        db.add(AIMessage(
            conversation_id=ai_conv.id,
            sender="user",
            content=user_message,
            message_type="text"
        ))
        db.commit()

        # Check consent to share tracking context
        consent_share = user.preferences.consent_ai_analysis if (user.preferences and user.preferences.consent_ai_analysis is not None) else True

        # Generate AI response via shared Mindy AI engine
        ai_res = generate_ai_response(
            user_message=user_message,
            user_id=user_id,
            consent_share_context=consent_share,
            db=db,
            conversation_history=history,
            current_conv_id=ai_conv.id
        )

        reply_content = ai_res.get("content", "I am here with you. What would you like to explore next?")

        # Record assistant reply turn
        db.add(AIMessage(
            conversation_id=ai_conv.id,
            sender="assistant",
            content=reply_content,
            message_type="text",
            safety_flagged=ai_res.get("safety_flagged", False),
            emergency_shown=ai_res.get("emergency_shown", False)
        ))
        db.commit()

        # Extract and update long-term memories
        try:
            extract_and_update_student_memories(user_id, user_message, reply_content, db)
        except Exception as ex:
            logger.warning(f"[WHATSAPP AI MEMORY] Memory extraction notice: {ex}")

        # Send response to student on WhatsApp
        # If crisis or safety flagged, include quick-action buttons to connect with counsellor
        if ai_res.get("safety_flagged"):
            buttons = [
                {"id": "anomaly_counsellor", "title": "Counsellor Contact 🤝"},
                {"id": "anomaly_doing_fine", "title": "I'm Safe Now 🌿"}
            ]
            WhatsAppService.send_interactive_buttons_sync(
                phone_number=phone,
                body_text=reply_content,
                buttons=buttons,
                db=db,
                user_id=user_id,
                context="mindy_crisis_response"
            )
        else:
            WhatsAppService.send_text_message_sync(
                phone_number=phone,
                text_content=reply_content,
                db=db,
                user_id=user_id,
                context="mindy_chat"
            )

        return {"type": "mindy_ai_reply", "user_id": user_id, "provider": ai_res.get("provider")}
