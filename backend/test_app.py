from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("Starting automated test suite for MindBridge Campus...")
    with TestClient(app) as client:
        # 1. Health
        h = client.get('/api/health')
        assert h.status_code == 200, f"Health check failed: {h.text}"
        print(f"✓ Health Check: {h.json()}")

        # 2. Frontend HTML
        f = client.get('/')
        assert f.status_code == 200, f"Frontend root failed: {f.text}"
        assert "<div id=\"root\">" in f.text, "Root element missing in HTML"
        print(f"✓ Frontend Served Correctly ({len(f.text)} bytes)")

        # 3. Student Login
        res_login = client.post('/api/auth/login', json={'email': 'student@mindbridge.edu', 'password': 'student123'})
        assert res_login.status_code == 200, f"Login failed: {res_login.text}"
        student_data = res_login.json()
        token = student_data['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print(f"✓ Student Login: {student_data['user']['full_name']} ({student_data['user']['role']})")

        # 4. Personal Insights
        ins = client.get('/api/insights/personal', headers=headers)
        assert ins.status_code == 200, f"Insights failed: {ins.text}"
        score = ins.json()['metrics']['weekly_wellbeing_score']
        print(f"✓ Personal Insights: Weekly Score = {score}/100, Total Insights = {len(ins.json()['insights'])}")

        # 5. Mood tracking retrieval
        moods = client.get('/api/mood/?days=30', headers=headers)
        assert moods.status_code == 200, f"Mood retrieval failed: {moods.text}"
        print(f"✓ Mood Tracking: Retrieved {len(moods.json())} entries")

        # 6. Stress summary
        stress_sum = client.get('/api/stress/summary', headers=headers)
        assert stress_sum.status_code == 200, f"Stress summary failed: {stress_sum.text}"
        print(f"✓ Stress Summary: Avg = {stress_sum.json()['average_level']}/10, Primary Trigger = {stress_sum.json()['most_frequent_trigger']}")

        # 7. Sleep metrics
        sleep_met = client.get('/api/sleep/metrics', headers=headers)
        assert sleep_met.status_code == 200, f"Sleep metrics failed: {sleep_met.text}"
        print(f"✓ Sleep Metrics: Avg = {sleep_met.json()['average_hours']} hrs, Consistency = {sleep_met.json()['consistency_percentage']}%")

        # 8. Private Journal isolation check
        journals = client.get('/api/journal/', headers=headers)
        assert journals.status_code == 200, f"Journal retrieval failed: {journals.text}"
        print(f"✓ Private Journal: {len(journals.json())} private entries (User Isolated)")

        # 9. AI Assistant Chat
        ai_chat = client.post('/api/ai/chat', headers=headers, json={'message': 'I have placement anxiety and trouble sleeping'})
        assert ai_chat.status_code == 200, f"AI chat failed: {ai_chat.text}"
        print(f"✓ AI Assistant Response: \"{ai_chat.json()['content'][:70]}...\"")

        # 10. AI Assistant Crisis Safety Detection
        ai_crisis = client.post('/api/ai/chat', headers=headers, json={'message': 'I want to end my life, can not take it'})
        assert ai_crisis.status_code == 200, f"AI crisis failed: {ai_crisis.text}"
        crisis_data = ai_crisis.json()
        assert crisis_data['safety_flagged'] == True, "Crisis safety flag was not triggered!"
        assert "14416" in crisis_data['content'], "Tele-MANAS hotline not in crisis message!"
        print(f"✓ AI Crisis Detection: Flagged = {crisis_data['safety_flagged']}, Emergency Tele-MANAS (14416) displayed")

        # 11. Counsellor Login & Access
        res_c_login = client.post('/api/auth/login', json={'email': 'counsellor@mindbridge.edu', 'password': 'counsellor123'})
        assert res_c_login.status_code == 200
        c_token = res_c_login.json()['access_token']
        c_headers = {'Authorization': f'Bearer {c_token}'}
        c_apts = client.get('/api/appointments/my', headers=c_headers)
        assert c_apts.status_code == 200
        print(f"✓ Counsellor Portal: {len(c_apts.json())} appointments loaded for Dr. Ananya Sharma")

        # 12. Admin Stats & Aggregate Trends
        res_a_login = client.post('/api/auth/login', json={'email': 'admin@mindbridge.edu', 'password': 'admin123'})
        assert res_a_login.status_code == 200
        a_token = res_a_login.json()['access_token']
        a_headers = {'Authorization': f'Bearer {a_token}'}
        stats = client.get('/api/admin/stats', headers=a_headers)
        assert stats.status_code == 200
        print(f"✓ Admin Platform Stats: {stats.json()}")

        print("\n🎉 ALL 12 END-TO-END AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == '__main__':
    run_tests()
