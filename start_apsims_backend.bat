@echo off
setlocal
echo ============================================
echo   APSIMS Backend Server
echo ============================================
echo Setting up environment...
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\nodejs;C:\laragon\bin\git\cmd;%PATH%"

cd /d "%~dp0packages\apsims-backend"

echo Starting APSIMS Backend...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo Running npm run dev...
call npm run dev
if errorlevel 1 (
    echo.
    echo Backend crashed or stopped with an error.
)
pause
