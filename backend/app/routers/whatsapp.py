import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta, date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User, UserPreference
from app.models.whatsapp import WhatsAppMessage
from app.services.whatsapp_service import WhatsAppService
from app.services.wellbeing_monitor import WellbeingMonitor
from app.schemas.whatsapp import (
    WhatsAppConnectRequest,
    WhatsAppPreferencesResponse,
    WhatsAppPreferencesUpdate,
    WhatsAppMessageResponse,
    WhatsAppTestMessageRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["Twilio WhatsApp Notifications"])


# -----------------------------------------------------------------------------
# 1. Twilio Webhook Endpoints (Delivery Status Callback & Inbound STOP/START/HELP)
# -----------------------------------------------------------------------------
@router.post("/status-callback")
async def twilio_status_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Twilio Programmable Messaging Delivery Status Callback.
    Receives real-time delivery status updates from Twilio (queued, sent, delivered, undelivered, failed).
    Updates WhatsAppMessage records and student verification status.
    """
    try:
        form = await request.form()
        form_data = dict(form)
    except Exception as ex:
        logger.error(f"[TWILIO STATUS CALLBACK] Failed to parse form payload: {ex}")
        raise HTTPException(status_code=400, detail="Invalid form payload")

    res = WhatsAppService.handle_status_callback(form_data, db)
    return res


@router.post("/incoming")
async def twilio_incoming_message(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Twilio Inbound Message Webhook for Compliance & Opt-Out Handling.
    Handles STOP, UNSUBSCRIBE, CANCEL (opt-out), START, UNSTOP (opt-in), and HELP.
    Returns compliant TwiML MessagingResponse XML.
    Note: Twilio handles notifications only per specification; inbound is strictly for consent compliance.
    """
    try:
        form = await request.form()
        form_data = dict(form)
    except Exception as ex:
        logger.error(f"[TWILIO INCOMING] Failed to parse form payload: {ex}")
        form_data = {}

    twiml = WhatsAppService.handle_incoming_message(form_data, db)
    return Response(content=twiml, media_type="application/xml", status_code=200)


# -----------------------------------------------------------------------------
# 2. Connection Status & Twilio Configuration Metadata
# -----------------------------------------------------------------------------
@router.get("/status")
def get_whatsapp_provider_status():
    """
    Returns real-time Twilio Programmable Messaging provider status,
    operational mode (sandbox vs production), sender number, and sandbox join keywords.
    """
    return WhatsAppService.get_provider_status()


# -----------------------------------------------------------------------------
# 3. Student WhatsApp Preferences & Granular Notification Consents
# -----------------------------------------------------------------------------
@router.get("/preferences", response_model=WhatsAppPreferencesResponse)
def get_whatsapp_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated student's WhatsApp connection state,
    country code, delivery health, and granular notification consents.
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
        whatsapp_country_code=getattr(pref, "whatsapp_country_code", "+91") or "+91",
        whatsapp_consent=bool(pref.whatsapp_consent),
        whatsapp_consent_at=pref.whatsapp_consent_at,
        whatsapp_enabled=bool(pref.whatsapp_enabled),
        whatsapp_verified=bool(getattr(pref, "whatsapp_verified", False)),
        whatsapp_reminders_consent=bool(getattr(pref, "whatsapp_reminders_consent", True)),
        whatsapp_weekly_summary_consent=bool(getattr(pref, "whatsapp_weekly_summary_consent", True)),
        whatsapp_alerts_consent=bool(getattr(pref, "whatsapp_alerts_consent", True)),
        whatsapp_followup_consent=bool(getattr(pref, "whatsapp_followup_consent", True)),
        whatsapp_counsellor_consent=bool(getattr(pref, "whatsapp_counsellor_consent", True)),
        whatsapp_academic_consent=bool(getattr(pref, "whatsapp_academic_consent", True)),
        whatsapp_last_delivery_status=getattr(pref, "whatsapp_last_delivery_status", None),
        whatsapp_last_delivery_at=getattr(pref, "whatsapp_last_delivery_at", None),
        whatsapp_last_error=getattr(pref, "whatsapp_last_error", None),
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
    Updates student notification categories, quiet hours, or enables/disables notifications.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if updates.whatsapp_enabled is not None:
        pref.whatsapp_enabled = updates.whatsapp_enabled
    if updates.whatsapp_country_code is not None:
        pref.whatsapp_country_code = updates.whatsapp_country_code
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
    if updates.whatsapp_academic_consent is not None:
        pref.whatsapp_academic_consent = updates.whatsapp_academic_consent
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
# 4. Connect Personal Number & Disconnect
# -----------------------------------------------------------------------------
@router.post("/connect")
def connect_whatsapp_number(
    payload: WhatsAppConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registers the student's personal WhatsApp number in standard E.164 format.
    Ensures explicit opt-in consent is recorded with timestamp.
    Does NOT mark the number verified simply because it was entered (per specification).
    Verification is confirmed upon real message delivery.
    """
    cleaned = WhatsAppService.clean_phone_number(payload.phone_number, payload.country_code)
    if not WhatsAppService.validate_phone(cleaned):
        raise HTTPException(
            status_code=400,
            detail=f"Please provide a valid mobile number in international E.164 format (e.g. {payload.country_code}9876543210)."
        )

    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Explicit opt-in consent is required to receive WhatsApp notifications from MindBridge Campus."
        )

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    pref.whatsapp_phone = cleaned
    pref.whatsapp_country_code = payload.country_code
    pref.whatsapp_consent = True
    pref.whatsapp_consent_at = datetime.now(timezone.utc)
    pref.whatsapp_enabled = True
    # Important: Do not mark verified simply because it was entered!
    pref.whatsapp_verified = False
    pref.whatsapp_reminders_consent = True
    pref.whatsapp_weekly_summary_consent = True
    pref.whatsapp_alerts_consent = True
    pref.whatsapp_academic_consent = True
    pref.whatsapp_last_delivery_status = "pending_verification"
    pref.whatsapp_last_error = None

    if not current_user.phone_number:
        current_user.phone_number = cleaned

    db.commit()

    provider_status = WhatsAppService.get_provider_status()

    return {
        "success": True,
        "message": f"WhatsApp number {cleaned} registered successfully. Send a test notification or await scheduled updates to complete verification.",
        "phone_number": cleaned,
        "country_code": payload.country_code,
        "is_verified": False,
        "provider_status": provider_status
    }


@router.post("/disconnect")
def disconnect_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes WhatsApp consent, disconnects personal number, and disables all future WhatsApp notifications.
    """
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if pref:
        pref.whatsapp_consent = False
        pref.whatsapp_enabled = False
        pref.whatsapp_verified = False
        pref.whatsapp_phone = None
        pref.whatsapp_last_delivery_status = "disconnected"
        pref.whatsapp_last_error = None
        db.commit()

    return {
        "success": True,
        "message": "WhatsApp notifications have been disconnected and consent has been revoked."
    }


# -----------------------------------------------------------------------------
# 5. Outbound Real Test Notification Dispatch
# -----------------------------------------------------------------------------
@router.post("/send-test")
def send_test_whatsapp_notification(
    payload: WhatsAppTestMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dispatches a real WhatsApp notification via Twilio Programmable Messaging.
    Builds realistic, personalized student content using actual database records
    (daily reminder, weekly summary, wellbeing notification, academic reminder, or standard test).
    Guarantees clean JSON output with zero unhandled 500 crashes.
    """
    try:
        pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        target_phone = payload.phone_number or (pref.whatsapp_phone if pref else None) or current_user.phone_number

        if not target_phone:
            raise HTTPException(status_code=400, detail="No WhatsApp phone number is connected or provided.")

        cleaned = WhatsAppService.clean_phone_number(
            target_phone,
            getattr(pref, "whatsapp_country_code", "+91") if pref else "+91"
        )
        if not WhatsAppService.validate_phone(cleaned):
            raise HTTPException(status_code=400, detail=f"Invalid phone number format: {target_phone}")

        category = payload.notification_category or "daily_reminder"

        # Build genuine notification body based on real student data
        if payload.custom_text:
            body = payload.custom_text
        elif category == "daily_reminder":
            body = WhatsAppService.build_daily_reminder_message(current_user, db)
        elif category == "weekly_summary":
            body = WhatsAppService.build_weekly_summary_message(current_user, db)
        elif category == "wellbeing_alert":
            body = WhatsAppService.build_anomaly_alert_message(
                current_user,
                anomaly_type="high_stress",
                details={"current_stress": 7.5, "previous_stress": 5.0}
            )
        elif category == "academic_reminder":
            body = WhatsAppService.build_academic_reminder_message(current_user, db)
        else:
            student_name = current_user.full_name or "Student"
            body = (
                f"🌿 *MindBridge Campus — WhatsApp Notification Test*\n\n"
                f"Hi {student_name}! This is a live test from MindBridge Campus. "
                f"Your personal WhatsApp notifications are successfully configured.\n\n"
                f"You will receive gentle daily check-in reminders, personalized weekly wellbeing reports, "
                f"and timely academic reminders.\n\n"
                f"Reply STOP anytime to opt out."
            )

        result = WhatsAppService.send_notification(
            phone_number=cleaned,
            message_body=body,
            db=db,
            user_id=current_user.id,
            notification_type=f"test_{category}"
        )

        if not result.get("success"):
            return {
                "success": False,
                "status": result.get("status", "failed"),
                "error": result.get("error", "Dispatch failed"),
                "recipient": cleaned,
                "category": category,
                "provider_status": WhatsAppService.get_provider_status()
            }

        return {
            "success": True,
            "message": f"Real test notification ({category}) dispatched successfully via Twilio.",
            "recipient": cleaned,
            "category": category,
            "status": result.get("status"),
            "twilio_sid": result.get("twilio_sid") or result.get("message_sid") or result.get("wa_message_id"),
            "body_preview": body[:120] + "..." if len(body) > 120 else body
        }
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception(f"[WHATSAPP TEST ERROR] Unexpected error during test dispatch: {ex}")
        return {
            "success": False,
            "status": "failed",
            "error": f"Dispatch error: {str(ex)}",
            "provider_status": WhatsAppService.get_provider_status()
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
    Retrieves the authenticated student's WhatsApp notification history,
    delivery statuses (sent, delivered, failed), timestamps, and error diagnostics.
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
# 7. Background Scheduled Sweep for WhatsApp Reminders & Follow-Ups
# -----------------------------------------------------------------------------
@router.post("/cron/dispatch-due")
def trigger_whatsapp_cron_sweep(
    db: Session = Depends(get_db)
):
    """
    Idempotent scheduled cron endpoint for external pingers or Render background cron jobs.
    Evaluates due daily check-in reminders, weekly reports, gradual follow-ups,
    and academic reminders for students with active WhatsApp channels enabled.
    """
    cycle_result = WellbeingMonitor.run_monitoring_cycle(db)
    return {
        "status": "success",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "cycle_result": cycle_result
    }
