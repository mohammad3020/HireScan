@echo off
setlocal enableextensions enabledelayedexpansion
set "ROOT=%~dp0"
set "ERRORS=0"
set "MISSING_DEPS=0"

echo ========================================
echo  HireScan - Starting Backend and Frontend
echo ========================================
echo.

REM --------------------------------------------------
REM Dependency Check Phase
REM --------------------------------------------------
echo [Phase 1/3] Checking dependencies...
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10-3.13 and try again.
    set /a ERRORS+=1
    goto :dependency_error
) else (
    python --version
    echo   [OK] Python is installed
)

REM Check Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and try again.
    set /a ERRORS+=1
    goto :dependency_error
) else (
    node --version
    echo   [OK] Node.js is installed
)
echo.

REM Check Backend dependencies (if venv exists)
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    REM First verify Python in venv works
    "%ROOT%backend\venv\Scripts\python.exe" --version >nul 2>&1
    if not errorlevel 1 (
        echo [Backend] Checking installed packages...
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import django" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import rest_framework" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import rest_framework_simplejwt" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import corsheaders" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import django_filters" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import dotenv" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "from PIL import Image" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "import requests" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "from docx import Document" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        "%ROOT%backend\venv\Scripts\python.exe" -c "from pypdf import PdfReader" >nul 2>&1
        if errorlevel 1 set /a MISSING_DEPS+=1
        
        if !MISSING_DEPS! EQU 0 (
            echo   [OK] All backend dependencies are installed
        ) else (
            echo   [INFO] Some dependencies missing - will install automatically
        )
    ) else (
        echo   [WARNING] Virtual environment Python not working - will reinstall
        set /a MISSING_DEPS+=1
    )
) else (
    echo   [INFO] Virtual environment not found - will create and install
)
echo.

REM Check Frontend dependencies
if exist "%ROOT%frontend\node_modules" (
    if exist "%ROOT%frontend\node_modules\react" (
        if exist "%ROOT%frontend\node_modules\vite" (
            if exist "%ROOT%frontend\node_modules\@tanstack\react-query" (
                echo   [OK] Frontend dependencies appear to be installed
            ) else (
                echo   [INFO] Some frontend packages missing - will install
                set /a MISSING_DEPS+=1
            )
        ) else (
            echo   [INFO] Frontend dependencies missing - will install
            set /a MISSING_DEPS+=1
        )
    ) else (
        echo   [INFO] Frontend dependencies missing - will install
        set /a MISSING_DEPS+=1
    )
) else (
    echo   [INFO] Frontend dependencies missing - will install
    set /a MISSING_DEPS+=1
)
echo.

REM --------------------------------------------------
REM Setup Phase
REM --------------------------------------------------
echo [Phase 2/3] Setting up environment...
echo.
echo [Backend] Setting up backend environment...

REM Check/create virtual environment
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    echo [Backend] Virtual environment found.
) else (
    echo [Backend] Virtual environment not found, creating...
    python -m venv "%ROOT%backend\venv"
    if errorlevel 1 goto :backend_error
    echo [Backend] Virtual environment created successfully.
)

REM Install/upgrade pip
echo [Backend] Upgrading pip...
"%ROOT%backend\venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
if errorlevel 1 goto :backend_error

REM Install backend dependencies
echo [Backend] Installing Python dependencies...
"%ROOT%backend\venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt" --quiet
if errorlevel 1 goto :backend_error
echo [Backend] Dependencies installed successfully.

REM Check for .env file
if not exist "%ROOT%backend\.env" (
    echo.
    echo [Warning] .env file not found in backend directory.
    echo Please create backend\.env file with the following variables:
    echo   OPENROUTER_API_KEY=your_api_key_here
    echo   OPENROUTER_MODEL=google/gemini-2.5-pro
    echo   DJANGO_SECRET_KEY=your_secret_key_here
    echo   DJANGO_DEBUG=True
    echo   ALLOWED_HOSTS=localhost,127.0.0.1
    echo.
    echo Continuing without .env file (using defaults)...
    echo.
    timeout /t 3 /nobreak >nul
)

REM Run database migrations
echo [Backend] Running database migrations...
pushd "%ROOT%backend" >nul
"%ROOT%backend\venv\Scripts\python.exe" manage.py migrate --noinput
if errorlevel 1 (
    popd >nul
    echo [Warning] Database migrations failed. Continuing anyway...
) else (
    popd >nul
    echo [Backend] Database migrations completed.
)

REM --------------------------------------------------
REM Frontend setup
REM --------------------------------------------------
echo.
echo [Frontend] Setting up frontend environment...
echo [Frontend] Installing npm packages...
pushd "%ROOT%frontend" >nul
call npm install --silent
if errorlevel 1 (
    popd >nul
    goto :frontend_error
)
popd >nul
echo [Frontend] Dependencies installed successfully.

REM --------------------------------------------------
REM Start Servers Phase
REM --------------------------------------------------
echo.
echo [Phase 3/3] Starting servers...
echo.

REM Verify backend is ready
if not exist "%ROOT%backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment not found after setup!
    goto :backend_error
)

if not exist "%ROOT%backend\manage.py" (
    echo [ERROR] manage.py not found in backend directory!
    goto :backend_error
)

REM Verify Django is installed
"%ROOT%backend\venv\Scripts\python.exe" -c "import django" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Django is not installed in virtual environment!
    goto :backend_error
)

REM Verify frontend is ready
if not exist "%ROOT%frontend\package.json" (
    echo [ERROR] package.json not found in frontend directory!
    goto :frontend_error
)

if not exist "%ROOT%frontend\node_modules" (
    echo [ERROR] Frontend node_modules not found after setup!
    goto :frontend_error
)

if not exist "%ROOT%frontend\node_modules\vite" (
    echo [ERROR] Vite is not installed in frontend!
    goto :frontend_error
)

echo [Backend] Starting Django development server...
REM Use absolute path for Python to ensure it works
if exist "%ROOT%backend\venv\Scripts\activate.bat" (
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && venv\Scripts\activate.bat && python manage.py runserver"
) else (
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && %ROOT%backend\venv\Scripts\python.exe manage.py runserver"
)

REM Wait a moment before starting frontend to let backend initialize
timeout /t 3 /nobreak >nul

REM --------------------------------------------------
REM Start frontend server
REM --------------------------------------------------
echo [Frontend] Starting Vite development server...
start "HireScan Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo ========================================
echo  Both servers are starting...
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo [Info] Two new command windows have been opened:
echo   - HireScan Backend: Django server
echo   - HireScan Frontend: Vite dev server
echo.
echo [Info] Make sure your backend\.env file is configured
echo   with OPENROUTER_API_KEY for AI features to work.
echo.
echo Close this window after both servers are running.
pause
goto :eof

:backend_error
echo.
echo [Error] Backend setup failed.
echo Please check the error messages above and resolve the issue.
echo Common issues:
echo   - Python version not compatible (need 3.10-3.13)
echo   - Missing Python dependencies
echo   - Network issues preventing package installation
echo.
pause
exit /b 1

:frontend_error
echo.
echo [Error] Frontend setup failed.
echo Please check the error messages above and resolve the issue.
echo Common issues:
echo   - Node.js version not compatible (need 18+)
echo   - Missing npm packages
echo   - Network issues preventing package installation
echo.
pause
exit /b 1

:dependency_error
echo.
echo [Error] Critical dependency check failed.
echo Please install the required software and try again.
echo.
pause
exit /b 1