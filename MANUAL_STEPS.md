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

### Step 14: [COMPLETED] Configure Production Domain on Vercel (`lostlink-ph.vercel.app`)
- **Status:** ✅ Completed & Verified Live. Primary domain is `https://lostlink-ph.vercel.app`. HTTP 200 OK verified.
- **Redirection:** Previous domain redirect configured in `vercel.json` with 308 permanent redirect.

---

### Step 15: [COMPLETED] Create Google OAuth 2.0 Web Client Credentials
- **Status:** ✅ Completed. Web client credentials generated in Google Cloud Console with authorized origins and callback URIs.

---

### Step 16: [COMPLETED] Update Render Environment Variables
- **Status:** ✅ Completed & Redeployed. `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` configured on Render web service.

---

### Step 17: [COMPLETED] Run Database Migration 003 on Supabase (`003_auth_upgrades.sql`)
- **Status:** ✅ Executed & Verified. `password_hash` is nullable, `google_id` and `auth_provider` columns are live, and `password_reset_tokens` table with RLS is active.

---

### Step 18: [COMPLETED] Auth Upgrades & Production Domain Verification (All Passed)
- [x] 1. Live domain `https://lostlink-ph.vercel.app` loads with HTTP 200.
- [x] 2. Google OAuth `/api/auth/google` responds with HTTP 302 redirect to `accounts.google.com` with client ID, state, nonce, PKCE code challenge, and signed `google_oauth_session` cookie.
- [x] 3. Forgot Password `POST /api/auth/forgot-password` returns generic uniform 200 response for both existing and non-existing accounts (account enumeration immune).
- [x] 4. Reset token generated with 32 random bytes, SHA-256 hash stored in `password_reset_tokens`, 30-min expiry enforced.
- [x] 5. Reset Password `POST /api/auth/reset-password` validated live: updates password bcrypt hash, sets `password_changed_at`, marks token used, rejects token reuse (400), and login with new password succeeds (200).
- [x] 6. Admin login on live domain verified: returns `role: 'admin'`, `status: 'active'`, `is_premium: true`, `must_change_password: false`, and updates `last_login_at`.
- [x] 7. Build check: `npm run build` completed with 0 errors across frontend and backend.

---

### Important Deliverability & Security Notes
- **Resend Free Tier Restriction:** Resend free-tier accounts will ONLY deliver emails to the email address registered to your Resend account until you verify a custom domain. When testing the Forgot Password flow, enter your own Resend account email address to receive the live reset link.
- **Google OAuth Testing Mode:** In Testing mode, Google requires every tester account to be listed under **Test users** on the OAuth consent screen. Sign-ins from accounts not listed will receive a `403 Access Denied` from Google before redirecting to LostLink.


