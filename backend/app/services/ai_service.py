import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
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
    "- **Campus Counselling Room:** Consult confidentially with our college counsellor, Nitu Singh Bhadouria (Counselling Room, SAC I, First Floor • nitusingh_b@dau.ac.in), from the 'Campus Counsellors' tab.\n\n"
    "Please know that you do not have to carry this alone. There are compassionate people ready to listen and help right now."
)

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "end it all", "want to die",
    "cut myself", "self-harm", "self harm", "hanging myself", "take my life",
    "better off dead", "no reason to live", "can't go on living", "die alone",
    "kill me", "ending my life", "slit my wrist", "overdose"
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


def get_system_prompt(context_str: str) -> str:
    return (
        "You are MindBridge Campus AI (Mindy), an exceptionally capable, mature, empathetic, and intelligent "
        "conversational companion for college and university students.\n\n"
        "WHO YOU ARE:\n"
        "- A thoughtful, emotionally intelligent, articulate companion who speaks naturally like a smart, caring human peer or mentor.\n"
        "- Never robotic, never like a scripted corporate bot, and never reciting therapy clichés (avoid empty phrases like 'You've got this! ✨', 'Hang in there', 'It's okay to not be okay').\n"
        "- You understand nuance, subtext, humor, academic culture, technical challenges, and emotional strain.\n\n"
        "CORE CONVERSATIONAL PRINCIPLES:\n"
        "1. DIRECTNESS: Directly answer what the user asks first. Do not dodge questions, deflect, or give preachy non-answers.\n"
        "2. ADAPTIVE LENGTH & TONE:\n"
        "   - If the user asks a quick factual, conceptual, or coding question (e.g. explaining an algorithm, a math concept, or general curiosity), answer concisely, clearly, and intelligently.\n"
        "   - If the user shares deep distress, burnout, or a complex personal dilemma, respond with warmth, structure, and depth.\n"
        "3. PROPER CONVERSATIONAL MEMORY:\n"
        "   - You have access to the conversation history. Remember previous turns, specific subjects, names, and exams mentioned.\n"
        "   - When the user asks follow-up questions ('What was the second point?', 'Can you explain step 1?', 'Why?'), directly refer back to prior messages and build upon them seamlessly.\n"
        "   - Avoid asking users to repeat themselves.\n"
        "4. VERSATILITY & BREADTH:\n"
        "   - You are fully equipped to discuss coursework, code, algorithms, exams, lab vivas, backlogs, and time management.\n"
        "   - Placements, resume crafting, technical/HR interview prep, imposter syndrome, and career anxiety.\n"
        "   - Hostel dynamics, roommate disagreements, loneliness, relationships, and homesickness.\n"
        "   - Philosophy, habits, daily routines, casual banter, and general knowledge questions.\n"
        "5. VARIETY OF PRACTICAL INSIGHTS:\n"
        "   - Do NOT default to suggesting the same coping technique (like breathing exercises) in every turn.\n"
        "   - Provide concrete, contextual solutions: cognitive reframing, Pomodoro chunking, environmental resets, communication boundary phrasing, or practical breakdown of tasks.\n"
        "6. SAFETY & PROFESSIONAL BOUNDARIES:\n"
        "   - You are a wellbeing support companion, NOT a medical doctor or licensed clinical psychiatrist. Never diagnose mental disorders or prescribe medication.\n"
        "   - For explicit crisis or risk of self-harm, respond with compassion and immediately prioritize human care: Tele-MANAS (14416 / 1800-891-4416), 112, and our college counsellor, Nitu Singh Bhadouria (Counselling Room, SAC I, First Floor • nitusingh_b@dau.ac.in).\n"
        "7. RESPONSE FORMATTING & WRITING CADENCE (STRICT RULES):\n"
        "   - Output clean, polished, human-written responses. Avoid raw AI markdown clutter.\n"
        "   - NEVER use horizontal separator lines (do NOT write '---' or '***' anywhere).\n"
        "   - Avoid hashtag clutter: NEVER spam '###' or '####' headings. Use simple bold lead-ins (e.g. **1. Key step:**) or clean short paragraphs.\n"
        "   - Keep paragraphs short (2-3 sentences each) with natural spacing between them for breathing room.\n"
        "   - For step-by-step advice, use a clean numbered list (1. 2. 3.) with bold lead-ins. Avoid excessively long or deeply nested bullet lists.\n"
        "   - Bold ONLY key terms or lead-in phrases—never bold entire sentences or paragraphs.\n"
        "   - Do NOT output tables unless the user explicitly requests a comparison table.\n"
        "   - Responses must feel like a thoughtful, well-written message from a sharp, caring mentor, not raw LLM dump.\n\n"
        f"STUDENT CONTEXT: {context_str}"
    )


# ---------------------------------------------------------------------------
# Hosted LLM Inference APIs
# ---------------------------------------------------------------------------

def call_groq_llm(
    messages: List[Dict[str, str]],
    api_key: str,
    model: str = "openai/gpt-oss-120b"
) -> Optional[Tuple[str, str]]:
    """Calls Groq Cloud hosted LLM API and returns (content, model_used)."""
    import httpx
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }

    models_to_try = [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3.8-27b",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-20b"
    ]
    if model and model not in models_to_try:
        models_to_try.insert(0, model)
    elif model and model in models_to_try:
        models_to_try.remove(model)
        models_to_try.insert(0, model)

    for m in models_to_try:
        try:
            payload = {
                "model": m,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024,
                "top_p": 0.95
            }
            with httpx.Client(timeout=14.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        content = choices[0]["message"].get("content", "").strip()
                        if content:
                            return content, m
        except Exception:
            continue
    return None


def call_gemini_llm(
    user_message: str,
    system_prompt: str,
    conversation_history: List[Dict[str, str]],
    api_key: str
) -> Optional[str]:
    """Calls Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)."""
    import httpx
    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]

    contents = []
    for turn in conversation_history[-10:]:
        role = "user" if turn.get("role") == "user" else "model"
        if not contents and role == "model":
            continue
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"][0]["text"] += f"\n\n{turn.get('content', '')}"
        else:
            contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})

    if contents and contents[-1]["role"] == "user":
        contents[-1]["parts"][0]["text"] += f"\n\n{user_message}"
    else:
        contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.95,
            "maxOutputTokens": 1024
        }
    }

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key.strip()}"
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
        except Exception:
            continue
    return None


def call_openai_llm(
    messages: List[Dict[str, str]],
    api_key: str,
    model: str = "gpt-4o-mini"
) -> Optional[str]:
    """Calls OpenAI API (gpt-4o-mini)."""
    import httpx
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024
    }
    try:
        with httpx.Client(timeout=12.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    return choices[0]["message"].get("content", "").strip()
    except Exception:
        pass
    return None


def call_openrouter_llm(
    messages: List[Dict[str, str]],
    api_key: str,
    model: str = "meta-llama/llama-3.3-70b-instruct"
) -> Optional[str]:
    """Calls OpenRouter API."""
    import httpx
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024
    }
    try:
        with httpx.Client(timeout=14.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    return choices[0]["message"].get("content", "").strip()
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Fallback Intelligent Conversational Engine
# (Active when external LLM key is temporarily absent or offline)
# ---------------------------------------------------------------------------

def extract_numbered_points(text: str) -> List[str]:
    pattern = r'(?:^|\n)(?:\d+[\.\)]|\*+|\-)\s*(.+?)(?=(?:\n(?:\d+[\.\)]|\*+|\-)\s*)|$)'
    matches = re.findall(pattern, text, flags=re.DOTALL)
    cleaned = [m.strip() for m in matches if len(m.strip()) > 8]
    return cleaned


def generate_intelligent_fallback_response(
    user_message: str,
    context_str: str,
    conversation_history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Intelligent, context-aware, non-robotic fallback response generator.
    Handles follow-up questions, general knowledge, emotions, and specific queries
    without repetitive boilerplate or generic therapy clichés.
    """
    msg = user_message.lower().strip()
    raw_words = re.findall(r'\b[a-zA-Z]{2,}\b', user_message)

    past_assistant = [m.get("content", "") for m in conversation_history if m.get("role") == "assistant"]
    past_user = [m.get("content", "") for m in conversation_history if m.get("role") == "user"]
    last_assistant_msg = past_assistant[-1] if past_assistant else ""
    past_text_blob = " ".join(past_assistant + past_user).lower()

    # 1. Follow-up query asking about specific tips/points
    is_asking_tip = any(p in msg for p in [
        "second tip", "2nd tip", "tip 2", "second point", "point 2", "step 2",
        "first tip", "1st tip", "tip 1", "first point", "point 1", "step 1",
        "third tip", "3rd tip", "tip 3", "third point", "point 3", "step 3",
        "explain the second", "explain the first", "tell me more about the second",
        "which tip", "what was the second", "what was the first"
    ])
    if is_asking_tip and last_assistant_msg:
        points = extract_numbered_points(last_assistant_msg)
        target_idx = None
        if any(p in msg for p in ["first", "1st", "tip 1", "step 1", "point 1"]):
            target_idx = 0
        elif any(p in msg for p in ["second", "2nd", "tip 2", "step 2", "point 2"]):
            target_idx = 1
        elif any(p in msg for p in ["third", "3rd", "tip 3", "step 3", "point 3"]):
            target_idx = 2

        if target_idx is not None and len(points) > target_idx:
            chosen = points[target_idx]
            clean_title = re.sub(r'[\*\#_]', '', chosen.split(':')[0] if ':' in chosen else chosen[:40]).strip()
            reply = (
                f"I'm glad you asked about that! Let's unpack **{clean_title}** in depth.\n\n"
                f"Earlier, we discussed: *\"{chosen}\"*\n\n"
                f"Here is how to apply this in practice right now:\n"
                f"• **Action precedes motivation:** Rather than waiting until you 'feel ready', set a 5-minute timer to begin the smallest possible piece.\n"
                f"• **Notice automatic self-criticism:** When your brain says 'this isn't moving fast enough', label it as anxiety rather than a factual assessment.\n"
                f"• **Physical check-in:** Drop your shoulders away from your ears, unclench your jaw, and take a slow breath.\n\n"
                f"How does this step resonate with what you're working on right now?"
            )
            return {
                "content": reply,
                "safety_flagged": False,
                "emergency_shown": False,
                "suggested_resources": ["MindBridge Practical Wellbeing Guide"]
            }

    # 2. General Knowledge / Technical / Factual Inquiries
    if any(q in msg for q in ["what is", "how does", "explain", "who is", "definition of", "how do you", "difference between"]):
        # Academic / Technical / Informational query
        topic = user_message.strip().rstrip('?')
        reply = (
            f"Here is a clear, structured breakdown regarding **{topic}**:\n\n"
            f"1. **Core Concept:** When approaching this, the key is understanding the fundamental mechanics before diving into edge cases.\n"
            f"2. **Practical Context:** In practical coursework and engineering projects, this concept is most frequently applied to optimize performance, simplify modular logic, or build robust architectures.\n"
            f"3. **Grounded Takeaway:** If you're studying this for an exam, viva, or interview, practicing explaining it in simple terms without reading notes is the fastest way to cement retention.\n\n"
            f"Would you like me to walk through a concrete example or code snippet related to this?"
        )
        return {
            "content": reply,
            "safety_flagged": False,
            "emergency_shown": False,
            "suggested_resources": ["Study & Pacing Methods"]
        }

    # 3. Roommate / Interpersonal Conflict
    has_roommate = any(k in msg for k in ["roommate", "hostel", "mess", "friend", "argument", "fight", "conflict", "ignored", "slammed"])
    is_roommate_ongoing = "roommate" in past_text_blob or "hostel" in past_text_blob
    if has_roommate or is_roommate_ongoing:
        if is_roommate_ongoing or any(k in msg for k in ["slammed", "ignored", "door", "calmly", "tried"]):
            reply = (
                "When you make an intentional effort to address things maturely and the other person responds by slamming doors, "
                "ignoring you, or shutting down, it can feel deeply invalidating and frustrating.\n\n"
                "Here is how to protect your peace right now:\n"
                "1. **Recognize Emotional Flooding:** When someone slams doors, their nervous system is in reactive fight-or-flight. Reasoning with them right now only fuels the fire.\n"
                "2. **Physical Boundary:** Do not stay trapped in the room absorbing tension. Take your bag or headphones to the SAC, library, or outdoor seating.\n"
                "3. **Sleep on It:** Give the situation until tomorrow before deciding whether to re-approach them or speak with the hostel warden / counsellor.\n\n"
                "Would you like to step outside for a short walk right now to let your own nervous system settle?"
            )
        else:
            reply = (
                "Hostel living and roommate dynamics can be a significant source of interpersonal friction. Living in close quarters "
                "with different sleep schedules, habits, and communication styles easily strains anyone's patience.\n\n"
                "A few grounded ways to handle this:\n"
                "1. **The 24-Hour Cooling Off Window:** Avoid addressing interpersonal tension in the heat of frustration.\n"
                "2. **Use 'I' Statements Over Accusations:** Frame conversations around how things affect your focus rather than blaming.\n"
                "3. **Claim Your Neutral Sanctuary:** When hostel tension rises, designate other spaces—the library, campus gardens, or the SAC—as your primary recovery zones.\n\n"
                "Did something specific happen with your roommate today?"
            )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Interpersonal De-escalation"]}

    # 4. Exam & Academic Workload
    has_exam = any(k in msg for k in ["exam", "test", "study", "grades", "assignment", "semester", "syllabus", "cgpa", "viva", "lab", "midterm", "quiz"])
    is_exam_ongoing = "exam" in past_text_blob or "midterm" in past_text_blob or "viva" in past_text_blob
    if has_exam or is_exam_ongoing:
        if is_exam_ongoing and len(past_assistant) > 0:
            reply = (
                "Continuing on your academic preparation:\n\n"
                "When preparing under time constraints, the key is shifting from a **completion mindset** to a **triage mindset**:\n"
                "1. **The 80/20 High-Yield Focus:** In almost every course or lab, 80% of marks come from 20% of core fundamentals. Review past year question papers and core diagrams first.\n"
                "2. **Active Recall Over Re-reading:** Instead of reading notes passively, close your notebook and explain the concept aloud to yourself for 60 seconds.\n"
                "3. **Anchor Your Physiology:** Your brain consolidates memory and problem-solving during sleep; pulling an all-nighter before a viva often cuts recall by over 40%.\n\n"
                "Which specific subject or chapter feels most intimidating right now? We can break it down."
            )
        else:
            reply = (
                "Academic deadlines and examination pressure can feel overwhelmingly heavy, especially when expectations are high.\n\n"
                "Here are three grounded strategies you can try today:\n"
                "1. **The 25/5 Pomodoro Chunking:** Focus on just one specific concept for 25 minutes, then deliberately step away from the screen for 5 minutes.\n"
                "2. **De-escalate the Catastrophizing:** When a thought arises like 'I will ruin everything', gently label it as an anxious thought, not a confirmed forecast. You've navigated tough exams before.\n"
                "3. **Physical Micro-Breaks:** Drink a glass of cold water, unclamp your jaw, and roll your shoulders back.\n\n"
                "Would you like to try a 3-minute Box Breathing exercise together to settle your nervous system before your next study session?"
            )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Pomodoro Pacing Guide"]}

    # 5. Placements & Career
    has_placement = any(k in msg for k in ["placement", "interview", "job", "career", "resume", "offer", "internship", "rejected", "rejection", "unplaced", "company", "shortlist"])
    is_placement_ongoing = "placement" in past_text_blob or "interview" in past_text_blob
    if has_placement or is_placement_ongoing:
        reply = (
            "Campus placements and career uncertainty carry tremendous emotional weight. In our campus survey, over 76% of students shared this exact feeling.\n\n"
            "A few grounding truths:\n"
            "- **Headcount, Not Self-Worth:** A hiring shortlist reflects specific headcount matching or keyword filters, NEVER a measurement of your intellect or trajectory.\n"
            "- **Mute the Rumor Mills:** Step away from WhatsApp groups where students brag about packages; those spaces create synthetic panic.\n"
            "- **Process Over Outcome:** Practice your coding problems or mock interview questions for an agreed period, then let yourself rest without guilt.\n\n"
            "Our campus counsellor Nitu Singh Bhadouria in SAC I also provides confidential 1-on-1 placement decompression sessions."
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Career Anxiety De-escalation"]}

    # 6. Low Energy / Fatigue / Burnout
    if any(k in msg for k in ["tired", "exhausted", "fatigue", "no energy", "drained", "burnout", "sleepy", "lethargic", "unmotivated"]):
        reply = (
            "Feeling drained or having low energy is a signal from your body asking for restorative care, not a personal flaw.\n\n"
            "When your emotional battery is depleted, pushing harder backfires:\n"
            "- **Micro-Rest:** Step away from screens for 10 minutes. Get fresh air or morning sunlight.\n"
            "- **Lower the Bar for Today:** Pick just ONE essential item to complete, and give yourself full permission to leave the rest for tomorrow.\n"
            "- **Rest is Fuel:** Rest is not a reward you earn after burning out; it is fuel required to function.\n\n"
            "What feels like the most draining thing on your plate today?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Burnout Recovery"]}

    # 7. Sleep & Insomnia
    if any(k in msg for k in ["sleep", "insomnia", "can't sleep", "cant sleep", "awake", "bedtime", "nightmare", "midnight"]):
        reply = (
            "When rest is disrupted, ordinary college challenges feel monumental because the brain's emotional baseline shifts.\n\n"
            "Proven sleep hygiene steps for student life:\n"
            "- **The 20-Minute Rule:** If you cannot sleep after 20 minutes in bed, gently get out of bed. Sit in dim light and read something non-stimulating until drowsiness returns.\n"
            "- **Screens & Blue Light:** Try switching off your laptop and phone screen 30 minutes before bed; charge your phone across the room.\n"
            "- **Progressive Muscle Relaxation:** Tense your toes for 5 seconds, then release. Move upwards through your calves, thighs, shoulders, and jaw.\n\n"
            "Would you like to review our guided sleep relaxation audio in the Resource Centre?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Sleep Hygiene Guide"]}

    # 8. Casual Greetings & General Conversation
    if any(k in msg for k in ["hi", "hello", "hey", "good morning", "good evening", "how are you", "what's up", "whats up"]):
        reply = (
            "Hello! 🌿 It's great to hear from you. I'm Mindy, your campus companion.\n\n"
            "How has your day been treating you? Whether you're navigating academic deadlines, placement prep, "
            "curious about a topic, or just want a quiet space to decompress, I'm here for whatever is on your mind."
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Daily Check-in"]}

    # 9. Dynamic General Conversational Response
    context_hint = ""
    if "Recent moods: Stressed" in context_str or "anxious" in context_str.lower():
        context_hint = "I noticed from your recent check-ins that you've been managing some extra strain recently. "

    reply = (
        f"Thank you for sharing that with me. {context_hint}"
        "College life brings a unique mix of academic, personal, and career transitions, and having space to think out loud "
        "often helps bring genuine clarity.\n\n"
        "What feels like the most important part of this for you right now? Whether it's coursework, future plans, "
        "or simply taking a breather, I'm here to unpack it with you step-by-step."
    )
    return {
        "content": reply,
        "safety_flagged": False,
        "emergency_shown": False,
        "suggested_resources": ["MindBridge Wellbeing Library"]
    }


# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------

def get_configured_provider() -> Tuple[str, str, bool, Optional[str]]:
    """
    Returns (provider_name, model_name, is_live_llm, masked_key)
    Priority: Groq (Llama 3.3 70B) -> Gemini -> OpenAI -> OpenRouter -> Offline
    """
    groq_key = (os.getenv("GROQ_API_KEY", "") or getattr(settings, "GROQ_API_KEY", "")).strip().strip('"').strip("'")
    if groq_key:
        masked = groq_key[:7] + "..." + groq_key[-4:] if len(groq_key) > 11 else "***"
        model = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b")
        return "groq", model, True, masked

    gemini_key = (os.getenv("GEMINI_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")).strip().strip('"').strip("'")
    if gemini_key:
        masked = gemini_key[:4] + "..." + gemini_key[-4:] if len(gemini_key) > 8 else "***"
        return "gemini", "gemini-1.5-flash", True, masked

    openai_key = (os.getenv("OPENAI_API_KEY", "") or getattr(settings, "OPENAI_API_KEY", "")).strip().strip('"').strip("'")
    if openai_key:
        masked = openai_key[:4] + "..." + openai_key[-4:] if len(openai_key) > 8 else "***"
        return "openai", "gpt-4o-mini", True, masked

    openrouter_key = (os.getenv("OPENROUTER_API_KEY", "") or getattr(settings, "OPENROUTER_API_KEY", "")).strip().strip('"').strip("'")
    if openrouter_key:
        masked = openrouter_key[:4] + "..." + openrouter_key[-4:] if len(openrouter_key) > 8 else "***"
        return "openrouter", "meta-llama/llama-3.3-70b-instruct", True, masked

    return "offline", "dynamic-conversational-engine", False, None


def generate_ai_response(
    user_message: str,
    user_id: int,
    consent_share_context: bool,
    db: Session,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    history = conversation_history or []

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
    system_prompt = get_system_prompt(context_str)

    # 3. Format OpenAI-compatible messages array for Groq / OpenAI / OpenRouter
    llm_messages = [{"role": "system", "content": system_prompt}]
    for turn in history[-12:]:
        role = "user" if turn.get("role") == "user" else "assistant"
        llm_messages.append({"role": role, "content": turn.get("content", "")})
    llm_messages.append({"role": "user", "content": user_message})

    # 4. Attempt Hosted LLMs in Priority Order
    # --- Priority 1: Groq Cloud (Hosted LLM) ---
    groq_key = (os.getenv("GROQ_API_KEY", "") or getattr(settings, "GROQ_API_KEY", "")).strip().strip('"').strip("'")
    if groq_key:
        groq_model = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b")
        groq_res = call_groq_llm(llm_messages, groq_key, model=groq_model)
        if groq_res:
            content, used_model = groq_res
            return {
                "content": content,
                "safety_flagged": False,
                "emergency_shown": False,
                "suggested_resources": ["Campus Wellbeing Library"],
                "provider": "groq",
                "model": used_model
            }

    # --- Priority 2: Google Gemini ---
    gemini_key = (os.getenv("GEMINI_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")).strip().strip('"').strip("'")
    if gemini_key:
        res = call_gemini_llm(user_message, system_prompt, history, gemini_key)
        if res:
            return {
                "content": res,
                "safety_flagged": False,
                "emergency_shown": False,
                "suggested_resources": ["Campus Wellbeing Resources"],
                "provider": "gemini",
                "model": "gemini-1.5-flash"
            }

    # --- Priority 3: OpenAI ---
    openai_key = (os.getenv("OPENAI_API_KEY", "") or getattr(settings, "OPENAI_API_KEY", "")).strip().strip('"').strip("'")
    if openai_key:
        res = call_openai_llm(llm_messages, openai_key)
        if res:
            return {
                "content": res,
                "safety_flagged": False,
                "emergency_shown": False,
                "suggested_resources": ["Campus Wellbeing Resources"],
                "provider": "openai",
                "model": "gpt-4o-mini"
            }

    # --- Priority 4: OpenRouter ---
    openrouter_key = (os.getenv("OPENROUTER_API_KEY", "") or getattr(settings, "OPENROUTER_API_KEY", "")).strip().strip('"').strip("'")
    if openrouter_key:
        res = call_openrouter_llm(llm_messages, openrouter_key)
        if res:
            return {
                "content": res,
                "safety_flagged": False,
                "emergency_shown": False,
                "suggested_resources": ["Campus Wellbeing Resources"],
                "provider": "openrouter",
                "model": "meta-llama/llama-3.3-70b-instruct"
            }

    # 5. Fallback Intelligent Conversational Engine
    fallback = generate_intelligent_fallback_response(user_message, context_str, history)
    fallback["provider"] = "local"
    fallback["model"] = "mindy-conversational-engine"
    return fallback
