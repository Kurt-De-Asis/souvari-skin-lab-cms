@echo off
setlocal enabledelayedexpansion
title Souvari Skin Lab - One-Time Setup
chcp 65001 >nul

echo.
echo  ============================================================
echo   SOUVARI SKIN LAB - Clinic Management System Setup
echo  ============================================================
echo.

REM ---- Check Node.js and npm ----
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js is NOT installed.
  echo  Please install it first from:  https://nodejs.org
  echo  Choose the "LTS" version and accept all defaults.
  echo.
  echo  After installing, close this window and run setup.bat again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] npm is NOT available. Reinstall Node.js from https://nodejs.org
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node --version') do set NODEVER=%%v
echo  [OK] Node.js found: %NODEVER%

REM ---- Database details ----
echo.
echo  Now I need to connect to your MySQL database.
echo.
set /p DBHOST="MySQL host [localhost]: " || set DBHOST=localhost
if "%DBHOST%"=="" set DBHOST=localhost
set /p DBPORT="MySQL port [3306]: " || set DBPORT=3306
if "%DBPORT%"=="" set DBPORT=3306
set /p DBNAME="Database name [iave_clinic]: " || set DBNAME=iave_clinic
if "%DBNAME%"=="" set DBNAME=iave_clinic
set /p DBUSER="MySQL username [root]: " || set DBUSER=root
if "%DBUSER%"=="" set DBUSER=root
set /p DBPASS="MySQL password (best to use letters & numbers only): " 

echo.
echo  Checking MySQL connection...
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Could not connect to MySQL.
  echo  Please check that MySQL is running and the password is correct, then run setup.bat again.
  echo.
  pause
  exit /b 1
)
echo  [OK] MySQL connection works.

REM ---- Create the database if it does not exist ----
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" -e "CREATE DATABASE IF NOT EXISTS \`%DBNAME%\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Could not create the "%DBNAME%" database. Check that your MySQL user has permission.
  pause
  exit /b 1
)
echo  [OK] Database "%DBNAME%" is ready.

REM ---- Create server/.env if it does not exist ----
if exist "server\.env" (
  echo  [INFO] server\.env already exists - leaving it untouched.
) else (
  echo  [OK] Creating server\.env from the project template.
  > "server\.env" @echo DATABASE_URL="mysql://%DBUSER%:%DBPASS%@%DBHOST%:%DBPORT%/%DBNAME%"
  >> "server\.env" @echo JWT_ACCESS_SECRET=clinic-access-secret-change-me
  >> "server\.env" @echo JWT_REFRESH_SECRET=clinic-refresh-secret-change-me
  >> "server\.env" @echo JWT_ACCESS_EXPIRES_IN=15m
  >> "server\.env" @echo JWT_REFRESH_EXPIRES_IN=7d
  >> "server\.env" @echo.
  >> "server\.env" @echo FRONTEND_URL=http://localhost:5173
  >> "server\.env" @echo BACKEND_URL=http://localhost:3000
  >> "server\.env" @echo.
  >> "server\.env" @echo AI_API_KEY=
  >> "server\.env" @echo AI_MODEL=gpt-3.5-turbo
  >> "server\.env" @echo.
  >> "server\.env" @echo SMS_PROVIDER=mock
  >> "server\.env" @echo SMS_API_KEY=
  >> "server\.env" @echo SMS_SENDER=Souvari Skin Lab
  >> "server\.env" @echo TEXTBEE_DEVICE_ID=
  >> "server\.env" @echo.
  >> "server\.env" @echo MAIL_HOST=
  >> "server\.env" @echo MAIL_PORT=587
  >> "server\.env" @echo MAIL_USER=
  >> "server\.env" @echo MAIL_PASS=
  >> "server\.env" @echo MAIL_FROM_NAME=Souvari Skin Lab
  >> "server\.env" @echo.
  >> "server\.env" @echo NODE_ENV=development
  >> "server\.env" @echo PORT=3000
)

REM ---- Install dependencies ----
echo.
echo  [1/3] Installing project dependencies (this can take a few minutes)...
call npm install
call cd server && call npm install
call cd ..
call cd client && call npm install
call cd ..
if errorlevel 1 (
  echo  [ERROR] Dependency install failed. Check your internet connection and try again.
  pause
  exit /b 1
)

REM ---- Prepare database ----
echo.
echo  [2/3] Creating the database tables...
call cd server
call npx prisma generate
call npx prisma migrate deploy
if errorlevel 1 (
  echo  [ERROR] Could not create the database tables. See message above.
  pause
  exit /b 1
)

echo.
if exist "..\souvari_full.sql" (
  echo  [3/3] Found souvari_full.sql - importing the owner's database snapshot...
  mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" "%DBNAME%" < "..\souvari_full.sql"
  if errorlevel 1 (
    echo.
    echo  [ERROR] Could not import souvari_full.sql. See the message above.
    echo  You can also try:  import-database.bat
    call cd ..
    pause
    exit /b 1
  )
) else (
  echo  [3/3] Adding the full Souvari Skin Lab data (demo + real services/staff)...
  call npx prisma db seed
  call npm run db:seed:catalog
  call npm run db:seed:memberships
  call npm run db:seed:loyalty
  call npm run db:seed:employees
  call npm run db:seed:service-staff
)
call cd ..

echo.
echo  ============================================================
echo   SETUP COMPLETE!
echo  ============================================================
echo.
echo   To start the system, double-click:  start.bat
echo   Then open your browser at:           http://localhost:5173
echo.
echo   Demo logins (all passwords: password123):
echo     Admin:    souvariskinlab@gmail.com
echo     Staff:    gianheartdaygon24@gmail.com
echo     Customer: juan.delacruz@email.com
echo.
pause