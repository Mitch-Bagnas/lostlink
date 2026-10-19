# LostLink: Human-in-the-Loop Manual Steps (`MANUAL_STEPS.md`)

This document lists every manual action required from you (the human in the loop).
Each entry provides:
- **Step number** & **Blocking/Optional** status
- **Where to do it** (exact URL, menu, or CLI)
- **Exact command or SQL to paste**
- **What success looks like**
- **What to send back to the AI if it fails**

---

### Step 0: [COMPLETED] Grant Write Access to Workspace Directory
- **Status:** Completed. Directory `d:\LostLink` is fully writable.

---

### Step 1: [COMPLETED] Create Supabase Project & Run Schema Migration
- **Status:** Completed. Tables `users`, `items`, and `notifications` created with custom enums, indexes, and RLS enabled.

---

### Step 2: [COMPLETED] Obtain Supabase Pooler Connection String
- **Status:** Completed. Verified working Supabase Transaction Pooler connection string configured in `backend/.env`:
  `postgresql://postgres.nwmubhfpzbczviboolpl:%40lostlink123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

---

### Step 3: [COMPLETED] Seed Database with Demo Accounts
- **Status:** Completed. `demo@lostlink.ph` (Free) and `pro@lostlink.ph` (Premium) seeded and verified in database.

---

### Step 4: [COMPLETED] Deploy Backend to Render
- **Status:** Completed. Service `lostlink` is live at **`https://lostlink-queh.onrender.com`**.
- Database connection verified live: `{"status":"ok","database":"connected"}`.

---

### Step 5: [COMPLETED] Frontend & Backend Cross-Origin Configuration
- **Status:** Completed. Backend configured with `credentials: true`, `sameSite: 'none'`, and `secure: true` for cross-origin authentication between Vercel and Render.

---

### Step 6: [COMPLETED] Deploy Frontend to Vercel
- **Status:** Completed. App is live at **`https://lostlink-app-gold.vercel.app`**.

---

### Step 7: [COMPLETED] Connect Vercel & Render Environment Variables
- **Status:** Completed & Verified Live. Cross-domain authentication, cookie passing, and API calls between `lostlink-app-gold.vercel.app` and `lostlink-queh.onrender.com` are fully operational.

---

### Step 8: [OPTIONAL] Resend API Key Setup (For Real Email Notifications)
- **Why this is needed:** When a finder clicks "Notify Owner", LostLink sends an email to the owner. In local development or if no API key is set, emails are logged to the console / simulated.
- **Important Resend Free-Tier Note:** Resend's free tier restricts sending to the single email address registered on your Resend account (or verified custom domain). If you test with demo accounts, send notifications to your own verified email.
- **Where to do it:** [Resend Dashboard](https://resend.com/api-keys)
  1. Sign in and create an API key named `LostLink-Prod`.
  2. In Render -> `lostlink` -> Environment -> Set `RESEND_API_KEY` to `re_...`.
  3. Set `EMAIL_FROM` to `onboarding@resend.dev` (or your verified domain sender).
- **What success looks like:**
  When `/api/found/:qrId/notify` is called, an email arrives in the owner's inbox with the subject: `🚨 LostLink Alert: Someone found your [Item Name]!`.

---

### Step 9: [COMPLETED] Core Production Smoke Test Checklist
- [x] 1. Landing page loads cleanly at 375px mobile and 1366px desktop.
- [x] 2. Sign in with demo account at `/auth` succeeds.
- [x] 3. Dashboard loads with seeded items ("University Student ID", "Blue Samsonite Backpack").
- [x] 4. Click **Manage & QR** on an item to inspect QR code and test status toggle (Safe <-> Lost).
- [x] 5. Public QR URL (`/found/<qr_id>`) verified live with HTTP 200 — zero owner info exposed.
- [x] 6. Send test finder alert message ("Left at the court") from mobile phone scanner — verified working live with real-time UI notification update.

---

### Step 10: [BLOCKING] Run Database Migration 002 (`migrations/002_admin.sql`)
- **Why this is needed:** Adds the `role` (`'user'`, `'admin'`) and `status` (`'active'`, `'suspended'`) columns, session revocation tracking (`password_changed_at`), forced password update flag (`must_change_password`), and the `audit_logs` table with row-level security.
- **Where to do it:** [Supabase SQL Editor](https://supabase.com/dashboard/project/nwmubhfpzbczviboolpl/sql/new)
- **Exact SQL to paste:**
  ```sql
  -- LostLink Migration: 002_admin.sql
  -- Description: Adds admin role, account suspension, audit logging, and session revocation columns.
  -- Paste-ready for the Supabase SQL Editor. Fully idempotent.

  -- 1. Create Enums if not exists
  DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('user', 'admin');
  EXCEPTION
      WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('active', 'suspended');
  EXCEPTION
      WHEN duplicate_object THEN NULL;
  END $$;

  -- 2. Alter Users Table
  ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS suspended_reason TEXT NULL,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

  -- 3. Create Audit Logs Table
  CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
      admin_email VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 4. Create Indexes
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

  -- 5. Enable Row Level Security on audit_logs (defense in depth, no public access)
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  ```
- **What success looks like:**
  Supabase displays green `Success. No rows returned.`
- **What to send back if it fails:**
  Copy and paste the exact error message from the Supabase results pane.

---

### Step 11: [BLOCKING] Provision Your First Administrator Account
- **Why this is needed:** There is strictly **no public way** to become an administrator. Signup always produces a regular user. This CLI script securely inserts or promotes your admin account using bcrypt hashing.
- **Where to do it:** PowerShell terminal inside `d:\LostLink\backend` (or tell me to run it for you once Step 10 is done).
- **Exact command to run:**
  ```powershell
  cd d:\LostLink\backend
  $env:ADMIN_NAME="Platform Administrator"
  $env:ADMIN_EMAIL="admin@lostlink.ph"
  $env:ADMIN_PASSWORD="AdminPassword123!"
  npx tsx scripts/createAdmin.ts
  Remove-Item Env:\ADMIN_NAME, Env:\ADMIN_EMAIL, Env:\ADMIN_PASSWORD
  ```
  *(You may customize `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your own preference).*
- **What success looks like:**
  Terminal prints:
  ```text
  ✅ Administrator account successfully configured:
  {
    id: '...',
    name: 'Platform Administrator',
    email: 'admin@lostlink.ph',
    role: 'admin',
    status: 'active',
    is_premium: true
  }
  🔒 IMPORTANT: Please remove ADMIN_PASSWORD from your environment or terminal history.
  ```
- **What to send back if it fails:**
  Copy and paste the terminal error output.
