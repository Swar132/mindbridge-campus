import asyncio
import zoneinfo
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User, UserPreference
from app.models.tracking import MoodEntry
from app.services.sms_service import SMSService

_scheduler_running = False

def check_and_send_due_reminders(db: Session, force_all: bool = False) -> List[Dict[str, Any]]:
    """
    Scans for students due for their daily wellbeing check-in reminder
    based on their preferred local time and sends SMS if not already checked in.
    """
    results = []
    
    # Query all users with verified phones and active reminders
    users = (
        db.query(User)
        .join(UserPreference, User.id == UserPreference.user_id)
        .filter(
            User.phone_verified == True,
            User.phone_number.isnot(None),
            UserPreference.sms_reminders_enabled == True,
            UserPreference.sms_consent_given == True
        )
        .all()
    )

    for user in users:
        prefs = user.preferences
        tz_str = prefs.timezone or "Asia/Kolkata"
        try:
            tz = zoneinfo.ZoneInfo(tz_str)
        except Exception:
            tz = zoneinfo.ZoneInfo("Asia/Kolkata")

        now_local = datetime.now(tz)
        current_time_str = now_local.strftime("%H:%M")
        today_date = now_local.date()

        # Check frequency (e.g. weekdays vs daily)
        if not force_all and prefs.reminder_frequency == "weekdays" and now_local.weekday() >= 5:
            continue  # Weekend, skip weekday-only reminder

        # Match reminder time (e.g. "20:30")
        target_time = prefs.reminder_time or "20:00"
        is_time_to_send = force_all or (current_time_str == target_time)

        if not is_time_to_send:
            continue

        # Prevent duplicate: Check if already sent today
        if not force_all and prefs.last_reminder_sent_date == today_date:
            continue

        # Prevent duplicate: Check if student has already completed check-in today
        start_of_day_utc = datetime.combine(today_date, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
        already_checked_in = db.query(MoodEntry).filter(
            MoodEntry.user_id == user.id,
            MoodEntry.recorded_at >= start_of_day_utc
        ).first()

        if already_checked_in:
            continue

        # Dispatch reminder
        res = SMSService.send_daily_reminder(db, user, is_test=False)
        results.append({
            "user_id": user.id,
            "email": user.email,
            "phone": user.phone_number,
            "result": res
        })

    return results


async def start_sms_reminder_scheduler():
    """
    Background worker loop that executes every 60 seconds
    to deliver scheduled wellbeing check-in reminders according to student local time.
    """
    global _scheduler_running
    _scheduler_running = True
    print("[SMS-SCHEDULER] Daily SMS reminder scheduler initialized and running.")

    while _scheduler_running:
        try:
            db = SessionLocal()
            try:
                sent = check_and_send_due_reminders(db, force_all=False)
                if sent:
                    print(f"[SMS-SCHEDULER] Dispatched {len(sent)} scheduled wellbeing reminders.")
                
                # Run intelligent wellbeing monitoring cycle (in-app reminders, weekly reports)
                try:
                    from app.services.wellbeing_monitor import WellbeingMonitor
                    WellbeingMonitor.run_monitoring_cycle(db)
                except Exception as mon_err:
                    print(f"[WELLBEING-MONITOR] Sweep notice: {mon_err}")
            finally:
                db.close()
        except Exception as e:
            print(f"[SMS-SCHEDULER] Error in scheduler loop: {e}")

        # Sleep for 60 seconds before next check
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            break


def stop_sms_reminder_scheduler():
    global _scheduler_running
    _scheduler_running = False
    print("[SMS-SCHEDULER] SMS reminder scheduler stopped.")
