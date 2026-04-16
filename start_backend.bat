@echo off
echo Setting up environment...
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\nodejs;C:\laragon\bin\git\cmd;%PATH%"

cd /d "%~dp0packages\backend"

echo Starting HMS Backend...
if exist node_modules (
    echo node_modules found.
) else (
    echo Installing backend dependencies...
    call npm install
)

echo Running npm run dev...
npm run dev
pause
