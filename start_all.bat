@echo off
cd /d "%~dp0"
echo Starting HMS Application (Frontend + Backend)...

start "HMS Backend" cmd /c "call start_backend.bat"
start "HMS Frontend" cmd /c "call start_frontend.bat"

echo.
echo Both services have been launched in separate windows.
echo - Backend will run on http://localhost:5000 (usually)
echo - Frontend will run on http://localhost:5173 (usually)
echo.
pause
