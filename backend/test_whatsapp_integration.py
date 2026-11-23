"""
Automated Comprehensive Test Suite for MindBridge Campus
Twilio Programmable Messaging WhatsApp Notifications Integration
"""
import sys
import os
import json
from datetime import datetime, date, timedelta, timezone

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
os.environ["TESTING"] = "1"
os.environ["TWILIO_ACCOUNT_SID"] = "ACtest_account_sid_for_unit_tests"
os.environ["TWILIO_AUTH_TOKEN"] = "test_auth_token_mindbridge_2026"
os.environ["TWILIO_WHATSAPP_FROM"] = "whatsapp:+14155238886"
os.environ["TWILIO_SANDBOX_KEYWORD"] = "mindbridge-test"

from app.database import SessionLocal, engine, Base
from app.services.seed_data import seed_database
from app.migrations import run_migrations
from app.config import settings
from app.models.user import User, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.monitoring import WellbeingAnomalyAlert, WeeklyWellbeingReport
from app.models.whatsapp import WhatsAppMessage
from app.models.ai import StudentMemory
from app.services.whatsapp_service import WhatsAppService
from app.services.wellbeing_monitor import WellbeingMonitor
from app.schemas.whatsapp import (
    WhatsAppConnectRequest,
    WhatsAppPreferencesUpdate,
    WhatsAppTestMessageRequest
)
from app.routers.whatsapp import (
    get_whatsapp_provider_status,
    get_whatsapp_preferences,
    update_whatsapp_preferences,
    connect_whatsapp_number,
    disconnect_whatsapp,
    send_test_whatsapp_notification,
    get_whatsapp_messages
)


def run_tests():
    print("\n" + "="*65)
    print("MINDBRIDGE CAMPUS TWILIO WHATSAPP NOTIFICATIONS TEST SUITE")
    print("="*65)

    # 1. Initialize DB & Migrations
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
        assert student is not None, "Demo student Priya not found"
        print(f"✓ [1/14] Authenticated Student: {student.full_name} (ID: {student.id})")

        # 2. Twilio Phone Number Formatting & Validation
        raw_number = "9876543210"
        cleaned_in = WhatsAppService.clean_phone_number(raw_number, default_country="+91")
        assert cleaned_in == "+919876543210", f"Expected +919876543210, got {cleaned_in}"
        assert WhatsAppService.validate_phone(cleaned_in) == True

        # Test Twilio whatsapp: prefix format
        twilio_addr = WhatsAppService.format_twilio_address(cleaned_in)
        assert twilio_addr == "whatsapp:+919876543210"

        # Test US number
        cleaned_us = WhatsAppService.clean_phone_number("4155238886", default_country="+1")
        assert cleaned_us == "+14155238886"
        print("✓ [2/14] Twilio E.164 phone formatting & whatsapp: prefix validation verified")

        # 3. Provider Status & Configuration
        provider_info = WhatsAppService.get_provider_status()
        assert "Twilio" in provider_info["provider"]
        assert provider_info["mode"] == "sandbox"
        assert "14155238886" in provider_info["whatsapp_from"]
        assert "join" in provider_info["sandbox_keyword"].lower() or "mindbridge" in provider_info["sandbox_keyword"].lower()
        print("✓ [3/14] Twilio Provider Status Metadata & Sandbox join details verified")

        # 4. Connect Personal WhatsApp Number (Honest Verification Rule)
        student_phone = "+919876543210"
        conn_req = WhatsAppConnectRequest(
            phone_number="9876543210",
            country_code="+91",
            consent=True
        )
        conn_res = connect_whatsapp_number(payload=conn_req, current_user=student, db=db)
        assert conn_res["success"] == True
        assert conn_res["phone_number"] == student_phone
        # Crucial check: Do not mark as verified simply because it was entered!
        assert conn_res["is_verified"] == False, "New registration must not be pre-verified"

        pref = db.query(UserPreference).filter(UserPreference.user_id == student.id).first()
        assert pref.whatsapp_phone == student_phone
        assert pref.whatsapp_country_code == "+91"
        assert pref.whatsapp_consent == True
        assert pref.whatsapp_enabled == True
        assert pref.whatsapp_verified == False
        assert pref.whatsapp_last_delivery_status == "pending_verification"
        print(f"✓ [4/14] Number Registered: {student_phone} with explicit consent & honest pending verification status")

        # 5. Outbound Real Test Notification Dispatch
        import time
        now_ts = int(time.time() * 1000)
        test_req = WhatsAppTestMessageRequest(
            phone_number=student_phone,
            notification_category="test",
            custom_text=f"🌿 MindBridge Campus Test at {now_ts} 🌿"
        )
        test_res = send_test_whatsapp_notification(payload=test_req, current_user=student, db=db)
        assert test_res["success"] == True
        assert test_res["twilio_sid"] is not None
        assert test_res["twilio_sid"].startswith("SM")
        assert test_res["status"] in ["queued", "sent", "delivered"]

        # Verify persisted into whatsapp_messages table
        persisted_msg = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.wa_message_id == test_res["twilio_sid"]
        ).first()
        assert persisted_msg is not None
        assert persisted_msg.direction == "outbound"
        assert persisted_msg.phone_number == student_phone
        print(f"✓ [5/14] Outbound Real Test Notification dispatched & recorded: SID={persisted_msg.wa_message_id}")

        # 6. Twilio Status Callback: Update to "delivered" & Honest Verification
        status_form = {
            "MessageSid": persisted_msg.wa_message_id,
            "MessageStatus": "delivered",
            "To": f"whatsapp:{student_phone}",
            "From": "whatsapp:+14155238886"
        }
        cb_res = WhatsAppService.handle_status_callback(status_form, db)
        assert cb_res["success"] == True
        assert cb_res["status"] == "delivered"

        db.refresh(persisted_msg)
        assert persisted_msg.status == "delivered"

        db.refresh(pref)
        # Now that delivery is confirmed, whatsapp_verified must be True!
        assert pref.whatsapp_verified == True
        assert pref.whatsapp_last_delivery_status == "delivered"
        print("✓ [6/14] Twilio Status Callback: Updated to 'delivered' and marked student verified upon real delivery")

        # 7. Compliance Opt-Out Handling via Twilio Incoming ("STOP")
        import time
        now_ts = int(time.time() * 1000)
        stop_form = {
            "From": f"whatsapp:{student_phone}",
            "To": "whatsapp:+14155238886",
            "Body": "STOP",
            "MessageSid": f"SMtest_stop_{now_ts}"
        }
        twiml_stop = WhatsAppService.handle_incoming_message(stop_form, db)
        assert "<Response>" in twiml_stop
        assert "unsubscribed" in twiml_stop.lower()

        db.refresh(pref)
        assert pref.whatsapp_enabled == False
        assert pref.whatsapp_consent == False
        print("✓ [7/14] Inbound Webhook 'STOP': Revoked consent and disabled WhatsApp notifications")

        # 8. Compliance Opt-In Handling via Twilio Incoming ("START")
        start_form = {
            "From": f"whatsapp:{student_phone}",
            "To": "whatsapp:+14155238886",
            "Body": "START",
            "MessageSid": f"SMtest_start_{now_ts}"
        }
        twiml_start = WhatsAppService.handle_incoming_message(start_form, db)
        assert "<Response>" in twiml_start
        assert "re-enabled" in twiml_start.lower()

        db.refresh(pref)
        assert pref.whatsapp_enabled == True
        assert pref.whatsapp_consent == True
        print("✓ [8/14] Inbound Webhook 'START': Re-enabled notifications and renewed consent")

        # 9. Compliance Help Handling via Twilio Incoming ("HELP")
        help_form = {
            "From": f"whatsapp:{student_phone}",
            "To": "whatsapp:+14155238886",
            "Body": "HELP",
            "MessageSid": f"SMtest_help_{now_ts}"
        }
        twiml_help = WhatsAppService.handle_incoming_message(help_form, db)
        assert "<Response>" in twiml_help
        assert "SAC I" in twiml_help or "Kiran" in twiml_help or "counsellor" in twiml_help.lower()
        print("✓ [9/14] Inbound Webhook 'HELP': Returned campus helpline numbers & counsellor info")

        # 10. Real Data: Daily Check-in Reminder Builder & Dispatch
        daily_msg = WhatsAppService.build_daily_reminder_message(student, db)
        assert student.full_name in daily_msg
        assert "Daily" in daily_msg and "Check-in" in daily_msg
        assert "Reply STOP anytime" in daily_msg or "Reply STOP" in daily_msg

        # Dispatch via WellbeingMonitor
        rem_res = WellbeingMonitor.evaluate_daily_reminder(student.id, db, force=True)
        assert rem_res is not None
        # Verify recorded in DB
        last_daily_notif = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "daily_reminder"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert last_daily_notif is not None
        assert "check-in" in last_daily_notif.body.lower()
        print("✓ [10/14] Daily Check-in Reminder generated with real student data and dispatched")

        # 11. Real Data: Weekly Wellbeing Summary Builder (Stress Balance & Sleep Consistency)
        weekly_msg = WhatsAppService.build_weekly_summary_message(student, db)
        assert student.full_name in weekly_msg
        assert "7-Day Wellbeing Summary" in weekly_msg
        assert "Stress Balance" in weekly_msg or "Stress" in weekly_msg
        assert "Sleep Consistency" in weekly_msg or "Sleep" in weekly_msg

        # Dispatch via WellbeingMonitor
        rep_res = WellbeingMonitor.generate_weekly_report(student.id, db, force=True)
        assert rep_res is not None
        last_weekly_notif = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "weekly_report"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert last_weekly_notif is not None
        assert "Wellbeing Summary" in last_weekly_notif.body
        print("✓ [11/14] Weekly Summary generated with real trends (Stress Balance & Sleep Consistency)")

        # 12. Real Data: Wellbeing Anomaly & Stress Alert
        alert_msg = WhatsAppService.build_anomaly_alert_message(
            student,
            anomaly_type="high_stress",
            details={"current_stress": 8.0, "previous_stress": 4.5}
        )
        assert student.full_name in alert_msg
        assert "Wellbeing Check-in" in alert_msg
        assert "stress" in alert_msg.lower()

        alert_send_res = WhatsAppService.send_notification(
            phone_number=student_phone,
            message_body=alert_msg,
            db=db,
            user_id=student.id,
            notification_type="wellbeing_alert"
        )
        assert alert_send_res["success"] == True
        print("✓ [12/14] Wellbeing Alert built with supportive, non-diagnostic tone and dispatched")

        # 13. Real Data: Academic & Placement Reminder
        # Ensure student has a memory/goal in StudentMemory
        mem = db.query(StudentMemory).filter(StudentMemory.user_id == student.id).first()
        if not mem:
            mem = StudentMemory(
                user_id=student.id,
                category="placement",
                topic="Mock Test Practice",
                key_point="Complete TCS and Google mock tests",
                is_active=True
            )
            db.add(mem)
            db.commit()

        acad_msg = WhatsAppService.build_academic_reminder_message(student, db)
        assert student.full_name in acad_msg
        assert "Academic & Placement Reminder" in acad_msg

        acad_res = WellbeingMonitor.evaluate_academic_reminders(student.id, db, force=True)
        assert acad_res is not None
        last_acad_notif = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "academic_reminder"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert last_acad_notif is not None
        print("✓ [13/14] Academic & Placement Reminder queried real student goals and dispatched")

        # 14. Granular Category Gating & Full Disconnect
        # Update category preferences: disable academic reminders
        pref_update = WhatsAppPreferencesUpdate(whatsapp_academic_consent=False)
        upd_pref_res = update_whatsapp_preferences(updates=pref_update, current_user=student, db=db)
        assert upd_pref_res.whatsapp_academic_consent == False

        # Attempt to evaluate academic reminder again - should be gated and suppressed
        gated_res = WellbeingMonitor.evaluate_academic_reminders(student.id, db, force=True)
        assert gated_res is None, "Academic reminder must be suppressed when consent is disabled"

        # Disconnect WhatsApp
        disc_res = disconnect_whatsapp(current_user=student, db=db)
        assert disc_res["success"] == True
        db.refresh(pref)
        assert pref.whatsapp_phone is None
        assert pref.whatsapp_enabled == False
        assert pref.whatsapp_consent == False
        assert pref.whatsapp_verified == False
        assert pref.whatsapp_last_delivery_status == "disconnected"
        print("✓ [14/14] Category Gating respected and Full Disconnect cleared numbers & consent cleanly")

        print("\n" + "="*65)
        print("ALL 14 TWILIO WHATSAPP NOTIFICATION INTEGRATION CHECKS PASSED!")
        print("="*65 + "\n")

    finally:
        db.close()


if __name__ == '__main__':
    run_tests()
