# SecureDrop

**Secure File Sharing with Hybrid Cryptography**

SecureDrop is a secure file-sharing web application engineered to protect files and cryptographic keys using a hybrid cryptosystem combining symmetric encryption (AES), asymmetric encryption (RSA), and cryptographic hashing (SHA-256).

> [!NOTE]
> **Current Status: Phase 1 — Project Foundation & Architecture**
> Phase 1 currently contains only the decoupled project foundation, initial configuration management, basic health-check API endpoints, and development connectivity setup.
> 
> *Encryption algorithms (AES, RSA), file upload/download, integrity checking (SHA-256), and user authentication will be implemented in subsequent phases.*

---

## Technology Stack

### Frontend
- **Framework:** React 18
- **Tooling & Bundler:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.13+)
- **ASGI Server:** Uvicorn
- **Configuration & Validation:** Pydantic / Pydantic Settings
- **Environment Management:** python-dotenv

### Future Infrastructure & Architecture
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** Supabase PostgreSQL
- **Encrypted File Storage:** Supabase Storage
- **Cryptosystem:** AES-256, RSA-4096 / 2048, SHA-256

---

## Project Structure

```text
SecureDrop/
├── .gitignore               # Root git ignore (prevents secret leaks & build artifacts)
├── README.md                # Project documentation
│
├── frontend/                # React + Vite + Tailwind CSS Frontend
│   ├── public/              # Static assets & icons
│   │   └── shield.svg
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, HealthBadge, etc.)
│   │   ├── pages/           # Application views (LandingPage)
│   │   ├── services/        # API communication client
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Tailwind CSS imports & styles
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite build & dev configuration
│   ├── .env.example         # Template for frontend environment variables
│   └── .env                 # Local frontend environment file
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
    └── .env                 # Local backend environment file
```

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Python**: 3.10+ (tested on Python 3.13)
- **Git**

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Verify the health check endpoint:
   - Endpoint: `http://localhost:8000/api/health`
   - Interactive Swagger Docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Access the application in your browser at `http://localhost:5173`.

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

---

## Current Limitations & Roadmap

- **Phase 1 (Current):** Clean architectural foundation, modular folder structure, environment variable handling, CORS configuration, and decoupled health check connectivity.
- **Phase 2 (Upcoming):** Database integration with Supabase / PostgreSQL and user authentication.
- **Phase 3 (Upcoming):** Asymmetric key generation (RSA) and key exchange management.
- **Phase 4 (Upcoming):** Client-side symmetric file encryption (AES), file integrity validation (SHA-256), and secure chunked storage.
