@echo off
setlocal enabledelayedexpansion
title Souvari Skin Lab - Import Database Snapshot
chcp 65001 >nul

echo.
echo  ============================================================
echo   SOUVARI SKIN LAB - Import Database Snapshot
echo  ============================================================
echo.
echo   This replaces this computer's database with the owner's
echo   database snapshot (souvari_full.sql). It creates the exact
echo   same services, staff, schedules, settings, and data that the
echo   owner has - no need to run the slow seed scripts.
echo.

REM ---- Check that the snapshot file is present ----
if not exist "souvari_full.sql" (
  echo  [ERROR] souvari_full.sql was not found next to this file.
  echo  Ask the owner to run export-database.bat and give you the
  echo  whole project folder together with souvari_full.sql.
  pause
  exit /b 1
)

REM ---- Check MySQL tools ----
where mysql >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] mysql was NOT found. Install MySQL from
  echo  https://dev.mysql.com/downloads/installer/ and try again.
  pause
  exit /b 1
)

REM ---- Database details ----
echo.
echo  Enter the MySQL details for THIS computer.
echo.
set /p DBHOST="MySQL host [localhost]: " || set DBHOST=localhost
if "%DBHOST%"=="" set DBHOST=localhost
set /p DBPORT="MySQL port [3306]: " || set DBPORT=3306
if "%DBPORT%"=="" set DBPORT=3306
set /p DBNAME="Database name [iave_clinic]: " || set DBNAME=iave_clinic
if "%DBNAME%"=="" set DBNAME=iave_clinic
set /p DBUSER="MySQL username [root]: " || set DBUSER=root
if "%DBUSER%"=="" set DBUSER=root
set /p DBPASS="MySQL password: "

echo.
echo  Checking MySQL connection...
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Could not connect to MySQL. Check that MySQL is running
  echo  and that the password is correct, then run this again.
  pause
  exit /b 1
)
echo  [OK] Connected.

REM ---- WARNING / confirmation ----
echo.
echo  ****************************************************************
echo   WARNING: This will DELETE the entire "%DBNAME%" database on
echo   this computer and replace it with the owner's snapshot.
echo   Any data already in "%DBNAME%" will be LOST.
echo  ****************************************************************
echo.
echo   To keep the current data, back it up first, e.g.:
echo     mysqldump -u %DBUSER% -p %DBNAME% ^> backup-current.sql
echo.
set /p CONFIRM="Type YES to continue: "
if /i not "%CONFIRM%"=="YES" (
  echo.
  echo  Cancelled - nothing was changed.
  pause
  exit /b 1
)

REM ---- Drop and recreate the database ----
echo.
echo  Removing the old "%DBNAME%" database...
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" -e "DROP DATABASE IF EXISTS \`%DBNAME%\`; CREATE DATABASE \`%DBNAME%\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Could not reset the database. Check permissions and try again.
  pause
  exit /b 1
)

REM ---- Import the snapshot ----
echo.
echo  Importing souvari_full.sql ... this usually takes under a minute.
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" "%DBNAME%" < "souvari_full.sql"
if errorlevel 1 (
  echo.
  echo  [ERROR] The import failed. See the message above.
  echo  Tip: if you get an access error, run this script as the same
  echo  MySQL user that created the database.
  pause
  exit /b 1
)

REM ---- Verify ----
echo.
echo  Verifying the imported data...
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" "%DBNAME%" -e "SELECT (SELECT COUNT(*) FROM services) AS services, (SELECT COUNT(*) FROM staff) AS staff, (SELECT COUNT(*) FROM staff_schedules) AS schedules, (SELECT COUNT(*) FROM service_staff) AS assignments;"
echo.
echo  If the numbers above look right, the database is ready.

echo.
echo  ============================================================
echo   IMPORT COMPLETE!
echo  ============================================================
echo.
echo   Next steps:
echo     1. Start the system with start.bat (or: npm run dev).
echo     2. Open http://localhost:5173 and press Ctrl+F5.
echo     3. Log in as Admin: souvariskinlab@gmail.com (password123).
echo.
pause