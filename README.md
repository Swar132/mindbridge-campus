# MindBridge Campus

## AI-Assisted Mental Health Tracking and Student Wellbeing Platform

MindBridge Campus is a full-stack mental health tracking and early wellbeing support web application designed specifically for college and university students.

College life exposes students to intense examination anxiety, placement uncertainty, social isolation, relationship strains, irregular sleep schedules, and academic burnout. MindBridge Campus offers a calm, confidential, and judgment-free digital space to track daily emotional patterns, receive personalized non-clinical wellbeing insights, practice evidence-informed somatic calming techniques, talk to an empathetic AI companion, and connect directly with campus counsellors.

> **IMPORTANT NON-CLINICAL SAFETY NOTICE:**  
> MindBridge Campus is a student wellbeing and psychoeducational support platform. It is **not** a clinical diagnostic tool or medical treatment system. AI insights and pattern observations are strictly non-clinical and must never be interpreted as psychiatric diagnoses or treatment prescriptions.

---

## 🚀 24/7 Permanent Cloud Deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Swar132/mindbridge-campus)

Click the button above to deploy MindBridge Campus to **Render.com** in 1 click with a managed PostgreSQL database and 24/7 uptime!

---

## 1. Technologies Used

### Frontend
- **React.js (v19)** with **Vite** for fast modern frontend architecture
- **Tailwind CSS (v3)** with custom calming color palette (soft lavender, muted teal, serene blue, off-white)
- **Lucide React** for icons
- **Recharts** for emotional valence area charts, stress trigger bar charts, sleep debt bars, and mood distribution donut charts
- **Framer Motion** & custom transitions for breathing visualizer animation

### Backend
- **Python (3.12)**
- **FastAPI** for high-performance REST APIs
- **SQLAlchemy ORM** for database interaction
- **SQLite** for zero-setup local persistence (`mindbridge.db`), compatible with PostgreSQL in production
- **PyJWT** for JSON Web Token authentication with 7-day session validity
- **Pure Bcrypt** for secure salted password hashing
- **Pydantic (v2)** for data validation schemas

### AI Wellbeing Engine
- **Hybrid Conversational Architecture**:
  - Contextual empathetic generator with voluntary student history injection (recent 7-day mood valence, sleep consistency, primary stress domains)
  - Hard pre-filter crisis safety detection: immediately intercepts self-harm or suicidal ideation and prioritizes immediate emergency helplines
  - Support for **Google Gemini 1.5 Flash** / external LLMs via environment variables (`GEMINI_API_KEY`)
  - Intelligent, deterministic local fallback engine that provides empathetic responses, cognitive reframing, and practical coping exercises when offline or when no external API key is provided

---

## 2. User Roles & Capabilities

### A. Student (`student@mindbridge.edu` / `student123`)
- **Student Dashboard**: Real-time greeting, 60-second check-in banner, 4 top metric cards, 7d/30d mood & stress trend charts, sleep duration vs. 7.5h target chart, and personalized observational insight cards.
- **Mood Tracker**: Dedicated logging of 8 distinct emotional states (*Very Happy, Happy, Neutral, Sad, Anxious, Stressed, Angry, Exhausted*), 1-10 intensity slider, context tag cloud, notes, and 7d/30d/90d filterable history with pie distribution.
- **Stress Tracker**: 1-10 stress rating scale with descriptive severity stages (*Mild Tension, Moderate, High Pressure, Severe Overwhelm*), domain categorization (*Academics, Placements and Career, Relationships, Family, Financial Issues, Social Life, Personal Issues, Other*), and trigger Pareto bar chart.
- **Sleep Tracker**: Automatic duration calculation between bedtime and wake-up times, 1-5 star sleep quality rating, sleep disruptor/hygiene tags, consistency score gauge, and non-causal sleep vs. mood trend observations.
- **Private Journal**: Personal reflective writing sanctuary with privacy lock guarantee. **Strictly isolated**: neither administrators, counsellors, nor the AI assistant can access student journal entries.
- **AI Wellbeing Assistant**: Empathetic conversational companion with consented tracking context toggle, one-click prompt pills (*Exam pressure, Placement anxiety, Insomnia, Grounding*), and direct embedded coping shortcuts.
- **Interactive Coping Tools**:
  - **4-7-8 Breathing Guide**: Real-time animated expanding/contracting visualizer guiding 4s Inhale, 7s Hold, and 8s Exhale cycles.
  - **5-4-3-2-1 Grounding Tool**: Somatic sensory wizard to ground panic and catastrophizing thoughts.
- **Counsellor Connect**: Browse campus counsellor profiles, select available consultation slots, submit requests, view status, and cancel bookings.
- **Settings & Privacy**: Manage daily check-in reminders, sleep reminders, reminder times, and AI context-sharing consent.

### B. Counsellor (`counsellor@mindbridge.edu` / `counsellor123`)
- **Counsellor Portal**: Central dashboard displaying pending appointment requests, upcoming confirmed consultations, and completed sessions.
- **Session Management**: Approve consultation requests with meeting room/link assignment, or decline with reason.
- **Confidential Case Notes**: Maintain private clinical notes for completed student appointments. Strictly protected so students and administrators cannot read clinical records.
- **Access Restrictions**: Counsellors do **not** have access to students' private journal entries or unsolicited tracking records.

### C. Administrator (`admin@mindbridge.edu` / `admin123`)
- **Admin Console**: Platform statistics (total students, total check-ins, consultation count, campus sleep average).
- **Anonymous Aggregate Trends**: Campus-wide mood distribution donut chart and top campus stress triggers chart without any identifiable individual student data.
- **User Management**: View accounts, toggle active/inactive status, and change user roles (*student, counsellor, admin*).
- **Resource Management**: Create, edit, and delete articles and exercises in the Wellbeing Resource Centre.
- **Access Restrictions**: Administrators have **zero access** to student private journals or counsellor private clinical notes.

---

## 3. Crisis Support & Indian Emergency Helplines

MindBridge Campus includes permanent, accessible crisis intervention buttons and automated chat triggers for immediate human support:

- **Tele-MANAS (Govt. of India)**: National 24/7 Mental Health Helpline at **14416** or **1800-891-4416** (Toll-Free, 20+ Languages).
- **National Emergency Services**: **112**
- **KIRAN Mental Health Rehabilitation Helpline**: **1800-599-0019**
- **Campus Student Wellness Centre**: Block B, Cabin 204.

---

## 4. Database Schema & Architecture

The application uses SQLAlchemy models with foreign key constraints, cascading rules, and user-isolated indexing:

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | User credentials, role (`student`/`counsellor`/`admin`), department, year, profile avatar |
| `CounsellorProfile` | `counsellor_profiles` | Counsellor qualifications, areas of support, availability, office location |
| `UserPreference` | `user_preferences` | Notification toggles, reminder times, AI data consent |
| `MoodEntry` | `mood_entries` | Mood emotion (8 types), intensity (1-10), tags, notes, timestamp |
| `StressEntry` | `stress_entries` | Stress rating (1-10), category, tags, notes, timestamp |
| `SleepEntry` | `sleep_entries` | Bedtime, wake time, duration, quality (1-5), sleep factors, date |
| `JournalEntry` | `journal_entries` | Private reflections, emotion tag, tags, entry date (**Strict User Isolation**) |
| `AIConversation` | `ai_conversations` | AI chat session titles and timestamps |
| `AIMessage` | `ai_messages` | Individual messages, safety flags, emergency shown indicators |
| `Appointment` | `appointments` | Bookings between students and counsellors, statuses, private clinical notes |
| `WellbeingResource` | `wellbeing_resources` | Curated articles, breathing exercises, grounding guides |
| `Notification` | `notifications` | Check-in alerts, appointment confirmations, recommendation updates |

---

## 5. API Endpoints Reference

All endpoints are prefixed with `/api` and documentable via Swagger UI at `/docs`.

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new account with role
- `POST /api/auth/login`: Authenticate and receive JWT bearer token
- `GET /api/auth/me`: Get current authenticated profile
- `PUT /api/auth/profile`: Update name, department, year, avatar

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
- `POST /api/sleep/`: Log bedtime, wake-up time, and quality
- `GET /api/sleep/?days={days}`: List sleep records
- `GET /api/sleep/metrics`: Sleep average, debt hours, consistency %
- `DELETE /api/sleep/{id}`: Delete sleep record

### Private Journal (`/api/journal`) — *Strict Isolation*
- `POST /api/journal/`: Create private journal entry
- `GET /api/journal/?search={query}&tag={tag}`: Search and filter current user's journal
- `GET /api/journal/{id}`: View single entry
- `PUT /api/journal/{id}`: Update entry
- `DELETE /api/journal/{id}`: Delete entry

### AI Wellbeing Assistant (`/api/ai`)
- `GET /api/ai/suggested-prompts`: Retrieve contextual student prompt pills
- `POST /api/ai/chat`: Send message, evaluate crisis safety, return empathetic response
- `GET /api/ai/conversations`: List user chat threads
- `GET /api/ai/conversations/{id}`: Retrieve thread history
- `DELETE /api/ai/conversations/{id}`: Clear thread

### Insights & Analytics (`/api/insights`)
- `GET /api/insights/personal`: Compute personal metrics, composite score, and trend insights
- `GET /api/insights/aggregate`: Anonymous campus-wide wellbeing trends for admin/counsellors

### Counsellors & Appointments (`/api/counsellors` & `/api/appointments`)
- `GET /api/counsellors/`: List campus counsellors
- `POST /api/appointments/`: Student books appointment
- `GET /api/appointments/my`: Role-aware list of appointments
- `PUT /api/appointments/{id}/status`: Counsellor updates status and adds private clinical notes
- `PUT /api/appointments/{id}/cancel`: Student or counsellor cancels appointment

### Resources (`/api/resources`)
- `GET /api/resources/?category={cat}&search={q}`: Filter resource library
- `POST /api/resources/`: Admin creates resource
- `PUT /api/resources/{id}`: Admin edits resource
- `DELETE /api/resources/{id}`: Admin deletes resource

### Notifications (`/api/notifications`)
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

## 6. How to Run MindBridge Campus Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Quick Unified Launch (Single Server)

The application has been configured so the FastAPI server automatically serves the compiled React production frontend alongside the REST API!

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Start the application:
   ```bash
   python -m uvicorn app.main:app --port 8000 --reload
   ```
4. Open your browser and go to:
   - **Web Application:** [http://localhost:8000](http://localhost:8000)
   - **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Dual-Server Development Mode (With Hot Reloading)

If you wish to make live frontend modifications with Vite HMR:

1. **Terminal 1 (Backend API):**
   ```bash
   cd backend
   python -m uvicorn app.main:app --port 8000 --reload
   ```
2. **Terminal 2 (Frontend with Vite):**
   ```bash
   cd frontend
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. Demo Credentials for Evaluation

The database is automatically pre-seeded with 35 continuous days of realistic, nuanced student logs, sample journal entries, appointments, and curated resources.

You can also use the **Instant 1-Click Demo Login** buttons on the login screen or navbar to switch roles seamlessly:

| Role | Email | Password | Persona |
|---|---|---|---|
| **Student** | `student@mindbridge.edu` | `student123` | Priya Sharma (3rd Year B.Tech CSE, 35 days of history) |
| **Counsellor** | `counsellor@mindbridge.edu` | `counsellor123` | Dr. Ananya Sharma (Ph.D. NIMHANS, Senior Psychologist) |
| **Administrator** | `admin@mindbridge.edu` | `admin123` | Prof. Rajesh Kumar (Dean of Student Affairs) |

---

## 8. Verification & Test Summary

All major workflows have been tested and verified:
- `auth.py`: Bcrypt password hashing, JWT generation, and token role verification.
- `seed_data.py`: Auto-populates 35 days of mood, stress, and sleep patterns, appointments, and resources on first run.
- `insights_engine.py`: Computes 7-day and 30-day mood stability, stress Pareto breakdown, sleep deficit, consistency score, and composite index.
- `ai_service.py`: Tested with standard academic stress queries and verified crisis keyword detection with Tele-MANAS emergency response.
- `frontend`: Built cleanly with `vite build` to `dist/`, completely integrated with Tailwind CSS, Lucide icons, and Recharts.

---

## 9. Current Limitations & Future Roadmap

- **External AI Key**: When `GEMINI_API_KEY` is not provided in `.env`, the system runs on the built-in empathetic offline engine. Adding a Google Gemini API key activates live generative responses.
- **SMS / Push Notifications**: Reminders currently trigger in-app notification badges and preferences. Integration with campus SMS gateways (Twilio/Gupshup) can be connected for mobile SMS reminders.
- **WebSockets for Realtime Chat**: AI chat is currently powered by low-latency asynchronous REST endpoints; streaming response tokens over Server-Sent Events (SSE) or WebSockets can be added for incremental typewriter effects.
