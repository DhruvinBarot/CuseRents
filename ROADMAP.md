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

## Phase 2: Stripe payments with Connect
- [x] Owners onboard to Stripe Connect (Profile → Set Up Payouts); accounts created via Accounts v2 because Stripe rejects v1 `type=express` for new platforms
- [x] Booking starts as `awaiting_payment`; hidden from the owner until the card is authorized
- [x] One PaymentIntent per booking: rental + deposit, `capture_method=manual`, destination charge to the owner, platform fee on the rental (`PLATFORM_FEE_PERCENT`, default 10)
- [x] Amount computed server-side from the booking; only the booking's renter can pay; status re-checked with Stripe, never trusted from the browser
- [x] Owner reject → authorization cancelled; return → rental captured, deposit released; damage → rental + deposit captured; failed capture leaves the booking active
- [x] Webhook with signature verification as backup for confirm
- [x] Rentals limited to end within 6 days (authorization lifetime)
- [x] Owner wallet no longer credited with fake balance (real money goes through Stripe)
- [x] Tests with Stripe mocked (`python manage.py test`)
- [ ] **You:** end-to-end run in test mode with real test keys + `stripe listen`
- Known: unpaid bookings don't hold the time slot (two renters could race); renter can't cancel their own booking yet (Phase 3)

## Phase 3: Finish the half-built features
- [x] Item photos: upload to Cloudinary (`/api/items/items/upload-photo/`, images only, 5 MB max), shown on cards and detail; dead placeholder URLs cleared
- [x] Reviews API (`/api/reviews/`): renter reviews item + owner, owner reviews renter, completed rentals only, once each, +50 points; shown on item detail
- [x] Fix review ratings being counted again on every save
- [x] Renter can cancel before pickup (card hold released, owner emailed)
- [x] Booking emails: new request (owner), accepted / declined / receipt (renter), cancelled (owner). Never block the booking action if mail fails
- [x] Profile shows rewards tier; points/CO2 refresh on profile open
- [x] Tests (`python manage.py test`, 15 total)
- Skipped: points redemption (wallet credit can't be spent at checkout yet), reminder emails (need a scheduler), video reviews
- **You:** set `CLOUDINARY_*` in `.env` for photo uploads; real SMTP settings come with deploy (Phase 5)

## Phase 4: Production hardening
- [x] `DEBUG` defaults to False; server refuses to start in production without a long random `SECRET_KEY`
- [x] Production-only: HTTPS redirect, secure cookies, HSTS (1h to start), proxy SSL header, nosniff, frame DENY; `CSRF_TRUSTED_ORIGINS` from env; browsable API only in DEBUG (`manage.py check --deploy` clean apart from HSTS subdomain/preload, which wait for a real domain)
- [x] Login/register rate limited (10/min per IP, `AUTH_THROTTLE_RATE`)
- [x] Removed 5 unused duplicate auth routes (simplejwt obtain/verify, dj-rest-auth, allauth Google, api-auth) that bypassed the limit
- [x] Requirements trimmed 53 → 35 (ipython, django-extensions etc.); verified with a clean install + full test run
- [x] `db.sqlite3` no longer tracked (gitignored); fresh setup = `migrate` + `createsuperuser`
- [x] Frontend: stateful views moved out of `App` so they stop remounting (root cause of the profile loop; booking form no longer resets when the login popup opens)
- [x] Booking buttons disabled while a request runs (double "Mark Returned" click hit Stripe twice)
- [x] Draft Terms of Service + Privacy Policy pages, linked in the footer (**have them reviewed before live mode**)
- [x] 19 backend tests
- Postgres: already supported via `DATABASE_URL` (psycopg2 installed); set up in Phase 5
- Note: old copies of `db.sqlite3` (demo data only, from before testing) remain in git history

## Phase 5: Deploy
- [x] `render.yaml` Blueprint (API + free Postgres), `build.sh` (install, collectstatic, migrate, first admin from env), Python 3.13 pin
- [x] Backend trusts its own Render hostname automatically (`RENDER_EXTERNAL_HOSTNAME`)
- [x] `DEPLOY.md`: step-by-step Render + Vercel + Stripe webhook
- [ ] **You:** create Render + Vercel accounts and follow `DEPLOY.md`
- [ ] Smoke test on the deployed URLs
- [ ] Before real money: Terms review, SMTP, Stripe live keys + live webhook, paid Render plans, optional custom domain
