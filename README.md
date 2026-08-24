# SecureDrop

**Secure File Sharing with Hybrid Cryptography (AES-256-GCM + RSA-OAEP-2048)**

SecureDrop is a modern cybersecurity web application engineered to protect files and cryptographic session keys using a client-side hybrid cryptosystem combining symmetric encryption (**AES-GCM-256**), asymmetric key encapsulation (**RSA-OAEP-2048**), and cryptographic hashing (**SHA-256**).

---

## 🔒 Security Architecture & Features

- **Hybrid Cryptography Pipeline:**
  - **Payload Encryption:** Every file is encrypted client-side in the browser using a cryptographically unique 256-bit AES-GCM key and 12-byte IV.
  - **Key Encapsulation:** The raw AES session key is encapsulated using the recipient's registered RSA-OAEP 2048-bit public key.
  - **Zero-Knowledge Decryption:** The receiver decrypts the session key using their local RSA private key isolated in browser **IndexedDB**, decrypts the ciphertext in-memory, and downloads the original file.
  - **Plaintext Isolation:** Plaintext file data and private keys NEVER touch the network, database, or server storage.
- **Client-Side Private Key Isolation:** RSA private keys are stored exclusively in browser IndexedDB (`SecureDropKeyStore`) on the user's device and are never transmitted over the network.
- **Authenticated Access Control:** Governed strictly by Supabase PostgreSQL Row-Level Security (RLS) and private Supabase Storage bucket access policies.
- **Production Dashboard:** Live transfer metrics, dynamic storage volume calculation, public key registration status, and recent activity logs with zero hardcoded dummy data.
- **Accessible UI:** Complete show/hide password visibility, responsive layouts from 320px mobile to 1920px desktop viewports, and interactive cryptographic self-tests.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 18
- **Tooling & Bundler:** Vite
- **Routing:** React Router DOM (v7)
- **Styling:** Tailwind CSS
- **Authentication & Database:** Supabase (`@supabase/supabase-js`)
- **Cryptography:** Native Browser Web Crypto API (`window.crypto.subtle`)
- **Local Key Vault:** Browser IndexedDB
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.13+)
- **ASGI Server:** Uvicorn
- **Configuration & Validation:** Pydantic / Pydantic Settings
- **Environment Management:** python-dotenv

### Database & Storage (Supabase)
- **Authentication:** Supabase Auth (JWT)
- **Relational Tables:** `public.profiles`, `public.files`, `public.user_public_keys`
- **Database Functions:** `get_receivers()`, `get_user_files()` (PostgreSQL `SECURITY DEFINER` RPCs)
- **Storage:** Private `secure-files` bucket with path-based RLS (`<sender_id>/<file>.enc`)

---

## 📁 Project Directory Tree

```text
SecureDrop/
├── .gitignore                          # Root git ignore (protects environment files, venvs, & node_modules)
├── README.md                           # Project documentation & architecture overview
├── start.bat                           # Windows one-click launcher for backend & frontend
│
├── frontend/                           # React 18 + Vite + Tailwind CSS Frontend
│   ├── public/                         # Static assets & icons
│   │   └── shield.svg                  # Brand favicon & security emblem
│   ├── src/                            # Application source code
│   │   ├── components/                 # Reusable UI component library
│   │   │   ├── Button.jsx              # Custom interactive button with loading & icon support
│   │   │   ├── Card.jsx                # Glassmorphic container card with header & action slots
│   │   │   ├── EmptyState.jsx          # Professional zero-data illustration & action prompt
│   │   │   ├── Footer.jsx              # Application footer with security status indicators
│   │   │   ├── GuestRoute.jsx          # Route guard redirecting authenticated users to dashboard
│   │   │   ├── HealthBadge.jsx         # Live backend & Supabase service health indicator
│   │   │   ├── Input.jsx               # Form input with icons, error states & end adornments
│   │   │   ├── LoadingScreen.jsx       # Full-screen session verification loader
│   │   │   ├── Navbar.jsx              # Responsive header navigation with mobile drawer
│   │   │   ├── PageHeader.jsx          # Standardized page title, description & action toolbar
│   │   │   ├── ProtectedRoute.jsx      # Route guard redirecting unauthenticated users to login
│   │   │   └── StatusBadge.jsx         # Status pill badge (active, ready, error, pending, verified)
│   │   ├── context/                    # React Context providers
│   │   │   └── AuthContext.jsx         # Supabase Auth provider (login, signup, logout, session)
│   │   ├── lib/                        # Third-party client instances
│   │   │   └── supabase.js             # Initialized Supabase client & environment configuration check
│   │   ├── pages/                      # Application route pages
│   │   │   ├── DashboardPage.jsx       # Real-time metrics, live transfer logs & security status
│   │   │   ├── FilesPage.jsx           # My Files vault (Received/Sent tabs, client-side decryption & download)
│   │   │   ├── LandingPage.jsx         # Public landing page with feature architecture & security cards
│   │   │   ├── LoginPage.jsx           # Sign-in form with email/password & show/hide password toggle
│   │   │   ├── ProfilePage.jsx         # User account details, RSA public key PEM & cryptographic self-test
│   │   │   ├── RegisterPage.jsx        # Registration form with password validation & visibility toggles
│   │   │   └── SendFilePage.jsx        # File upload, recipient picker & client-side hybrid encryption pipeline
│   │   ├── services/                   # Frontend service layer
│   │   │   ├── api.js                  # Axios client for backend API communication
│   │   │   ├── cryptoService.js        # Web Crypto API service (AES-GCM-256, RSA-OAEP-2048, IndexedDB)
│   │   │   └── fileService.js          # File transmission, storage upload/download & metadata persistence
│   │   ├── App.jsx                     # Root application router with protected/guest route configuration
│   │   ├── index.css                   # Global Tailwind CSS directives & theme styling
│   │   └── main.jsx                    # React DOM root entry point
│   ├── index.html                      # HTML5 template entry point
│   ├── package-lock.json               # Locked dependency tree
│   ├── package.json                    # Frontend dependencies & npm scripts
│   ├── postcss.config.js               # PostCSS plugins configuration
│   ├── tailwind.config.js              # Tailwind CSS utility & theme extensions
│   ├── vite.config.js                  # Vite bundler & development server configuration
│   ├── .env.example                    # Template for frontend environment variables
│   └── .env                            # Local frontend environment secrets (gitignored)
│
└── backend/                            # FastAPI Python Backend
    ├── app/                            # Application package
    │   ├── __init__.py                 # App package initialization
    │   ├── main.py                     # FastAPI application setup, CORS middleware & health routing
    │   ├── api/                        # API route layer
    │   │   ├── __init__.py             # API package initialization
    │   │   ├── router.py               # Aggregated API router
    │   │   └── v1/                     # Version 1 API endpoints
    │   │       ├── __init__.py         # V1 package initialization
    │   │       └── endpoints/          # Route handlers
    │   │           ├── __init__.py     # Endpoints package initialization
    │   │           └── health.py       # GET /api/health service check endpoint
    │   ├── core/                       # Core configuration & settings
    │   │   ├── __init__.py             # Core package initialization
    │   │   └── config.py               # Pydantic Settings & environment variables validation
    │   ├── models/                     # Database models package
    │   │   └── __init__.py             # Models package initialization
    │   ├── schemas/                    # Pydantic validation schemas
    │   │   ├── __init__.py             # Schemas package initialization
    │   └── services/                   # Backend business logic services
    │       └── __init__.py             # Services package initialization
    ├── sql/                            # Supabase PostgreSQL database migration scripts
    │   ├── get_receivers.sql           # RPC function for secure recipient listing
    │   ├── get_user_files.sql          # RPC function for authenticated file retrieval with profile joins
    │   ├── phase_3_2_encryption.sql    # Migration adding encryption metadata columns to public.files
    │   └── user_public_keys.sql        # Table & RLS policies for RSA public key distribution
    ├── requirements.txt                # Python backend dependencies
    ├── .env.example                    # Template for backend environment variables
    └── .env                            # Local backend environment secrets (gitignored)
```

---

## 🚀 Quick Start (Windows)

Simply double-click:
```cmd
start.bat
```
This script validates dependencies, starts both backend (FastAPI) and frontend (Vite) servers, and opens `http://localhost:5173` in your default browser.

---

## 💻 Manual Setup

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
- **Health Endpoint:** `http://localhost:8000/api/health`
- **Swagger Documentation:** `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- **Web Application:** `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the API service | `"SecureDrop API"` |
| `ENVIRONMENT` | Environment type (`development` / `production`) | `"development"` |
| `DEBUG` | Debug mode toggle | `True` |
| `HOST` | Server bind host | `"0.0.0.0"` |
| `PORT` | Server bind port | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `"http://localhost:5173,http://127.0.0.1:5173"` |

### Frontend (`frontend/.env`)
| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend FastAPI service | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `your-anon-key` |
