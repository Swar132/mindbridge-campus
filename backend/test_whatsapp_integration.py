"""
Automated Comprehensive Test Suite for MindBridge Campus
Meta WhatsApp Business Cloud API & Mindy WhatsApp Integration
"""
import sys
import os
import json
import hmac
import hashlib
from datetime import datetime, date, timedelta, time, timezone

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
os.environ["TESTING"] = "1"
os.environ["GROQ_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["OPENROUTER_API_KEY"] = ""

from app.database import SessionLocal, engine, Base
from app.services.seed_data import seed_database, seed_whatsapp_templates
from app.migrations import run_migrations
from app.config import settings
from app.models.user import User, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.monitoring import WellbeingAnomalyAlert, WeeklyWellbeingReport
from app.models.whatsapp import WhatsAppMessage, WhatsAppConversation, WhatsAppTemplate
from app.models.ai import AIConversation, AIMessage, StudentMemory
from app.services.whatsapp_service import WhatsAppService
from app.services.wellbeing_monitor import WellbeingMonitor
from app.schemas.whatsapp import (
    WhatsAppConnectRequest,
    WhatsAppPreferencesUpdate,
    WhatsAppTestMessageRequest,
    WhatsAppSimulateIncomingRequest
)
from app.routers.whatsapp import (
    get_whatsapp_provider_status,
    get_whatsapp_preferences,
    update_whatsapp_preferences,
    connect_whatsapp_number,
    disconnect_whatsapp,
    send_test_whatsapp_message,
    get_whatsapp_messages,
    simulate_incoming_whatsapp_message
)


def run_tests():
    print("\n" + "="*65)
    print("MINDBRIDGE CAMPUS WHATSAPP & MINDY INTEGRATION TEST SUITE")
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
        seed_whatsapp_templates(db)

        student = db.query(User).filter(User.email == "student@mindbridge.edu").first()
        student2 = db.query(User).filter(User.email == "rohit.mehta@mindbridge.edu").first()
        assert student is not None, "Demo student Priya not found"
        print(f"✓ [1/15] Authenticated Student: {student.full_name} (ID: {student.id})")

        # 2. Webhook Verification Handshake (GET /api/whatsapp/webhook)
        verify_token = getattr(settings, "WHATSAPP_VERIFY_TOKEN", "mindbridge_campus_webhook_verify_token_2026")
        challenge_token = "987654321"

        # Valid challenge
        resp_challenge = WhatsAppService.verify_webhook_challenge("subscribe", verify_token, challenge_token)
        assert resp_challenge == challenge_token, "Webhook verification failed for valid token"
        
        # Invalid challenge
        bad_resp = WhatsAppService.verify_webhook_challenge("subscribe", "wrong_token", challenge_token)
        assert bad_resp is None, "Webhook verification allowed invalid token"
        print("✓ [2/15] Meta Webhook Verification Handshake (hub.challenge) validated")

        # 3. HMAC-SHA256 Signature Validation (X-Hub-Signature-256)
        test_payload = b'{"object": "whatsapp_business_account", "entry": []}'
        test_secret = "test_meta_app_secret_mindbridge_2026"
        old_secret = getattr(settings, "WHATSAPP_APP_SECRET", "")
        settings.WHATSAPP_APP_SECRET = test_secret

        valid_sig = "sha256=" + hmac.new(test_secret.encode("utf-8"), test_payload, hashlib.sha256).hexdigest()
        assert WhatsAppService.validate_hub_signature(test_payload, valid_sig) == True, "Valid HMAC signature rejected"

        invalid_sig = "sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        assert WhatsAppService.validate_hub_signature(test_payload, invalid_sig) == False, "Tampered signature accepted"
        settings.WHATSAPP_APP_SECRET = old_secret
        print("✓ [3/15] Webhook HMAC-SHA256 Signature Validation verified")

        # 4. Connect Student WhatsApp Number & Opt-In Flow
        student_phone = "+919876543210"
        conn_req = WhatsAppConnectRequest(phone_number=student_phone, consent=True)
        conn_res = connect_whatsapp_number(payload=conn_req, current_user=student, db=db)
        assert conn_res["success"] == True
        assert conn_res["phone_number"] == student_phone
        assert conn_res["is_verified"] == True

        # Verify DB preferences updated
        pref = db.query(UserPreference).filter(UserPreference.user_id == student.id).first()
        assert pref.whatsapp_enabled == True
        assert pref.whatsapp_consent == True
        assert pref.whatsapp_phone == student_phone
        print(f"✓ [4/15] Student WhatsApp Account Connected: {student_phone} with Opt-in Consent")

        # 5. Outbound Test Message Dispatch (Interactive Buttons)
        test_req = WhatsAppTestMessageRequest(phone_number=student_phone, message_type="interactive_buttons")
        test_res = send_test_whatsapp_message(payload=test_req, current_user=student, db=db)
        assert test_res["success"] == True
        assert test_res["wa_message_id"] is not None
        assert "wamid." in test_res["wa_message_id"]

        # Verify persisted into whatsapp_messages
        sent_msg = db.query(WhatsAppMessage).filter(WhatsAppMessage.wa_message_id == test_res["wa_message_id"]).first()
        assert sent_msg is not None
        assert sent_msg.direction == "outbound"
        assert sent_msg.status == "sent"
        print(f"✓ [5/15] Outbound Interactive Message dispatched & persisted: ID={sent_msg.wa_message_id[:25]}...")

        # 6. Inbound Delivery Status Webhook Updates
        status_payload = {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "wa_acc_1",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "statuses": [
                                    {
                                        "id": sent_msg.wa_message_id,
                                        "status": "delivered",
                                        "timestamp": str(int(datetime.now(timezone.utc).timestamp())),
                                        "recipient_id": student_phone.replace("+", "")
                                    }
                                ]
                            },
                            "field": "messages"
                        }
                    ]
                }
            ]
        }
        status_res = WhatsAppService.process_webhook_payload(status_payload, db)
        assert status_res["success"] == True
        assert status_res["processed_count"] == 1

        db.refresh(sent_msg)
        assert sent_msg.status == "delivered", f"Expected status 'delivered', got '{sent_msg.status}'"
        print(f"✓ [6/15] Webhook Status Receipt updated message to status='{sent_msg.status}'", flush=True)

        # 7. Compliance Opt-Out Handling ("STOP")
        sim_stop = WhatsAppSimulateIncomingRequest(phone_number=student_phone, text="STOP")
        stop_res = simulate_incoming_whatsapp_message(payload=sim_stop, db=db)
        assert stop_res["simulation_success"] == True

        db.refresh(pref)
        assert pref.whatsapp_enabled == False
        assert pref.whatsapp_consent == False
        print("✓ [7/15] Compliance Opt-Out: Received 'STOP', disabled WhatsApp & revoked consent", flush=True)

        # 8. Compliance Opt-In Handling ("START")
        sim_start = WhatsAppSimulateIncomingRequest(phone_number=student_phone, text="START")
        start_res = simulate_incoming_whatsapp_message(payload=sim_start, db=db)
        assert start_res["simulation_success"] == True

        db.refresh(pref)
        assert pref.whatsapp_enabled == True
        assert pref.whatsapp_consent == True
        print("✓ [8/15] Compliance Opt-In: Received 'START', reactivated WhatsApp & renewed consent", flush=True)

        # 9. Interactive Check-in Flow via Button Taps
        # Student taps "checkin_start"
        sim_btn_checkin = WhatsAppSimulateIncomingRequest(
            phone_number=student_phone,
            message_type="button_reply",
            button_id="checkin_start",
            button_title="Log Check-in 🌿"
        )
        checkin_flow_res = simulate_incoming_whatsapp_message(payload=sim_btn_checkin, db=db)
        assert checkin_flow_res["simulation_success"] == True

        # Student selects mood: "checkin_mood_great"
        sim_btn_mood = WhatsAppSimulateIncomingRequest(
            phone_number=student_phone,
            message_type="button_reply",
            button_id="checkin_mood_great",
            button_title="Great 😊"
        )
        mood_res = simulate_incoming_whatsapp_message(payload=sim_btn_mood, db=db)
        assert mood_res["simulation_success"] == True

        # Verify MoodEntry was created for student
        latest_mood = db.query(MoodEntry).filter(MoodEntry.user_id == student.id).order_by(MoodEntry.recorded_at.desc()).first()
        assert latest_mood is not None
        assert latest_mood.mood == "Happy"
        assert "WhatsApp" in latest_mood.notes
        print(f"✓ [9/15] Interactive 1-Tap Daily Check-in recorded in database: Mood='{latest_mood.mood}'", flush=True)

        # 10. Interactive Anomaly Alert Resolution via WhatsApp
        # Create an active anomaly alert for student
        test_alert = WellbeingAnomalyAlert(
            user_id=student.id,
            alert_type="sudden_stress_increase",
            metric_name="stress",
            observed_value=8.5,
            baseline_value=3.2,
            severity="attention",
            trigger_reason="Stress rose noticeably",
            supportive_message="We noticed elevated stress. Take a breath.",
            follow_up_stage=1,
            resolution_status="active",
            is_acknowledged=False
        )
        db.add(test_alert)
        db.commit()
        db.refresh(test_alert)

        # Student replies via 1-tap button: "anomaly_placements"
        sim_btn_anomaly = WhatsAppSimulateIncomingRequest(
            phone_number=student_phone,
            message_type="button_reply",
            button_id="anomaly_placements",
            button_title="Stressed about placements"
        )
        anomaly_reply_res = simulate_incoming_whatsapp_message(payload=sim_btn_anomaly, db=db)
        assert anomaly_reply_res["simulation_success"] == True

        db.refresh(test_alert)
        assert test_alert.resolution_status == "resolved_student_responded"
        assert test_alert.is_acknowledged == True
        assert "placements" in test_alert.student_response.lower()
        print(f"✓ [10/15] Interactive Anomaly Resolution via WhatsApp: Status='{test_alert.resolution_status}'", flush=True)

        # 11. Campus Counsellor Direct Referral via WhatsApp Button
        sim_btn_counsellor = WhatsAppSimulateIncomingRequest(
            phone_number=student_phone,
            message_type="button_reply",
            button_id="anomaly_counsellor",
            button_title="Campus Counsellor 🤝"
        )
        counsellor_btn_res = simulate_incoming_whatsapp_message(payload=sim_btn_counsellor, db=db)
        assert counsellor_btn_res["simulation_success"] == True

        # Verify counsellor contact was sent
        last_counsellor_msg = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "counsellor_referral"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert last_counsellor_msg is not None
        assert "Dr. Nitu Singh Bhadouria" in last_counsellor_msg.body
        assert "SAC I" in last_counsellor_msg.body
        print("✓ [11/15] Campus Counsellor Referral sent via WhatsApp: Dr. Nitu Singh Bhadouria in SAC I", flush=True)

        # 12. Mindy Conversational AI on WhatsApp (Natural Language & Long-Term Memory)
        student_question = "I have 2 coding interviews this week and I'm feeling severe imposter syndrome. Can you help me calm down?"
        sim_mindy_msg = WhatsAppSimulateIncomingRequest(
            phone_number=student_phone,
            message_type="text",
            text=student_question
        )
        mindy_res = simulate_incoming_whatsapp_message(payload=sim_mindy_msg, db=db)
        assert mindy_res["simulation_success"] == True

        # Verify AI message saved in AIConversation
        last_ai_msg = db.query(AIMessage).filter(
            AIMessage.sender == "assistant"
        ).order_by(AIMessage.created_at.desc()).first()
        assert last_ai_msg is not None
        assert len(last_ai_msg.content) > 30

        # Verify outbound WhatsApp message dispatched back to student
        last_outbound_chat = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "mindy_chat"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert last_outbound_chat is not None
        assert len(last_outbound_chat.body) > 30
        print(f"✓ [12/15] Mindy AI Conversational Chat on WhatsApp verified: Response length={len(last_outbound_chat.body)} chars")

        # 13. Proactive Wellbeing Reminders & Multi-Stage Follow-Ups over WhatsApp
        # Test daily reminder dispatch via WellbeingMonitor
        rem = WellbeingMonitor.evaluate_daily_reminder(student.id, db, force=True)
        # Check if outbound WhatsApp daily reminder was recorded
        daily_wa_msg = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "daily_reminder"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert daily_wa_msg is not None
        assert "evening reminder" in daily_wa_msg.body.lower()
        print("✓ [13/15] Proactive Daily Check-in Reminder dispatched over WhatsApp")

        # 14. Weekly Summary Report Dispatched over WhatsApp
        rep = WellbeingMonitor.generate_weekly_report(student.id, db, force=True)
        weekly_wa_msg = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.phone_number == student_phone,
            WhatsAppMessage.conversation_context == "weekly_report"
        ).order_by(WhatsAppMessage.created_at.desc()).first()
        assert weekly_wa_msg is not None
        assert "MindBridge 7-Day Wellbeing Summary" in weekly_wa_msg.body
        print("✓ [14/15] Weekly Wellbeing Summary comparative report dispatched over WhatsApp")

        # 15. Granular Category Consent Enforcement & Disconnect
        # Disable alerts consent
        pref_upd = WhatsAppPreferencesUpdate(whatsapp_alerts_consent=False)
        upd_res = update_whatsapp_preferences(updates=pref_upd, current_user=student, db=db)
        assert upd_res.whatsapp_alerts_consent == False

        # Disconnect WhatsApp
        disc_res = disconnect_whatsapp(current_user=student, db=db)
        assert disc_res["success"] == True
        db.refresh(pref)
        assert pref.whatsapp_phone is None
        assert pref.whatsapp_enabled == False
        print("✓ [15/15] Category Consent Gating & Full Disconnect verified")

        print("\n" + "="*65)
        print("ALL 15 WHATSAPP & MINDY INTEGRATION TEST CHECKS PASSED!")
        print("="*65)

    finally:
        db.close()


if __name__ == '__main__':
    run_tests()
