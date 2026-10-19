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

### Step 9: [VERIFICATION] Production Smoke Test Checklist
- [x] 1. Landing page loads cleanly at 375px mobile and 1366px desktop.
- [x] 2. Sign in with demo account at `/auth` succeeds.
- [x] 3. Dashboard loads with seeded items ("University Student ID", "Blue Samsonite Backpack").
- [x] 4. Click **Manage & QR** on an item to inspect QR code and test status toggle (Safe <-> Lost).
- [x] 5. Public QR URL (`/found/<qr_id>`) verified live with HTTP 200 — zero owner info exposed.
- [x] 6. Send test finder alert message — verified working live with success response and DB persistence.
- [ ] 7. Add a 3rd item via **Add Item**.
- [ ] 8. Attempt to add a 4th item to verify the 3-item free tier limit and modal upsell.
- [ ] 9. Visit `/premium` and test the simulated upgrade flow.
- [ ] 10. Click Log Out to verify cookie cleanup and redirect to landing/login.

