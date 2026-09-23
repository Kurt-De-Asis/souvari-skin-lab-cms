@echo off
setlocal
title Souvari Skin Lab - Update Existing Data
chcp 65001 >nul

echo.
echo  ============================================================
echo   SOUVARI SKIN LAB - Update Existing Database
echo  ============================================================
echo.
echo   Use this when the system is ALREADY installed and running
echo   and you want to load the REAL services, staff, schedules,
echo   and staff assignments.
echo.
echo   What it does:
echo     - Adds/updates the full service catalog (memberships + loyalty)
echo     - REPLACES the staff list with the real Souvari team
echo     - Rebuilds staff schedules and service assignments
echo.
echo   What it does NOT do:
echo     - Does not delete customers or appointments
echo     - Does not wipe the database
echo.
echo   IMPORTANT: existing STAFF are removed and replaced by the
echo   real team. If you need the old staff history, back up first.
echo.
echo   Recommended backup (run in a Command Prompt in this folder):
echo     mysqldump -u root -p iave_clinic ^> backup-souvari.sql
echo.

set /p CONFIRM="Type YES to continue: "
if /i not "%CONFIRM%"=="YES" (
  echo.
  echo  Cancelled - nothing was changed.
  pause
  exit /b 0
)

REM ---- Go to the project folder ----
cd /d "%~dp0"

REM ---- Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js is NOT installed. Install it from https://nodejs.org
  pause
  exit /b 1
)

echo.
echo  [1/4] Checking/installing dependencies (fast if already done)...
call npm install
call cd server && call npm install
call cd ..

echo.
echo  [2/4] Applying any database changes...
call cd server
call npx prisma generate
call npx prisma migrate deploy
if errorlevel 1 (
  echo  [ERROR] Could not apply database changes. Check MySQL is running
  echo  and that server\.env has the correct password.
  pause
  exit /b 1
)

echo.
echo  [3/4] Loading the real service catalog, memberships, and loyalty...
call npm run db:seed:catalog
call npm run db:seed:memberships
call npm run db:seed:loyalty

echo.
echo  [4/4] Installing the real staff, schedules, and assignments...
call npm run db:seed:employees
call npm run db:seed:service-staff
call cd ..

echo.
echo  ============================================================
echo   UPDATE COMPLETE!
echo  ============================================================
echo.
echo   Next steps:
echo     1. Restart the system (start.bat, or npm run dev).
echo     2. Open http://localhost:5173 and press Ctrl+F5.
echo     3. Log in as Admin and update Settings (address, phone,
echo        email) to the new Souvari Skin Lab details.
echo.
echo   Admin login: souvariskinlab@gmail.com  (password123)
echo.
pause