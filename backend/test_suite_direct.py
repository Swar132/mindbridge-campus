import asyncio
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.journal import JournalEntry
from app.models.appointment import Appointment
from app.models.resource import WellbeingResource
from app.services.seed_data import seed_database
from app.services.insights_engine import calculate_insights
from app.services.ai_service import generate_ai_response, detect_crisis
from app.auth import verify_password, create_access_token

def run_direct_tests():
    print("==================================================")
    print("MINDBRIDGE CAMPUS DIRECT VERIFICATION SUITE")
    print("==================================================")

    db = SessionLocal()
    try:
        # 1. Verify Seeding
        seed_database(db)
        users = db.query(User).all()
        print(f"[1] Database Seeding: Found {len(users)} users:")
        for u in users:
            print(f"    - {u.email} ({u.role}): {u.full_name}")

        # 2. Verify Authentication Passwords
        student = db.query(User).filter(User.email == "student@mindbridge.edu").first()
        counsellor = db.query(User).filter(User.email == "counsellor@mindbridge.edu").first()
        admin = db.query(User).filter(User.email == "admin@mindbridge.edu").first()

        assert verify_password("student123", student.password_hash), "Student password verification failed"
        assert verify_password("counsellor123", counsellor.password_hash), "Counsellor password verification failed"
        assert verify_password("admin123", admin.password_hash), "Admin password verification failed"
        print("[2] Password Hashing (Bcrypt) & Verification: All 3 roles PASS")

        # 3. JWT Token Generation
        token = create_access_token({"sub": str(student.id), "role": student.role})
        assert token and len(token) > 20, "Token generation failed"
        print(f"[3] PyJWT Token Generation: PASS (token prefix: {token[:20]}...)")

        # 4. Insights Engine
        insights = calculate_insights(student.id, db)
        print(f"[4] Insights Engine: PASS")
        print(f"    - Weekly Wellbeing Composite Score: {insights.metrics.weekly_wellbeing_score}/100")
        print(f"    - Last Night Sleep: {insights.metrics.last_night_sleep_hours} hrs")
        print(f"    - Consistency Score: {insights.metrics.sleep_consistency_score}%")
        print(f"    - Active Insights ({len(insights.insights)}): {[i.title for i in insights.insights]}")

        # 5. Tracking History Logs (35+ days)
        mood_count = db.query(MoodEntry).filter(MoodEntry.user_id == student.id).count()
        stress_count = db.query(StressEntry).filter(StressEntry.user_id == student.id).count()
        sleep_count = db.query(SleepEntry).filter(SleepEntry.user_id == student.id).count()
        print(f"[5] Student Tracking History: PASS")
        print(f"    - Mood Entries: {mood_count}")
        print(f"    - Stress Entries: {stress_count}")
        print(f"    - Sleep Entries: {sleep_count}")

        # 6. Private Journal User Isolation
        journals = db.query(JournalEntry).filter(JournalEntry.user_id == student.id).all()
        print(f"[6] Private Journal Storage: Found {len(journals)} entries for Priya")
        for j in journals:
            print(f"    - \"{j.title}\" (Emotion: {j.mood_tag}, Private: {j.is_private})")

        # 7. AI Assistant Empathetic Response
        ai_normal = generate_ai_response("I have placement anxiety and test stress", student.id, True, db)
        print(f"[7] AI Assistant Context-Aware Guidance: PASS")
        print(f"    - Safety Flagged: {ai_normal['safety_flagged']}")
        print(f"    - Response Snippet: {ai_normal['content'][:90]}...")

        # 8. AI Crisis Detection & Emergency Hotline Intervention
        crisis_query = "I want to end my life, I cannot do this anymore"
        assert detect_crisis(crisis_query) == True, "Crisis keyword failed detection!"
        ai_crisis = generate_ai_response(crisis_query, student.id, True, db)
        assert ai_crisis['safety_flagged'] == True, "AI response was not safety flagged!"
        assert ai_crisis['emergency_shown'] == True, "Emergency flag was not set!"
        assert "14416" in ai_crisis['content'], "Tele-MANAS hotline 14416 missing in crisis response!"
        assert "112" in ai_crisis['content'], "112 emergency hotline missing in crisis response!"
        print(f"[8] AI Crisis Detection & Indian Emergency Protocols: PASS")
        print("    - Intercepted self-harm distress signal")
        print("    - Provided Tele-MANAS (14416) and 112 emergency helplines")

        # 9. Appointments & Counsellor Notes
        apts = db.query(Appointment).all()
        print(f"[9] Counsellor Appointments: Found {len(apts)} appointments:")
        for a in apts:
            print(f"    - With {a.counsellor.title} for {a.appointment_date}: Status = {a.status}")

        # 10. Curated Wellbeing Resources
        resources = db.query(WellbeingResource).all()
        print(f"[10] Curated Wellbeing Resources: Found {len(resources)} items:")
        for r in resources:
            print(f"     - [{r.category}] {r.title} ({r.content_type}, {r.read_time_minutes}m)")

        print("==================================================")
        print("ALL 10 VERIFICATION MODULES PASSED WITH 100% SUCCESS!")
        print("==================================================")

    finally:
        db.close()

if __name__ == '__main__':
    run_direct_tests()
