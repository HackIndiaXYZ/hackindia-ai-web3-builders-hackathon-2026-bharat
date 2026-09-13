@echo off
setlocal

REM Ensure the script starts in the directory where this .bat file is located
cd /d "%~dp0"

echo =========================================
echo Starting Web App Development Environment
echo =========================================
echo.

echo Checking dependencies...

REM 1. Check for Node.js (needed for npx)
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install it from https://nodejs.org/ to serve the frontend.
    pause
    exit /b
)



echo All dependencies are satisfied!
echo.

echo Installing dependencies for the local backend...
call npm install

echo Starting Local Backend Server...
echo A new window will open with the server logs.

REM Start the Node server in a new visible window
start cmd /k "npm start"

REM Wait 3 seconds to ensure the server has time to start
ping -n 4 127.0.0.1 >nul

echo Opening Microsoft Edge...
start msedge http://localhost:3000

echo.
echo The frontend is now running!
echo To stop the frontend, you can close this console window.
pause
