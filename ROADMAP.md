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
- [x] Frontend API URL from `REACT_APP_API_URL` (+ `cuserents-frontend/.env.example`)
- [x] Fix crash bug: `@property @property` on `Booking.duration_hours` / `is_overdue`
- [x] Every user gets a Wallet (post_save signal + backfill migration); booking `complete` needs it
- [x] JWT refresh on 401 + `token_blacklist` app so logout/rotation actually work
- [x] Fix pricing bug: daily rate was prorated per hour (2h of a $20/day item cost $1.67), now per started day; frontend mirrors it
- [x] Fix same-day bookings rejected as "in the past" (date-only input parsed as UTC midnight); now date + time picker
- [x] Fix search box losing focus on every keystroke
- [x] "My Listings" uses `?mine=true` instead of filtering the first 20 items client-side
- [x] Mark Picked Up / Mark Returned buttons (activate / complete)
- [x] Home stats from `/api/items/items/stats/`
- [x] SQLite path no longer depends on the folder you start the server from
- [x] App no longer crashes when Stripe.js is blocked
- [x] Backend test for the full lifecycle + daily-rate pricing (`python manage.py test bookings`)
- Moved to Phase 3: item photo upload (the UI shows category icons, never `photo_url`, so upload needs a display change too)
- Known: without `GOOGLE_MAPS_API_KEY` addresses aren't geocoded; the list form falls back to downtown Syracuse coordinates

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
- [ ] Item photos: upload to Cloudinary and show them on cards/detail
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
