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

### Step 10: [COMPLETED] Run Database Migration 002 (`migrations/002_admin.sql`)
- **Status:** ✅ Executed and verified live on Supabase.
- **Summary:** Added `role` and `status` enums, session revocation (`password_changed_at`), forced password update flag (`must_change_password`), `audit_logs` table with RLS, and indexes.

---

### Step 11: [COMPLETED] Provision Your First Administrator Account
- **Status:** ✅ Completed. Account `admin@lostlink.ph` provisioned with `role = 'admin'`, `status = 'active'`, `is_premium = true`.
- **Note:** Ensure temporary passwords used in terminal history are cleared.

---

### Step 12: [COMPLETED] Admin Panel & Security Suite Verification (9/9 Checks Passed)
- [x] 1. `createAdmin` executed, admin login succeeds, `/admin` loads overview metrics and 30-day velocity chart.
- [x] 2. Regular user signup strictly rejects role tampering; all `/api/admin/*` endpoints strictly return 403 Forbidden to regular users.
- [x] 3. Suspending a user immediately terminates their active session (`403 ACCOUNT_SUSPENDED`), login displays reason banner, and admin reactivation restores full access.
- [x] 4. Free tier 3-item limit enforced (`403 FREE_TIER_LIMIT_REACHED`); admin grants premium; user can register 4th+ items.
- [x] 5. Admin password reset generates a one-time temp password; immediately revokes old session (`401 SESSION_REVOKED`); old password rejected; temp password succeeds and prompts forced password change modal.
- [x] 6. Safety guardrails block self-deletion (400), self-demotion (400), self-suspension (400), and direct deletion of admins without two-step demotion.
- [x] 7. Cascade user deletion cleanly purges user, items, and finder notifications from the database.
- [x] 8. Audit logging verified: every action tracked with `admin_email` snapshot and ZERO leaked passwords/secrets. Public `GET /api/found/:qrId` verified to leak ZERO owner data.
- [x] 9. Production build `npm run build` succeeds on backend and frontend (0 errors). Full-page responsive screenshots captured at 375px and 1366px for `/admin`, `/admin/users`, and `/admin/users/:id`.

---

### Step 13: [ACTION REQUIRED] Trigger Render Backend Redeployment
- **Why this is needed:** While Vercel has built the new frontend bundle, Render is still serving the previous backend deployment from before migration 002. Consequently, the live `/api/auth/login` on Render still returns the old user object without the `role` property (`user.role === undefined`), which hides the navbar Admin link and blocks `/admin`.
- **Where to do it:** [Render Dashboard](https://dashboard.render.com) -> Select your Web Service (`lostlink-app` / `lostlink-backend`).
- **Exact Action:** Click the **Manual Deploy** button (top right) -> Select **Clear build cache & deploy**.
- **What success looks like:**
  Once Render finishes deploying (Status: `Live`):
  1. Open [lostlink-app-gold.vercel.app/auth](https://lostlink-app-gold.vercel.app/auth).
  2. Log in with `admin@lostlink.ph` and `admin123`.
  3. The **Admin PANEL** link will appear in the top navbar.
  4. Clicking it will open the full Admin Panel at `/admin`.

---

### Step 14: [ACTION REQUIRED] Configure Production Domain on Vercel (`lostlink.vercel.app`)
- **Why this is needed:** Upgrades the production URL from `lostlink-app-gold.vercel.app` to the clean branded domain `lostlink.vercel.app`. All existing links to the old domain will permanently 308-redirect to the new domain preserving paths and query parameters.
- **Where to do it:** [Vercel Dashboard](https://vercel.com/dashboard) -> Select your LostLink frontend project -> **Settings** -> **Domains**.
- **Exact Actions:**
  1. In the **Domain** input box, enter `lostlink.vercel.app` and click **Add**.
  2. If `lostlink.vercel.app` is already taken by another account, enter `lostlink-ph.vercel.app` instead.
  3. Keep the old domain `lostlink-app-gold.vercel.app` in your domains list — our `vercel.json` will automatically 308-redirect all incoming traffic from the old domain to the new primary domain.
- **What success looks like:**
  The new domain displays a green status badge (`Valid Configuration`). Visiting `https://lostlink.vercel.app` (or `lostlink-ph.vercel.app`) loads the LostLink landing page.

---

### Step 15: [ACTION REQUIRED] Create Google OAuth 2.0 Web Client Credentials
- **Why this is needed:** Real Google Sign-In uses a server-side OAuth 2.0 authorization code flow with PKCE, requiring a registered Google Client ID and Client Secret to verify tokens securely.
- **Where to do it:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Exact Actions:**
  1. **Select or Create Project:** Click the project dropdown at the top and select your project (or click **New Project** and name it `LostLink`).
  2. **Configure OAuth Consent Screen (if not done yet):**
     - Go to **APIs & Services** -> **OAuth consent screen**.
     - Choose **External** -> click **Create**.
     - **App Information:** App name: `LostLink`, User support email: your email, Developer contact email: your email. Click **Save and Continue**.
     - **Scopes:** Click **Add or Remove Scopes**, check `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `openid`. Click **Update** -> **Save and Continue**.
     - **Test Users (IMPORTANT):** While the app is in **Testing mode**, only accounts listed here can sign in. Click **Add Users**, type your personal Google email address (and any other test accounts), and click **Save and Continue**. *(Once you are ready for everyone to use it, you can click "Publish App" on this screen).*
  3. **Create Credentials:**
     - Go to **APIs & Services** -> **Credentials**.
     - Click **+ CREATE CREDENTIALS** -> Select **OAuth client ID**.
     - **Application type:** Select **Web application**.
     - **Name:** `LostLink Web Client`.
     - **Authorized JavaScript origins:**
       ```text
       https://lostlink.vercel.app
       http://localhost:5173
       ```
       *(If you used `lostlink-ph.vercel.app`, enter `https://lostlink-ph.vercel.app` instead)*
     - **Authorized redirect URIs:**
       ```text
       https://lostlink.vercel.app/api/auth/google/callback
       http://localhost:5173/api/auth/google/callback
       ```
       *(If you used `lostlink-ph.vercel.app`, enter `https://lostlink-ph.vercel.app/api/auth/google/callback` instead)*
     - Click **Create**.
     - Copy the **Client ID** (ends with `.apps.googleusercontent.com`) and the **Client Secret**.

---

### Step 16: [ACTION REQUIRED] Update Render Environment Variables
- **Why this is needed:** The backend needs the Google credentials to exchange authorization codes, and needs `FRONTEND_URL` updated so CORS and OAuth redirect cookies function correctly.
- **Where to do it:** [Render Dashboard](https://dashboard.render.com) -> Select your Web Service (`lostlink-queh`) -> **Environment**.
- **Exact Actions:**
  Add or edit these three environment variables:
  | Key | Value |
  | :--- | :--- |
  | `FRONTEND_URL` | `https://lostlink.vercel.app` *(or `https://lostlink-ph.vercel.app`)* |
  | `GOOGLE_CLIENT_ID` | `<Your Google Client ID from Step 15>` |
  | `GOOGLE_CLIENT_SECRET` | `<Your Google Client Secret from Step 15>` |
- Click **Save Changes**. Render will automatically trigger a deployment.

---

### Step 17: [BLOCKING] Run Database Migration 003 on Supabase (`003_auth_upgrades.sql`)
- **Why this is needed:** Adds support for password reset tokens (`password_reset_tokens` table with RLS), makes `password_hash` nullable for Google-only users, and adds `google_id` and `auth_provider`.
- **Where to do it:** [Supabase Dashboard](https://supabase.com/dashboard) -> Select your Project -> **SQL Editor** -> **New query**.
- **Paste-Ready SQL:**
```sql
-- LostLink Migration: 003_auth_upgrades.sql
-- Description: Password reset tokens, Google OAuth support, and nullable password_hash.
-- Paste-ready for the Supabase SQL Editor. Fully idempotent.

-- 1. Create auth_provider enum if not exists
DO $$ BEGIN
    CREATE TYPE auth_provider_type AS ENUM ('local', 'google');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter Users Table
-- Make password_hash nullable for Google-only accounts
ALTER TABLE users 
    ALTER COLUMN password_hash DROP NOT NULL;

-- Add google_id and auth_provider columns
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE NULL,
    ADD COLUMN IF NOT EXISTS auth_provider auth_provider_type NOT NULL DEFAULT 'local';

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

-- 3. Create Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);

-- 5. Enable Row Level Security (defense-in-depth, no public access)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
```
- **What success looks like:**
  The query executes with `Success. No rows returned`.
  You can run this quick verification query to confirm the columns and table are active:
  ```sql
  SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'users' AND column_name IN ('password_hash', 'google_id', 'auth_provider');

  SELECT table_name FROM information_schema.tables WHERE table_name = 'password_reset_tokens';
  ```

---

### Important Deliverability & Security Notes
- **Resend Free Tier Restriction:** Resend free-tier accounts will ONLY deliver emails to the email address registered to your Resend account until you verify a custom domain. When testing the Forgot Password flow, enter your own Resend account email address to receive the live reset link.
- **Google OAuth Testing Mode:** In Testing mode, Google requires every tester account to be listed under **Test users** on the OAuth consent screen. Sign-ins from accounts not listed will receive a `403 Access Denied` from Google before redirecting to LostLink.

