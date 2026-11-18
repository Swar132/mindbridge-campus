# 🚀 MindBridge Campus — Production Cloud Deployment & 24/7 Permanent Hosting Guide

This document is the authoritative guide for permanently hosting **MindBridge Campus** in the cloud so that it remains accessible **24/7 globally**, completely independent of your laptop, local servers, VS Code, or temporary tunnels.

---

## 🏛️ 1. Complete Project Stack & Architecture Audit

Before deploying, the entire codebase was audited and verified for production cloud readiness:

| Layer | Technology | Production Configuration |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TailwindCSS | Compiles into static bundle in `frontend/dist`. Relative `/api` paths with zero localhost dependencies. |
| **Backend** | Python 3.12 + FastAPI + Uvicorn | Serves `/api` REST endpoints, WebSocket-ready, and directly serves compiled static SPA from `frontend/dist`. |
| **PWA Engine** | Web App Manifest + Service Worker (`sw.js`) | Caches app shell, runtime stale-while-revalidate, offline fallback handling, standalone display on mobile/desktop. |
| **Database** | SQLAlchemy 2.0 ORM + PostgreSQL / SQLite | Multi-dialect engine: Automatically uses managed **PostgreSQL** in cloud production when `DATABASE_URL` is set, with fallback to SQLite for local runs. |
| **Authentication** | JWT (`HS256`) + Salted Bcrypt | Encrypted tokens stored client-side in localStorage, auto-injected via `Authorization: Bearer <token>` headers. |
| **AI Companion (Mindy)** | Hybrid LLM + Empathetic Rule Engine | Resilient fallback engine tailored to campus stressors (placements, exams, burnout); supports voice note recording & playback. Hardened crisis protocol (Tele-MANAS `14416`). |
| **Containerization** | Multi-Stage `Dockerfile` | Stage 1 builds React with Node 20; Stage 2 packages FastAPI with Python 3.12. Zero manual frontend compilation required on server. |

---

## ☁️ 2. Recommended Hosting Platform: Render.com (Free Tier)

### Why Render is the Optimal Choice for MindBridge Campus:
1. **Unified Full-Stack Deployment**: Because our `Dockerfile` bundles the compiled React frontend into FastAPI, both the frontend and backend run as **one single web service** under **one permanent URL** (e.g., `https://mindbridge-campus.onrender.com`).
2. **Zero CORS Issues**: Serving frontend and backend from the same domain completely eliminates cross-origin request errors, cookie security blocks, and mismatched API URLs.
3. **Free Managed PostgreSQL**: Render offers a free managed PostgreSQL database with 1 GB storage that integrates directly via `render.yaml`.
4. **Permanent URL**: Unlike temporary tunnels, Render URLs **never change** when your laptop is turned off, restarted, or redeployed.
5. **Automated Git Deployments**: Every `git push origin main` triggers an automatic zero-downtime rebuild and deploy.
6. **Free Custom Domain Support**: You can easily attach a custom domain (e.g. `mindbridgecampus.org`) with free, automated SSL from Let's Encrypt.

---

## 📋 3. Step-by-Step Permanent Deployment (In 5 Minutes)

### Step 1: Create a GitHub Repository and Push Code

The local repository is already initialized and committed. To push it to your GitHub account (`Swar132`):

1. Go to [https://github.com/new](https://github.com/new) and create a repository named **`mindbridge-campus`** (set to **Public** or **Private**).
2. Run these commands in PowerShell from the project directory:

```powershell
cd C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus

# Add your GitHub repository as the remote
git remote add origin https://github.com/Swar132/mindbridge-campus.git

# Rename default branch to main (if not already main)
git branch -M main

# Push the codebase
git push -u origin main
```

*(Git Credential Manager will prompt you once to sign into GitHub in your browser if not already signed in).*

---

### Step 2: Deploy on Render with 1-Click Blueprint

Render automatically reads the included `render.yaml` configuration to provision **both** the Web Service and the PostgreSQL Database:

1. Visit **[https://dashboard.render.com](https://dashboard.render.com)** and sign in with your GitHub account.
2. In the top navbar, click **"New +"** and select **"Blueprint"**.
3. Select your repository: **`Swar132/mindbridge-campus`**.
4. Render will detect `render.yaml` and show:
   * **`mindbridge-db`** (Managed PostgreSQL Database — Free Tier)
   * **`mindbridge-campus`** (Web Service — Docker Environment — Free Tier)
5. Click **"Apply"**.
6. Render will:
   * Spin up your cloud PostgreSQL database.
   * Build the Docker container (compiling React and installing FastAPI dependencies).
   * Automatically connect `DATABASE_URL` from the database to the web service.
   * Auto-seed demo accounts (`student@mindbridge.edu`, `counsellor@mindbridge.edu`, `admin@mindbridge.edu`).
   * Launch your live website at:
     **`https://mindbridge-campus.onrender.com`** *(or your chosen name)*.

---

## 🗄️ 4. Persistent Database & Migration Options

### Option A: Render Managed PostgreSQL (Configured in `render.yaml`)
* **Persistence**: Data survives all server restarts, updates, and redeployments.
* **Storage**: 1 GB free storage, 50 connections.
* **Connection**: Render automatically manages and links `DATABASE_URL`.

### Option B: External Managed PostgreSQL (Supabase / Neon.tech)
If you prefer a standalone cloud database that never expires:
1. Create a free project on **[Supabase](https://supabase.com)** or **[Neon](https://neon.tech)**.
2. Copy the Connection String (URI), e.g.:
   `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
3. In Render Web Service → **Environment**, set:
   * `DATABASE_URL` = your Supabase / Neon connection string.

### Migrating Local SQLite Data to Cloud PostgreSQL:
If you have created custom check-ins or journal entries on your laptop that you wish to transfer to the cloud database:
```powershell
cd C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus
python backend/migrate_to_postgres.py --target "postgresql://user:password@host:port/dbname"
```
The script will inspect the local `mindbridge.db`, create all necessary tables in PostgreSQL, and migrate all users, journals, check-ins, counsellors, and resources without data loss.

---

## 🔑 5. Environment Variables Reference

Configure these in the Render Dashboard (**Environment** tab):

| Variable | Description | Required? | Default / Example |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL connection string | **Auto** | Auto-injected by Render Blueprint, or paste from Supabase/Neon |
| `JWT_SECRET` | Secret key for signing authentication tokens | **Auto** | Auto-generated random string by Render |
| `PROJECT_NAME` | Display name of the platform | No | `"MindBridge Campus"` |
| `GEMINI_API_KEY` | Google Gemini API key for live generative AI | Optional | If left blank, Mindy operates using the built-in empathetic offline engine |
| `OPENAI_API_KEY` | Alternative LLM API key | Optional | Blank |
| `PORT` | Web server port | Auto | `8000` (Render sets this automatically) |

---

## 🔄 6. How to Update Your Website in the Future

Once connected to GitHub and Render:
1. Make your code changes locally.
2. Commit and push:
   ```powershell
   git add .
   git commit -m "feat: improve dashboard animations"
   git push origin main
   ```
3. **Render will automatically detect the push, rebuild the app, and redeploy.**
4. **The public URL remains completely unchanged.**
5. **All user data in PostgreSQL is preserved without interruption.**

---

## ⚠️ 7. Free Tier Characteristics & Best Practices

* **Spin-Down on Inactivity (Cold Start)**:
  * On Render's Free Tier, if a web service receives no traffic for 15 minutes, it goes into sleep mode to conserve resources.
  * When someone visits the URL after it has been sleeping, Render automatically spins it back up. The initial page load will take **~30 to 45 seconds**. Subsequent clicks and pages will be instant.
  * **Pro-Tip (Keeping it Awake 24/7 for Free)**:
    You can set up a free uptime monitor at **[UptimeRobot](https://uptimerobot.com)** (free 5-minute ping) pointing to `https://your-app.onrender.com/api/health`. This prevents the container from ever sleeping, keeping it fast and instant for faculty reviews.
* **Custom Domain (Optional Branded URL)**:
  * In Render → Web Service → **Settings** → **Custom Domains**, add your domain (e.g. `mindbridge.yourcollege.edu` or `mindbridge.me`).
  * Add the CNAME record in your DNS provider (Namecheap, GoDaddy, Cloudflare).
  * Render issues a free Let's Encrypt SSL certificate automatically.
