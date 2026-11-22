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
    WhatsAppOptInRequest,
    AlertResponseRequest
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
    trigger_monitoring_sweep,
    respond_to_alert,
    pause_notifications,
    resume_notifications
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
        print(f"✓ [12/17] Student Isolation & Scheduled Evaluation verified: {eval_res['result']}")

        # 13. Compound Anomaly & Positive Improvement Detection
        # Ensure student2 has preference enabled
        pref_s2 = db.query(UserPreference).filter(UserPreference.user_id == student2.id).first()
        if not pref_s2:
            pref_s2 = UserPreference(user_id=student2.id, sudden_change_alerts_enabled=True)
            db.add(pref_s2)
        else:
            pref_s2.sudden_change_alerts_enabled = True
        db.commit()

        # Clear student2 entries to test positive improvement
        db.query(WellbeingAnomalyAlert).filter(WellbeingAnomalyAlert.user_id == student2.id).delete()
        db.query(MoodEntry).filter(MoodEntry.user_id == student2.id).delete()
        db.query(StressEntry).filter(StressEntry.user_id == student2.id).delete()
        db.query(SleepEntry).filter(SleepEntry.user_id == student2.id).delete()
        db.commit()

        # Seed baseline with high stress (7.5) and lower sleep (5.5h) for student 2 (days -14 to -4)
        for i in range(14, 3, -1):
            past_date = today - timedelta(days=i)
            dt_past = datetime.combine(past_date, time(20, 0), tzinfo=timezone.utc)
            db.add(MoodEntry(user_id=student2.id, mood="Stressed", intensity=7, energy_level=3, recorded_at=dt_past))
            db.add(StressEntry(user_id=student2.id, level=8, category="Placements and Career", recorded_at=dt_past))
            db.add(SleepEntry(user_id=student2.id, bedtime="01:30", wake_time="07:00", duration_hours=5.5, quality=2, sleep_date=past_date, recorded_at=dt_past))
        db.commit()

        # Today student 2 experiences positive progress: stress drops to 3, sleep up to 8.5h
        dt_today2 = datetime.now(timezone.utc)
        db.add(MoodEntry(user_id=student2.id, mood="Calm", intensity=4, energy_level=5, recorded_at=dt_today2))
        db.add(StressEntry(user_id=student2.id, level=3, category="Academics", recorded_at=dt_today2))
        db.add(SleepEntry(user_id=student2.id, bedtime="22:30", wake_time="07:00", duration_hours=8.5, quality=4, sleep_date=today, recorded_at=dt_today2))
        db.commit()

        alerts_s2 = WellbeingMonitor.evaluate_anomalies(student2.id, db)
        celebration_alerts = [a for a in alerts_s2 if a.is_positive_celebration]
        assert len(celebration_alerts) >= 1, "Failed to detect positive stress relief celebration"
        print(f"✓ [13/17] Positive Improvement Recognition verified: \"{celebration_alerts[0].supportive_message[:60]}...\"")

        # 14. Gradual Multi-Stage Follow-Up Progression (Stages 1 -> 2 -> 3 -> 4)
        # Create a test alert for student 1 at stage 1, active and unresolved
        test_alert = WellbeingAnomalyAlert(
            user_id=student.id,
            alert_type="stress_spike",
            metric_name="stress",
            observed_value=9.0,
            baseline_value=3.5,
            severity="moderate",
            trigger_reason="Stress spiked significantly",
            supportive_message="We noticed your stress levels have been elevated. Take a gentle breath.",
            follow_up_stage=1,
            follow_up_count=0,
            last_follow_up_at=datetime.now(timezone.utc) - timedelta(days=3),
            resolution_status="active_monitoring",
            is_acknowledged=False
        )
        db.add(test_alert)
        db.commit()
        db.refresh(test_alert)

        # Progression to Stage 2
        fups_stage2 = WellbeingMonitor.progress_follow_ups(student.id, db)
        db.refresh(test_alert)
        assert test_alert.follow_up_stage == 2
        assert test_alert.follow_up_count == 1
        print("✓ [14/17] Multi-Stage Follow-up Progression: Advanced to Stage 2 (Gentle Check-in)")

        # Fast forward time to trigger Stage 3
        test_alert.last_follow_up_at = datetime.now(timezone.utc) - timedelta(days=3)
        db.commit()
        fups_stage3 = WellbeingMonitor.progress_follow_ups(student.id, db)
        db.refresh(test_alert)
        assert test_alert.follow_up_stage == 3
        assert test_alert.follow_up_count == 2
        print("✓ [14/17] Multi-Stage Follow-up Progression: Advanced to Stage 3 (Mindy AI & Resource Offers)")

        # Fast forward time to trigger Stage 4
        test_alert.last_follow_up_at = datetime.now(timezone.utc) - timedelta(days=3)
        db.commit()
        fups_stage4 = WellbeingMonitor.progress_follow_ups(student.id, db)
        db.refresh(test_alert)
        assert test_alert.follow_up_stage == 4
        assert test_alert.follow_up_count == 3
        print("✓ [14/17] Multi-Stage Follow-up Progression: Advanced to Stage 4 (Confidential Counsellor Connection)")

        # 15. Interactive 1-Tap Student Response Submission & Halting
        resp_req = AlertResponseRequest(response="I've been stressed about placements.")
        resp_out = respond_to_alert(alert_id=test_alert.id, payload=resp_req, current_user=student, db=db)
        assert resp_out["success"] == True
        assert resp_out["resolution_status"] == "resolved_student_responded"
        assert "placement" in resp_out["advice"].lower() or "career" in resp_out["advice"].lower()
        
        # Verify alert marked acknowledged and resolved
        db.refresh(test_alert)
        assert test_alert.is_acknowledged == True
        assert test_alert.resolution_status == "resolved_student_responded"
        assert test_alert.student_response == "I've been stressed about placements."

        # Verify follow-up progression immediately halts for resolved alert
        test_alert.last_follow_up_at = datetime.now(timezone.utc) - timedelta(days=5)
        db.commit()
        fups_halted = WellbeingMonitor.progress_follow_ups(student.id, db)
        assert len(fups_halted) == 0, "Follow-up continued despite student response resolution!"
        print("✓ [15/17] Interactive 1-Tap Response verified: tailored advice returned, follow-up halted")

        # 16. Natural Indicator Recovery Halting
        # Create an active alert at stage 1
        recovery_alert = WellbeingAnomalyAlert(
            user_id=student.id,
            alert_type="sleep_drop",
            metric_name="sleep_hours",
            observed_value=4.0,
            baseline_value=8.0,
            severity="moderate",
            trigger_reason="Sleep duration dropped",
            supportive_message="Gentle check on sleep",
            follow_up_stage=1,
            follow_up_count=0,
            last_follow_up_at=datetime.now(timezone.utc) - timedelta(days=3),
            resolution_status="active_monitoring",
            is_acknowledged=False
        )
        db.add(recovery_alert)
        db.commit()
        db.refresh(recovery_alert)

        # Seed fresh calm check-ins showing stress has settled (level 2) and sleep has recovered (8.5h)
        dt_rec = datetime.now(timezone.utc)
        db.add(StressEntry(user_id=student.id, level=2, category="General", recorded_at=dt_rec))
        db.add(SleepEntry(user_id=student.id, bedtime="22:30", wake_time="07:00", duration_hours=8.5, quality=4, sleep_date=today, recorded_at=dt_rec))
        db.commit()

        recovery_fups = WellbeingMonitor.progress_follow_ups(student.id, db)
        db.refresh(recovery_alert)
        assert recovery_alert.resolution_status == "resolved_indicator_recovered"
        print("✓ [16/17] Natural Indicator Recovery Halting verified: student recovered, alerts concluded")

        # 17. Pause & Resume Notifications Endpoint & Safeguard
        pause_out = pause_notifications(days=7, current_user=student, db=db)
        assert pause_out["is_paused"] == True
        assert pause_out["paused_until"] is not None

        # Verify reminders & follow-ups are skipped when paused
        paused_rem = WellbeingMonitor.evaluate_daily_reminder(student.id, db, force=True)
        assert paused_rem is None, "Reminder sent while notifications paused!"
        paused_fups = WellbeingMonitor.progress_follow_ups(student.id, db)
        assert len(paused_fups) == 0, "Follow-up ran while notifications paused!"

        # Resume notifications
        resume_out = resume_notifications(current_user=student, db=db)
        assert resume_out["is_paused"] == False
        pref_after = db.query(UserPreference).filter(UserPreference.user_id == student.id).first()
        assert pref_after.is_paused == False
        assert pref_after.paused_until is None
        print("✓ [17/17] Pause & Resume Notifications verified: total mute safeguard operational")

        print("\n" + "="*60)
        print("ALL 17 INTELLIGENT MONITORING TEST SUITE CHECKS PASSED!")
        print("="*60)

    finally:
        db.close()


if __name__ == '__main__':
    run_tests()
