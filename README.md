
# 🏙️ CuseRents

A **micro-rental marketplace** connecting Syracuse neighbors to borrow and rent everyday items sustainably.

> Built with **Django REST Framework (backend)** and **React + JavaScript (frontend)**
> Payments via **Stripe**, authentication with **dj-rest-auth/allauth**, and smart distance filtering around Syracuse, NY.

---

## 🌟 Features

* 🔎 **Browse Nearby Items** by category, keyword, or distance
* 📦 **List Your Own Items** with pricing, deposits, and location
* 💳 **Stripe Payments** — hourly bookings with refundable deposits
* 👤 **User Profile**

  * View “My Listings” (edit/delete)
  * View “My Rentals” (status, duration, total, deposit)
* 🌱 **Rewards & Sustainability Metrics** (CO₂ saved, wallet balance, points)
* 🔐 Secure Login & Registration (dj-rest-auth + allauth)

---

## 🧱 Tech Stack

| Layer        | Technology                                                   |
| ------------ | ------------------------------------------------------------ |
| **Frontend** | React (JavaScript + CSS, Create React App)                   |
| **Backend**  | Django 5 + Django REST Framework                             |
| **Auth**     | dj-rest-auth, allauth                                        |
| **Database** | SQLite (dev) / PostgreSQL (prod)                             |
| **Payments** | Stripe Python SDK                                            |
| **Extras**   | django-cors-headers, Axios, React Context API, python-dotenv |

---

## 📁 Folder Structure

```
CUSERENTS-MAIN/
├── CuseRents-backend/        # Django backend
│   ├── bookings/             # Booking & rental logic
│   ├── items/                # Item listings & categories
│   ├── payments/             # Stripe payments integration
│   ├── reviews/              # User/item review system
│   ├── rewards/              # Points & sustainability data
│   ├── users/                # Authentication, profiles
│   ├── CuseRents/            # Project settings, URLs
│   ├── db.sqlite3            # Dev database
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.txt              # Environment variables (rename to .env)
│
└── cuserents-frontend/       # React frontend
    ├── public/
    ├── src/
    │   ├── App.js            # Main app views
    │   ├── components/       # UI components (modals, forms)
    │   ├── services/api.js   # REST API functions
    │   └── context/AuthContext.js
    ├── package.json
    └── package-lock.json
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/DhruvinBarot/CuseRents.git
cd CuseRents-main
```

---

### 2️⃣ Backend Setup (Django)

```bash
# 1. Navigate to backend folder
cd CuseRents-backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# For Windows:
venv\Scripts\activate
# For Mac/Linux:
source venv/bin/activate

# 4. Install all dependencies
pip install -r requirements.txt

# 5. Create the database (it is not in git) and an admin account
python manage.py migrate
python manage.py createsuperuser

# 6. Start the server
python manage.py runserver
```

Backend will start at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### 📋 Backend Dependencies

All backend dependencies are installed automatically from `requirements.txt`.

---

### 🧾 Backend `.env` File

Copy `.env.example` → `.env` (in `CuseRents-backend/`) and fill in your keys. `.env` is gitignored, never commit it.

---

### 3️⃣ Frontend Setup (React - CRA)

```bash
cd ../cuserents-frontend
npm install
npm start
```

Frontend runs on **[http://localhost:3000](http://localhost:3000)**

#### 🧾 Frontend `.env`

```
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## 🔗 API Endpoints (Backend)

| Method | Endpoint                                   | Description                         |
| ------ | -------------------------------------------- | ----------------------------------- |
| `POST` | `/api/users/auth/register/`                  | Register (returns JWT tokens)       |
| `POST` | `/api/users/auth/login/`                     | Login with username or email        |
| `GET`  | `/api/users/auth/me/`                        | Current user + wallet               |
| `POST` | `/api/token/refresh/`                        | Refresh access token                |
| `GET`  | `/api/items/items/search/?lat=&lng=&radius=` | Items near a location               |
| `GET`  | `/api/items/items/?mine=true`                | Your own listings                   |
| `GET`  | `/api/items/items/stats/`                    | Home page stats                     |
| `POST` | `/api/items/items/upload-photo/`             | Multipart `photo` → Cloudinary URL  |
| `GET`  | `/api/reviews/?item={id}`                    | Item reviews                        |
| `POST` | `/api/reviews/`                              | `{booking_id, stars, text}`         |
| `POST` | `/api/items/items/`                          | List a new item                     |
| `GET`  | `/api/bookings/bookings/`                    | Your bookings (as renter or owner)  |
| `POST` | `/api/bookings/bookings/`                    | Request a booking                   |
| `POST` | `/api/bookings/bookings/{id}/accept/`        | Owner accepts (also `reject`)       |
| `POST` | `/api/bookings/bookings/{id}/activate/`      | Pickup confirmed                    |
| `POST` | `/api/bookings/bookings/{id}/cancel/`        | Renter cancels, hold released       |
| `POST` | `/api/bookings/bookings/{id}/complete/`      | Return confirmed, captures payment (`damage_reported` also captures deposit) |
| `POST` | `/api/payments/create-intent/`               | `{booking_id}` → Stripe client secret |
| `POST` | `/api/payments/confirm/`                     | `{booking_id}` re-checks payment with Stripe |
| `POST` | `/api/payments/webhook/`                     | Stripe webhook (signature verified) |
| `POST` | `/api/payments/connect/onboard/`             | Owner payout onboarding link        |
| `GET`  | `/api/payments/connect/status/`              | Owner payout status                 |

Run backend tests: `python manage.py test`

---

## 🔬 Stripe Setup (test mode)

Payments use **Stripe Connect** (Accounts v2 with a full Stripe dashboard, Stripe-managed fees and losses; destination charges):
the renter's card is authorized at booking, the rental fee is captured when the owner marks the item returned
(the deposit hold is released, or captured if damage is reported), and Stripe pays the owner minus `PLATFORM_FEE_PERCENT`.

1. In the Stripe dashboard (test mode): enable **Connect** and copy your API keys
2. Backend `CuseRents-backend/.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
3. Frontend `cuserents-frontend/.env`: `REACT_APP_STRIPE_PUBLISHABLE_KEY` (restart `npm start` after editing)
4. Webhooks locally: `stripe listen --forward-to localhost:8000/api/payments/webhook/` and put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`
5. As an owner: Profile → **Set Up Payouts with Stripe** (in test mode use Stripe's test data, e.g. SSN `000-00-0000`, routing `110000000`, account `000123456789`)
6. As a renter: book with card `4242 4242 4242 4242`, any future date, any CVC/ZIP

Rentals must end within 6 days of booking (card authorizations expire after 7).

---

## 🧠 Common Issues

| Problem                       | Fix                                                           |
| ----------------------------- | ------------------------------------------------------------- |
| `ModuleNotFoundError: stripe` | Run `pip install stripe`                                      |
| CORS policy error             | Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `.env`    |
| 404 on `/`                    | Normal for API-only backend — use `/api/` routes              |

---

## 🛣️ Roadmap

* 📱 Responsive mobile layout
* 🗨️ Chat system between owners & renters
* ⭐ Ratings & reviews
* ☁️ Cloud image uploads
* 📊 Admin analytics dashboard
* 🧮 Advanced booking filters

---

## 📜 License

MIT © 2025 [Dhruvin Barot](https://github.com/DhruvinBarot)

