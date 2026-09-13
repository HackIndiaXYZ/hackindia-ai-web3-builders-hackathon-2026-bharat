@echo off
echo ==========================================
echo   BAP Web App - Deploy to Render
echo ==========================================
echo.

:: Get commit message from user
set /p msg="Enter commit message (or press Enter for 'Update'): "
if "%msg%"=="" set msg=Update

:: Stage all changes
echo.
echo [1/3] Staging changes...
git add .

:: Commit
echo [2/3] Committing: "%msg%"
git commit -m "%msg%"

:: Push to GitHub (triggers auto-deploy on Render)
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ==========================================
echo   ✅ Done! Render will auto-deploy now.
echo   Check: https://dashboard.render.com
echo ==========================================
echo.
pause
