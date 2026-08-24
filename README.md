# 🛡️ SecureDrop

<div align="center">

![SecureDrop Banner](frontend/public/shield.svg)

### **Zero-Knowledge File Sharing with End-to-End Hybrid Cryptography**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Web Crypto API](https://img.shields.io/badge/Web_Crypto_API-W3C_Standard-4F46E5?style=for-the-badge&logo=w3c&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Build Status](https://img.shields.io/badge/Build-Passing-10B981?style=for-the-badge)](https://github.com/ayush21-r/SecureDrop)

<p align="center">
  <b>SecureDrop</b> is an enterprise-grade, peer-to-peer secure file exchange platform designed with zero-knowledge hybrid cryptography. Files are encrypted directly inside the sender's browser using <b>AES-GCM-256</b>, encapsulated with the recipient's <b>RSA-OAEP-2048</b> public key, and stored exclusively as encrypted ciphertext. Private keys and decrypted plaintext never touch intermediate servers or databases.
</p>

[Quick Start](#-quick-start) • [Architecture](#-cryptographic-architecture) • [Security Model](#-zero-knowledge-security-guarantees) • [Project Structure](#-project-directory-tree) • [Setup Guide](#-installation--local-setup)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Cryptographic Architecture](#-cryptographic-architecture)
  - [1. File Transmission (Sender Encryption)](#1-file-transmission-sender-encryption)
  - [2. File Retrieval (Recipient Decryption)](#2-file-retrieval-recipient-decryption)
  - [3. Key Isolation & Storage](#3-key-isolation--storage)
- [Technology Stack](#-technology-stack)
- [Project Directory Tree](#-project-directory-tree)
- [Installation & Local Setup](#-installation--local-setup)
  - [One-Click Windows Launcher](#1-one-click-windows-launcher)
  - [Manual Frontend Setup](#2-frontend-setup)
  - [Manual Backend Setup](#3-backend-setup)
  - [Supabase Database Setup](#4-database-migrations)
- [Environment Configuration](#-environment-configuration)
- [Zero-Knowledge Security Guarantees](#-zero-knowledge-security-guarantees)
- [Production UI Highlights](#-production-ui-highlights)
- [License](#-license)

---

## 🌟 Overview

Traditional cloud file sharing exposes sensitive files and documents to cloud providers, third-party operators, and storage breaches. **SecureDrop** solves this by implementing an in-browser hybrid cryptosystem where:

1. **Every file gets a unique symmetric session key:** Encrypted in client RAM using native **AES-GCM-256** with an authenticated initialization vector (IV).
2. **Asymmetric Key Encapsulation:** The random AES session key is encrypted with the recipient's **RSA-OAEP-2048** public key.
3. **Local Private Key Vault:** The recipient's RSA private key is generated locally and isolated in browser **IndexedDB**. It never leaves the client device.
4. **Cloud Vault Isolation:** Supabase Storage receives only scrambled `.enc` ciphertext bytes.

---

## ✨ Key Features

- 🔐 **End-to-End Hybrid Encryption:** AES-256-GCM symmetric payload protection combined with RSA-OAEP-2048 asymmetric key distribution.
- 🔑 **Browser-Native Web Crypto API:** Zero third-party crypto bloat; utilizes native browser hardware-accelerated cryptographic primitives (`window.crypto.subtle`).
- 🛡️ **Zero-Knowledge Key Storage:** Private keys are persisted exclusively in IndexedDB (`SecureDropKeyStore`) on the user's local device.
- ⚡ **Real-Time Dynamic Dashboard:** Displays actual live transfer counters, dynamic storage usage calculation, and cryptographic identity status with zero dummy or hardcoded values.
- 👥 **Authenticated Recipient Directory:** Secure RPC function (`get_receivers()`) listing registered users without compromising table-level Row-Level Security.
- 📂 **Dual-Vault File Manager:** Tabbed view for sent and received transfers with real-time `Decrypt & Download` actions, cipher badges, and status tracking.
- 🧪 **Built-in Cryptographic Self-Test:** In-app verification suite on the Profile page that executes live encryption/decryption loops to confirm browser crypto health.
- 👁️ **Accessible Security UI:** Password visibility reveal toggles on Login and Register, keyboard navigation support, and full responsiveness across mobile (320px) to ultra-wide displays (1920px).

---

## 🔒 Cryptographic Architecture

### Hybrid Encryption Lifecycle

```
=========================================================================================
                           SECUREDROP CRYPTOGRAPHIC LIFECYCLE
=========================================================================================

 [ SENDER: In-Browser Client ]
   1. Select File (Plaintext Blob)
   2. Generate 256-bit AES-GCM session key + 12-byte IV
   3. Encrypt File with AES-GCM-256  ──────────────────────────┐
   4. Fetch Recipient's RSA-OAEP-2048 Public Key                │
   5. Encrypt AES Key with Recipient's Public Key               │
                                                                ▼
   [ SUPABASE CLOUD VAULT ]                     [ Encrypted Ciphertext (.enc) ]
   - Storage: secure-files/<sender_id>/<file>.enc               │
   - Database: public.files metadata record                     │
     (encrypted_key, iv, content_type, file_size)               │
                                                                │
                                                                ▼
 [ RECIPIENT: In-Browser Client ]                               │
   1. Open "My Files" & click "Decrypt & Download"              │
   2. Download Ciphertext (.enc) ◄──────────────────────────────┘
   3. Retrieve Local RSA Private Key from Browser IndexedDB
   4. Decrypt encrypted_key with RSA-OAEP-2048 ───► Recovers AES Key
   5. Decrypt Ciphertext with AES-GCM-256 + IV ────► Recovers Plaintext Blob
   6. Trigger Browser Download with Original Filename (e.g. document.pdf)
=========================================================================================
```

### 1. File Transmission (Sender Encryption)
1. Sender selects a file and an authenticated recipient from the directory.
2. The browser generates a cryptographically secure random 256-bit symmetric key (`generateAESGCMKey`) and a 12-byte initialization vector (`generateRandomIV`).
3. The plaintext buffer is encrypted using `AES-GCM` via `window.crypto.subtle.encrypt`.
4. The recipient's registered public key (SPKI PEM) is fetched and imported into a `CryptoKey`.
5. The raw AES session key is encapsulated with `RSA-OAEP` (SHA-256).
6. The ciphertext is uploaded as a private `.enc` object into the Supabase `secure-files` bucket under the sender's UUID path.
7. File metadata, Base64-encoded `encrypted_key`, Base64-encoded `iv`, and original file details are recorded in `public.files`.

### 2. File Retrieval (Recipient Decryption)
1. Recipient navigates to **My Files &rarr; Received Files**.
2. Clicking **Decrypt & Download** initiates the zero-knowledge recovery process.
3. The local RSA private key is loaded directly from browser IndexedDB (`SecureDropKeyStore`).
4. The encrypted `.enc` payload is downloaded from the private storage vault.
5. The session key is decrypted with `window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedKeyBuffer)`.
6. The ciphertext is decrypted with `window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertextBuffer)`.
7. An in-memory `Blob` is constructed with the original MIME `content_type` and downloaded with the exact `original_filename`.

### 3. Key Isolation & Storage
| Key Type | Algorithm | Storage Location | Accessibility |
| :--- | :--- | :--- | :--- |
| **User RSA Private Key** | RSA-OAEP-2048 (SHA-256) | Browser IndexedDB (`SecureDropKeyStore`) | Client-side only. Non-exportable, zero network transmission. |
| **User RSA Public Key** | RSA-OAEP-2048 (SPKI PEM) | Supabase (`public.user_public_keys`) | Authenticated public directory for recipient key lookup. |
| **File Session Key** | AES-GCM 256-bit | Encapsulated in `public.files.encrypted_key` | Only decryptable by recipient's private key. |
| **File IV (Nonce)** | 96-bit (12 bytes) | Stored in `public.files.iv` | Public parameter required for AES-GCM decryption. |

---

## 💻 Technology Stack

### Frontend Architecture
- **Framework:** React 18.3.1 (Single-Page Application)
- **Build Tooling:** Vite 6.4.3
- **Routing:** React Router DOM v7 (featuring `ProtectedRoute` and `GuestRoute` wrappers)
- **Styling:** Tailwind CSS 3.4.17 with custom security glassmorphism theme
- **Icons:** Lucide React
- **Cryptography Engine:** Browser Web Crypto API (`window.crypto.subtle`)
- **Key Store:** Native HTML5 IndexedDB API

### Backend Architecture
- **Framework:** FastAPI 0.115.0 (Asynchronous Python 3.13+)
- **Server:** Uvicorn ASGI Server
- **Settings & Validation:** Pydantic v2 & Pydantic Settings
- **Environment Management:** python-dotenv

### Database, Auth & Storage
- **Identity Provider:** Supabase Auth (JWT session management & token persistence)
- **Database Engine:** PostgreSQL with Row-Level Security (RLS)
- **Database Functions:** PostgreSQL `SECURITY DEFINER` RPCs (`get_receivers()`, `get_user_files()`)
- **Cloud Vault:** Supabase Private Storage (`secure-files` bucket with strict RLS policies)

---

## 📁 Project Directory Tree

```text
SecureDrop/
├── .gitignore                          # Root git ignore (protects secrets, venvs, & node_modules)
├── README.md                           # Comprehensive documentation & architecture guide
├── start.bat                           # Windows one-click development launcher
│
├── frontend/                           # React 18 + Vite + Tailwind CSS Client
│   ├── public/                         # Static assets & emblems
│   │   └── shield.svg                  # Brand favicon & security emblem
│   ├── src/                            # Frontend source application
│   │   ├── components/                 # Reusable UI component library
│   │   │   ├── Button.jsx              # Button with loading states, variants & icons
│   │   │   ├── Card.jsx                # Glassmorphic container with action headers
│   │   │   ├── EmptyState.jsx          # Zero-data state with action buttons
│   │   │   ├── Footer.jsx              # Application footer with security status
│   │   │   ├── GuestRoute.jsx          # Route guard for unauthenticated pages
│   │   │   ├── HealthBadge.jsx         # Backend API connection badge
│   │   │   ├── Input.jsx               # Form input with adornments & error feedback
│   │   │   ├── LoadingScreen.jsx       # Full-screen session verification loader
│   │   │   ├── Navbar.jsx              # Responsive header navigation & mobile drawer
│   │   │   ├── PageHeader.jsx          # Page header with description & action buttons
│   │   │   ├── ProtectedRoute.jsx      # Route guard for authenticated pages
│   │   │   └── StatusBadge.jsx         # Status pill badge (active, ready, error, pending)
│   │   ├── context/                    # React Context providers
│   │   │   └── AuthContext.jsx         # Supabase Auth provider (login, signup, session)
│   │   ├── lib/                        # Client libraries & SDK initializers
│   │   │   └── supabase.js             # Initialized Supabase client instance
│   │   ├── pages/                      # Application route pages
│   │   │   ├── DashboardPage.jsx       # Live transfer metrics, storage usage & recent activity
│   │   │   ├── FilesPage.jsx           # Received & Sent vaults with Decrypt & Download
│   │   │   ├── LandingPage.jsx         # Public landing page with security overview
│   │   │   ├── LoginPage.jsx           # Sign-in form with show/hide password toggle
│   │   │   ├── ProfilePage.jsx         # Account details, RSA public key & crypto self-test
│   │   │   ├── RegisterPage.jsx        # User signup with password validation
│   │   │   └── SendFilePage.jsx        # File upload & hybrid encryption pipeline
│   │   ├── services/                   # Service layer
│   │   │   ├── api.js                  # Axios client for FastAPI backend communication
│   │   │   ├── cryptoService.js        # Web Crypto API engine (AES-GCM, RSA-OAEP, IndexedDB)
│   │   │   └── fileService.js          # File transmission, vault download & metadata persistence
│   │   ├── App.jsx                     # Application router configuration
│   │   ├── index.css                   # Global Tailwind CSS directives & custom styling
│   │   └── main.jsx                    # React DOM entry point
│   ├── index.html                      # HTML5 template entry point
│   ├── package-lock.json               # Locked frontend dependency tree
│   ├── package.json                    # Frontend package dependencies & npm scripts
│   ├── postcss.config.js               # PostCSS configuration
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── vite.config.js                  # Vite bundler & development configuration
│   ├── .env.example                    # Template for frontend environment variables
│   └── .env                            # Local frontend environment secrets (gitignored)
│
└── backend/                            # FastAPI Python Backend
    ├── app/                            # Application package
    │   ├── __init__.py                 # Package initialization
    │   ├── main.py                     # FastAPI application setup, CORS & health routes
    │   ├── api/                        # API routes
    │   │   ├── __init__.py
    │   │   ├── router.py               # Aggregated API router
    │   │   └── v1/
    │   │       ├── __init__.py
    │   │       └── endpoints/
    │   │           ├── __init__.py
    │   │           └── health.py       # GET /api/health endpoint
    │   ├── core/                       # Core configuration
    │   │   ├── __init__.py
    │   │   └── config.py               # Pydantic Settings & environment variables
    │   ├── models/                     # Database models
    │   │   └── __init__.py
    │   ├── schemas/                    # Pydantic validation schemas
    │   │   ├── __init__.py
    │   │   └── health.py               # HealthResponse model definition
    │   └── services/                   # Business logic services
    │       └── __init__.py
    ├── sql/                            # PostgreSQL database migrations
    │   ├── get_receivers.sql           # Secure recipient directory RPC
    │   ├── get_user_files.sql          # Authenticated file query RPC
    │   ├── phase_3_2_encryption.sql    # Encryption columns migration for public.files
    │   └── user_public_keys.sql        # Table & RLS policies for RSA public keys
    ├── requirements.txt                # Backend Python dependencies
    ├── .env.example                    # Template for backend environment variables
    └── .env                            # Local backend environment secrets (gitignored)
```

---

## 🚀 Installation & Local Setup

### 1. One-Click Windows Launcher
If you are on Windows, simply double-click the included batch launcher:
```cmd
start.bat
```
This script will automatically:
- Verify and install Python and Node.js dependencies.
- Launch the FastAPI backend on `http://localhost:8000`.
- Launch the Vite React frontend on `http://localhost:5173`.
- Automatically open your default browser to the web app.

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase URL & Anon Key

# Start development server
npm run dev

# Run production build
npm run build
```

---

### 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env

# Start FastAPI server with live reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

### 4. Database Migrations

Execute the SQL scripts located in `backend/sql/` inside your **Supabase SQL Editor** in the following order:

1. **[user_public_keys.sql](backend/sql/user_public_keys.sql)**: Creates the table for RSA-OAEP public keys with RLS policies allowing authenticated users to register their public key and view others' public keys.
2. **[phase_3_2_encryption.sql](backend/sql/phase_3_2_encryption.sql)**: Adds `encrypted_key`, `iv`, `encryption_algorithm`, and `is_encrypted` columns to `public.files`.
3. **[get_receivers.sql](backend/sql/get_receivers.sql)**: Creates the `get_receivers()` RPC function for secure recipient selection.
4. **[get_user_files.sql](backend/sql/get_user_files.sql)**: Creates the `get_user_files()` RPC function to fetch a user's sent and received files with sender/receiver profile details.

---

## ⚙️ Environment Configuration

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend FastAPI service | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous API Key | `eyJhbGciOi...` |

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Service name | `"SecureDrop API"` |
| `ENVIRONMENT` | Runtime environment | `"development"` / `"production"` |
| `DEBUG` | Debug mode toggle | `True` |
| `HOST` | Server bind address | `"0.0.0.0"` |
| `PORT` | Server bind port | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `"http://localhost:5173,http://127.0.0.1:5173"` |

---

## 🛡️ Zero-Knowledge Security Guarantees

1. **Client-Side Cryptography:** No unencrypted data or plaintext file byte ever leaves the browser RAM.
2. **Device-Isolated Private Keys:** RSA private keys generated in the browser are marked `extractable: false` when used for decryption and are stored in client IndexedDB.
3. **Row-Level Security (RLS):** All database tables strictly enforce PostgreSQL policies ensuring users can only read files sent to them or uploaded by them.
4. **Storage Bucket Privacy:** The Supabase Storage bucket `secure-files` is marked **Private**. Unauthorized users cannot read or download raw `.enc` objects.
5. **No Password Stored on Custom Servers:** All authentication is delegated to Supabase Auth with bcrypt/Argon2 hashing.

---

## 🖥️ Production UI Highlights

- **Dashboard:** Zero dummy data. Live metric cards displaying actual transferred files, computed vault storage volume, and RSA key status.
- **Show/Hide Password:** Accessible toggles with `Eye` / `EyeOff` icons on both Login and Register forms.
- **My Files Dual Vault:** Filterable and searchable tabs for **Received Files** and **Sent Files** with instant `Decrypt & Download` actions.
- **Cryptographic Self-Test:** Live Web Crypto self-test directly in the user profile to verify local key pair functionality.
- **Full Responsive Reflow:** Flawless rendering from 320px smartphones to 1920px widescreen monitors with zero horizontal overflow.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>SecureDrop</b> — Engineered for Privacy. Powered by Hybrid Cryptography.
</div>
