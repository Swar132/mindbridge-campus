"""
Automated Comprehensive Test Suite for MindBridge Campus
Intelligent Wellbeing Monitoring & Notification System
Direct Verification & Comprehensive Integration Suite
"""
import sys
import os
import json
from datetime import datetime, date, timedelta, time, timezone

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, engine, Base
from app.services.seed_data import seed_database
from app.migrations import run_migrations
from app.models.user import User, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.monitoring import (
    WeeklyWellbeingReport,
    WellbeingAnomalyAlert,
    PushSubscription,
    NotificationLog
)
from app.models.notification import Notification
from app.services.wellbeing_monitor import WellbeingMonitor
from app.services.whatsapp_service import WhatsAppService
from app.services.push_service import PushService
from app.schemas.monitoring import (
    NotificationPreferenceUpdate,
    PushSubscriptionCreate,
    WhatsAppOptInRequest
)
from app.routers.notifications import (
    get_preferences,
    update_preferences,
    get_weekly_reports,
    generate_weekly_report_on_demand,
    get_anomaly_alerts,
    get_vapid_public_key,
    subscribe_push,
    unsubscribe_push,
    send_test_push_notification,
    opt_in_whatsapp,
    opt_out_whatsapp,
    get_notification_logs,
    trigger_monitoring_sweep
)


def run_tests():
    print("\n" + "="*60)
    print("MINDBRIDGE CAMPUS INTELLIGENT MONITORING TEST SUITE")
    print("="*60)

    # 1. Database & Migrations Initialization
    Base.metadata.create_all(bind=engine)
    try:
        run_migrations(engine)
    except Exception as ex:
        print(f"Migration note: {ex}")

    db = SessionLocal()
    try:
        # Seed if empty
        if db.query(User).filter(User.email == "student@mindbridge.edu").first() is None:
            seed_database(db)

        student = db.query(User).filter(User.email == "student@mindbridge.edu").first()
        student2 = db.query(User).filter(User.email == "rohit.mehta@mindbridge.edu").first()
        assert student is not None, "Demo student Priya not found in database"
        assert student2 is not None, "Second student Rohit not found in database"
        print(f"✓ [1/12] Authenticated Student 1: {student.full_name} (ID: {student.id})")
        print(f"✓ [1/12] Authenticated Student 2: {student2.full_name} (ID: {student2.id})")

        # 2. Test Notification Preferences Retrieval & Schema
        prefs_res = get_preferences(current_user=student, db=db)
        assert prefs_res.daily_reminder_enabled is not None
        assert prefs_res.weekly_summary_enabled is not None
        assert prefs_res.sudden_change_alerts_enabled is not None
        print(f"✓ [2/12] Retrieved Preferences: Daily={prefs_res.daily_reminder_enabled}, Weekly={prefs_res.weekly_summary_enabled}, Alerts={prefs_res.sudden_change_alerts_enabled}")

        # Test Preferences Update
        upd_data = NotificationPreferenceUpdate(
            daily_reminder_enabled=True,
            reminder_time="20:45",
            weekly_summary_enabled=True,
            sudden_change_alerts_enabled=True,
            browser_push_enabled=True,
            whatsapp_enabled=False,
            preferred_days=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            quiet_hours_start="23:00",
            quiet_hours_end="07:00"
        )
        upd_res = update_preferences(pref_in=upd_data, current_user=student, db=db)
        assert upd_res.reminder_time == "20:45"
        assert upd_res.quiet_hours_start == "23:00"
        print("✓ [3/12] Updated preferences successfully verified")

        # 3. Test VAPID Key & Push APIs
        vapid_res = get_vapid_public_key()
        assert "publicKey" in vapid_res
        assert len(vapid_res["publicKey"]) > 20
        print(f"✓ [4/12] VAPID Key retrieved: {vapid_res['publicKey'][:25]}...")

        # Push Subscription Registration
        sub_create = PushSubscriptionCreate(
            endpoint="https://fcm.googleapis.com/fcm/send/mock-token-xyz-12345",
            p256dh="BMockKeyForTestingP256dhStringValue1234567890==",
            auth="MockAuthSecret123=="
        )
        sub_res = subscribe_push(sub_in=sub_create, current_user=student, db=db)
        assert sub_res["status"] == "active"

        # Push test dispatch (safely handled by PushService without breaking)
        test_push_res = send_test_push_notification(current_user=student, db=db)
        assert "push_devices_notified" in test_push_res
        print("✓ [5/12] Web Push Subscription & Safe Test Dispatch verified")

        # 4. WhatsApp Zero-Cost Provider Safeguards & International Formatting
        assert WhatsAppService.is_configured() == False, "WhatsApp service should remain inactive when unconfigured"
        assert WhatsAppService.validate_phone("+91 98765 43210") == True, "Valid Indian phone rejected"
        assert WhatsAppService.validate_phone("12345") == False, "Invalid short phone accepted incorrectly"

        wa_consent_req = WhatsAppOptInRequest(
            phone_number="+91 98765 43210",
            consent=True
        )
        wa_res = opt_in_whatsapp(payload=wa_consent_req, current_user=student, db=db)
        assert wa_res["success"] == True
        assert wa_res["provider_status"]["is_active"] == False, "WhatsApp must remain inactive without active Meta Cloud token"
        print("✓ [6/12] WhatsApp Zero-Cost Safeguards & Consent Architecture validated")

        # 5. Data Sufficiency Threshold (Weekly Report < 3 entries)
        today = date.today()
        # Clean tracking entries for student 1 to test cold start
        db.query(WellbeingAnomalyAlert).filter(WellbeingAnomalyAlert.user_id == student.id).delete()
        db.query(WeeklyWellbeingReport).filter(WeeklyWellbeingReport.user_id == student.id).delete()
        db.query(MoodEntry).filter(MoodEntry.user_id == student.id).delete()
        db.query(StressEntry).filter(StressEntry.user_id == student.id).delete()
        db.query(SleepEntry).filter(SleepEntry.user_id == student.id).delete()
        db.commit()

        # Seed only 1 check-in entry in past 7 days
        dt_1 = datetime.combine(today - timedelta(days=2), time(20, 0), tzinfo=timezone.utc)
        db.add(MoodEntry(user_id=student.id, mood="Neutral", intensity=5, energy_level=5, recorded_at=dt_1))
        db.add(StressEntry(user_id=student.id, level=4, category="Academics", recorded_at=dt_1))
        db.add(SleepEntry(user_id=student.id, bedtime="23:30", wake_time="07:00", duration_hours=7.5, quality=3, sleep_date=today - timedelta(days=2), recorded_at=dt_1))
        db.commit()

        rep_insufficient = WellbeingMonitor.generate_weekly_report(student.id, db, force=True)
        assert rep_insufficient is not None
        assert rep_insufficient.is_sufficient_data == False, "Threshold failed: generated full report with only 1 entry"
        assert "at least 3 daily check-ins" in rep_insufficient.summary_message
        print("✓ [7/12] Data Sufficiency Threshold enforced (no fabricated data when < 3 check-ins)")

        # 6. Weekly Report Generation with Sufficient Data (>= 3 entries)
        # Add entries for 6 consecutive days: days -6 to -1
        for i in range(6, 0, -1):
            past_date = today - timedelta(days=i)
            dt_past = datetime.combine(past_date, time(20, 0), tzinfo=timezone.utc)
            db.add(MoodEntry(user_id=student.id, mood="Happy" if i % 2 == 0 else "Neutral", intensity=6, energy_level=4, recorded_at=dt_past))
            db.add(StressEntry(user_id=student.id, level=3 if i > 3 else 4, category="Placements and Career", recorded_at=dt_past))
            db.add(SleepEntry(user_id=student.id, bedtime="23:00", wake_time="07:00", duration_hours=8.0, quality=4, sleep_date=past_date, recorded_at=dt_past))
        db.commit()

        rep_sufficient = WellbeingMonitor.generate_weekly_report(student.id, db, force=True)
        assert rep_sufficient is not None
        assert rep_sufficient.is_sufficient_data == True
        assert rep_sufficient.total_checkins_current_week >= 6
        assert rep_sufficient.avg_stress is not None
        assert rep_sufficient.avg_sleep_hours is not None
        assert rep_sufficient.dominant_mood in ["Happy", "Neutral"]
        print(f"✓ [8/12] Weekly Wellbeing Report Generated with Real Data:")
        print(f"       - Check-ins Analyzed: {rep_sufficient.total_checkins_current_week}")
        print(f"       - Avg Stress: {rep_sufficient.avg_stress:.1f}/10")
        print(f"       - Avg Sleep: {rep_sufficient.avg_sleep_hours:.1f} hrs")
        print(f"       - Dominant Mood: {rep_sufficient.dominant_mood}")
        print(f"       - Top Domain: {rep_sufficient.top_stress_domain}")

        # 7. Intelligent Sudden-Change Anomaly Engine
        # Add 10 prior days of baseline history (days -20 to -7)
        for i in range(20, 6, -1):
            past_date = today - timedelta(days=i)
            dt_past = datetime.combine(past_date, time(20, 0), tzinfo=timezone.utc)
            db.add(MoodEntry(user_id=student.id, mood="Happy", intensity=4, energy_level=4, recorded_at=dt_past))
            db.add(StressEntry(user_id=student.id, level=3, category="Academics", recorded_at=dt_past))
            db.add(SleepEntry(user_id=student.id, bedtime="23:00", wake_time="07:00", duration_hours=8.0, quality=4, sleep_date=past_date, recorded_at=dt_past))
        db.commit()

        # Add TODAY's sudden spike entry:
        # Stress jumps to 9 (diff = +5.5 points, >= 2.5 and >= 7)
        # Sleep drops to 4.0h (drop = 4.0 hrs, <= 5h and drop >= 2.5h)
        # Energy drops to 1 (drop = 3 points, <= 3 and drop >= 3)
        today_dt_utc = datetime.now(timezone.utc)
        db.add(MoodEntry(user_id=student.id, mood="Anxious", intensity=8, energy_level=1, recorded_at=today_dt_utc))
        db.add(StressEntry(user_id=student.id, level=9, category="Exams", recorded_at=today_dt_utc))
        db.add(SleepEntry(user_id=student.id, bedtime="03:30", wake_time="07:30", duration_hours=4.0, quality=2, sleep_date=today, recorded_at=today_dt_utc))
        db.commit()

        alerts = WellbeingMonitor.evaluate_anomalies(student.id, db)
        assert len(alerts) >= 1, "Expected at least 1 anomaly alert for sudden stress/sleep spike"
        alert_types = [a.alert_type for a in alerts]
        print(f"✓ [9/12] Sudden-Change Anomaly Detected: {alert_types}")
        print(f"       - Trigger Reason: \"{alerts[0].trigger_reason}\"")
        print(f"       - Supportive Message: \"{alerts[0].supportive_message}\"")
        assert alerts[0].mindy_context is not None, "Mindy context missing in anomaly alert"

        # 8. Anomaly 48-Hour Cooldown Safeguard
        second_alerts = WellbeingMonitor.evaluate_anomalies(student.id, db)
        assert len(second_alerts) == 0, "Cooldown failed: duplicate alert generated within 48h window"
        print("✓ [10/12] Anomaly 48h Cooldown Safeguard verified: NO alert fatigue or duplicate alerts")

        # 9. Daily Check-in Reminder Idempotency
        # Since student logged entries today, reminder must return None (NEVER send if completed)
        rem_today = WellbeingMonitor.evaluate_daily_reminder(student.id, db, force=False)
        assert rem_today is None, "Daily reminder sent despite student already completing check-in today!"
        print("✓ [11/12] Daily Reminder Idempotency verified: NEVER sends reminder when check-in is done")

        # 10. Student Privacy & Data Isolation Check
        # Student 2 (Rohit) requests their weekly reports and anomalies
        rohit_reports = get_weekly_reports(current_user=student2, db=db)
        rohit_anomalies = get_anomaly_alerts(current_user=student2, db=db)
        # Verify Rohit does NOT see Priya's data
        for r in rohit_reports:
            assert r.user_id == student2.id, "Data leak: Student received another user's weekly report"
        for a in rohit_anomalies:
            assert a.user_id == student2.id, "Data leak: Student received another user's anomaly alert"

        # 11. Public Scheduled Evaluation Endpoint
        eval_res = trigger_monitoring_sweep(db=db)
        assert eval_res["status"] == "success"
        print(f"✓ [12/12] Student Isolation & Scheduled Evaluation verified: {eval_res['result']}")

        print("\n" + "="*60)
        print("ALL 12 INTELLIGENT MONITORING TEST SUITE CHECKS PASSED!")
        print("="*60)

    finally:
        db.close()


if __name__ == '__main__':
    run_tests()
