# CuseRents Launch Roadmap

Each phase ends with a working app, a quick manual test, and a push to GitHub.

## Phase 0: Repo and local setup
- [x] Connect the local folder to the GitHub repo
- [x] Replace the tracked `.env.txt` (python-decouple only reads `.env`) with `.env.example`; real `.env` stays gitignored
- [x] Remove clutter: root `urls.py`, the duplicate root `requirement.txt`, unused `src/pages/*`
- [x] Bump `pillow` / `psycopg2-binary` so `pip install` works on Python 3.13
- [x] Fix the README env instructions (and convert the README from UTF-16 to UTF-8)
- Deferred to Phase 4: stop committing `db.sqlite3` (the README relies on it for demo data; prod uses Postgres)

## Phase 1: Frontend and backend connected, core flows working
- [ ] Frontend API URL from `REACT_APP_API_URL` instead of the hardcoded `127.0.0.1:8000`
- [ ] Fix the crash bug: `@property @property` on `Booking.duration_hours` / `is_overdue`
- [ ] Make sure every user gets a Wallet (signal on user create); booking `complete` needs it
- [ ] JWT refresh: an axios interceptor that refreshes on 401, so users aren't logged out after 60 min
- [ ] End-to-end test: register → login → list item → browse/search → book → owner accepts → activate → complete
- [ ] Add the missing `activateBooking` to api.js and an "Activate/Picked up" button in the profile
- [ ] Home page stats from the API instead of hardcoded 12 / 95kg / $2,400
- [ ] Item photo upload (Cloudinary is configured; check the item form actually sends images)

## Phase 2: Stripe payments (the real thing)
Payments today are **fake**: `PaymentForm.jsx` sleeps for 800 ms and calls it paid. The backend endpoint trusts whatever amount the client sends and doesn't require login.
- [ ] Backend: `Payment` model (booking, intent id, type rental/deposit, amount, status)
- [ ] `POST /api/payments/create-intent/` takes a **booking_id**, computes the amount server-side, requires auth, uses `settings.STRIPE_SECRET_KEY`
- [ ] New flow: create booking (`pending_payment`) → create PaymentIntent → `stripe.confirmCardPayment` in the frontend → webhook marks the booking paid
- [ ] Deposit as a separate PaymentIntent with `capture_method=manual` (a hold). Release it on complete, capture it on damage. **Limit:** card holds expire after about 7 days, so longer rentals need a different approach
- [ ] `POST /api/payments/webhook/` with signature verification (`STRIPE_WEBHOOK_SECRET`), events `payment_intent.succeeded` / `payment_failed` / `canceled`
- [ ] Refund on cancel/reject; auto-cancel the hold if the owner rejects
- [ ] Test with the Stripe CLI (`stripe listen --forward-to localhost:8000/api/payments/webhook/`) and test cards
- [ ] **Decision needed: owner payouts.** Paying owners real money requires Stripe Connect (Express accounts, onboarding, `transfer_data`). Without it, the owner's "wallet balance" is just a number and you pay owners by hand

## Phase 3: Finish the half-built features
- [ ] Reviews API (the model exists, `urls.py` is empty) and UI on item detail
- [ ] Rewards/wallet API (the model exists, no endpoints) and the profile display
- [ ] Booking emails (request, accepted, reminder) via a real SMTP provider
- [ ] Basic backend tests for booking + payment + webhook

## Phase 4: Production hardening
- [ ] `DEBUG=False`, real `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, secure cookies, HTTPS redirect
- [ ] Postgres via `DATABASE_URL`
- [ ] Rate-limit auth endpoints, trim `requirements.txt` (ipython etc. aren't needed in prod)
- [ ] Terms of Service and a Privacy page (Stripe requires these for live mode)

## Phase 5: Deploy (when you say go)
- [ ] Backend: Render/Railway (gunicorn + whitenoise already present) + managed Postgres
- [ ] Frontend: Vercel/Netlify with `REACT_APP_API_URL` and `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- [ ] Stripe live keys + live webhook endpoint, a custom domain, smoke test with a real $1 booking
