import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    """
    Official Meta WhatsApp Cloud API Provider Abstraction.
    
    Meta WhatsApp Cloud API Guidelines & Cost Structure:
    1. Meta provides 1,000 free service (user-initiated) conversations per month.
    2. Business-initiated notifications (reminders, weekly summaries) require:
       - A verified Meta Business Manager account
       - Meta WhatsApp Business App ID & System User Access Token
       - Pre-approved Meta Message Templates (e.g. `mindbridge_checkin_reminder`, `mindbridge_weekly_summary`)
       - A valid payment method attached to Meta Business Account for volume exceeding tier limits.
    3. To ensure 100% cost-free operation for universities without incurring unexpected charges,
       this service remains SAFELY INACTIVE until the administrator explicitly configures official
       Meta Cloud API credentials in environment variables.
    4. Unofficial browser automation, Selenium, or third-party paid aggregators are STRICTLY PROHIBITED.
    """

    @staticmethod
    def is_configured() -> bool:
        """
        Returns True only if valid Meta WhatsApp Cloud API credentials are provided.
        """
        return bool(
            settings.WHATSAPP_PHONE_NUMBER_ID and 
            settings.WHATSAPP_ACCESS_TOKEN and 
            settings.WHATSAPP_BUSINESS_ACCOUNT_ID
        )

    @staticmethod
    def get_provider_status() -> Dict[str, Any]:
        """
        Returns the real-time operational status and configuration guide for WhatsApp integration.
        """
        configured = WhatsAppService.is_configured()
        return {
            "is_active": configured,
            "provider": "Meta WhatsApp Cloud API (Official)",
            "status": "active" if configured else "inactive_unconfigured",
            "free_allowance_info": "Meta includes 1,000 free service conversations per month. Outbound business templates require an active Meta Developer app.",
            "requires_action": not configured,
            "setup_guide_summary": (
                "To enable free official WhatsApp notifications: "
                "1. Create a free Meta Developer app at developers.facebook.com with the WhatsApp product. "
                "2. Obtain your WhatsApp Phone Number ID and System User Access Token. "
                "3. Submit the required notification templates (mindbridge_daily_reminder, mindbridge_weekly_report). "
                "4. Add WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, and WHATSAPP_BUSINESS_ACCOUNT_ID to your environment variables."
            )
        }

    @staticmethod
    def clean_phone_number(phone: str, default_country: str = "+91") -> str:
        """
        Cleans and formats phone number to standard E.164.
        """
        if not phone:
            return ""
        # Remove whitespace, dashes, parens
        digits = re.sub(r"[^\d+]", "", phone.strip())
        if not digits.startswith("+"):
            # Assume India (+91) if 10 digits
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

    @staticmethod
    async def send_template_message(
        recipient_phone: str,
        template_name: str,
        parameters: list,
        language_code: str = "en"
    ) -> Dict[str, Any]:
        """
        Sends an official pre-approved template message via Meta WhatsApp Cloud API.
        """
        if not WhatsAppService.is_configured():
            logger.info("[WHATSAPP] Meta Cloud API credentials not configured. Skipping delivery.")
            return {
                "success": False,
                "status": "disabled",
                "message": "WhatsApp integration is not configured with official Meta Cloud credentials."
            }

        cleaned = WhatsAppService.clean_phone_number(recipient_phone)
        if not WhatsAppService.validate_phone(cleaned):
            return {
                "success": False,
                "status": "invalid_phone",
                "message": f"Invalid recipient phone number format: {recipient_phone}"
            }

        # Format recipient without '+' for Meta Graph API
        meta_recipient = cleaned.replace("+", "")
        url = f"https://graph.facebook.com/v21.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": meta_recipient,
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

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    data = res.json()
                    logger.info(f"[WHATSAPP] Successfully dispatched template {template_name} to {cleaned}")
                    return {
                        "success": True,
                        "status": "delivered",
                        "message_id": data.get("messages", [{}])[0].get("id")
                    }
                else:
                    logger.error(f"[WHATSAPP] Meta API returned {res.status_code}: {res.text}")
                    return {
                        "success": False,
                        "status": "failed",
                        "error": res.text
                    }
        except Exception as ex:
            logger.error(f"[WHATSAPP] Exception dispatching template message: {ex}")
            return {
                "success": False,
                "status": "error",
                "error": str(ex)
            }
