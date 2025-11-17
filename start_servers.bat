@echo off
setlocal enableextensions
set "ROOT=%~dp0"

echo ========================================
echo  HireScan - Starting Backend and Frontend
echo ========================================
echo.

REM --------------------------------------------------
REM Backend dependencies
REM --------------------------------------------------
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    echo [Backend] Virtual environment found.
) else (
    echo [Backend] Virtual environment not found, creating...
    python -m venv "%ROOT%backend\venv"
    if errorlevel 1 goto :backend_error
)

echo [Backend] Ensuring Python requirements are installed...
"%ROOT%backend\venv\Scripts\python.exe" -m pip install --upgrade pip
"%ROOT%backend\venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt"
if errorlevel 1 goto :backend_error

REM --------------------------------------------------
REM Frontend dependencies
REM --------------------------------------------------
echo [Frontend] Ensuring npm packages are installed...
pushd "%ROOT%frontend" >nul
call npm install
if errorlevel 1 (
    popd >nul
    goto :frontend_error
)
popd >nul

REM --------------------------------------------------
REM Start backend server
REM --------------------------------------------------
if exist "%ROOT%backend\venv\Scripts\activate.bat" (
    echo [Backend] Activating virtual environment and starting server...
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && venv\Scripts\activate.bat && python manage.py runserver"
) else (
    echo [Backend] Virtual environment not found, starting without activation...
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && python manage.py runserver"
)

REM Wait a moment before starting frontend
timeout /t 2 /nobreak >nul

REM --------------------------------------------------
REM Start frontend server
REM --------------------------------------------------
echo [Frontend] Starting development server...
start "HireScan Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo ========================================
echo  Both servers are starting...
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Close this window after both servers are running.
pause
goto :eof

:backend_error
echo.
echo [Error] Backend dependency installation failed. Please resolve the issue and re-run this script.
pause
exit /b 1

:frontend_error
echo.
echo [Error] Frontend dependency installation failed. Please resolve the issue and re-run this script.
pause
exit /b 1