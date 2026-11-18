# 🚀 MindBridge Campus - Deployment Guide

This document describes how MindBridge Campus is deployed and made publicly accessible on the web.

---

## 🌐 1. Active Public URL (Instant Live Access)

MindBridge Campus is currently live and accessible worldwide over HTTPS:

> **Live Public URL:** [https://vip-flood-richmond-thumbnails.trycloudflare.com](https://vip-flood-richmond-thumbnails.trycloudflare.com)

- **Mobile & Desktop Ready:** Fully responsive design tested on modern mobile browsers (iOS Safari, Android Chrome) and desktop screens.
- **Zero Configuration Needed:** No login walls, VPNs, or proxy configuration required for your friends to access it.
- **SSL / HTTPS Encrypted:** End-to-end TLS encryption provided by Cloudflare's global edge network.

### 🔑 Demo Accounts Available for Instant Testing

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@mindbridge.edu` | `student123` | Wellbeing Sanctuary Dashboard, Expressive Mood Check-in, Daily Micro-Activities, Private Encrypted Journal, Mindy AI Companion, Counsellor Booking, SOS 14416 Support |
| **Counsellor** | `counsellor@mindbridge.edu` | `counsellor123` | Counsellor Workspace, Appointment Request Approvals, Private Clinical Session Notes |
| **Administrator** | `admin@mindbridge.edu` | `admin123` | Admin Command, User Registry, Resource Library Management, Anonymous Aggregate Wellbeing Trends |

> *Note: You can also click **"Create an account"** on the login page to register your own custom student or counsellor account, or use the 1-click role switcher buttons.*

---

## 🛡️ 2. Production Security & Privacy Architecture

MindBridge Campus was designed from the ground up to uphold the highest student privacy and mental wellbeing standards:

1. **Private Journal Strict Isolation:**
   - Student journal entries are private to the author.
   - Neither administrators nor counsellors have access to student journals.
   - Mindy AI Companion does not ingest private journals without explicit user consent.
2. **Password Security:**
   - Salted Bcrypt one-way password hashing.
   - PyJWT tokens signed with `HS256` and stored in localStorage.
3. **Emergency Crisis Protection (India Context):**
   - Hard pre-filter for self-harm and distress keywords.
   - Prominent Emergency Modal and SOS button in the top navbar linking directly to:
     - **Tele-MANAS:** `14416` (24x7 National Tele-Mental Health Programme of India)
     - **National Emergency Number:** `112`
     - **KIRAN Mental Health Helpline:** `1800-599-0019`
4. **Non-Clinical Wellbeing Disclaimers:**
   - Visual indicators clearly state that MindBridge Campus is an emotional wellbeing tracking and peer support platform, not a medical diagnostic or clinical treatment tool.

---

## ☁️ 3. Permanent 24/7 Cloud Hosting (Render / Railway Free Tier)

If you would like to run MindBridge Campus permanently in the cloud 24/7:

### Option A: Render.com (Recommended Free Tier)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete MindBridge Campus full-stack platform"
   git remote add origin https://github.com/<your-username>/mindbridge-campus.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [https://render.com](https://render.com) and sign in with GitHub.
   - Click **"New +"** → **"Web Service"**.
   - Select your `mindbridge-campus` repository.
   - Render will detect the included `Dockerfile` and `render.yaml` automatically.
   - Choose the **Free** instance tier.
   - Add environment variables (optional):
     - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key if you want live LLM generation; otherwise, the built-in empathetic wellbeing fallback engine operates automatically!
     - `JWT_SECRET`: Any random 32-character string.
   - Click **"Create Web Service"**.
   - Render will build the React frontend, configure FastAPI, and provide you with a permanent `https://mindbridge-campus.onrender.com` URL!

---

## 💻 4. Running Locally / Re-launching the Public Tunnel

If you stop or restart your local machine, you can re-launch the server and public tunnel at any time:

```powershell
# Run the public launcher
powershell -ExecutionPolicy Bypass -File .\run_public.ps1
```

To stop all background processes:
```powershell
powershell -ExecutionPolicy Bypass -File .\stop_public.ps1
```
