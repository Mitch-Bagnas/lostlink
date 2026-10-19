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

### Step 4: [BLOCKING for Prod] Deploy Backend to Render
- **Why this is needed:** Render hosts our Node.js + Express API.
- **Where to do it:** [Render Dashboard](https://dashboard.render.com/)
  1. Click **New +** -> **Web Service**.
  2. Connect your GitHub repository containing `LostLink`.
  3. Fill in the service settings:
     - **Name:** `lostlink-backend`
     - **Region:** Singapore (or Oregon / closest to Supabase)
     - **Root Directory:** `backend`
     - **Runtime:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free
  4. Scroll down to **Environment Variables** and add:
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render's default)
     - `DATABASE_URL`: *(Paste your Supabase Pooler URI from Step 2)*
     - `JWT_SECRET`: *(Generate any random 32+ character string, e.g. run `openssl rand -hex 32` or use a long passphrase)*
     - `FRONTEND_URL`: `https://placeholder.vercel.app` *(We will update this in Step 7 once Vercel gives us the domain)*
     - `RESEND_API_KEY`: *(Optional, leave blank or add your Resend key if you have one)*
     - `EMAIL_FROM`: `LostLink <onboarding@resend.dev>`
  5. Click **Create Web Service**.
  6. Wait for the build and deployment to complete. Render will display your live backend URL (e.g., `https://lostlink-backend.onrender.com`).
  7. Test `/api/health` by opening `https://lostlink-backend.onrender.com/api/health` in your browser.
- **What success looks like:**
  Browser shows `{"status":"ok","database":"connected","timestamp":"..."}`.
- **What to send back if it fails:**
  Copy the error logs from the Render "Logs" tab.

---

### Step 5: [BLOCKING for Prod] Insert Render Backend URL into `vercel.json` Rewrite
- **Why this is needed:** Vercel reverse-proxies all `/api/*` traffic to the Render backend. This ensures the frontend and backend share the exact same origin in the browser's eyes, allowing `sameSite: 'lax'` secure cookies to work cleanly without third-party cookie blocking.
- **Where to do it:** Open `vercel.json` in your code editor.
- **Exact edit:**
  Replace `https://lostlink-backend.onrender.com` in `vercel.json` with your actual Render URL from Step 4.
  ```json
  {
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/api/:path*"
      },
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **Commit & Push:** Commit and push this change to your repository.

---

### Step 6: [BLOCKING for Prod] Deploy Frontend to Vercel
- **Why this is needed:** Vercel builds and hosts the React Vite SPA.
- **Where to do it:** [Vercel Dashboard](https://vercel.com/dashboard)
  1. Click **Add New...** -> **Project**.
  2. Import your GitHub repository.
  3. In the project setup screen:
     - **Framework Preset:** `Vite`
     - **Root Directory:** Click "Edit" and choose `frontend`
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
  4. Under **Environment Variables**, add:
     - `VITE_API_URL`: `/api` *(Since Vercel reverse-proxies `/api` via `vercel.json`, leave this as `/api`)*
  5. Click **Deploy**.
  6. When deployment finishes, copy your live Vercel URL (e.g., `https://lostlink.vercel.app`).
- **What success looks like:**
  Vercel gives you a green checkmark and the live site loads the LostLink landing page.

---

### Step 7: [BLOCKING for Prod] Set `FRONTEND_URL` on Render and Redeploy
- **Why this is needed:** Express CORS and cookie headers must match the exact Vercel frontend domain to prevent unauthorized origins from making requests.
- **Where to do it:** [Render Dashboard](https://dashboard.render.com/) -> Select `lostlink-backend` -> **Environment** tab.
- **Exact edit:**
  Update `FRONTEND_URL` to match your Vercel URL from Step 6:
  `FRONTEND_URL`: `https://lostlink.vercel.app` (do not include a trailing slash).
  Click **Save Changes**. Render will automatically trigger a rolling redeploy.
- **What success looks like:**
  Render deploys successfully and the logs say `LostLink Backend running on port 10000`.

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
