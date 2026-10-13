# Deploying CuseRents

Backend + Postgres on **Render** (from `render.yaml`), frontend on **Vercel**. Still Stripe **test mode**; going live is the last section.

## 1. Push
Push the latest commit to GitHub (`git push origin main`). Render and Vercel deploy from GitHub.

## 2. Backend on Render (~10 min)
1. Sign up at [render.com](https://render.com) with your GitHub account.
2. **New → Blueprint** → choose the `CuseRents` repo → it reads `render.yaml` and shows a database + a web service.
3. Fill the prompted values:
   | Key | Value |
   |---|---|
   | `FRONTEND_URL` | `https://cuserents.vercel.app` for now (fixed in step 4) |
   | `CORS_ALLOWED_ORIGINS` | same as `FRONTEND_URL` |
   | `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | your `sk_test_…` / `pk_test_…` |
   | `STRIPE_WEBHOOK_SECRET` | leave empty for now (step 5) |
   | `CLOUDINARY_*` | your Cloudinary keys, or empty (photo upload then says "not configured") |
   | `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` | your admin login for `/admin/` (strong password) |
4. **Apply**. The first build takes a few minutes. When it's live, open
   `https://<service>.onrender.com/api/items/items/stats/`, which should show JSON. Note this URL.

## 3. Frontend on Vercel (~5 min)
1. Sign up at [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import `CuseRents`.
2. **Root Directory:** `cuserents-frontend` (framework auto-detects as Create React App).
3. **Environment Variables:**
   - `REACT_APP_API_URL` = your Render URL, e.g. `https://cuserents-api.onrender.com` (no trailing slash, no `/api`)
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` = your `pk_test_…`
4. **Deploy** → note the URL, e.g. `https://cuserents.vercel.app`.

## 4. Point the backend at the frontend
Render → `cuserents-api` → **Environment** → set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the exact Vercel URL (no trailing slash) → **Save** (it redeploys).

## 5. Stripe webhook
Stripe dashboard (sandbox) → **Developers → Webhooks / Event destinations → Add endpoint**:
- URL: `https://<service>.onrender.com/api/payments/webhook/`
- Events: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`

Copy the signing secret (`whsec_…`) → Render → `STRIPE_WEBHOOK_SECRET` → Save.

## 6. Smoke test
Run the same owner/renter test as locally (two browsers): payouts setup → list item → book with `4242 4242 4242 4242` → accept → picked up → returned → review. Check the payment in Stripe.

## Free-tier limits to know
- The Render free web service **sleeps after ~15 min idle**; the first request after that takes up to a minute.
- Render free Postgres **expires after 30 days**. Upgrade the database plan before real users arrive.
- **Emails go to the Render logs** until SMTP is set. Add `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` in Render.

## Going live (real money), later
1. Have the Terms/Privacy pages reviewed; set a real support email.
2. Stripe: activate your account, complete the Connect platform profile, switch to **live** keys in Render + Vercel, and add a live-mode webhook (new `whsec_…`).
3. Upgrade Render plans (no sleeping, persistent DB), set up SMTP, optionally add a custom domain (then update `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`).
