# LOPE — UGC Platform

## Project Structure

```
lope/
│
├── 📁 api/                   ← BACKEND (Node.js serverless functions)
│   ├── lib/
│   │   ├── db.js             ← Database (Neon PostgreSQL)
│   │   └── middleware.js     ← Auth (JWT) + CORS helpers
│   ├── auth/
│   │   ├── login.js          ← POST /api/auth/login
│   │   ├── register.js       ← POST /api/auth/register
│   │   ├── me.js             ← GET  /api/auth/me
│   │   ├── profile.js        ← PATCH /api/auth/profile
│   │   └── password.js       ← PATCH /api/auth/password
│   ├── campaigns/
│   │   ├── index.js          ← GET/POST /api/campaigns
│   │   ├── [id].js           ← PATCH/DELETE /api/campaigns/:id
│   │   └── public/
│   │       ├── [slug].js     ← GET /api/campaigns/public/:slug
│   │       └── [slug]/
│   │           └── submit.js ← POST /api/campaigns/public/:slug/submit
│   ├── submissions/
│   │   ├── index.js          ← GET /api/submissions
│   │   └── [id].js           ← PATCH /api/submissions/:id
│   ├── stories/
│   │   ├── index.js          ← GET /api/stories
│   │   └── [id]/
│   │       └── generate.js   ← POST /api/stories/:id/generate
│   ├── stats/
│   │   └── index.js          ← GET /api/stats
│   └── setup.js              ← POST /api/setup (seed database once)
│
├── 📁 src/                   ← FRONTEND (React 18 + Vite)
│   ├── main.jsx              ← App entry point
│   ├── App.jsx               ← Router + layout
│   ├── styles/
│   │   └── tokens.css        ← Design tokens (colors, fonts, spacing)
│   ├── lib/
│   │   └── api.js            ← HTTP client (talks to /api/*)
│   ├── context/
│   │   ├── AuthContext.jsx   ← Global auth state (login/logout)
│   │   └── ToastContext.jsx  ← Toast notifications
│   ├── router/
│   │   └── ProtectedRoute.jsx← Redirects to /login if not authed
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardShell.jsx ← Main layout wrapper
│   │   │   ├── Sidebar.jsx        ← Left navigation
│   │   │   └── Topbar.jsx         ← Top header bar
│   │   └── ui/
│   │       ├── Button.jsx    ← Reusable button (primary/outline/ghost/danger)
│   │       ├── Pill.jsx      ← Status badge (green/amber/red)
│   │       └── Modal.jsx     ← Dialog overlay
│   └── pages/
│       ├── auth/
│       │   ├── Login.jsx     ← /login page
│       │   └── Register.jsx  ← /register page
│       ├── dashboard/
│       │   ├── Overview.jsx  ← /dashboard (stats + activity feed)
│       │   ├── Campaigns.jsx ← /dashboard/campaigns (create/edit/delete)
│       │   ├── Submissions.jsx ← /dashboard/submissions (approve/reject)
│       │   ├── Stories.jsx   ← /dashboard/stories (generate/view)
│       │   └── Settings.jsx  ← /dashboard/settings (profile + password)
│       └── public/
│           └── Submit.jsx    ← /submit/:slug (public UGC form)
│
├── index.html                ← HTML entry point
├── vite.config.js            ← Vite config
├── vercel.json               ← Vercel routing config
├── package.json              ← All dependencies
└── .env.example              ← Environment variables template
```

---

## Deploy to Vercel (Step by Step)

### Step 1 — Neon Database (free)
1. Go to https://neon.tech → Sign up free
2. Click **New Project** → give it a name → Create
3. Copy the **Connection String** from the dashboard
   (looks like: `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

### Step 2 — Cloudinary for file uploads (free)
1. Go to https://cloudinary.com → Sign up free
2. On your dashboard, copy your **Cloud Name**
3. Go to **Settings → Upload → Upload Presets → Add upload preset**
4. Set **Signing Mode** to `Unsigned` → Save → Copy the preset name

### Step 3 — Push to GitHub
1. Extract this zip
2. Open terminal inside the folder
3. Run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/lope.git
   git push -u origin main
   ```

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your repo
3. Add these Environment Variables:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | Any random 32+ character string |
   | `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `VITE_CLOUDINARY_UPLOAD_PRESET` | Your unsigned preset name |

4. Click **Deploy** — Vercel builds automatically

### Step 5 — Seed the database (do this ONCE after first deploy)
Open your browser console on your live Vercel URL and run:
```js
fetch('/api/setup', {method:'POST'}).then(r=>r.json()).then(console.log)
```
This creates all tables and adds demo data.

**Demo login:** `demo@lope.com` / `password123`

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
# Then fill in your real values in .env

# Run locally (needs Vercel CLI for API functions)
npx vercel dev
# → Opens at http://localhost:3000

# OR run frontend only (no API)
npm run dev
# → Opens at http://localhost:5173
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Vite |
| Backend | Node.js Serverless Functions (Vercel) |
| Database | Neon PostgreSQL (serverless-compatible) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Uploads | Cloudinary (direct browser upload) |
| Deployment | Vercel (free tier) |
