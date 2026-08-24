# SecureDrop

**Secure File Sharing with Hybrid Cryptography**

SecureDrop is a secure file-sharing web application engineered to protect files and cryptographic keys using a hybrid cryptosystem combining symmetric encryption (AES), asymmetric encryption (RSA), and cryptographic hashing (SHA-256).

---

## Current Status: Phase 1 — Completed

### ✅ Completed in Phase 1
- **Decoupled Architecture:** Clean separation between `frontend/` (React + Vite + Tailwind CSS) and `backend/` (FastAPI + Uvicorn + Pydantic Settings).
- **Frontend Routing & UI:** Navigation bar, footer, landing page, login page, registration page, dashboard, send file page, files vault, and profile page.
- **Supabase Authentication:** Official `@supabase/supabase-js` client, registration with user metadata, login, logout, session persistence across reloads, and route guards (`ProtectedRoute`, `GuestRoute`).
- **Backend Health & CORS:** FastAPI backend serving `/api/health` and `/api/v1/health` with environment-driven CORS configuration (`ALLOWED_ORIGINS`).
- **Environment & Security Hygiene:** Zero hardcoded secrets, complete `.env` / `.gitignore` separation, and environment-driven API URLs (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **One-Click Launcher:** Windows [start.bat](file:///c:/Project/SecureDrop/start.bat) to launch both services and open the browser automatically.

### ⏳ Not Yet Implemented (Future Phases)
- File sharing logic and database application tables
- Client-side symmetric encryption (AES-256-GCM)
- Asymmetric key generation and key protection (RSA-4096 / RSA-OAEP)
- File integrity verification checksums (SHA-256)
- Encrypted file storage integration (Supabase Storage)

---

## Technology Stack

### Frontend
- **Framework:** React 18
- **Tooling & Bundler:** Vite
- **Routing:** React Router DOM (v7)
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth (`@supabase/supabase-js`)
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.13+)
- **ASGI Server:** Uvicorn
- **Configuration & Validation:** Pydantic / Pydantic Settings
- **Environment Management:** python-dotenv

### Deployment Architecture
- **Frontend:** Vercel
- **Backend:** Render
- **Database & Auth:** Supabase (Auth + PostgreSQL)
- **Storage:** Supabase Storage

---

## Project Structure

```text
SecureDrop/
├── .gitignore               # Root git ignore (protects secrets, venvs, & node_modules)
├── README.md                # Project documentation
├── start.bat                # Windows one-click development launcher
│
├── frontend/                # React + Vite + Tailwind CSS Frontend
│   ├── public/              # Static assets & icons (shield.svg)
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, Footer, Button, Input, Card, StatusBadge, etc.)
│   │   ├── context/         # AuthContext with Supabase session management
│   │   ├── lib/             # Supabase client configuration (supabase.js)
│   │   ├── pages/           # LandingPage, LoginPage, RegisterPage, DashboardPage, SendFilePage, FilesPage, ProfilePage
│   │   ├── services/        # Backend API communication client (api.js)
│   │   ├── App.jsx          # Application root with Protected & Guest routes
│   │   ├── main.jsx         # React DOM entry point
│   │   └── index.css        # Tailwind CSS directives & custom styling
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite build & dev configuration
│   ├── .env.example         # Template for frontend environment variables
│   └── .env                 # Local frontend environment file (gitignored)
│
└── backend/                 # FastAPI Python Backend
    ├── app/
    │   ├── __init__.py      # App package metadata
    │   ├── main.py          # FastAPI application & CORS initialization
    │   ├── api/
    │   │   ├── __init__.py
    │   │   ├── router.py    # Central API router
    │   │   └── v1/
    │   │       ├── __init__.py
    │   │       └── endpoints/
    │   │           ├── __init__.py
    │   │           └── health.py # Health check endpoint (/api/health)
    │   ├── core/
    │   │   ├── __init__.py
    │   │   └── config.py    # Environment settings & CORS validation
    │   ├── models/          # Database models (PostgreSQL / Supabase preparation)
    │   │   └── __init__.py
    │   ├── schemas/         # Pydantic schemas (HealthResponse, etc.)
    │   │   ├── __init__.py
    │   │   └── health.py
    │   └── services/        # Business logic services
    │       └── __init__.py
    ├── requirements.txt     # Backend Python dependencies
    ├── .env.example         # Template for backend environment variables
    └── .env                 # Local backend environment file (gitignored)
```

---

## Quick Start (Windows)

Simply double-click:
```cmd
start.bat
```
This will check dependencies, launch both backend and frontend servers, and open `http://localhost:5173` in your default browser.

---

## Manual Local Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Health Check: `http://localhost:8000/api/health`
- Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the service | `"SecureDrop API"` |
| `ENVIRONMENT` | Environment type (`development` / `production`) | `"development"` |
| `DEBUG` | Debug mode enabled / disabled | `True` |
| `HOST` | Server bind host | `"0.0.0.0"` |
| `PORT` | Server bind port | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `"http://localhost:5173,http://127.0.0.1:5173"` |

### Frontend (`frontend/.env`)
| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend FastAPI service | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `your-anon-key` |
