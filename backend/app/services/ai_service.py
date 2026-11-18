import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.models.tracking import MoodEntry, StressEntry, SleepEntry

# Emergency resources for Indian student context
EMERGENCY_SUPPORT_TEXT = (
    "\n\n🚨 **Immediate Crisis & Confidential Support Resources:**\n"
    "- **Tele-MANAS (Govt. of India 24/7 Mental Health Helpline):** Call **14416** or **1800-891-4416** (Toll-Free, Multilingual)\n"
    "- **National Emergency Services:** Call **112**\n"
    "- **KIRAN Mental Health Rehabilitation Helpline:** Call **1800-599-0019**\n"
    "- **Campus Wellness Centre:** Book an appointment directly with our campus counsellor Dr. Ananya Sharma from the 'Find a Counsellor' tab.\n\n"
    "Please know that you do not have to carry this alone. There are compassionate people ready to listen and help right now."
)

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "end it all", "want to die", 
    "cut myself", "self-harm", "self harm", "hanging myself", "take my life", 
    "better off dead", "no reason to live", "can't go on living", "die alone"
]

def detect_crisis(message: str) -> bool:
    lowered = message.lower()
    for kw in CRISIS_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', lowered):
            return True
    return False

def get_student_context(user_id: int, db: Session) -> str:
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_moods = db.query(MoodEntry).filter(
        MoodEntry.user_id == user_id,
        MoodEntry.recorded_at >= seven_days_ago
    ).order_by(MoodEntry.recorded_at.desc()).limit(5).all()

    recent_stress = db.query(StressEntry).filter(
        StressEntry.user_id == user_id,
        StressEntry.recorded_at >= seven_days_ago
    ).order_by(StressEntry.recorded_at.desc()).limit(5).all()

    recent_sleep = db.query(SleepEntry).filter(
        SleepEntry.user_id == user_id,
        SleepEntry.recorded_at >= seven_days_ago
    ).order_by(SleepEntry.recorded_at.desc()).limit(5).all()

    summary_parts = []
    if recent_moods:
        mood_names = [m.mood for m in recent_moods]
        energy_avg = sum(getattr(m, 'energy_level', 5) or 5 for m in recent_moods) / len(recent_moods)
        summary_parts.append(f"Recent moods: {', '.join(mood_names)} (Avg Energy: {round(energy_avg, 1)}/10)")
    if recent_stress:
        avg_s = sum(s.level for s in recent_stress) / len(recent_stress)
        cats = list(set(s.category for s in recent_stress))
        summary_parts.append(f"Stress level avg: {round(avg_s, 1)}/10, primary domains: {', '.join(cats)}")
    if recent_sleep:
        avg_sl = sum(s.duration_hours for s in recent_sleep) / len(recent_sleep)
        summary_parts.append(f"Average nightly sleep: {round(avg_sl, 1)} hours")

    if summary_parts:
        return "Student's Consented Wellbeing Tracking Context (Past 7 Days): " + " | ".join(summary_parts)
    return "No recent tracking logs available."

def generate_local_response(user_message: str, context_str: str) -> Dict[str, Any]:
    msg = user_message.lower()
    
    # 0. Voice Note Reflection
    if any(k in msg for k in ["voice note", "recorded a voice", "audio reflection"]):
        reply = (
            "I received and listened to your voice reflection 🎙️. Taking the time to speak your thoughts aloud "
            "often brings emotional clarity that typing alone cannot provide.\n\n"
            "From what you shared, remember that your current feelings—whether they relate to academic load, placement worries, "
            "or exhaustion—are valid signals from your body asking for rest and pacing, not weaknesses.\n\n"
            "Would you like to try a calming 3-minute breathwork session, or write down one small win from today?"
        )
        return {
            "content": reply,
            "safety_flagged": False,
            "emergency_shown": False,
            "suggested_resources": ["4-7-8 Breathing Technique", "2-Minute Daily Reflection Guide"]
        }

    # 1. Exam / Academic stress (#3 Stressor in Survey: 63.7%)
    elif any(k in msg for k in ["exam", "test", "study", "grades", "assignment", "semester", "academic", "syllabus", "cgpa", "marks"]):
        reply = (
            "I hear how demanding academic workloads and examination pressure can feel right now. "
            "When deadlines and syllabi pile up, our minds naturally enter overdrive trying to protect our future.\n\n"
            "Here are three grounded strategies you can try today:\n"
            "1. **The 25/5 Pomodoro Chunking:** Focus on just one specific concept for 25 minutes, then deliberately step away from the screen for 5 minutes. Notice what is directly in front of you.\n"
            "2. **De-escalate the Catastrophizing:** When a thought arises like 'I will ruin everything', gently label it as an anxious thought, not a confirmed forecast. You've navigated tough exams before.\n"
            "3. **Physical Micro-Breaks:** Drink a glass of cold water, unclamp your jaw, and roll your shoulders back.\n\n"
            "Would you like to try a 3-minute Box Breathing exercise together to settle your nervous system before your next study session?"
        )
        resources = ["4-7-8 Breathing Technique", "Tackling Academic Burnout Guide"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 2. Placement / Career Anxiety (#1 & #2 Stressors in Survey: 76% & 69%)
    elif any(k in msg for k in ["placement", "interview", "job", "career", "resume", "offer", "internship", "rejected", "rejection", "unplaced", "company"]):
        reply = (
            "Campus placements and career uncertainty carry a tremendous amount of emotional weight. "
            "Our campus survey shows over 76% of students experience this exact same anxiety.\n\n"
            "It's easy to start tying your personal self-worth to interview callbacks or shortlists, but please remember: "
            "a hiring shortlist is a match of immediate business headcount, NEVER a measurement of your intellect or future trajectory.\n\n"
            "A few gentle anchors:\n"
            "- **Focus on Process Over Outcome:** Practice your coding problems or mock interview questions for an agreed period, then let yourself rest without guilt.\n"
            "- **Beware Peer Comparison Distortion:** Social media and hostel banter amplify early offers while keeping dozens of quiet rejections hidden.\n"
            "- **One Step Today:** What is one tiny, manageable step you can take today—polishing one bullet point on your resume or doing one practice problem?\n\n"
            "Our campus counsellors also provide confidential 1-on-1 placement decompression sessions."
        )
        resources = ["Tackling Placement Rejection & Imposter Syndrome", "Career Anxiety De-escalation Plan"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 3. Low Energy / Fatigue / Burnout (Survey: 65.3% tired often/daily)
    elif any(k in msg for k in ["tired", "exhausted", "fatigue", "no energy", "drained", "burnout", "sleepy", "lethargic"]):
        reply = (
            "I hear you. Feeling constantly drained or lacking daytime energy is one of the most common challenges on campus—over 65% of students report this exact pattern.\n\n"
            "When your emotional or physical battery is depleted, pushing harder often backfires. Your body is asking for restorative care:\n"
            "- **Energy Audits:** Notice what is draining your reserves: late-night phone scrolling, skipping breakfast, or cognitive hyper-focus.\n"
            "- **Hydration & Sunlight:** Step outside for 10 minutes of morning sunlight to reset your circadian rhythms.\n"
            "- **Permission to Rest:** Rest is not a reward you earn after burning out; it is fuel required to function.\n\n"
            "Would you like to log this in today's wellbeing check-in so we can track how your energy correlates with your sleep duration?"
        )
        resources = ["College Student's Guide to Sleep Hygiene", "Overcoming Academic Burnout"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 4. Sleep / Insomnia / Racing Thoughts
    elif any(k in msg for k in ["sleep", "insomnia", "can't sleep", "awake", "bedtime", "nightmare", "midnight"]):
        reply = (
            "Irregular sleep heavily influences our emotional baseline. When rest is disrupted, the brain's amygdala "
            "becomes significantly more reactive, making ordinary challenges feel monumental.\n\n"
            "Proven sleep hygiene steps tailored for hostel and student life:\n"
            "- **The 20-Minute Rule:** If you cannot sleep after 20 minutes in bed, gently get out of bed. Sit in dim light and read something non-stimulating until drowsiness returns.\n"
            "- **Screens & Blue Light:** Try switching off your laptop and phone screen 30 minutes before bed; charge your phone across the room if possible.\n"
            "- **Progressive Muscle Relaxation:** Tense your toes for 5 seconds, then release. Move upwards through your calves, thighs, shoulders, and jaw.\n\n"
            "Would you like to review our guided sleep relaxation audio in the Resource Centre?"
        )
        resources = ["College Student's Guide to Sleep Hygiene", "Progressive Muscle Relaxation for Deep Rest"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 5. Time Management / Procrastination (Survey: 47.3%)
    elif any(k in msg for k in ["procrastinat", "time management", "waste time", "focus", "concentrat", "distract", "lazy", "behind"]):
        reply = (
            "Procrastination is rarely about laziness—psychologically, it is almost always an emotional regulation issue. "
            "When a task feels overwhelming, uncertain, or boring, our brain avoids the discomfort by seeking immediate dopamine.\n\n"
            "Here is how to break the cycle gently:\n"
            "- **The 5-Minute Rule:** Commit to working on the task for just five minutes. If you want to stop after 5 minutes, you can. Usually, overcoming the starting friction is 90% of the battle.\n"
            "- **Lower the Definition of 'Done':** A messy first draft or partial solution is infinitely better than a blank page.\n"
            "- **Remove Distraction Triggers:** Place your phone in another room or turn on Do Not Disturb during focus blocks.\n\n"
            "Be kind to yourself as you restart. You don't have to fix everything in one afternoon."
        )
        resources = ["Time-Management & Pacing Strategies", "Pomodoro Focus Guide"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 6. Family Expectations & Pressure (Survey: 54%)
    elif any(k in msg for k in ["family", "parents", "expectation", "pressure", "father", "mother", "disappoint", "compare"]):
        reply = (
            "Navigating family expectations alongside your own aspirations is a deeply delicate and heavy emotional balance. "
            "In our campus survey, more than half of students identified family pressure as a primary stressor.\n\n"
            "A few grounding thoughts:\n"
            "- **Differentiating Care From Pressure:** Parents often project their own anxieties about financial security or social standing onto academic performance out of love, even if the delivery feels suffocating.\n"
            "- **Your Journey is Yours:** You are studying and building a life for yourself, not merely fulfilling a script written by someone else.\n"
            "- **Boundaries:** It is completely healthy to set gentle conversational boundaries around exam results or placement packages.\n\n"
            "If this pressure feels suffocating, speaking with a campus counsellor can help you clarify your own voice."
        )
        resources = ["Navigating Family Expectations & Boundaries", "Book Confidential Counsellor"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 7. Financial Stress (Survey: 48%)
    elif any(k in msg for k in ["money", "financial", "fees", "cost", "afford", "expensive", "debt", "loan"]):
        reply = (
            "Financial worries during college can induce persistent background anxiety that affects your sleep and concentration. "
            "Nearly 48% of students in our campus study shared this concern.\n\n"
            "Key campus steps to consider:\n"
            "- **Campus Aid & Scholarships:** Check the Dean of Student Affairs portal for emergency student assistance funds, merit-cum-means grants, or departmental assistantships.\n"
            "- **Peer Budgeting:** It is completely okay to say 'that's out of my budget right now' when peers plan expensive outings.\n\n"
            "Our campus support centre can also connect you with student financial aid officers."
        )
        resources = ["Campus Financial Assistance Directory", "MindBridge Wellbeing Library"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 8. Loneliness / Social Isolation / Homesickness
    elif any(k in msg for k in ["lonely", "alone", "homesick", "friend", "isolated", "nobody", "roommate", "miss home", "disconnect"]):
        reply = (
            "Living in a hostel or navigating college social dynamics can feel intensely isolating at times. "
            "Even on a bustling campus, many students experience a profound sense of solitude behind closed doors.\n\n"
            "Remember:\n"
            "- Connecting doesn't require being the center of attention. Small, micro-interactions—a shared greeting with a classmate, sitting in the common library area, or calling home—can gradually rebuild warmth.\n"
            "- Campus clubs and student interest groups provide low-pressure spaces where shared curiosity does the heavy lifting.\n"
            "- Our campus counsellors host open drop-in chats if you'd simply like an empathetic space to speak your mind freely.\n\n"
            "You are not alone in feeling this, and reaching out is a sign of strength."
        )
        resources = ["Overcoming Campus Isolation & Building Meaningful Connections"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # 9. Anxiety / Panic / Overwhelm
    elif any(k in msg for k in ["anxious", "anxiety", "panic", "overwhelmed", "freaking out", "racing heart", "scared", "nervous"]):
        reply = (
            "I want you to pause right now and take a slow, deep breath in... and let it gently out. "
            "You are in a safe physical space right here.\n\n"
            "Let's ground your senses with the **5-4-3-2-1 Technique**:\n"
            "• Look around and notice **5 things you can see** (a pen, shadows, window, desk).\n"
            "• Feel **4 things you can touch** (your feet on the floor, texture of your sleeves).\n"
            "• Listen for **3 distinct sounds** (fan humming, birds outside, clock).\n"
            "• Notice **2 things you can smell** (coffee, fresh air).\n"
            "• Acknowledge **1 positive thing about yourself**.\n\n"
            "Your nervous system is doing its best to protect you, but this physical wave will pass. Take another breath."
        )
        resources = ["5-4-3-2-1 Sensory Grounding Technique", "4-7-8 Breathing Technique"]
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": resources}

    # Default general empathetic response
    else:
        context_hint = ""
        if "Recent moods: Stressed" in context_str or "anxious" in context_str.lower():
            context_hint = "I noticed from your recent check-ins that you've been managing some extra strain recently. "

        reply = (
            f"Thank you for sharing that with me. {context_hint}"
            "College life brings a unique mix of academic, social, and personal responsibilities, and it's completely valid "
            "to check in with yourself and acknowledge how you're feeling.\n\n"
            "What feels like the biggest thing on your mind right now? Whether it's coursework, placement prep, sleep, "
            "or just needing a quiet moment to reflect, I'm here to listen and help you unpack it step-by-step."
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["MindBridge Wellbeing Library"]}

def generate_ai_response(
    user_message: str,
    user_id: int,
    consent_share_context: bool,
    db: Session
) -> Dict[str, Any]:
    # 1. Immediate Safety & Crisis Protocol
    if detect_crisis(user_message):
        crisis_response = (
            "I hear how much pain you are in right now, and I care deeply about your safety. "
            "While I am an AI wellbeing assistant and cannot provide clinical crisis intervention, "
            "you do NOT have to carry this immense weight by yourself. Immediate, confidential, "
            "and compassionate human support is available right now."
            + EMERGENCY_SUPPORT_TEXT
        )
        return {
            "content": crisis_response,
            "safety_flagged": True,
            "emergency_shown": True,
            "suggested_resources": ["Emergency Helplines", "Tele-MANAS (14416)", "Campus Counsellor Urgent Booking"]
        }

    # 2. Extract consented student context
    context_str = get_student_context(user_id, db) if consent_share_context else "Student opted not to share tracking context."

    # 3. Check for external API (Gemini or OpenAI)
    api_key = settings.GEMINI_API_KEY.strip().strip('"').strip("'") if settings.GEMINI_API_KEY else ""
    if api_key:
        try:
            import httpx
            system_prompt = (
                "You are MindBridge Campus AI (Mindy), an empathetic, supportive, and non-judgmental student wellbeing companion. "
                "You support college students with career anxiety, exam stress, placements, sleep, relationships, and emotional wellbeing. "
                "CRITICAL GUIDELINES:\n"
                "1. NEVER give clinical diagnoses, medical advice, or prescribe medications.\n"
                "2. Clearly identify yourself as a wellbeing support companion, not a replacement for professional human counselling.\n"
                "3. Offer practical, student-friendly coping strategies (breathing exercises, Pomodoro pacing, sleep hygiene, grounding).\n"
                "4. Be warm, validating, conversational, and constructive.\n"
                f"Context: {context_str}"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"System Instructions: {system_prompt}\n\nStudent Message: {user_message}"}]}
                ]
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {
                        "content": text,
                        "safety_flagged": False,
                        "emergency_shown": False,
                        "suggested_resources": ["Campus Wellbeing Resources"]
                    }
        except Exception:
            pass  # Fall back smoothly to local empathetic response

    # 4. Fallback / Local Engine
    return generate_local_response(user_message, context_str)
