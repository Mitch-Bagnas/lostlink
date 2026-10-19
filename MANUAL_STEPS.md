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

### Step 7: [FINAL STEP] Connect Vercel & Render Environment Variables
To connect the live frontend to the live backend:

1. **In Render Dashboard ([dashboard.render.com](https://dashboard.render.com/)):**
   - Click your `lostlink` Web Service $\rightarrow$ **Environment** tab.
   - Update `FRONTEND_URL` to:
     ```text
     https://lostlink-app-gold.vercel.app
     ```
   - Click **Save Changes** (triggers a quick automatic restart).

2. **In Vercel Dashboard ([vercel.com](https://vercel.com/)):**
   - Click `lostlink-app` $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
   - Edit `VITE_API_URL` (or add it if missing):
     - **Key:** `VITE_API_URL`
     - **Value:**
       ```text
       https://lostlink-queh.onrender.com/api
       ```
     - Make sure **Config** is selected (not Secret).
     - Click **Save**.
   - Go to the **Deployments** tab $\rightarrow$ click the **`...`** (three dots) on the top deployment $\rightarrow$ click **Redeploy**.

---

---

### Step 8: [OPTIONAL] Resend API Key Setup (For Real Email Notifications)
- **Why this is needed:** When a finder clicks "Notify Owner", LostLink sends an email to the owner. In local development or if no API key is set, emails are logged to the console / simulated.
- **Important Resend Free-Tier Note:** Resend's free tier restricts sending to the single email address registered on your Resend account (or verified custom domain). If you test with demo accounts, send notifications to your own verified email.
- **Where to do it:** [Resend Dashboard](https://resend.com/api-keys)
  1. Sign in and create an API key named `LostLink-Prod`.
  2. In Render -> `lostlink-backend` -> Environment -> Set `RESEND_API_KEY` to `re_...`.
  3. Set `EMAIL_FROM` to `onboarding@resend.dev` (or your verified domain sender).
- **What success looks like:**
  When `/api/found/:qrId/notify` is called, an email arrives in the owner's inbox with the subject: `🚨 LostLink Alert: Someone found your [Item Name]!`.

---

### Step 9: [VERIFICATION] Production Smoke Test Checklist
Open your live Vercel URL in an incognito window and verify:
- [ ] 1. Landing page loads cleanly at 375px mobile and 1366px desktop.
- [ ] 2. Create a new account at `/auth`.
- [ ] 3. Dashboard loads with 0 items.
- [ ] 4. Register Item 1 (Wallet), Item 2 (Bag), Item 3 (Gadget).
- [ ] 5. Attempt to register Item 4 -> Verify the upgrade prompt modal opens and server rejects with 403.
- [ ] 6. Mark Item 1 as "Lost".
- [ ] 7. Copy the QR link (`/found/<qr_id>`) and open it in a separate private window.
- [ ] 8. Verify the public page shows only Item Name, Category, and Status — no owner name, email, or phone.
- [ ] 9. Type a finder message ("Found on MRT train 3") and submit "Notify Owner".
- [ ] 10. Confirm notification is logged/received in owner dashboard.
- [ ] 11. Navigate to `/premium` -> click "Upgrade" -> complete simulated payment.
- [ ] 12. Register Item 4 now as Premium -> succeeds!
- [ ] 13. Log out -> verify cookie cleared and protected routes redirect to `/auth`.
