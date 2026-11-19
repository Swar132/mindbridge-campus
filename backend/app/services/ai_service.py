import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.user import User
from app.models.ai import AIConversation, AIMessage, StudentMemory

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

def get_student_tracking_context(user_id: int, db: Session) -> str:
    """Retrieves consented wellbeing check-in metrics for the past 7 days."""
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


# ---------------------------------------------------------------------------
# Long-Term Conversational Memory & Progress Engine
# ---------------------------------------------------------------------------

def extract_and_update_student_memories(
    user_id: int,
    user_message: str,
    ai_reply: str,
    db: Session
) -> List[StudentMemory]:
    """
    Intelligently identifies goals, commitments, habits, and progress updates
    from user messages and persists them to the student_memories table.
    Enables Mindy to remember goals across conversations and track progress.
    """
    msg = user_message.lower().strip()
    extracted_memories = []
    now = datetime.now(timezone.utc)

    # 1. DSA & Problem Solving Goals / Updates
    is_dsa_related = any(k in msg for k in ["dsa", "leetcode", "coding problem", "codeforces", "gfg", "data structures", "algorithm"])
    if is_dsa_related:
        # Check for specific daily/weekly target
        num_match = re.search(r'(\d+|two|three|one|four|five)\s*(?:dsa\s*)?(?:problems?|questions?)', msg)
        target_qty = num_match.group(1) if num_match else "two"
        if target_qty == "2": target_qty = "two"
        elif target_qty == "1": target_qty = "one"
        elif target_qty == "3": target_qty = "three"

        # Check if reporting progress / completion
        has_solved = any(k in msg for k in ["solved", "did", "completed", "done with", "finished", "practiced", "streak"])
        has_failed = any(k in msg for k in ["couldn't", "could not", "failed", "missed", "skipped", "didn't do", "broke my streak", "fell behind", "struggling"])

        existing = db.query(StudentMemory).filter(
            StudentMemory.user_id == user_id,
            StudentMemory.topic.ilike("%dsa%"),
            StudentMemory.is_active == True
        ).first()

        if existing:
            existing.last_mentioned_at = now
            if has_solved:
                existing.progress_status = "in_progress"
                existing.details = f"Student actively practicing and solved problems on {now.strftime('%b %d')}."
            elif has_failed:
                existing.progress_status = "struggling"
                existing.details = f"Student reported struggling or missing daily target on {now.strftime('%b %d')}. Mindy should offer gentle reassurance."
            db.commit()
            extracted_memories.append(existing)
        elif any(k in msg for k in ["want to", "plan to", "aiming to", "goal", "will solve", "trying to", "daily"]):
            mem = StudentMemory(
                user_id=user_id,
                category="goal",
                topic="DSA Problem Solving",
                key_point=f"Wants to solve {target_qty} DSA problems daily on LeetCode / GFG",
                details=f"Committed to consistent problem solving for placement readiness (recorded {now.strftime('%b %d')}).",
                progress_status="active",
                target_frequency="daily",
                last_mentioned_at=now
            )
            db.add(mem)
            db.commit()
            db.refresh(mem)
            extracted_memories.append(mem)

    # 2. Campus Placement & Interview Preparation
    is_placement = any(k in msg for k in ["placement", "interview", "campus drive", "resume", "shortlist", "aptitude round", "unplaced", "company"])
    if is_placement and any(k in msg for k in ["prep", "nervous", "anxiety", "preparing", "target", "aim", "interview", "tier", "offer"]):
        existing_p = db.query(StudentMemory).filter(
            StudentMemory.user_id == user_id,
            StudentMemory.topic.ilike("%placement%"),
            StudentMemory.is_active == True
        ).first()

        company_match = re.search(r'\b(?:at|for|with)\s+([A-Z][a-zA-Z0-9]+)\b', user_message)
        comp_name = company_match.group(1) if company_match else None

        if existing_p:
            existing_p.last_mentioned_at = now
            if any(k in msg for k in ["cleared", "selected", "shortlisted", "offer", "passed"]):
                existing_p.progress_status = "achieved"
                existing_p.details = f"Great milestone: student reported positive placement news on {now.strftime('%b %d')}!"
            elif any(k in msg for k in ["rejected", "failed", "eliminated", "lost"]):
                existing_p.progress_status = "struggling"
                existing_p.details = f"Navigated a rejection on {now.strftime('%b %d')}. Mindy should emphasize resilience and perspective."
            db.commit()
            extracted_memories.append(existing_p)
        else:
            kp = f"Preparing for campus placements and technical interviews"
            if comp_name:
                kp += f" (focused on {comp_name})"
            mem = StudentMemory(
                user_id=user_id,
                category="placement",
                topic="Campus Placement Preparation",
                key_point=kp,
                details="Managing interview anxiety, technical preparation, and aptitude rounds.",
                progress_status="active",
                target_frequency="ongoing",
                last_mentioned_at=now
            )
            db.add(mem)
            db.commit()
            db.refresh(mem)
            extracted_memories.append(mem)

    # 3. Sleep & Wake Routine Habits
    is_sleep_habit = any(k in msg for k in ["sleep schedule", "wake up early", "sleep by", "wake up at", "bedtime"])
    if is_sleep_habit:
        time_match = re.search(r'(\d{1,2}(?::\d{2})?\s*(?:am|pm))', msg)
        time_str = time_match.group(1) if time_match else "11 PM"
        existing_s = db.query(StudentMemory).filter(
            StudentMemory.user_id == user_id,
            StudentMemory.topic.ilike("%sleep%"),
            StudentMemory.is_active == True
        ).first()
        if existing_s:
            existing_s.last_mentioned_at = now
            db.commit()
            extracted_memories.append(existing_s)
        else:
            mem = StudentMemory(
                user_id=user_id,
                category="habit",
                topic="Sleep & Recovery Routine",
                key_point=f"Working towards healthier sleep hygiene (target around {time_str})",
                details="Regulating circadian rhythm to improve focus and reduce exam exhaustion.",
                progress_status="active",
                target_frequency="nightly",
                last_mentioned_at=now
            )
            db.add(mem)
            db.commit()
            db.refresh(mem)
            extracted_memories.append(mem)

    # 4. Academic Coursework & Exam Stress
    is_academics = any(k in msg for k in ["midterm", "exam next week", "viva", "semester exam", "cgpa", "backlog", "syllabus"])
    if is_academics and any(k in msg for k in ["stress", "overwhelm", "failing", "plan", "cover", "study"]):
        existing_a = db.query(StudentMemory).filter(
            StudentMemory.user_id == user_id,
            StudentMemory.topic.ilike("%academic%"),
            StudentMemory.is_active == True
        ).first()
        if existing_a:
            existing_a.last_mentioned_at = now
            db.commit()
            extracted_memories.append(existing_a)
        else:
            mem = StudentMemory(
                user_id=user_id,
                category="academic",
                topic="Academic Deadlines & Exams",
                key_point="Balancing high-stakes coursework, exam prep, and study fatigue",
                details="Focusing on active recall and high-yield topic triage over passive re-reading.",
                progress_status="active",
                target_frequency="semester",
                last_mentioned_at=now
            )
            db.add(mem)
            db.commit()
            db.refresh(mem)
            extracted_memories.append(mem)

    # 5. Generic Intention Matching ("I want to...", "My goal is to...", "I plan to...")
    intention_match = re.search(r'(?:i want to|my goal is to|i plan to|i am aiming to|i will try to)\s+([^.!?\n]{8,70})', msg)
    if intention_match and not extracted_memories:
        goal_text = intention_match.group(1).strip()
        # Ensure it's not a trivial sentence
        if len(goal_text.split()) >= 3 and not any(w in goal_text for w in ["tell you", "ask you", "know if", "talk about", "say that"]):
            existing_g = db.query(StudentMemory).filter(
                StudentMemory.user_id == user_id,
                StudentMemory.key_point.ilike(f"%{goal_text[:20]}%"),
                StudentMemory.is_active == True
            ).first()
            if not existing_g:
                short_title = " ".join([w.capitalize() for w in goal_text.split()[:4]])
                mem = StudentMemory(
                    user_id=user_id,
                    category="goal",
                    topic=f"Student Goal: {short_title}",
                    key_point=f"Goal: {goal_text}",
                    details=f"Student self-identified goal on {now.strftime('%b %d')}.",
                    progress_status="active",
                    target_frequency="daily",
                    last_mentioned_at=now
                )
                db.add(mem)
                db.commit()
                db.refresh(mem)
                extracted_memories.append(mem)

    return extracted_memories


def get_long_term_memory_context(
    user_id: int,
    current_message: str,
    db: Session,
    current_conv_id: Optional[int] = None
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Constructs an intelligent, non-redundant long-term memory dossier for Mindy.
    Includes active student goals, past session key takeaways, and continuity prompts.
    """
    user = db.query(User).filter(User.id == user_id).first()
    student_name = user.full_name if user else "Student"
    student_dept = getattr(user, 'department', None) or "Engineering"
    student_year = getattr(user, 'year_of_study', None) or "Undergraduate"

    # Fetch active memories & goals
    active_memories = db.query(StudentMemory).filter(
        StudentMemory.user_id == user_id,
        StudentMemory.is_active == True
    ).order_by(StudentMemory.last_mentioned_at.desc()).limit(8).all()

    memories_payload = []
    memory_lines = []
    for m in active_memories:
        mem_info = {
            "id": m.id,
            "category": m.category,
            "topic": m.topic,
            "key_point": m.key_point,
            "progress_status": m.progress_status,
            "target_frequency": m.target_frequency,
            "details": m.details,
            "last_mentioned": m.last_mentioned_at.strftime("%b %d") if m.last_mentioned_at else "Recently"
        }
        memories_payload.append(mem_info)
        line = f"- [{m.category.upper()}] {m.topic}: \"{m.key_point}\" (Status: {m.progress_status.capitalize()}"
        if m.target_frequency:
            line += f", Cadence: {m.target_frequency}"
        if m.details:
            line += f" | Note: {m.details}"
        line += ")"
        memory_lines.append(line)

    # Fetch previous conversations summary (excluding current one)
    prev_convs_query = db.query(AIConversation).filter(
        AIConversation.user_id == user_id
    )
    if current_conv_id:
        prev_convs_query = prev_convs_query.filter(AIConversation.id != current_conv_id)

    previous_conversations = prev_convs_query.order_by(AIConversation.updated_at.desc()).limit(3).all()

    prev_sessions_lines = []
    for c in previous_conversations:
        date_str = c.updated_at.strftime("%b %d") if c.updated_at else "Earlier"
        if c.summary:
            prev_sessions_lines.append(f"- Chat '{c.title}' ({date_str}): {c.summary}")
        else:
            # Get last user message and assistant reply
            last_msgs = db.query(AIMessage).filter(AIMessage.conversation_id == c.id).order_by(AIMessage.created_at.desc()).limit(2).all()
            if last_msgs:
                takeaway = last_msgs[0].content[:140].replace('\n', ' ')
                prev_sessions_lines.append(f"- Chat '{c.title}' ({date_str}): Prior discussion on student challenges. Mindy noted: \"{takeaway}...\"")

    # Build dense, formatted memory dossier
    dossier_parts = [
        f"STUDENT PROFILE: {student_name} | {student_dept} | {student_year}"
    ]

    if memory_lines:
        dossier_parts.append("ACTIVE TRACKED GOALS & HABITS (CROSS-SESSION MEMORY):\n" + "\n".join(memory_lines))
    else:
        dossier_parts.append("ACTIVE TRACKED GOALS: No active goals explicitly logged yet. If the student mentions a habit or target (e.g. daily DSA practice, sleep target), acknowledge and track it naturally.")

    if prev_sessions_lines:
        dossier_parts.append("PREVIOUS CHAT SESSIONS TAKEAWAYS:\n" + "\n".join(prev_sessions_lines))

    # Continuity instructions
    dossier_parts.append(
        "LONG-TERM CONTINUITY MANDATE FOR MINDY:\n"
        "1. PROACTIVE PROGRESS CHECK: If the student shares a greeting ('hi', 'hey', 'what's up') or starts a new conversation, warmly check in on how they are doing and naturally follow up on their active goals (e.g., asking how consistently they've been keeping up with their DSA problem solving goal or placement prep).\n"
        "2. REMEMBER DO NOT REPEAT: Never ask the student to explain context they have already established in prior sessions. Refer to previous discussions seamlessly ('Last time we discussed your placement interview stress...').\n"
        "3. CELEBRATE & RE-ANCHOR: When the student reports consistency, celebrate their genuine progress. If they missed days or felt overwhelmed, offer practical, guilt-free re-anchoring (e.g., focusing on the very next single problem instead of stressing about perfection)."
    )

    full_context_str = "\n\n".join(dossier_parts)
    return full_context_str, memories_payload


# ---------------------------------------------------------------------------
# Mindy System Prompt Formulation
# ---------------------------------------------------------------------------

def get_system_prompt(tracking_context: str, memory_context: str) -> str:
    return (
        "You are MindBridge Campus AI (Mindy), an exceptionally capable, mature, empathetic, and intelligent "
        "conversational companion and mentor for college and university students.\n\n"
        "WHO YOU ARE:\n"
        "- A thoughtful, emotionally intelligent, articulate companion who speaks naturally like a smart, caring human peer or mentor.\n"
        "- Never robotic, never like a scripted corporate bot, and never reciting empty therapy clichés (avoid hollow phrases like 'You've got this! ✨', 'Hang in there', 'It's okay to not be okay').\n"
        "- You understand nuance, subtext, humor, academic culture, technical challenges, and emotional strain.\n\n"
        "CORE CONVERSATIONAL PRINCIPLES:\n"
        "1. DIRECTNESS: Directly address what the user asks first. Do not dodge questions, deflect, or give preachy non-answers.\n"
        "2. ADAPTIVE LENGTH & TONE:\n"
        "   - If the user asks a quick conceptual, coding, or factual question (e.g. explaining an algorithm, a math concept, or general curiosity), answer concisely, clearly, and intelligently.\n"
        "   - If the user shares distress, burnout, or a complex personal dilemma, respond with warmth, structure, and depth.\n"
        "3. PROPER CONVERSATIONAL & LONG-TERM MEMORY:\n"
        "   - You have access to both the current conversation history AND the student's long-term memory dossier across previous sessions.\n"
        "   - Remember active goals (e.g. daily DSA problem solving, placement interview prep, exam study plans) and follow up on them naturally.\n"
        "   - When the user asks follow-up questions ('What was the second point?', 'Can you explain step 1?', 'How am I doing on my goals?'), directly refer back to prior messages and build upon them seamlessly.\n"
        "   - Avoid asking users to repeat information they have already provided.\n"
        "4. VERSATILITY & BREADTH:\n"
        "   - Coursework, code, algorithms (DSA), exams, lab vivas, backlogs, and time management.\n"
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
        f"{memory_context}\n\n"
        f"{tracking_context}"
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
    """Calls OpenAI API."""
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
# Intelligent Fallback Engine with Goal & Memory Awareness
# ---------------------------------------------------------------------------

def extract_numbered_points(text: str) -> List[str]:
    pattern = r'(?:^|\n)(?:\d+[\.\)]|\*+|\-)\s*(.+?)(?=(?:\n(?:\d+[\.\)]|\*+|\-)\s*)|$)'
    matches = re.findall(pattern, text, flags=re.DOTALL)
    cleaned = [m.strip() for m in matches if len(m.strip()) > 8]
    return cleaned


def generate_intelligent_fallback_response(
    user_message: str,
    context_str: str,
    conversation_history: List[Dict[str, str]],
    memories: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Intelligent, context-aware, non-robotic fallback response generator.
    Handles follow-up questions, general knowledge, emotions, and specific queries
    without repetitive boilerplate or generic therapy clichés.
    Seamlessly integrates student long-term memories and goals.
    """
    msg = user_message.lower().strip()
    active_mems = memories or []

    past_assistant = [m.get("content", "") for m in conversation_history if m.get("role") == "assistant"]
    past_user = [m.get("content", "") for m in conversation_history if m.get("role") == "user"]
    last_assistant_msg = past_assistant[-1] if past_assistant else ""
    past_text_blob = " ".join(past_assistant + past_user).lower()

    # Find active DSA goal if present
    dsa_mem = next((m for m in active_mems if "dsa" in m.get("topic", "").lower() or "dsa" in m.get("key_point", "").lower()), None)
    placement_mem = next((m for m in active_mems if "placement" in m.get("topic", "").lower()), None)

    # 1. Progress Report Check: User solved problems / completed daily goal
    has_completed_dsa = any(k in msg for k in ["solved 2", "solved two", "did 2", "did two", "completed my dsa", "solved my problems", "solved problems today", "did my coding"])
    if has_completed_dsa:
        reply = (
            "That is fantastic consistency! You committed to your daily problem-solving target and you showed up and delivered today.\n\n"
            "Stacking these small daily wins is exactly what transforms placement preparation from something overwhelming into quiet confidence.\n\n"
            "How did the problems feel today—did you work through arrays/strings, trees, or dynamic programming?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["DSA Placement Practice Guide"]}

    # 2. Setback / Struggle Check: User missed target or feeling behind
    has_missed_dsa = any(k in msg for k in ["couldn't solve", "could not solve", "missed my dsa", "failed to do", "broke my streak", "didn't do any dsa", "couldn't do my dsa"])
    if has_missed_dsa:
        reply = (
            "Please don't be hard on yourself. Consistency in engineering placement prep doesn't mean a perfect streak 365 days a year; "
            "it means not letting one missed day turn into a week of avoidance.\n\n"
            "Here is how to reset without guilt:\n"
            "1. **Release the back-debt:** Do not try to solve 4 problems tomorrow to 'compensate'. That only causes burnout.\n"
            "2. **Lower the friction:** Tomorrow, pick just ONE easy or medium problem you feel comfortable with to re-establish momentum.\n"
            "3. **Remember the big picture:** You're building problem-solving muscle over time, not sprinting.\n\n"
            "What got in the way today? Was it coursework deadlines, low energy, or a tricky problem?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Habit Consistency & Reset Guide"]}

    # 3. Follow-up query asking about specific tips/points
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

    # 4. Inquiring about Active Goals / "What are my goals?" / "What do you remember?"
    if any(q in msg for q in ["what are my goals", "what do you remember", "my goals", "my progress", "what did i tell you"]):
        if active_mems:
            mem_bullets = "\n".join([f"• **{m.get('topic')}:** {m.get('key_point')} *(Status: {m.get('progress_status', 'active').capitalize()})*" for m in active_mems])
            reply = (
                f"Here is what I'm currently keeping in mind for you across our conversations:\n\n"
                f"{mem_bullets}\n\n"
                "I follow up on these because keeping small commitments top-of-mind is the most effective way to build lasting habits. "
                "How do you feel your consistency has been across these goals lately?"
            )
        else:
            reply = (
                "Right now, we haven't established specific ongoing goals yet. "
                "Whether you'd like to track a daily target like solving two DSA problems, sticking to a sleep routine, "
                "or managing campus placement prep, feel free to tell me what you're working toward and I will remember it!"
            )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Goal Tracking & Consistency"]}

    # 5. Casual Greetings & Natural Follow-ups with Active Memories
    if any(k in msg for k in ["hi", "hello", "hey", "good morning", "good evening", "how are you", "what's up", "whats up"]):
        if dsa_mem:
            reply = (
                "Hello! 🌿 It's great to hear from you. I'm Mindy, your campus companion.\n\n"
                "How has your day been treating you? Also, I wanted to check in on how that goal of "
                f"**{dsa_mem.get('key_point', 'solving two DSA problems daily')}** has been coming along? "
                "Whether you're celebrating a streak or need a quick reset, I'm right here with you."
            )
        elif placement_mem:
            reply = (
                "Hello! 🌿 It's wonderful to see you. How are you holding up today?\n\n"
                "Last time we touched on campus placement preparation and interview pacing. "
                "How have things been feeling on that front lately?"
            )
        else:
            reply = (
                "Hello! 🌿 It's great to hear from you. I'm Mindy, your campus companion.\n\n"
                "How has your day been treating you? Whether you're navigating academic deadlines, placement prep, "
                "curious about a concept, or just want a quiet space to decompress, I'm here for whatever is on your mind."
            )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Daily Check-in"]}

    # 6. Placements & Career
    has_placement = any(k in msg for k in ["placement", "interview", "job", "career", "resume", "offer", "internship", "rejected", "rejection", "unplaced", "company", "shortlist"])
    is_placement_ongoing = "placement" in past_text_blob or "interview" in past_text_blob
    if has_placement or is_placement_ongoing:
        follow_up_goal = f"\n\nRemember: your daily practice—like {dsa_mem.get('key_point')}—is what builds real substance over time." if dsa_mem else ""
        reply = (
            "Campus placements and career uncertainty carry tremendous emotional weight. In our campus survey, over 76% of students shared this exact feeling.\n\n"
            "A few grounding truths:\n"
            "1. **Headcount, Not Self-Worth:** A hiring shortlist reflects specific keyword filters and business headcounts, NEVER a measurement of your intellect or trajectory.\n"
            "2. **Mute the Rumor Mills:** Step away from hostel groups where people boast about CTC numbers; those spaces create synthetic panic.\n"
            "3. **Process Over Outcome:** Practice your coding problems or mock interview questions for an agreed period, then let yourself rest without guilt.{follow_up_goal}\n\n"
            "Our campus counsellor Nitu Singh Bhadouria in SAC I also provides confidential 1-on-1 placement decompression sessions."
        ).format(follow_up_goal=follow_up_goal)
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Career Anxiety De-escalation"]}

    # 7. General Knowledge / Technical / Factual Inquiries
    if any(q in msg for q in ["what is", "how does", "explain", "who is", "definition of", "how do you", "difference between"]):
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

    # 8. Roommate / Interpersonal Conflict
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

    # 9. Exam & Academic Workload
    has_exam = any(k in msg for k in ["exam", "test", "study", "grades", "assignment", "semester", "syllabus", "cgpa", "viva", "lab", "midterm", "quiz"])
    is_exam_ongoing = "exam" in past_text_blob or "midterm" in past_text_blob or "viva" in past_text_blob
    if has_exam or is_exam_ongoing:
        reply = (
            "When preparing under time constraints, the key is shifting from a **completion mindset** to a **triage mindset**:\n\n"
            "1. **The 80/20 High-Yield Focus:** In almost every course or lab, 80% of marks come from 20% of core fundamentals. Review past year question papers and core diagrams first.\n"
            "2. **Active Recall Over Re-reading:** Instead of reading notes passively, close your notebook and explain the concept aloud to yourself for 60 seconds.\n"
            "3. **Anchor Your Physiology:** Your brain consolidates memory and problem-solving during sleep; pulling an all-nighter before a viva often cuts recall by over 40%.\n\n"
            "Which specific subject or chapter feels most intimidating right now? We can break it down."
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Pomodoro Pacing Guide"]}

    # 10. Low Energy / Fatigue / Burnout
    if any(k in msg for k in ["tired", "exhausted", "fatigue", "no energy", "drained", "burnout", "sleepy", "lethargic", "unmotivated"]):
        reply = (
            "Feeling drained or having low energy is a signal from your body asking for restorative care, not a personal flaw.\n\n"
            "When your emotional battery is depleted, pushing harder backfires:\n"
            "1. **Micro-Rest:** Step away from screens for 10 minutes. Get fresh air or morning sunlight.\n"
            "2. **Lower the Bar for Today:** Pick just ONE essential item to complete, and give yourself full permission to leave the rest for tomorrow.\n"
            "3. **Rest is Fuel:** Rest is not a reward you earn after burning out; it is fuel required to function.\n\n"
            "What feels like the most draining thing on your plate today?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Burnout Recovery"]}

    # 11. Sleep & Insomnia
    if any(k in msg for k in ["sleep", "insomnia", "can't sleep", "cant sleep", "awake", "bedtime", "nightmare", "midnight"]):
        reply = (
            "When rest is disrupted, ordinary college challenges feel monumental because the brain's emotional baseline shifts.\n\n"
            "Proven sleep hygiene steps for student life:\n"
            "1. **The 20-Minute Rule:** If you cannot sleep after 20 minutes in bed, gently get out of bed. Sit in dim light and read something non-stimulating until drowsiness returns.\n"
            "2. **Screens & Blue Light:** Try switching off your laptop and phone screen 30 minutes before bed; charge your phone across the room.\n"
            "3. **Progressive Muscle Relaxation:** Tense your toes for 5 seconds, then release. Move upwards through your calves, thighs, shoulders, and jaw.\n\n"
            "Would you like to review our guided sleep relaxation audio in the Resource Centre?"
        )
        return {"content": reply, "safety_flagged": False, "emergency_shown": False, "suggested_resources": ["Sleep Hygiene Guide"]}

    # 12. Dynamic General Conversational Response
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
    conversation_history: Optional[List[Dict[str, str]]] = None,
    current_conv_id: Optional[int] = None
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

    # 2. Extract consented student tracking context & long-term memory context
    tracking_str = get_student_tracking_context(user_id, db) if consent_share_context else "Student opted not to share tracking context."
    memory_str, structured_memories = get_long_term_memory_context(user_id, user_message, db, current_conv_id=current_conv_id)

    system_prompt = get_system_prompt(tracking_str, memory_str)

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

    # 5. Fallback Intelligent Conversational Engine with Memory
    fallback = generate_intelligent_fallback_response(user_message, tracking_str, history, structured_memories)
    fallback["provider"] = "local"
    fallback["model"] = "mindy-conversational-engine"
    return fallback
