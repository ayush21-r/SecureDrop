@echo off
setlocal enabledelayedexpansion

title SecureDrop Launcher
echo ===================================================
echo               SecureDrop Launcher
echo ===================================================
echo.

:: Ensure working directory is the script location
cd /d "%~dp0"

:: 1. Verify Backend Prerequisites
echo [1/4] Checking backend environment...
if not exist "backend\.venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment not found at backend\.venv
    echo Please set up backend dependencies first:
    echo   cd backend
    echo   python -m venv .venv
    echo   .\.venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from template...
        copy "backend\.env.example" "backend\.env" >nul
    )
)

:: 2. Verify Frontend Prerequisites
echo [2/4] Checking frontend environment...
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found at frontend\node_modules
    echo Please install frontend dependencies first:
    echo   cd frontend
    echo   npm install
    echo.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        echo [INFO] Creating frontend\.env from template...
        copy "frontend\.env.example" "frontend\.env" >nul
    )
)

:: 3. Start Backend Service
echo [3/4] Starting SecureDrop Backend (FastAPI on port 8000)...
start "SecureDrop Backend (Port 8000)" cmd /k "cd /d ""%~dp0backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 4. Start Frontend Service
echo [4/4] Starting SecureDrop Frontend (Vite on port 5173)...
start "SecureDrop Frontend (Port 5173)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

:: 5. Wait for Frontend to become ready and launch browser
echo.
echo Waiting for SecureDrop web services to become ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue; if ($r.StatusCode -eq 200) { $ready = $true; break; } } catch {} Start-Sleep -Milliseconds 500 }; if ($ready) { Start-Process 'http://localhost:5173' } else { Start-Process 'http://localhost:5173' }"

echo.
echo ===================================================
echo SecureDrop is running!
echo.
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend API:      http://localhost:8000
echo  - API Docs:         http://localhost:8000/docs
echo  - Health Check:     http://localhost:8000/api/health
echo.
echo (Keep the opened backend and frontend windows running)
echo Press any key to close this launcher window...
echo ===================================================
pause >nul
