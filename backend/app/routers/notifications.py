import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User, UserPreference
from app.models.notification import Notification
from app.models.monitoring import (
    WeeklyWellbeingReport,
    WellbeingAnomalyAlert,
    PushSubscription,
    NotificationLog
)
from app.schemas.notification import NotificationResponse
from app.schemas.monitoring import (
    WeeklyWellbeingReportResponse,
    WellbeingAnomalyAlertResponse,
    PushSubscriptionCreate,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    WhatsAppOptInRequest,
    NotificationLogResponse
)
from app.auth import get_current_user
from app.services.wellbeing_monitor import WellbeingMonitor
from app.services.push_service import PushService
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/notifications", tags=["Wellbeing Notifications & Monitoring"])

# -------------------------------------------------------------
# 1. In-App Notifications
# -------------------------------------------------------------
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return notifs

@router.put("/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# -------------------------------------------------------------
# 2. Preferences & Settings
# -------------------------------------------------------------
@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    try:
        preferred_days_list = json.loads(pref.preferred_days) if isinstance(pref.preferred_days, str) else (pref.preferred_days or [])
    except Exception:
        preferred_days_list = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return NotificationPreferenceResponse(
        checkin_reminder_enabled=bool(pref.checkin_reminder_enabled),
        daily_reminder_enabled=bool(getattr(pref, "daily_reminder_enabled", True)),
        weekly_summary_enabled=bool(getattr(pref, "weekly_summary_enabled", True)),
        sudden_change_alerts_enabled=bool(getattr(pref, "sudden_change_alerts_enabled", True)),
        browser_push_enabled=bool(getattr(pref, "browser_push_enabled", False)),
        whatsapp_enabled=bool(getattr(pref, "whatsapp_enabled", False)),
        reminder_time=pref.reminder_time or "20:00",
        preferred_days=preferred_days_list,
        quiet_hours_start=getattr(pref, "quiet_hours_start", "22:00") or "22:00",
        quiet_hours_end=getattr(pref, "quiet_hours_end", "07:00") or "07:00",
        timezone=getattr(pref, "timezone", "Asia/Kolkata") or "Asia/Kolkata",
        whatsapp_phone=getattr(pref, "whatsapp_phone", None) or current_user.phone_number,
        whatsapp_consent=bool(getattr(pref, "whatsapp_consent", False)),
        whatsapp_status=WhatsAppService.get_provider_status()
    )

@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_preferences(
    pref_in: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if pref_in.daily_reminder_enabled is not None:
        pref.daily_reminder_enabled = pref_in.daily_reminder_enabled
        pref.checkin_reminder_enabled = pref_in.daily_reminder_enabled
    if pref_in.weekly_summary_enabled is not None:
        pref.weekly_summary_enabled = pref_in.weekly_summary_enabled
    if pref_in.sudden_change_alerts_enabled is not None:
        pref.sudden_change_alerts_enabled = pref_in.sudden_change_alerts_enabled
    if pref_in.browser_push_enabled is not None:
        pref.browser_push_enabled = pref_in.browser_push_enabled
    if pref_in.whatsapp_enabled is not None:
        # Require consent before enabling whatsapp
        if pref_in.whatsapp_enabled and not (pref.whatsapp_consent or pref_in.whatsapp_consent):
            raise HTTPException(
                status_code=400,
                detail="WhatsApp notifications require explicit student consent before enabling."
            )
        pref.whatsapp_enabled = pref_in.whatsapp_enabled
    if pref_in.reminder_time is not None:
        pref.reminder_time = pref_in.reminder_time
    if pref_in.preferred_days is not None:
        pref.preferred_days = json.dumps(pref_in.preferred_days)
    if pref_in.quiet_hours_start is not None:
        pref.quiet_hours_start = pref_in.quiet_hours_start
    if pref_in.quiet_hours_end is not None:
        pref.quiet_hours_end = pref_in.quiet_hours_end
    if pref_in.timezone is not None:
        pref.timezone = pref_in.timezone
    if pref_in.whatsapp_phone is not None:
        cleaned = WhatsAppService.clean_phone_number(pref_in.whatsapp_phone)
        pref.whatsapp_phone = cleaned
    if pref_in.whatsapp_consent is not None:
        pref.whatsapp_consent = pref_in.whatsapp_consent
        if pref_in.whatsapp_consent:
            pref.whatsapp_consent_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pref)

    return get_preferences(current_user=current_user, db=db)

# -------------------------------------------------------------
# 3. Weekly Wellbeing Reports
# -------------------------------------------------------------
@router.get("/reports/weekly", response_model=List[WeeklyWellbeingReportResponse])
def get_weekly_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = (
        db.query(WeeklyWellbeingReport)
        .filter(WeeklyWellbeingReport.user_id == current_user.id)
        .order_by(WeeklyWellbeingReport.week_end.desc())
        .limit(10)
        .all()
    )
    
    # If student has no reports yet, attempt on-the-fly generation from actual records
    if not reports:
        new_report = WellbeingMonitor.generate_weekly_report(current_user.id, db, force=False)
        if new_report:
            reports = [new_report]

    for r in reports:
        try:
            r.supportive_feedback = json.loads(r.supportive_feedback) if isinstance(r.supportive_feedback, str) else r.supportive_feedback
        except Exception:
            r.supportive_feedback = []

    return reports

@router.get("/reports/weekly/{report_id}", response_model=WeeklyWellbeingReportResponse)
def get_single_weekly_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(WeeklyWellbeingReport).filter(
        WeeklyWellbeingReport.id == report_id,
        WeeklyWellbeingReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found or access denied")

    try:
        report.supportive_feedback = json.loads(report.supportive_feedback) if isinstance(report.supportive_feedback, str) else report.supportive_feedback
    except Exception:
        report.supportive_feedback = []

    return report

@router.post("/reports/weekly/generate", response_model=WeeklyWellbeingReportResponse)
def generate_weekly_report_on_demand(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    On-demand generation/re-calculation of current 7-day wellbeing summary.
    """
    report = WellbeingMonitor.generate_weekly_report(current_user.id, db, force=True)
    if not report:
        raise HTTPException(status_code=500, detail="Could not generate weekly wellbeing report")
    
    try:
        report.supportive_feedback = json.loads(report.supportive_feedback) if isinstance(report.supportive_feedback, str) else report.supportive_feedback
    except Exception:
        report.supportive_feedback = []

    return report

# -------------------------------------------------------------
# 4. Sudden-Change Anomaly Alerts
# -------------------------------------------------------------
@router.get("/alerts", response_model=List[WellbeingAnomalyAlertResponse])
def get_anomaly_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(WellbeingAnomalyAlert)
        .filter(WellbeingAnomalyAlert.user_id == current_user.id)
        .order_by(WellbeingAnomalyAlert.created_at.desc())
        .limit(20)
        .all()
    )
    return alerts

@router.put("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(WellbeingAnomalyAlert).filter(
        WellbeingAnomalyAlert.id == alert_id,
        WellbeingAnomalyAlert.user_id == current_user.id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found or access denied")

    alert.is_acknowledged = True
    db.commit()
    return {"message": "Alert acknowledged successfully"}

# -------------------------------------------------------------
# 5. Free Browser Push (Web Push & Service Worker)
# -------------------------------------------------------------
@router.get("/push/vapid-public-key")
def get_vapid_public_key():
    return {
        "publicKey": settings.VAPID_PUBLIC_KEY
    }

@router.post("/push/subscribe")
def subscribe_push(
    sub_in: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if this endpoint is already registered
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub_in.endpoint
    ).first()

    if not existing:
        new_sub = PushSubscription(
            user_id=current_user.id,
            endpoint=sub_in.endpoint,
            p256dh=sub_in.p256dh,
            auth=sub_in.auth,
            user_agent=sub_in.user_agent
        )
        db.add(new_sub)

    # Enable browser push in preferences
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if pref:
        pref.browser_push_enabled = True

    db.commit()
    return {"message": "Browser push subscription registered successfully", "status": "active"}

@router.post("/push/unsubscribe")
def unsubscribe_push(
    sub_in: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub_in.endpoint
    ).delete(synchronize_session=False)

    # If no remaining subscriptions, update preference
    remaining = db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).count()
    if remaining == 0:
        pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        if pref:
            pref.browser_push_enabled = False

    db.commit()
    return {"message": "Browser push subscription removed", "status": "unsubscribed"}

@router.post("/test-push")
def send_test_push_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends an immediate verification push notification and in-app notification to confirm delivery.
    """
    title = "MindBridge Wellbeing Connection 🌿"
    body = "Your browser notification channel is active! You will receive gentle daily reminders and weekly summaries here."
    url = "/notifications"

    # Always create in-app notification
    notif = Notification(
        user_id=current_user.id,
        title=title,
        message=body,
        type="system",
        is_read=False,
        link=url
    )
    db.add(notif)
    db.commit()

    # Try dispatching web push
    pushed_count = PushService.dispatch_to_user(
        db=db,
        user_id=current_user.id,
        title=title,
        body=body,
        url=url,
        notification_type="system"
    )

    return {
        "success": True,
        "in_app_created": True,
        "push_devices_notified": pushed_count,
        "message": f"Test notification created! Delivered to {pushed_count} browser push endpoint(s)."
    }

# -------------------------------------------------------------
# 6. WhatsApp Opt-In & Status (Official Meta Cloud API)
# -------------------------------------------------------------
@router.post("/whatsapp/opt-in")
def opt_in_whatsapp(
    payload: WhatsAppOptInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleaned = WhatsAppService.clean_phone_number(payload.phone_number)
    if not WhatsAppService.validate_phone(cleaned):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid phone number in E.164 format (e.g. +919876543210)."
        )

    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Explicit consent is required to receive notifications on WhatsApp."
        )

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    pref.whatsapp_phone = cleaned
    pref.whatsapp_consent = True
    pref.whatsapp_consent_at = datetime.now(timezone.utc)
    pref.whatsapp_enabled = True
    db.commit()

    provider_status = WhatsAppService.get_provider_status()

    return {
        "success": True,
        "message": "WhatsApp consent and phone number saved successfully.",
        "phone_number": cleaned,
        "provider_status": provider_status
    }

@router.post("/whatsapp/opt-out")
def opt_out_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if pref:
        pref.whatsapp_consent = False
        pref.whatsapp_enabled = False
        db.commit()

    return {
        "success": True,
        "message": "Successfully opted out of WhatsApp notifications."
    }

# -------------------------------------------------------------
# 7. Notification Logs & History
# -------------------------------------------------------------
@router.get("/logs", response_model=List[NotificationLogResponse])
def get_notification_logs(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(NotificationLog)
        .filter(NotificationLog.user_id == current_user.id)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
        .all()
    )
    return logs

# -------------------------------------------------------------
# 8. Background Monitoring Sweep (Safe, Idempotent Evaluation)
# -------------------------------------------------------------
@router.post("/evaluate")
def trigger_monitoring_sweep(
    db: Session = Depends(get_db)
):
    """
    Idempotent monitoring cycle endpoint for background worker or periodic uptime pings.
    Evaluates due daily reminders and scheduled weekly reports without duplicate notifications.
    """
    res = WellbeingMonitor.run_monitoring_cycle(db)
    return {
        "status": "success",
        "result": res
    }
