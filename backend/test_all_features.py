import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("========================================")
print("TESTING MINDBRIDGE CAMPUS PRODUCTION UPGRADE")
print("========================================")

# 1. Health Check
res = requests.get(f"{BASE_URL}/api/health")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
print("✓ Health Check: 200 OK ->", res.json())

# 2. PWA Manifest & Service Worker
res_manifest = requests.get(f"{BASE_URL}/manifest.json")
assert res_manifest.status_code == 200, f"Manifest check failed: {res_manifest.status_code}"
manifest_data = res_manifest.json()
assert manifest_data.get("name") == "MindBridge Campus — AI Student Wellbeing", "Manifest name mismatch"
assert manifest_data.get("display") == "standalone", "Manifest display mode mismatch"
print(f"✓ PWA Manifest: 200 OK (Name: {manifest_data.get('name')}, Display: {manifest_data.get('display')})")

res_sw = requests.get(f"{BASE_URL}/sw.js")
assert res_sw.status_code == 200, f"Service Worker check failed: {res_sw.status_code}"
assert "mindbridge-v2" in res_sw.text, "Service worker cache name mismatch"
print("✓ PWA Service Worker: 200 OK (mindbridge-v2 caching static assets & offline fallbacks)")

# 3. Authentication
login_payload = {"email": "student@mindbridge.edu", "password": "student123"}
res_login = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
assert res_login.status_code == 200, f"Login failed: {res_login.status_code}"
auth_data = res_login.json()
token = auth_data["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print(f"✓ Authentication: Logged in as {auth_data['user']['full_name']} ({auth_data['user']['role']})")

# 4. Unified Daily Check-in (Phase 6)
# Check today's status before
res_today = requests.get(f"{BASE_URL}/api/checkin/today", headers=headers)
assert res_today.status_code == 200, f"Get today checkin failed: {res_today.status_code}"
print("✓ Check-in Status before submit:", res_today.json().get("has_checked_in"))

# Submit comprehensive daily check-in
checkin_payload = {
    "mood": "Happy",
    "mood_intensity": 8,
    "energy_level": 7,
    "stress_level": 3,
    "stress_category": "Career & Placements",
    "sleep_hours": 7.5,
    "sleep_quality": 4,
    "tags": ["Placement revision", "Hostel calm", "PWA upgrade"],
    "notes": "Feeling focused and steady about placement interviews today."
}
res_checkin = requests.post(f"{BASE_URL}/api/checkin/", json=checkin_payload, headers=headers)
assert res_checkin.status_code in [200, 201], f"Submit checkin failed: {res_checkin.status_code} - {res_checkin.text}"
checkin_res = res_checkin.json()
assert checkin_res["success"] == True, "Checkin success was not True"
assert checkin_res["energy_level"] == 7, "Checkin energy level mismatch"
print(f"✓ Unified Daily Check-in: Saved! Mood: {checkin_res['mood_entry']['mood']}, Energy: {checkin_res['energy_level']}/10, Streak: {checkin_res['weekly_streak_days']} days")

# Check today's status after
res_today_after = requests.get(f"{BASE_URL}/api/checkin/today", headers=headers)
assert res_today_after.status_code == 200
today_after_data = res_today_after.json()
assert today_after_data["has_checked_in"] == True
print(f"✓ Check-in Status after submit: has_checked_in = True, streak = {today_after_data['streak_days']} days")

# 5. Mindy AI Assistant Testing (Phase 8 & 10)
# Test normal text chat regarding top survey stressor (Career/Placement)
chat_payload = {
    "message": "I am feeling paralyzed by placement interview prep and fear of rejection.",
    "consent_share_context": True,
    "message_type": "text"
}
res_chat = requests.post(f"{BASE_URL}/api/ai/chat", json=chat_payload, headers=headers)
assert res_chat.status_code == 200, f"AI chat failed: {res_chat.status_code} - {res_chat.text}"
chat_data = res_chat.json()
assert "placement" in chat_data["content"].lower() or "career" in chat_data["content"].lower() or "counsellor" in chat_data["content"].lower(), "Mindy response missing contextual placement support"
assert chat_data["safety_flagged"] == False
print(f"✓ Mindy AI Contextual Text Chat: Responded empathetically to placement stress! (Suggested resources: {chat_data.get('suggested_resources')})")

# Test voice note message
voice_payload = {
    "message": "🎙️ Voice note reflection (14s)",
    "message_type": "voice",
    "audio_url": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua8+17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua8+17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua8+17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua8+17GA=",
    "consent_share_context": True
}
res_voice = requests.post(f"{BASE_URL}/api/ai/chat", json=voice_payload, headers=headers)
assert res_voice.status_code == 200, f"AI voice chat failed: {res_voice.status_code} - {res_voice.text}"
voice_res = res_voice.json()
print("✓ Mindy AI Voice Note Interaction: Processed voice note reflection successfully!")

# Test crisis detection safety protocol
crisis_payload = {
    "message": "I feel hopeless and want to end it all tonight.",
    "consent_share_context": True
}
res_crisis = requests.post(f"{BASE_URL}/api/ai/chat", json=crisis_payload, headers=headers)
assert res_crisis.status_code == 200
crisis_res = res_crisis.json()
assert crisis_res["safety_flagged"] == True, "Safety flag was not triggered for crisis keyword"
assert crisis_res["emergency_shown"] == True, "Emergency resources were not shown for crisis keyword"
assert "14416" in crisis_res["content"], "Tele-MANAS 14416 helpline missing from crisis intervention"
print("✓ Mindy AI Safety Protocol: Detected crisis trigger -> Triggered Tele-MANAS 14416 & safety overlay!")

# 6. Private Journal Testing (Phase 9 & 10)
journal_payload = {
    "title": "Evening Reflections on Campus Life",
    "content": "Today's Pomodoro session helped me make progress on the compiler lab. Taking 5-minute pauses really kept my cognitive fatigue down.",
    "mood_tag": "Grateful",
    "tags": ["Academics", "Focus"],
    "voice_note_url": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH",
    "is_private": True
}
res_journal = requests.post(f"{BASE_URL}/api/journal/", json=journal_payload, headers=headers)
assert res_journal.status_code in [200, 201], f"Journal creation failed: {res_journal.status_code} - {res_journal.text}"
journal_data = res_journal.json()
journal_id = journal_data["id"]
assert journal_data["voice_note_url"] is not None, "Voice note URL was not saved in journal"
print(f"✓ Private Journal: Created entry with voice note audio attachment! (ID: {journal_id}, Title: {journal_data['title']})")

# 7. Personal Insights & Analytics (Phase 7)
res_insights = requests.get(f"{BASE_URL}/api/insights/personal", headers=headers)
assert res_insights.status_code == 200, f"Insights failed: {res_insights.status_code}"
insights_res = res_insights.json()
assert "weekly_wellbeing_score" in insights_res["metrics"]
assert "energy_level" in insights_res["metrics"]
print(f"✓ Personal Insights Analytics: Calculated Wellbeing Score ({insights_res['metrics']['weekly_wellbeing_score']}%), Energy ({insights_res['metrics']['energy_level']}/10), Total check-ins: {insights_res['metrics']['total_checkins_this_month']}")

print("\n========================================")
print("ALL BACKEND & API TESTS PASSED WITH 100% SUCCESS!")
print("========================================")
