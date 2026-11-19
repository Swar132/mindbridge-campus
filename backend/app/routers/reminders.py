from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserPreference
from app.models.sms import PhoneVerification, SMSLog
from app.schemas.reminders import (
    PhoneUpdateRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    ReminderPreferencesUpdate,
    ReminderStatusResponse,
    SMSLogResponse
)
from app.auth import get_current_user
from app.services.sms_service import (
    SMSService,
    clean_phone_number,
    validate_phone_number,
    mask_phone_number
)
from app.services.sms_scheduler import check_and_send_due_reminders

router = APIRouter(prefix="/reminders", tags=["SMS Wellbeing Reminders"])

@router.get("/status", response_model=ReminderStatusResponse)
def get_reminder_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = current_user.preferences
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return ReminderStatusResponse(
        phone_number=current_user.phone_number,
        phone_masked=mask_phone_number(current_user.phone_number),
        phone_verified=bool(current_user.phone_verified),
        sms_reminders_enabled=bool(prefs.sms_reminders_enabled and current_user.phone_verified),
        reminder_time=prefs.reminder_time or "20:00",
        reminder_frequency=getattr(prefs, "reminder_frequency", "daily") or "daily",
        timezone=getattr(prefs, "timezone", "Asia/Kolkata") or "Asia/Kolkata",
        sms_consent_given=bool(getattr(prefs, "sms_consent_given", False)),
        sms_consent_at=getattr(prefs, "sms_consent_at", None),
        last_reminder_sent_date=getattr(prefs, "last_reminder_sent_date", None),
        provider_info=SMSService.get_provider_status()
    )

@router.post("/phone")
def update_phone_number(
    payload: PhoneUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleaned = clean_phone_number(payload.phone_number, payload.country_code or "+91")
    is_valid, err = validate_phone_number(cleaned)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err)

    # Check if number changed
    if current_user.phone_number != cleaned:
        current_user.phone_number = cleaned
        current_user.phone_verified = False
        if current_user.preferences:
            current_user.preferences.sms_reminders_enabled = False
        db.commit()

    # Dispatch real OTP to phone
    try:
        otp_res = SMSService.send_verification_otp(db, current_user, cleaned)
        return {
            "success": True,
            "message": otp_res.get("message"),
            "phone_number": cleaned,
            "phone_masked": mask_phone_number(cleaned),
            "phone_verified": current_user.phone_verified
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"SMS OTP dispatch failed: {ex}")

@router.post("/otp/send")
def send_otp(
    payload: SendOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleaned = clean_phone_number(payload.phone_number)
    try:
        res = SMSService.send_verification_otp(db, current_user, cleaned)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"SMS OTP dispatch failed: {ex}")

@router.post("/otp/verify")
def verify_otp(
    payload: VerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleaned = clean_phone_number(payload.phone_number)
    try:
        res = SMSService.verify_otp_code(db, current_user, cleaned, payload.otp_code)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"OTP verification failed: {ex}")

@router.put("/preferences")
def update_preferences(
    payload: ReminderPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = current_user.preferences
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)

    # Validate requirement: Cannot enable SMS reminders without a verified phone
    if payload.sms_reminders_enabled is True:
        if not current_user.phone_number or not current_user.phone_verified:
            raise HTTPException(
                status_code=400,
                detail="A verified phone number is required before activating daily SMS reminders."
            )
        if payload.sms_consent_given is False:
            raise HTTPException(
                status_code=400,
                detail="Explicit student consent is required to receive daily SMS reminders."
            )

    if payload.sms_reminders_enabled is not None:
        prefs.sms_reminders_enabled = payload.sms_reminders_enabled
    if payload.reminder_time is not None:
        prefs.reminder_time = payload.reminder_time
    if payload.reminder_frequency is not None:
        prefs.reminder_frequency = payload.reminder_frequency
    if payload.timezone is not None:
        prefs.timezone = payload.timezone
    if payload.sms_consent_given is not None:
        prefs.sms_consent_given = payload.sms_consent_given
        if payload.sms_consent_given:
            prefs.sms_consent_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(prefs)
    return get_reminder_status(current_user=current_user, db=db)

@router.post("/test-reminder")
def trigger_test_reminder(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.phone_number or not current_user.phone_verified:
        raise HTTPException(
            status_code=400,
            detail="Please link and verify your phone number via OTP first."
        )

    res = SMSService.send_daily_reminder(db, current_user, is_test=True)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/opt-out")
def opt_out_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return SMSService.opt_out(db, current_user)

@router.get("/logs", response_model=List[SMSLogResponse])
def get_user_sms_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(SMSLog)
        .filter(SMSLog.user_id == current_user.id)
        .order_by(SMSLog.sent_at.desc())
        .limit(20)
        .all()
    )
    return [
        SMSLogResponse(
            id=l.id,
            phone_masked=mask_phone_number(l.phone_number),
            message_type=l.message_type,
            status=l.status,
            provider=l.provider,
            sent_at=l.sent_at,
            error_message=l.error_message
        )
        for l in logs
    ]

@router.post("/webhook")
async def handle_sms_inbound_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives carrier / provider inbound SMS webhooks (e.g. Twilio SMS Inbound)
    to process incoming 'STOP', 'UNSUBSCRIBE', or 'CANCEL' keywords for regulatory compliance.
    """
    try:
        form = await request.form()
        from_number = form.get("From") or form.get("phone") or form.get("sender")
        body = (form.get("Body") or form.get("message") or "").strip().upper()

        if from_number and body in ("STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"):
            cleaned = clean_phone_number(from_number)
            user = db.query(User).filter(User.phone_number == cleaned).first()
            if user:
                SMSService.opt_out(db, user)
                return {"status": "opted_out", "phone": mask_phone_number(cleaned)}
    except Exception as e:
        print(f"[SMS-WEBHOOK] Webhook parsing error: {e}")

    return {"status": "received"}

@router.post("/trigger-cron")
def trigger_scheduled_cron(
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin or manual trigger to check and dispatch scheduled reminders."""
    sent = check_and_send_due_reminders(db, force_all=force)
    return {
        "status": "cron_executed",
        "processed_count": len(sent),
        "reminders": sent
    }
