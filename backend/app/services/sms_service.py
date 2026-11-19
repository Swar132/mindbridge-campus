import os
import re
import secrets
from datetime import datetime, timezone, timedelta, date
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx

from app.config import settings
from app.models.user import User, UserPreference
from app.models.sms import PhoneVerification, SMSLog

# Default Indian SMS template conforming to DLT messaging guidelines
REMINDER_MESSAGE_TEMPLATE = (
    "Hey {first_name}! Take a moment for yourself today. How are you feeling? "
    "Complete your MindBridge wellbeing check-in whenever you're ready: "
    "https://mindbridge-campus-te1l.onrender.com 💙 (Reply STOP to opt out)"
)

OTP_MESSAGE_TEMPLATE = (
    "Your MindBridge Campus verification code is: {otp}. "
    "Valid for 10 minutes. Please do not share this code. 🌿"
)

OPT_OUT_MESSAGE = (
    "MindBridge Campus: You have been successfully opted out of SMS reminders. "
    "You will receive no further messages. Re-enable anytime in Sanctuary Settings."
)

def clean_phone_number(phone_raw: str, default_country: str = "+91") -> str:
    """
    Normalizes a phone number to standard E.164 format.
    E.g.: '98765 43210' with '+91' -> '+919876543210'
          '+91-98765-43210' -> '+919876543210'
          '+1 (555) 123-4567' -> '+15551234567'
    """
    cleaned = re.sub(r"[\s\-\(\)\.]", "", phone_raw.strip())
    if cleaned.startswith("+"):
        return cleaned
    # Remove leading zeros
    cleaned = cleaned.lstrip("0")
    if default_country.startswith("+"):
        return f"{default_country}{cleaned}"
    return f"+{default_country}{cleaned}"

def validate_phone_number(phone_e164: str) -> Tuple[bool, str]:
    """
    Validates E.164 format with specific handling for India (+91) and international numbers.
    """
    if not phone_e164 or not phone_e164.startswith("+"):
        return False, "Phone number must start with a valid country code (e.g. +91)."

    if not re.match(r"^\+[1-9]\d{7,14}$", phone_e164):
        return False, "Phone number must be in valid international E.164 format (7-15 digits)."

    # India specific validation: +91 followed by 10 digits starting with 6, 7, 8, or 9
    if phone_e164.startswith("+91"):
        digits = phone_e164[3:]
        if len(digits) != 10:
            return False, f"Indian phone numbers require 10 digits after +91 (received {len(digits)})."
        if digits[0] not in "6789":
            return False, "Indian mobile numbers must start with 6, 7, 8, or 9."

    return True, "Valid phone number"

def mask_phone_number(phone: str) -> str:
    """Masks phone number for privacy e.g. +91 98•••• 3210"""
    if not phone or len(phone) < 6:
        return phone or ""
    prefix = phone[:5]
    suffix = phone[-4:]
    masked_middle = "•" * max(3, len(phone) - 9)
    return f"{prefix} {masked_middle} {suffix}"

def to_utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures datetimes are timezone-aware UTC for safe comparisons."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class SMSService:
    @staticmethod
    def get_provider_status() -> Dict[str, Any]:
        """Returns the configured SMS provider name and status."""
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "").strip() or os.getenv("TWILIO_MESSAGING_SERVICE_SID", "").strip()

        fast2sms_key = os.getenv("FAST2SMS_API_KEY", "").strip()
        msg91_key = os.getenv("MSG91_AUTH_KEY", "").strip()

        if twilio_sid and twilio_token and twilio_from:
            return {
                "provider": "twilio",
                "is_live": True,
                "masked_from": mask_phone_number(twilio_from),
                "description": "Twilio Cloud SMS Gateway"
            }
        elif fast2sms_key:
            return {
                "provider": "fast2sms",
                "is_live": True,
                "masked_from": "Fast2SMS India Route",
                "description": "Fast2SMS Indian DLT SMS Gateway"
            }
        elif msg91_key:
            return {
                "provider": "msg91",
                "is_live": True,
                "masked_from": "MSG91 Route",
                "description": "MSG91 Enterprise SMS Gateway"
            }
        else:
            return {
                "provider": "simulated",
                "is_live": False,
                "masked_from": "MindBridge Campus SMS Simulator",
                "description": "Carrier-Compliant Gateway Simulator (Active for dev/testing; set TWILIO_* or FAST2SMS_* for live cellular delivery)"
            }

    @staticmethod
    def dispatch_sms(
        phone_number: str,
        message_body: str,
        message_type: str = "daily_reminder",
        user_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Sends an SMS through the configured provider (Twilio / Fast2SMS / MSG91 / Simulated)
        and logs the delivery to the persistent PostgreSQL sms_logs table.
        """
        provider_info = SMSService.get_provider_status()
        provider_name = provider_info["provider"]
        provider_msg_id = None
        delivery_status = "sent"
        error_msg = None

        # 1. Attempt Twilio
        if provider_name == "twilio":
            try:
                sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
                token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
                from_num = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
                msg_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "").strip()

                url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
                payload = {
                    "To": phone_number,
                    "Body": message_body
                }
                if msg_service_sid:
                    payload["MessagingServiceSid"] = msg_service_sid
                elif from_num:
                    payload["From"] = from_num

                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, data=payload, auth=(sid, token))
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        provider_msg_id = data.get("sid")
                        delivery_status = "delivered"
                    else:
                        delivery_status = "failed"
                        error_msg = f"Twilio HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                delivery_status = "failed"
                error_msg = str(e)

        # 2. Attempt Fast2SMS (India)
        elif provider_name == "fast2sms":
            try:
                api_key = os.getenv("FAST2SMS_API_KEY", "").strip()
                # Extract 10 digits for Indian numbers
                target_num = phone_number.replace("+91", "").strip()
                url = "https://www.fast2sms.com/dev/bulkV2"
                headers = {"authorization": api_key}
                payload = {
                    "route": "q",
                    "message": message_body,
                    "language": "english",
                    "flash": 0,
                    "numbers": target_num
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("return") is True:
                            provider_msg_id = data.get("request_id")
                            delivery_status = "delivered"
                        else:
                            delivery_status = "failed"
                            error_msg = data.get("message", "Fast2SMS error")
                    else:
                        delivery_status = "failed"
                        error_msg = f"Fast2SMS HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                delivery_status = "failed"
                error_msg = str(e)

        # 3. Simulated Provider (Reliable, persistent fallback)
        else:
            provider_msg_id = f"sim_{secrets.token_hex(8)}"
            delivery_status = "simulated"
            print(f"[SMS-SIMULATOR] Delivery to {mask_phone_number(phone_number)} | Type: {message_type}")
            print(f"                Body: {message_body}")

        # Persistent Logging to PostgreSQL
        if db:
            try:
                log_entry = SMSLog(
                    user_id=user_id,
                    phone_number=phone_number,
                    message_type=message_type,
                    message_body=message_body,
                    provider=provider_name,
                    provider_message_id=provider_msg_id,
                    status=delivery_status,
                    error_message=error_msg,
                    sent_at=datetime.now(timezone.utc)
                )
                db.add(log_entry)
                db.commit()
            except Exception as log_ex:
                print(f"[SMS] Failed to persist log entry: {log_ex}")
                try:
                    db.rollback()
                except Exception:
                    pass

        return {
            "success": delivery_status in ("sent", "delivered", "simulated"),
            "provider": provider_name,
            "status": delivery_status,
            "provider_message_id": provider_msg_id,
            "phone_masked": mask_phone_number(phone_number),
            "error": error_msg
        }

    @staticmethod
    def send_verification_otp(
        db: Session,
        user: User,
        phone_number: str
    ) -> Dict[str, Any]:
        """
        Generates and dispatches a 6-digit OTP to verify phone ownership.
        Enforces a 60-second cooldown between requests.
        """
        # Validate format
        is_valid, err = validate_phone_number(phone_number)
        if not is_valid:
            return {"success": False, "message": err}

        now = datetime.now(timezone.utc)
        one_min_ago = now - timedelta(seconds=60)

        # Rate-limiting: Check if OTP sent in last 60 seconds
        recent_req = db.query(PhoneVerification).filter(
            PhoneVerification.user_id == user.id,
            PhoneVerification.phone_number == phone_number
        ).order_by(PhoneVerification.created_at.desc()).first()

        if recent_req:
            created_utc = to_utc_aware(recent_req.created_at)
            if created_utc and created_utc >= one_min_ago:
                return {
                    "success": False,
                    "message": "Please wait at least 60 seconds before requesting a new verification code."
                }

        # Generate 6-digit cryptographic OTP
        otp_code = str(secrets.randbelow(900000) + 100000)
        expires_at = now + timedelta(minutes=10)

        # Store in PostgreSQL
        verification = PhoneVerification(
            user_id=user.id,
            phone_number=phone_number,
            otp_code=otp_code,
            created_at=now,
            expires_at=expires_at,
            is_verified=False,
            attempts=0
        )
        db.add(verification)
        db.commit()

        # Dispatch OTP SMS
        sms_body = OTP_MESSAGE_TEMPLATE.format(otp=otp_code)
        dispatch_res = SMSService.dispatch_sms(
            phone_number=phone_number,
            message_body=sms_body,
            message_type="otp",
            user_id=user.id,
            db=db
        )

        return {
            "success": True,
            "message": f"Verification code sent to {mask_phone_number(phone_number)}! Valid for 10 minutes.",
            "phone_masked": mask_phone_number(phone_number),
            "expires_in_seconds": 600,
            # In simulated mode, provide the code in response to facilitate rapid testing and onboarding
            "test_otp": otp_code if dispatch_res.get("provider") == "simulated" else None
        }

    @staticmethod
    def verify_otp_code(
        db: Session,
        user: User,
        phone_number: str,
        otp_code: str
    ) -> Dict[str, Any]:
        """
        Validates OTP code and activates verified phone status.
        """
        clean_code = otp_code.strip()
        now = datetime.now(timezone.utc)

        # Find latest pending verification for this user and phone
        record = db.query(PhoneVerification).filter(
            PhoneVerification.user_id == user.id,
            PhoneVerification.phone_number == phone_number,
            PhoneVerification.is_verified == False
        ).order_by(PhoneVerification.created_at.desc()).first()

        if not record:
            return {"success": False, "message": "No pending verification found. Please request a new code."}

        exp_utc = to_utc_aware(record.expires_at)
        if exp_utc and exp_utc < now:
            return {"success": False, "message": "Verification code has expired. Please request a new one."}

        if record.attempts >= 5:
            return {"success": False, "message": "Too many failed attempts. Please request a new code."}

        record.attempts += 1

        if record.otp_code != clean_code:
            db.commit()
            return {"success": False, "message": "Incorrect verification code. Please check and try again."}

        # Mark verified
        record.is_verified = True
        user.phone_number = phone_number
        user.phone_verified = True

        # Activate user preferences
        if user.preferences:
            user.preferences.sms_reminders_enabled = True
            user.preferences.sms_consent_given = True
            user.preferences.sms_consent_at = now
        else:
            pref = UserPreference(
                user_id=user.id,
                sms_reminders_enabled=True,
                sms_consent_given=True,
                sms_consent_at=now
            )
            db.add(pref)

        db.commit()

        # Send confirmation welcome SMS
        welcome_sms = (
            "MindBridge Campus: Your phone number is verified! 🌿 "
            "Daily wellbeing reminders are now active. "
            "Reply STOP anytime to opt out."
        )
        SMSService.dispatch_sms(
            phone_number=phone_number,
            message_body=welcome_sms,
            message_type="verification_welcome",
            user_id=user.id,
            db=db
        )

        return {
            "success": True,
            "message": "Phone number successfully verified! Daily SMS reminders are now active.",
            "phone_number": user.phone_number,
            "phone_masked": mask_phone_number(user.phone_number),
            "phone_verified": True
        }

    @staticmethod
    def send_daily_reminder(
        db: Session,
        user: User,
        is_test: bool = False
    ) -> Dict[str, Any]:
        """
        Sends the daily wellbeing check-in reminder SMS to a consented student.
        Enforces:
        1. Verified phone requirement
        2. Explicit student consent
        3. Avoid duplicate reminders if user already checked in today (unless test trigger)
        4. Avoid sending duplicate reminders on the same calendar day (unless test trigger)
        """
        if not user.phone_number or not user.phone_verified:
            return {"success": False, "message": "User does not have a verified mobile number."}

        prefs = user.preferences
        if not is_test:
            if not prefs or not prefs.sms_reminders_enabled:
                return {"success": False, "message": "SMS reminders are disabled by student preferences."}
            if not prefs.sms_consent_given:
                return {"success": False, "message": "Explicit consent for SMS reminders was revoked or not provided."}

        # Check timezone and current date
        user_tz_str = (prefs.timezone if prefs and prefs.timezone else "Asia/Kolkata")
        try:
            import zoneinfo
            user_tz = zoneinfo.ZoneInfo(user_tz_str)
        except Exception:
            user_tz = timezone.utc

        now_user = datetime.now(user_tz)
        today_user_date = now_user.date()

        # Duplicate Prevention 1: Has student already checked in today?
        if not is_test:
            from app.models.tracking import MoodEntry
            # Check mood entries today in user's timezone
            start_of_day_utc = datetime.combine(today_user_date, datetime.min.time(), tzinfo=user_tz).astimezone(timezone.utc)
            already_checked_in = db.query(MoodEntry).filter(
                MoodEntry.user_id == user.id,
                MoodEntry.recorded_at >= start_of_day_utc
            ).first()

            if already_checked_in:
                return {
                    "success": False,
                    "message": "Student has already completed their check-in today. Reminder skipped."
                }

            # Duplicate Prevention 2: Has reminder already been sent today?
            if prefs and prefs.last_reminder_sent_date == today_user_date:
                return {
                    "success": False,
                    "message": "Reminder was already sent for today. Duplicate avoided."
                }

        # Prepare message
        first_name = user.full_name.split()[0] if user.full_name else "Friend"
        prefix = "⚡ [TEST REMINDER] " if is_test else ""
        sms_text = prefix + REMINDER_MESSAGE_TEMPLATE.format(first_name=first_name)

        # Dispatch
        res = SMSService.dispatch_sms(
            phone_number=user.phone_number,
            message_body=sms_text,
            message_type="test_reminder" if is_test else "daily_reminder",
            user_id=user.id,
            db=db
        )

        # Update last sent date
        if res.get("success") and not is_test and prefs:
            prefs.last_reminder_sent_date = today_user_date
            db.commit()

        return {
            "success": res.get("success", False),
            "message": f"Daily reminder sent to {mask_phone_number(user.phone_number)}." if res.get("success") else "Failed to send SMS reminder.",
            "details": res
        }

    @staticmethod
    def opt_out(db: Session, user: User) -> Dict[str, Any]:
        """
        Immediately halts SMS reminders and revokes consent.
        """
        if user.preferences:
            user.preferences.sms_reminders_enabled = False
            user.preferences.sms_consent_given = False
            db.commit()

        # Log opt-out
        if user.phone_number:
            SMSService.dispatch_sms(
                phone_number=user.phone_number,
                message_body=OPT_OUT_MESSAGE,
                message_type="opt_out",
                user_id=user.id,
                db=db
            )

        return {
            "success": True,
            "message": "You have been successfully opted out of SMS reminders. You can re-enable them anytime in Settings."
        }
