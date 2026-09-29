@echo off
setlocal
title Souvari Skin Lab - Pull Latest Code & Update Database
chcp 65001 >nul

echo.
echo  ============================================================
echo   SOUVARI SKIN LAB - Pull Latest Code & Update Database
echo  ============================================================
echo.
echo   What this does:
echo     1. Pulls the latest code from GitHub
echo     2. Installs/updates dependencies
echo     3. Applies database migrations
echo     4. Lets you choose how to sync the data snapshot
echo.

REM ---- Check that git is installed ----
where git >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] git was NOT found. Install it from https://git-scm.com
  pause
  exit /b 1
)

cd /d "%~dp0"

REM ---- Detect uncommitted local changes (including untracked files) ----
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set CHANGES=%%i
if not "%CHANGES%"=="0" goto :has_changes

:proceed
echo.
echo  [1/5] Pulling the latest code from GitHub...
git pull origin master
if errorlevel 1 (
  echo.
  echo  [ERROR] git pull failed. Check your internet connection and
  echo  that you have access to the repository, then run this again.
  pause
  exit /b 1
)

echo.
echo  [2/5] Installing/updating dependencies (fast if already up to date)...
call npm install
if errorlevel 1 (
  echo  [ERROR] Dependency install failed.
  pause
  exit /b 1
)
call cd server && call npm install
call cd ..
call cd client && call npm install
call cd ..
if errorlevel 1 (
  echo  [ERROR] Dependency install failed.
  pause
  exit /b 1
)

echo.
echo  [3/5] Applying database migrations...
call cd server
call npx prisma generate
call npx prisma migrate deploy
if errorlevel 1 (
  echo  [ERROR] Could not apply database changes. Make sure MySQL is
  echo  running and that server\.env has the correct database password.
  call cd ..
  pause
  exit /b 1
)
call cd ..

REM ---- Data sync menu ----
if exist "souvari_full.sql" (
  goto :have_snapshot
)
echo.
echo  [4/5] No souvari_full.sql found in this folder.
echo  Keeping the current database data as-is.
echo  (Ask the owner for souvari_full.sql if you want the exact
echo  same services, staff, and schedules they have.)
goto :done

:have_snapshot
echo.
echo  ============================================================
echo   DATABASE SYNC MENU
echo  ============================================================
echo   A fresh snapshot (souvari_full.sql) from the owner was found
echo   in this folder.
echo.
echo   [A] FULL SYNC - Replace this computer's database with the
echo       owner's exact snapshot.
echo       WARNING: this DELETES all local data in the database
echo       BEFORE importing the snapshot.
echo   [B] SAFE UPDATE - Keep local customers and appointments, only
echo       refresh services, staff, schedules, and settings.
echo   [C] SKIP - Keep the current database exactly as it is.
echo.
set /p DATACHOICE="Choose [A/B/C]: "
if /i "%DATACHOICE%"=="A" call import-database.bat
if /i "%DATACHOICE%"=="B" call update-data.bat
if /i "%DATACHOICE%"=="C" echo Skipping the data sync. The current database is kept as-is.

:done
echo.
echo  ============================================================
echo   UPDATE COMPLETE!
echo  ============================================================
echo.
echo   Next steps:
echo     1. Start the system with start.bat (or: npm run dev).
echo     2. Open http://localhost:5173 and press Ctrl+F5.
echo.
pause
goto :eof

:has_changes
echo.
echo  [WARNING] You have uncommitted local changes. The pull may
echo  fail or cause merge conflicts. Recommended first:
echo     git stash
echo  or commit your changes before continuing.
set /p CONTINUE="Continue anyway? Type YES to continue: "
if /i not "%CONTINUE%"=="YES" (
  echo.
  echo  Cancelled - nothing was changed.
  pause
  exit /b 0
)
goto :proceed