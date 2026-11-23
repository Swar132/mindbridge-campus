import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta, date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User, UserPreference
from app.models.whatsapp import WhatsAppMessage, WhatsAppConversation, WhatsAppTemplate
from app.services.whatsapp_service import WhatsAppService
from app.services.wellbeing_monitor import WellbeingMonitor
from app.schemas.whatsapp import (
    WhatsAppConnectRequest,
    WhatsAppVerifyCodeRequest,
    WhatsAppPreferencesResponse,
    WhatsAppPreferencesUpdate,
    WhatsAppMessageResponse,
    WhatsAppTestMessageRequest,
    WhatsAppSimulateIncomingRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Business Platform Integration"])


# -----------------------------------------------------------------------------
# 1. Official Meta Webhook Endpoints (Verification & Inbound Processing)
# -----------------------------------------------------------------------------
@router.get("/webhook")
def meta_webhook_verification(
    request: Request
):
    """
    Official Meta WhatsApp Webhook Handshake Verification.
    Responds to Meta's GET challenge when configuring webhook callback in Meta App Dashboard.
    Query parameters:
    - hub.mode
    - hub.verify_token
    - hub.challenge
    """
    params = request.query_params
    hub_mode = params.get("hub.mode")
    hub_verify_token = params.get("hub.verify_token")
    hub_challenge = params.get("hub.challenge")

    verified_challenge = WhatsAppService.verify_webhook_challenge(hub_mode, hub_verify_token, hub_challenge)
    if verified_challenge is not None:
        # Return plain integer/string challenge directly as required by Meta specification
        return Response(content=str(verified_challenge), media_type="text/plain", status_code=200)

    raise HTTPException(status_code=403, detail="Webhook verification token mismatch or invalid mode.")


@router.post("/webhook")
async def meta_webhook_incoming(
    request: Request,
    db: Session = Depends(get_db),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256")
):
    """
    Official Meta WhatsApp Webhook Inbound Message & Delivery Status Receiver.
    Validates HMAC-SHA256 signature using WHATSAPP_APP_SECRET and processes:
    - Incoming student text messages -> Mindy AI
    - Interactive button and list replies -> 1-tap check-in, anomaly responses, counsellor requests
    - Delivery receipts (sent, delivered, read, failed)
    """
    raw_body = await request.body()
    
    # Signature validation
    if not WhatsAppService.validate_hub_signature(raw_body, x_hub_signature_256):
        logger.warning("[WHATSAPP WEBHOOK] Rejected payload due to invalid HMAC signature.")
        raise HTTPException(status_code=401, detail="Invalid X-Hub-Signature-256.")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as ex:
        logger.error(f"[WHATSAPP WEBHOOK] Malformed JSON: {ex}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    result = WhatsAppService.process_webhook_payload(payload, db)
    return result


# -----------------------------------------------------------------------------
# 2. Connection Status & Provider Metadata
# -----------------------------------------------------------------------------
@router.get("/status")
def get_whatsapp_provider_status():
    """
    Returns real-time Meta WhatsApp Cloud API connectivity, version, and credentials status.
    """
    return WhatsAppService.get_provider_status()


# -----------------------------------------------------------------------------
# 3. Student WhatsApp Preferences & Category Consents
# -----------------------------------------------------------------------------
@router.get("/preferences", response_model=WhatsAppPreferencesResponse)
def get_whatsapp_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated student's WhatsApp connection status and granular category consents.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    try:
        days = json.loads(pref.preferred_days) if pref.preferred_days else ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    except Exception:
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return WhatsAppPreferencesResponse(
        whatsapp_phone=pref.whatsapp_phone or current_user.phone_number,
        whatsapp_consent=bool(pref.whatsapp_consent),
        whatsapp_consent_at=pref.whatsapp_consent_at,
        whatsapp_enabled=bool(pref.whatsapp_enabled),
        whatsapp_verified=bool(getattr(pref, "whatsapp_verified", False)),
        whatsapp_reminders_consent=bool(getattr(pref, "whatsapp_reminders_consent", True)),
        whatsapp_weekly_summary_consent=bool(getattr(pref, "whatsapp_weekly_summary_consent", True)),
        whatsapp_alerts_consent=bool(getattr(pref, "whatsapp_alerts_consent", True)),
        whatsapp_followup_consent=bool(getattr(pref, "whatsapp_followup_consent", True)),
        whatsapp_counsellor_consent=bool(getattr(pref, "whatsapp_counsellor_consent", True)),
        whatsapp_mindy_consent=bool(getattr(pref, "whatsapp_mindy_consent", True)),
        quiet_hours_start=pref.quiet_hours_start or "22:00",
        quiet_hours_end=pref.quiet_hours_end or "07:00",
        preferred_days=days,
        is_paused=bool(getattr(pref, "is_paused", False)),
        paused_until=getattr(pref, "paused_until", None),
        provider_status=WhatsAppService.get_provider_status()
    )


@router.put("/preferences", response_model=WhatsAppPreferencesResponse)
def update_whatsapp_preferences(
    updates: WhatsAppPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates granular notification consents (reminders, weekly summaries, alerts, counsellor updates) and quiet hours.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if updates.whatsapp_enabled is not None:
        pref.whatsapp_enabled = updates.whatsapp_enabled
    if updates.whatsapp_reminders_consent is not None:
        pref.whatsapp_reminders_consent = updates.whatsapp_reminders_consent
    if updates.whatsapp_weekly_summary_consent is not None:
        pref.whatsapp_weekly_summary_consent = updates.whatsapp_weekly_summary_consent
    if updates.whatsapp_alerts_consent is not None:
        pref.whatsapp_alerts_consent = updates.whatsapp_alerts_consent
    if updates.whatsapp_followup_consent is not None:
        pref.whatsapp_followup_consent = updates.whatsapp_followup_consent
    if updates.whatsapp_counsellor_consent is not None:
        pref.whatsapp_counsellor_consent = updates.whatsapp_counsellor_consent
    if updates.whatsapp_mindy_consent is not None:
        pref.whatsapp_mindy_consent = updates.whatsapp_mindy_consent
    if updates.quiet_hours_start is not None:
        pref.quiet_hours_start = updates.quiet_hours_start
    if updates.quiet_hours_end is not None:
        pref.quiet_hours_end = updates.quiet_hours_end
    if updates.preferred_days is not None:
        pref.preferred_days = json.dumps(updates.preferred_days)
    if updates.is_paused is not None:
        pref.is_paused = updates.is_paused
    if updates.paused_until is not None:
        pref.paused_until = updates.paused_until

    db.commit()
    db.refresh(pref)

    return get_whatsapp_preferences(current_user=current_user, db=db)


# -----------------------------------------------------------------------------
# 4. Connect, Verify, & Disconnect Student WhatsApp Account
# -----------------------------------------------------------------------------
@router.post("/connect")
def connect_whatsapp_number(
    payload: WhatsAppConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connects student WhatsApp phone number in standard E.164 format.
    Generates a 6-digit verification code and initiates opt-in.
    """
    cleaned = WhatsAppService.clean_phone_number(payload.phone_number)
    if not WhatsAppService.validate_phone(cleaned):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid phone number in E.164 format (e.g. +919876543210)."
        )

    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Explicit opt-in consent is required to connect WhatsApp notifications."
        )

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    # Generate 6-digit verification code
    import random
    code = f"{random.randint(100000, 999999)}"

    pref.whatsapp_phone = cleaned
    pref.whatsapp_consent = True
    pref.whatsapp_consent_at = datetime.now(timezone.utc)
    pref.whatsapp_enabled = True
    pref.whatsapp_verified = True  # Instant activation for student ease
    pref.whatsapp_verification_code = code

    # Update user phone number if not yet set
    if not current_user.phone_number:
        current_user.phone_number = cleaned

    db.commit()

    # Send welcome / confirmation message
    welcome_text = (
        f"🌿 *Welcome to MindBridge Campus, {current_user.full_name}!* 🌿\n\n"
        "Your WhatsApp wellbeing companion is now connected! You can receive gentle check-in reminders, "
        "personalized weekly summaries, and talk directly with Mindy AI anytime.\n\n"
        "Reply with *'Check in'* to log today's mood, or ask Mindy any question about coursework, "
        "placement prep, or stress relief. Reply *STOP* anytime to opt out."
    )
    buttons = [
        {"id": "checkin_start", "title": "Log Check-in 🌿"},
        {"id": "talk_to_mindy", "title": "Talk to Mindy 💬"}
    ]
    WhatsAppService.send_interactive_buttons_sync(
        phone_number=cleaned,
        body_text=welcome_text,
        buttons=buttons,
        db=db,
        user_id=current_user.id,
        context="welcome_optin"
    )

    return {
        "success": True,
        "message": f"Successfully connected WhatsApp number {cleaned}.",
        "phone_number": cleaned,
        "verification_code": code,
        "is_verified": True
    }


@router.post("/verify-code")
def verify_whatsapp_code(
    payload: WhatsAppVerifyCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies the 6-digit connection code.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref or not pref.whatsapp_phone:
        raise HTTPException(status_code=400, detail="No WhatsApp number currently linked.")

    if pref.whatsapp_verification_code and pref.whatsapp_verification_code != payload.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    pref.whatsapp_verified = True
    pref.whatsapp_verification_code = None
    db.commit()

    return {"success": True, "message": "WhatsApp number verified successfully!"}


@router.post("/disconnect")
def disconnect_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes WhatsApp consent, disconnects number, and mutes all future notifications.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    phone = pref.whatsapp_phone if pref else None
    if pref:
        pref.whatsapp_consent = False
        pref.whatsapp_enabled = False
        pref.whatsapp_verified = False
        pref.whatsapp_phone = None
        db.commit()

    if phone:
        WhatsAppService.send_text_message_sync(
            phone_number=phone,
            text_content="Your WhatsApp notifications for MindBridge Campus have been disconnected. You can reconnect anytime from your profile settings. Take care! 🌿",
            db=db,
            user_id=current_user.id,
            context="disconnect"
        )

    return {"success": True, "message": "WhatsApp connection successfully removed and consent revoked."}


# -----------------------------------------------------------------------------
# 5. Outbound Test Message Dispatch
# -----------------------------------------------------------------------------
@router.post("/send-test")
def send_test_whatsapp_message(
    payload: WhatsAppTestMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends an immediate test WhatsApp notification to the authenticated student's number
    to verify delivery and interactive button rendering.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    target_phone = payload.phone_number or (pref.whatsapp_phone if pref else None) or current_user.phone_number

    if not target_phone:
        raise HTTPException(status_code=400, detail="No WhatsApp phone number provided or linked.")

    cleaned = WhatsAppService.clean_phone_number(target_phone)
    if not WhatsAppService.validate_phone(cleaned):
        raise HTTPException(status_code=400, detail=f"Invalid phone number format: {target_phone}")

    student_name = current_user.full_name or "Student"
    test_body = payload.custom_text or (
        f"🌿 *MindBridge Campus WhatsApp Test* 🌿\n\n"
        f"Hi {student_name}! Your official WhatsApp connection is active. "
        "You will receive gentle check-in reminders, wellbeing insights, and 24/7 access to Mindy AI right here."
    )

    if payload.message_type == "text":
        res = WhatsAppService.send_text_message_sync(
            phone_number=cleaned,
            text_content=test_body,
            db=db,
            user_id=current_user.id,
            context="test_dispatch"
        )
    else:
        # Default to rich interactive buttons
        buttons = [
            {"id": "checkin_start", "title": "Log Check-in 🌿"},
            {"id": "talk_to_mindy", "title": "Talk to Mindy 💬"},
            {"id": "anomaly_doing_fine", "title": "Doing Fine 👍"}
        ]
        res = WhatsAppService.send_interactive_buttons_sync(
            phone_number=cleaned,
            body_text=test_body,
            buttons=buttons,
            db=db,
            user_id=current_user.id,
            context="test_dispatch"
        )

    return {
        "success": res.get("success", False),
        "recipient": cleaned,
        "status": res.get("status"),
        "wa_message_id": res.get("wa_message_id"),
        "error": res.get("error")
    }


# -----------------------------------------------------------------------------
# 6. Student Message History & Delivery Log
# -----------------------------------------------------------------------------
@router.get("/messages", response_model=List[WhatsAppMessageResponse])
def get_whatsapp_messages(
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated student's WhatsApp conversation logs, inbound replies,
    and message delivery statuses.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    student_phone = pref.whatsapp_phone if pref else current_user.phone_number

    query = db.query(WhatsAppMessage)
    if student_phone:
        query = query.filter(
            (WhatsAppMessage.user_id == current_user.id) | (WhatsAppMessage.phone_number == student_phone)
        )
    else:
        query = query.filter(WhatsAppMessage.user_id == current_user.id)

    messages = query.order_by(WhatsAppMessage.created_at.desc()).limit(limit).all()
    return messages


# -----------------------------------------------------------------------------
# 7. Simulation & Development Testing Endpoint
# -----------------------------------------------------------------------------
@router.post("/simulate-incoming")
def simulate_incoming_whatsapp_message(
    payload: WhatsAppSimulateIncomingRequest,
    db: Session = Depends(get_db)
):
    """
    Testing & Development Simulator:
    Simulates an incoming student WhatsApp message or interactive button click
    without requiring a live webhook forwarder (e.g. ngrok).
    Executes the exact same parsing, Mindy AI routing, and response logic as live Meta webhooks.
    """
    cleaned = WhatsAppService.clean_phone_number(payload.phone_number)
    mock_msg_id = f"wamid.sim_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

    if payload.message_type == "button_reply" and payload.button_id:
        simulated_msg = {
            "id": mock_msg_id,
            "from": cleaned.replace("+", ""),
            "type": "interactive",
            "interactive": {
                "type": "button_reply",
                "button_reply": {
                    "id": payload.button_id,
                    "title": payload.button_title or payload.button_id
                }
            }
        }
    else:
        simulated_msg = {
            "id": mock_msg_id,
            "from": cleaned.replace("+", ""),
            "type": "text",
            "text": {
                "body": payload.text or "Hello Mindy!"
            }
        }

    webhook_payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "simulated_account_1",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {"display_phone_number": "15550001", "phone_number_id": "10001"},
                            "messages": [simulated_msg]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }

    result = WhatsAppService.process_webhook_payload(webhook_payload, db)
    return {
        "simulation_success": True,
        "input_message": payload.text or payload.button_id,
        "result": result
    }


# -----------------------------------------------------------------------------
# 8. Background Scheduled Sweep for WhatsApp Reminders & Follow-Ups
# -----------------------------------------------------------------------------
@router.post("/cron/dispatch-due")
def trigger_whatsapp_cron_sweep(
    db: Session = Depends(get_db)
):
    """
    Idempotent scheduled cron endpoint for external pingers or Render background cron jobs.
    Evaluates due daily check-in reminders, weekly reports, and gradual follow-ups
    specifically checking students with active WhatsApp channels enabled.
    """
    cycle_result = WellbeingMonitor.run_monitoring_cycle(db)
    return {
        "status": "success",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "cycle_result": cycle_result
    }
