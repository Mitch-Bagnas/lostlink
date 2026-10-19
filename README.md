# LostLink

> *"Recover what matters, privately."*

LostLink is a modern, privacy-first, QR-based lost-and-found web application. Users register belongings and generate a unique QR code for each item. When a finder scans the QR code, they arrive at a clean public page where they can notify the owner immediately — without ever seeing the owner's name, email, or phone number.

---

## Features

- **Privacy-First Design:** Public scanner pages (`/found/:qrId`) display only the item name, category, and status. Owner email, phone number, and account IDs are never exposed.
- **Instant Secure Notifications:** Finders send an optional note (and optional finder contact); LostLink automatically delivers an HTML alert to the owner's email with HTML injection escaping.
- **SMS / Dual Alert Integration (Premium):** When owners select the `email+phone` contact method, dual notification is dispatched (email + mock SMS log).
- **Free vs. Premium Tiers:**
  - **Free:** Up to 3 registered belongings, email notification. (4th item creation strictly blocked with HTTP 403 on the server).
  - **Premium (₱50/month):** Unlimited belongings, email + SMS notifications, printable sticker labels, and priority support.
- **Atomic Concurrency:** Item limits are enforced atomically inside database transactions with row locks to prevent race condition bypasses.
- **Rate-Limiting & Security:**
  - Strict per-IP + per-QR rate limiting on notification submissions (5 per 15 min).
  - Rate limiting on authentication routes (10 per 15 min).
  - HTTP-only, secure cookies paired with Vercel API reverse proxying.
  - Row Level Security (RLS) enabled as a defense-in-depth shield against unauthorized direct client access.

---

## Monorepo Layout

```text
LostLink/
├── backend/            # Express + TypeScript + PostgreSQL API
├── frontend/           # React + Vite + TypeScript + Tailwind CSS SPA
├── migrations/         # Plain SQL migrations for Supabase
├── scripts/            # Helper scripts (e.g. bcrypt hash generation)
├── render.yaml         # Render backend web service blueprint
├── vercel.json         # Vercel SPA routing & API reverse-proxy configuration
├── seed.sql            # Seed data with demo accounts & test belongings
├── MANUAL_STEPS.md     # Step-by-step human-in-the-loop manual instructions
└── README.md
```

---

## Local Development Quickstart

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)
- A Supabase PostgreSQL database project (see `MANUAL_STEPS.md`)

### 1. Database Setup
Follow **Step 1** in [MANUAL_STEPS.md](MANUAL_STEPS.md) to run `migrations/001_initial_schema.sql` in your Supabase SQL Editor.
Optionally run `seed.sql` (**Step 3**) for instant demo accounts.

### 2. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Create `backend/.env` based on `backend/.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   JWT_SECRET=your-random-32-char-secret
   FRONTEND_URL=http://localhost:5173
   RESEND_API_KEY=
   EMAIL_FROM=LostLink <onboarding@resend.dev>
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`. Test health: `http://localhost:5000/api/health`.

### 3. Frontend Setup
1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Demo Accounts (from `seed.sql`)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Free User** | `demo@lostlink.ph` | `Password123!` | 2 items registered (1 lost, 1 safe). Has 1 remaining slot before 3-item limit. |
| **Premium User** | `pro@lostlink.ph` | `Password123!` | 4 items registered. Supports `email+phone` contact method. |

---

## Deployment Guide

Refer to [MANUAL_STEPS.md](MANUAL_STEPS.md) for the exact step-by-step deployment procedure:
1. Supabase database provisioning & migrations.
2. Render backend deployment.
3. Vercel frontend deployment with API reverse proxy.
4. Production CORS cross-link configuration.
