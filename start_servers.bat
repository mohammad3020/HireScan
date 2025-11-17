@echo off
setlocal
set "ROOT=%~dp0"

echo ========================================
echo  HireScan - Starting Backend and Frontend
echo ========================================
echo.

echo [Backend] Starting Django development server...
if exist "%ROOT%backend\venv\Scripts\activate.bat" (
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && venv\Scripts\activate.bat && python manage.py runserver"
) else (
    start "HireScan Backend" cmd /k "cd /d %ROOT%backend && %ROOT%backend\venv\Scripts\python.exe manage.py runserver"
)

REM Wait a moment before starting frontend
timeout /t 3 /nobreak >nul

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
pause
