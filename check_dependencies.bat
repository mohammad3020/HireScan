@echo off
setlocal enableextensions enabledelayedexpansion
set "ROOT=%~dp0"
set "ERRORS=0"

echo ========================================
echo  HireScan - Dependency Checker
echo ========================================
echo.

REM --------------------------------------------------
REM Check Python installation
REM --------------------------------------------------
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Python is not installed or not in PATH
    set /a ERRORS+=1
) else (
    python --version
    echo   [OK] Python is installed
)
echo.

REM --------------------------------------------------
REM Check Node.js installation
REM --------------------------------------------------
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Node.js is not installed or not in PATH
    set /a ERRORS+=1
) else (
    node --version
    echo   [OK] Node.js is installed
)
echo.

REM --------------------------------------------------
REM Check Backend dependencies
REM --------------------------------------------------
echo [3/5] Checking Backend Python dependencies...
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    echo   Checking installed packages...
    "%ROOT%backend\venv\Scripts\python.exe" -c "import django; print(f'Django {django.__version__}')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] Django not installed
        set /a ERRORS+=1
    ) else (
        "%ROOT%backend\venv\Scripts\python.exe" -c "import django; print(f'  Django {django.__version__}')"
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import rest_framework; print('  DRF installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] djangorestframework not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import rest_framework_simplejwt; print('  JWT installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] djangorestframework-simplejwt not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import corsheaders; print('  CORS headers installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] django-cors-headers not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import django_filters; print('  Django filter installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] django-filter not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import dotenv; print('  python-dotenv installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] python-dotenv not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "from PIL import Image; print('  Pillow installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] Pillow not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "import requests; print('  Requests installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] requests not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "from docx import Document; print('  python-docx installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] python-docx not installed
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "from pypdf import PdfReader; print('  pypdf installed')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] pypdf not installed
        set /a ERRORS+=1
    )
    
    if !ERRORS! EQU 0 (
        echo   [OK] All backend dependencies are installed
    )
) else (
    echo   [WARNING] Virtual environment not found
    echo   Run start_servers.bat to create and setup the environment
    set /a ERRORS+=1
)
echo.

REM --------------------------------------------------
REM Check AI service dependencies
REM --------------------------------------------------
echo [4/5] Checking AI service dependencies...
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    "%ROOT%backend\venv\Scripts\python.exe" -c "import requests; print('  Requests: OK')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] requests not installed for AI service
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "from pypdf import PdfReader; print('  pypdf: OK')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] pypdf not installed for AI service
        set /a ERRORS+=1
    )
    
    "%ROOT%backend\venv\Scripts\python.exe" -c "from docx import Document; print('  python-docx: OK')" 2>nul
    if errorlevel 1 (
        echo   [ERROR] python-docx not installed for AI service
        set /a ERRORS+=1
    )
    
    if !ERRORS! EQU 0 (
        echo   [OK] All AI service dependencies are installed
    )
) else (
    echo   [SKIP] Virtual environment not found
)
echo.

REM --------------------------------------------------
REM Check Frontend dependencies
REM --------------------------------------------------
echo [5/5] Checking Frontend npm dependencies...
if exist "%ROOT%frontend\node_modules" (
    pushd "%ROOT%frontend" >nul
    call npm list --depth=0 >nul 2>&1
    if errorlevel 1 (
        echo   [WARNING] Some npm packages may be missing
        echo   Run: cd frontend ^&^& npm install
        set /a ERRORS+=1
    ) else (
        echo   [OK] node_modules directory exists
        echo   Checking key packages...
        if exist "%ROOT%frontend\node_modules\react" (
            echo     React: OK
        ) else (
            echo     [ERROR] React not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\vite" (
            echo     Vite: OK
        ) else (
            echo     [ERROR] Vite not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\@tanstack\react-query" (
            echo     React Query: OK
        ) else (
            echo     [ERROR] @tanstack/react-query not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\axios" (
            echo     Axios: OK
        ) else (
            echo     [ERROR] Axios not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\zustand" (
            echo     Zustand: OK
        ) else (
            echo     [ERROR] Zustand not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\recharts" (
            echo     Recharts: OK
        ) else (
            echo     [ERROR] Recharts not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\react-router-dom" (
            echo     React Router: OK
        ) else (
            echo     [ERROR] react-router-dom not found
            set /a ERRORS+=1
        )
        if exist "%ROOT%frontend\node_modules\tailwindcss" (
            echo     TailwindCSS: OK
        ) else (
            echo     [ERROR] TailwindCSS not found
            set /a ERRORS+=1
        )
    )
    popd >nul
) else (
    echo   [WARNING] node_modules directory not found
    echo   Run: cd frontend ^&^& npm install
    set /a ERRORS+=1
)
echo.

REM --------------------------------------------------
REM Summary
REM --------------------------------------------------
echo ========================================
if !ERRORS! EQU 0 (
    echo  All dependencies are installed!
    echo ========================================
    echo.
    echo [SUCCESS] You can run start_servers.bat to start the application
) else (
    echo  Found !ERRORS! issue(s)
    echo ========================================
    echo.
    echo [ACTION REQUIRED] Please fix the issues above
    echo.
    echo To install missing dependencies:
    echo   1. Backend: Run start_servers.bat (it will install automatically)
    echo   2. Frontend: cd frontend ^&^& npm install
)
echo.
pause

