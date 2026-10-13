
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

# 5. Run migrations (database already exists, but just in case)
python manage.py migrate

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
| `POST` | `/api/items/items/`                          | List a new item                     |
| `GET`  | `/api/bookings/bookings/`                    | Your bookings (as renter or owner)  |
| `POST` | `/api/bookings/bookings/`                    | Request a booking                   |
| `POST` | `/api/bookings/bookings/{id}/accept/`        | Owner accepts (also `reject`)       |
| `POST` | `/api/bookings/bookings/{id}/activate/`      | Pickup confirmed                    |
| `POST` | `/api/bookings/bookings/{id}/complete/`      | Return confirmed, rewards credited  |

Run backend tests: `python manage.py test`

---

## 🔬 Testing Stripe (Sandbox)

Use Stripe test credentials:

```
4242 4242 4242 4242
Exp: any future date
CVC: any 3 digits
ZIP: any 5 digits
```

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

