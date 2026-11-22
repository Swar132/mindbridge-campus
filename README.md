# MindBridge Campus

## AI-Assisted Mental Health Tracking and Student Wellbeing Platform

MindBridge Campus is a full-stack mental health tracking and early wellbeing support web application designed specifically for college and university students.

College life exposes students to intense examination anxiety, placement uncertainty, social isolation, relationship strains, irregular sleep schedules, and academic burnout. MindBridge Campus offers a calm, confidential, and judgment-free digital space to track daily emotional patterns, receive personalized non-clinical wellbeing insights, practice evidence-informed somatic calming techniques, talk to an empathetic AI companion with persistent long-term memory, and connect directly with campus counsellors.

> **IMPORTANT NON-CLINICAL SAFETY NOTICE:**  
> MindBridge Campus is a student wellbeing and psychoeducational support platform. It is **not** a clinical diagnostic tool or medical treatment system. AI insights and pattern observations are strictly non-clinical and must never be interpreted as psychiatric diagnoses or treatment prescriptions.

---

## 🌐 Live Production Deployment

- **Live Web Application:** [https://mindbridge-campus-te1l.onrender.com](https://mindbridge-campus-te1l.onrender.com)
- **Interactive REST API Documentation (Swagger UI):** [https://mindbridge-campus-te1l.onrender.com/docs](https://mindbridge-campus-te1l.onrender.com/docs)
- **Production Database:** Managed PostgreSQL 18 on Render (`mindbridge_wqup`)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Swar132/mindbridge-campus)

---

## 📊 Dashboard Metrics & Formulas

The student dashboard adheres to a **Strict Non-Fabrication Policy**: when a student has no logs, the system displays an invitation to complete their first 60-second check-in rather than generating synthetic sine waves or fake scores.

### 1. Dashboard Metrics Overview

#### A. Rating History Graph (`Stress Balance %` — Orange Curve & Tooltip)
In the 7-day and 14-day **Rating History** area chart, two curves are plotted:
1. **Wellbeing (Sky Blue):** Daily emotional valence and mood intensity:
   $$\text{Wellbeing (\%)} = \text{Mood Intensity} \times 10 \quad (\text{Scale: } 10\% \text{ to } 100\%)$$
2. **Stress Balance (Amber/Orange):** Inverted daily stress metric, measuring calm and unburdened cognitive bandwidth. **A higher Stress Balance score indicates a lower reported stress level**:
   $$\text{Stress Balance (\%)} = (10 - \text{Stress Level}) \times 10$$
   - **Stress Level 1 (Minimal tension):** $\text{Stress Balance} = (10 - 1) \times 10 = \mathbf{90\%}$
   - **Stress Level 5 (Moderate stress):** $\text{Stress Balance} = (10 - 5) \times 10 = \mathbf{50\%}$
   - **Stress Level 8 (High pressure):** $\text{Stress Balance} = (10 - 8) \times 10 = \mathbf{20\%}$

#### B. Metric Card 5: Sleep Consistency (`Consistency / Sleep Consistency`)
Card 5 displays the student's **Sleep Consistency Score out of 10.0** (with a balance scale icon), evaluating circadian regularity and daily sleep routine stability:
$$\text{Sleep Consistency Rating} = \frac{\text{Sleep Consistency Score}}{10}$$

The underlying **Sleep Consistency Score (0–100)** is computed by the backend `insights_engine.py` using the standard deviation ($\sigma$) of the student's sleep duration over the past 7 days:
$$\mu = \frac{1}{N} \sum_{i=1}^N \text{duration\_hours}_i$$
$$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (\text{duration\_hours}_i - \mu)^2}$$
$$\text{Sleep Consistency Score} = \max\left(50, \min\left(95, \operatorname{round}(100 - (\sigma \times 15))\right)\right)$$
- If $N = 1$ (single entry), consistency defaults to a stable baseline of **85** (yielding a Sleep Consistency rating of **8.5**).
- If $\sigma = 0$ (rock-solid identical bed/wake intervals), score caps at **95** (Sleep Consistency rating **9.5**).
- If $\sigma \ge 3.0\text{h}$ (erratic all-nighters mixed with crash days), score floor is **50** (Sleep Consistency rating **5.0**).

#### C. Composite Weekly Wellbeing Score (0–100 Ring)
$$\text{Weekly Wellbeing Score} = \operatorname{mean}\left(\text{Mood Valence \%}, \text{Stress Inversion \%}, \text{Sleep Ratio \%}\right)$$
- $\text{Mood Valence \%} = \text{Average Valence (1–10)} \times 10$
- $\text{Stress Inversion \%} = (10 - \text{Average 7d Stress}) \times 10$
- $\text{Sleep Ratio \%} = \min\left(100, \left(\frac{\text{Average 7d Sleep Duration}}{8.0}\right) \times 100\right)$

---

## 🛠️ Student Life & Wellbeing Hub (Resource Library Redesign)

The Resource Library is redesigned into an interactive **Student Life & Wellbeing Hub**, combining structured actionable guides with 8 functional mini-tools and verified external references.

### 1. Six Core Pillars
1. **Academic Life:** Exam preparation, past question paper (PYQ) 80/20 triage, chronic procrastination, concentration blocks, and syllabus overload.
2. **Placement & Career:** On-campus placement drives, imposter syndrome, interview rejection decoupling, live coding anxiety, and behavioral STAR prep.
3. **Mental & Emotional Wellbeing:** Somatic grounding, acute anxiety, stopping catastrophic loops ("I am going to fail"), self-compassion, and emotional regulation.
4. **Sleep & Physical Health:** Circadian rhythm resetting for night owls, screen fatigue, the 10-3-2-1-0 sleep rule, and hostel hydration.
5. **Relationships & Social Life:** Hostel roommate boundaries, late-night noise disputes, navigating homesickness, and building an authentic campus tribe.
6. **Productivity & Personal Growth:** Deep work protocols, the Pomodoro method, single-tasking, goal chunking, and daily habit consistency.

### 2. Eight Interactive Mini-Tools

All 8 tools are fully interactive and maintain isolated state per student in `localStorage`:

| Tool | Key Capabilities |
| :--- | :--- |
| **Study Planner** | Timed retrieval sprints, priority tags (`High`, `Medium`, `Low`), progress bars, and 1-click presets (*Finals Triage*, *Placement Prep*, *Daily Rhythm*). |
| **Pomodoro Focus Timer** | 25m/50m Deep Work, 5m/15m breaks, circular SVG countdown, daily session counter, and synthesized Web Audio bell chime (zero external audio dependencies). |
| **Exam Countdown Planner** | Test schedule organizer with live countdown badges (*In 2 days*, *Tomorrow!*), and interactive unit revision checklists with completion tracking. |
| **Placement Preparation Tracker** | 5 Pillars: **DSA Problem Counter** (+1, +5, -1 buttons), **Core CS & Aptitude** (OS, DBMS, Networks, OOP, Aptitude), **Resume Check**, **Project Defense**, and **Mock Interviews**. Displays a live **Placement Readiness Index (0–100%)**. |
| **Daily Habit Tracker** | Tracks 5 daily habits: 7h+ Sleep, 2.5L Water, 20m Movement, 90m Deep Study, and Daily Check-in. Features a **Streak Counter (🔥 X-Day Streak)**. |
| **Mood Journaling Prompts** | 6 reflective prompts. Clicking **"Journal on This"** opens a guided modal; reflections save directly into the PostgreSQL `journal_entries` table via `api.createJournal()`. |
| **Breathing & Grounding** | Dual modes: (1) **Interactive 4-7-8 Breathing Pacer** with animated expanding/contracting orb and 4-cycle counter, and (2) **5-4-3-2-1 Sensory Scan** checklist. |
| **Goal Planner** | Converts semester goals into 3 daily micro-steps. Clicking **"Sync with Mindy AI"** saves the goal directly into Mindy's persistent long-term memory (`StudentMemory`) for personalized check-ins during chat. |

### 3. Actionable Guide Format
Every guide follows a structured framework:
- **The Problem & College Context:** Real campus realities (WhatsApp shortlists, 4 exams in 5 days, roommate conflicts).
- **Practical Action Steps:** 3–4 concrete, numbered steps to apply immediately.
- **2-Minute Micro-Activity:** Immediate tangible exercise (e.g., 5-minute starter rule, 20-20-20 eye rest).
- **Realistic College Life Example:** Scenarios featuring hostel mess dining, SAC-I viva examinations, and library deep work sessions.
- **Quick Takeaway Mental Anchor:** High-impact reframes (*"Action precedes motivation"*, *"Thoughts are hypotheses, not courtroom facts"*).
- **Related Tools & Source References:** Cross-links to interactive tools and citations (Stanford Learning Lab, Dr. Matthew Walker, Tele-MANAS).

### 4. Dynamic Personalized Recommendations
- **API:** `GET /api/resources/personalized`
- Analyzes recent student check-in trends (stress domain, mood intensity, sleep quality) to recommend tailored tools and guides with supportive, non-diagnostic rationales.

### 5. Verified External Resources & Helplines
- **Tele-MANAS (Govt. of India):** Free 24/7 National Mental Health Helpline (Toll-Free **14416** / **1800-891-4416**).
- **WHO Mental Health:** Authoritative global mental health research and self-care strategies.
- **Notion for Education:** Free for students with `.edu` / university email for semester revision databases.
- **Google Calendar:** Time-blocking classes, lab submissions, and sleep anchors.
- **LeetCode:** Industry-standard DSA problem-solving and mock contest assessments.
- **GeeksforGeeks:** Core engineering subject revision (OS, DBMS, Networks, System Design).
- **NHS Sleep and Tiredness Guidance:** Clinically verified sleep hygiene protocols.

### 6. User Controls
- **Hub View Tabs:** Seamless navigation between *All Hub Resources*, *Interactive Mini-Tools*, *Actionable Guides*, *Verified External Tools*, and *My Bookmarks*.
- **Real-time Search:** Instant keyword matching across titles, summaries, and tags.
- **Category Filter Pills:** One-click filtering across all 6 categories.
- **Bookmarking & Completion Tracking:** Star/bookmark any guide or tool, and track reading progress with the **"Mark as Read / Completed"** toggle.
- **Daily Practical Challenge Card:** Features rotating daily micro-challenges with completion tracking.

---

## 🤖 Mindy AI Chatbot & Persistent Memory Engine

Mindy is an intelligent, personalized student companion equipped with persistent conversation history and long-term memory:

### 1. Multi-Session Conversation Persistence
- Every conversation thread is stored in PostgreSQL (`ai_conversations`, `ai_messages`) scoped to the student.
- Preserved across logouts, logins, browser refreshes, and server restarts.
- Students can browse past conversation threads or start a fresh conversation at any time.

### 2. Long-Term Memory System (`StudentMemory`)
- Maintains persistent long-term memories in the `student_memories` table across sessions.
- Memory categories: `goal`, `academic`, `placement`, `personal`, `challenge`.
- Mindy recalls prior challenges, goals, and placement milestones naturally without repeating questions (e.g., *"Last time you mentioned feeling stressed about your OS midterm. How did your preparation go?"*).
- Integrated with the **Goal Planner** tool to sync active semester goals directly into Mindy's working context.
- Full privacy control: students can view, delete individual memories, or clear all memories at any time (`DELETE /api/ai/memory`).

### 3. Multi-LLM Provider Engine
- Supports **Groq** (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`), **Google Gemini** (`gemini-1.5-flash`), **OpenAI**, and **OpenRouter**.
- Built-in deterministic offline fallback engine provides empathetic support, cognitive reframing, and crisis helpline prioritization when offline or when no API keys are present.

---

## 🔐 User Roles & Permissions

| Role | Access & Capabilities | Isolation Guarantee |
|---|---|---|
| **Student** | Daily check-ins, mood/stress/sleep tracking, private journal, Mindy AI chatbot with memory, interactive mini-tools, resource hub, counsellor booking. | **Strictly isolated.** Journal entries and private logs are inaccessible to counsellors and admins. |
| **Counsellor** | Counsellor portal, pending appointment approvals, confirmed consultations, private clinical case notes. | Cannot view student private journals or unshared tracking records. Clinical case notes are inaccessible to students. |
| **Administrator** | System statistics, anonymous aggregate campus trends (mood distribution, top stress triggers), user activation/roles, resource management. | **Zero access** to individual student journals, personal logs, or counsellor clinical case notes. |

---

## 🗄️ Database Schema (PostgreSQL & SQLite)

The platform utilizes SQLAlchemy ORM with foreign key cascades and user-isolated indexing:

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | User credentials, role (`student`/`counsellor`/`admin`), department, year, avatar |
| `CounsellorProfile` | `counsellor_profiles` | Counsellor credentials, bio, areas of support, availability, office location |
| `UserPreference` | `user_preferences` | Notification settings, reminder times, AI context consent |
| `MoodEntry` | `mood_entries` | Mood state (8 types), intensity (1–10), energy level (1–10), tags, notes, timestamp |
| `StressEntry` | `stress_entries` | Stress rating (1–10), category, tags, notes, timestamp |
| `SleepEntry` | `sleep_entries` | Bedtime, wake time, duration (hours), quality (1–5), sleep factors, date |
| `JournalEntry` | `journal_entries` | Private student reflections, mood tag, tags (**Strict User Isolation**) |
| `AIConversation` | `ai_conversations` | AI chat session threads and timestamps |
| `AIMessage` | `ai_messages` | Chat messages, safety evaluation flags, emergency referral indicators |
| `StudentMemory` | `student_memories` | Long-term memory store for Mindy AI (goals, academics, placements, preferences) |
| `Appointment` | `appointments` | Bookings between students and counsellors, statuses, private clinical notes |
| `WellbeingResource` | `wellbeing_resources` | Curated actionable guides across 6 categories, read times, structured content |
| `Notification` | `notifications` | Check-in alerts, appointment confirmations, system notifications |

---

## 🔌 API Endpoints Reference

All endpoints are prefixed with `/api` and documentable via Swagger UI at `/docs`.

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Simple registration with full name, email, and password
- `POST /api/auth/login`: Authenticate and receive JWT bearer token (7-day validity)
- `POST /api/auth/logout`: Invalidate session
- `GET /api/auth/me`: Get current authenticated profile
- `PUT /api/auth/profile`: Update name, department, year, avatar

### Unified Daily Check-In (`/api/checkin`)
- `GET /api/checkin/today`: Check if student has already logged today
- `POST /api/checkin/`: Unified 60-second check-in (mood, stress, sleep, journal notes)

### Mood Tracking (`/api/mood`)
- `POST /api/mood/`: Log mood entry
- `GET /api/mood/?days={7|30|90}`: Filter mood entries
- `DELETE /api/mood/{id}`: Delete mood entry

### Stress Tracking (`/api/stress`)
- `POST /api/stress/`: Log stress entry
- `GET /api/stress/?days={days}`: List stress entries
- `GET /api/stress/summary`: Retrieve 30-day average and trigger breakdown
- `DELETE /api/stress/{id}`: Delete stress entry

### Sleep Tracking (`/api/sleep`)
- `POST /api/sleep/`: Log bedtime, wake-up time, duration, and quality
- `GET /api/sleep/?days={days}`: List sleep records
- `GET /api/sleep/metrics`: Sleep average, debt hours, consistency %
- `DELETE /api/sleep/{id}`: Delete sleep record

### Private Journal (`/api/journal`) — *Strict Isolation*
- `POST /api/journal/`: Create private journal entry (integrated with Mood Journaling tool)
- `GET /api/journal/?search={query}&tag={tag}`: Search and filter current user's journal
- `GET /api/journal/{id}`: View single entry
- `PUT /api/journal/{id}`: Update entry
- `DELETE /api/journal/{id}`: Delete entry

### AI Wellbeing Assistant & Memory (`/api/ai`)
- `POST /api/ai/chat`: Send message, evaluate crisis safety, return empathetic response
- `GET /api/ai/conversations`: List user chat threads
- `GET /api/ai/conversations/{id}`: Retrieve thread history
- `DELETE /api/ai/conversations/{id}`: Delete chat thread
- `GET /api/ai/memory`: Retrieve student's long-term memories
- `POST /api/ai/memory`: Create memory/goal (integrated with Goal Planner tool)
- `DELETE /api/ai/memory/{id}`: Delete individual memory
- `DELETE /api/ai/memory`: Clear all memories (privacy control)
- `GET /api/ai/suggested-prompts`: Retrieve contextual student prompt pills
- `GET /api/ai/config`: Check active LLM provider and status
- `POST /api/ai/config`: Update LLM API keys and model selection

### Student Life & Wellbeing Hub (`/api/resources`)
- `GET /api/resources/?category={cat}&search={q}`: Filter 12 comprehensive guides
- `GET /api/resources/personalized`: Dynamic personalized recommendations based on check-in trends
- `GET /api/resources/{id}`: Retrieve single guide with full markdown content
- `POST /api/resources/`: Admin creates resource
- `PUT /api/resources/{id}`: Admin edits resource
- `DELETE /api/resources/{id}`: Admin deletes resource

### Insights & Analytics (`/api/insights`)
- `GET /api/insights/personal`: Compute personal metrics, composite score, and trend insights
- `GET /api/insights/aggregate`: Anonymous campus-wide wellbeing trends for admin/counsellors

### Counsellors & Appointments (`/api/counsellors` & `/api/appointments`)
- `GET /api/counsellors/`: List campus counsellors
- `POST /api/appointments/`: Student books appointment
- `GET /api/appointments/my`: Role-aware list of appointments
- `PUT /api/appointments/{id}/status`: Counsellor updates status and adds private clinical notes
- `PUT /api/appointments/{id}/cancel`: Student or counsellor cancels appointment

### Notifications & Preferences (`/api/notifications`)
- `GET /api/notifications/`: List user alerts
- `PUT /api/notifications/{id}/read`: Mark notification read
- `PUT /api/notifications/read-all`: Mark all notifications read
- `GET /api/notifications/preferences`: Get reminder settings
- `PUT /api/notifications/preferences`: Update reminder settings

### Admin Operations (`/api/admin`)
- `GET /api/admin/stats`: Total counts for users, logs, and sessions
- `GET /api/admin/users`: List users with role filter
- `PUT /api/admin/users/{id}/status`: Toggle user activation
- `PUT /api/admin/users/{id}/role`: Elevate or modify account role

---

## 💻 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Quick Unified Launch (Single Server)
FastAPI automatically serves the compiled React production frontend from `frontend/dist`:

```bash
# 1. Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# 2. Install backend dependencies and launch
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Dual-Server Development Mode (With Hot Reloading)
- **Terminal 1 (Backend API):**
  ```bash
  cd backend
  python -m uvicorn app.main:app --port 8000 --reload
  ```
- **Terminal 2 (Frontend with Vite HMR):**
  ```bash
  cd frontend
  npm run dev
  ```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Credentials for Evaluation

You can use the **Instant 1-Click Demo Login** buttons on the login screen or navbar to switch roles seamlessly:

| Role | Email | Password | Persona |
|---|---|---|---|
| **Student** | `student@mindbridge.edu` | `student123` | Priya Sharma (3rd Year B.Tech CSE, 35 days of history) |
| **Counsellor** | `nitusingh_b@dau.ac.in` | `counsellor123` | Dr. Nitu Singh Bhadouria (SAC I First Floor, Student Counsellor) |
| **Administrator** | `admin@mindbridge.edu` | `admin123` | Prof. Rajesh Kumar (Dean of Student Affairs) |

---

## 🆘 Crisis Support & Emergency Helplines

MindBridge Campus includes persistent crisis intervention triggers and quick-access emergency modal links:

- **Tele-MANAS (Govt. of India):** 24/7 National Mental Health Helpline at **14416** or **1800-891-4416** (Toll-Free, 20+ Languages).
- **National Emergency Number:** **112**
- **KIRAN Mental Health Rehabilitation Helpline:** **1800-599-0019**
- **Campus Student Wellness Centre:** SAC I, First Floor, Counselling Room (Dr. Nitu Singh Bhadouria).
