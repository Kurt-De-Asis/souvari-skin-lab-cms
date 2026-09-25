@echo off
setlocal

REM ============================================================
REM  Souvari Skin Lab - server setup (run as Administrator)
REM  - clones/pulls the repo, installs deps, builds, runs under
REM    PM2, and registers an on-login start task.
REM ============================================================

set "CLINIC_DIR=C:\clinic"
set "REPO_DIR=%CLINIC_DIR%\souvari-skin-lab-cms"
set "REMOTE=https://github.com/Kurt-De-Asis/souvari-skin-lab-cms.git"
set "BRANCH=master"

where git >nul 2>&1 || (echo [ERROR] Git not found in PATH. Install https://git-scm.com and re-run. & pause & exit /b 1)
where node >nul 2>&1 || (echo [ERROR] Node.js not found in PATH. Install v20.11+ LTS and re-run. & pause & exit /b 1)

echo [1/7] Getting the code...
if not exist "%REPO_DIR%" (
  mkdir "%CLINIC_DIR%"
  git clone "%REMOTE%" "%REPO_DIR%"
  if errorlevel 1 (echo [ERROR] git clone failed. Check the repo is public/accessible. & pause & exit /b 1)
) else (
  cd /d "%REPO_DIR%"
  git fetch origin "%BRANCH%"
  git reset --hard "origin/%BRANCH%"
)

echo [2/7] Installing server dependencies...
cd /d "%REPO_DIR%\server"
call npm ci
if errorlevel 1 (echo [ERROR] npm ci failed for server. & pause & exit /b 1)

echo [3/7] Installing client dependencies...
cd /d "%REPO_DIR%\client"
call npm ci
if errorlevel 1 (echo [ERROR] npm ci failed for client. & pause & exit /b 1)

echo [4/7] Environment file...
if not exist "%REPO_DIR%\server\.env" (
  copy /Y "%REPO_DIR%\server\.env.example.prod" "%REPO_DIR%\server\.env" >nul
  echo    Created server\.env from .env.example.prod.
)
echo    IMPORTANT: open server\.env and fill in DATABASE_URL password and JWT secrets (see .env.example.prod).
pause

echo [5/7] Building (this takes a minute)...
cd /d "%REPO_DIR%\client"
call npm run build
if errorlevel 1 (echo [ERROR] client build failed. & pause & exit /b 1)
cd /d "%REPO_DIR%\server"
call npm run build
if errorlevel 1 (echo [ERROR] server build failed. & pause & exit /b 1)

echo [6/7] Applying database migrations...
call npx prisma migrate deploy
if errorlevel 1 (echo [ERROR] prisma migrate deploy failed. Check server\.env DATABASE_URL is correct. & pause & exit /b 1)

echo [7/7] Starting under PM2...
call npm install -g pm2 >nul 2>&1
call pm2 delete souvari-api >nul 2>&1
call pm2 start ecosystem.config.js
call pm2 save
call pm2 startup >nul 2>&1

REM Register an on-login task so the server starts after a reboot.
copy /Y "%~dp0start-server.bat" "%CLINIC_DIR%\start-server.bat" >nul
schtasks /create /f /tn "SouvariServer" /sc onlogon /tr "cmd /c \"%CLINIC_DIR%\start-server.bat\"" >nul
echo    Task Scheduler "SouvariServer" registered for on-login start.

echo.
echo Setup complete. PM2 status:
call pm2 list
echo.
echo Next: run setup-tunnel.bat to expose it through Cloudflare.
pause