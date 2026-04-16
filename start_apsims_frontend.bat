@echo off
setlocal
echo ============================================
echo   APSIMS Frontend Server
echo ============================================
echo Setting up environment...
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\nodejs;C:\laragon\bin\git\cmd;%PATH%"

cd /d "%~dp0packages\apsims-frontend"

echo Starting APSIMS Frontend...
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo Running npm run dev...
call npm run dev
if errorlevel 1 (
    echo.
    echo Frontend crashed or stopped with an error.
)
pause
