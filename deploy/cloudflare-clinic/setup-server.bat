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
REM Preflight steps are idempotent and non-fatal; they clear state a snapshot
REM import can leave behind (duplicate phone numbers, half-applied migration
REM markers) that would otherwise abort the whole migration chain.
echo    [deploy] preflight: clearing duplicate phones (if any)...
call npx prisma db execute --file prisma/predeploy.sql --schema prisma/schema.prisma || echo    [deploy] phone preflight reported an error (continuing)
echo    [deploy] preflight: clearing half-applied migration markers...
call npx prisma db execute --file prisma/predeploy-migrations.sql --schema prisma/schema.prisma || echo    [deploy] migration-marker preflight reported an error (continuing)
REM Unblock legacy/failed migrations: drop_preferred_staff cannot run on a
REM fresh database, and the unique-phone migration may be sitting failed.
call npx prisma migrate resolve --rolled-back 20261002120000_add_unique_user_phone || echo    [deploy] resolve rolled-back skipped
call npx prisma migrate resolve --applied 20260929120000_drop_preferred_staff || echo    [deploy] resolve applied skipped

set "MIGRATE_TRY=0"
:MIGRATE_RETRY
set /a MIGRATE_TRY+=1
echo    [deploy] prisma migrate deploy (attempt %MIGRATE_TRY%/5)...
call npx prisma migrate deploy
if not errorlevel 1 goto :MIGRATE_OK
if %MIGRATE_TRY% GEQ 5 goto :MIGRATE_FAIL
echo    [deploy] migrate deploy failed, retrying in 10s...
timeout /t 10 /nobreak >nul
goto :MIGRATE_RETRY

:MIGRATE_OK
echo    [deploy] migrations applied.
goto :MIGRATE_END

:MIGRATE_FAIL
echo    [WARNING] prisma migrate deploy did not complete after 5 attempts.
echo    [WARNING] Check server\.env DATABASE_URL. Continuing anyway so the server
echo    [WARNING] can still start; inspect with "npx prisma migrate status".

:MIGRATE_END
echo    [deploy] final migration status:
call npx prisma migrate status

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