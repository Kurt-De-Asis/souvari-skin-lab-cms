@echo off
setlocal enabledelayedexpansion
title Souvari Skin Lab - Export Database Snapshot
chcp 65001 >nul

echo.
echo  ============================================================
echo   SOUVARI SKIN LAB - Export Database Snapshot
echo  ============================================================
echo.
echo   This creates a single file (souvari_full.sql) with your ENTIRE
echo   database - services, staff, schedules, customers, settings, and
echo   everything else. Give this file to clients and they can import
echo   it in under a minute instead of running the slow seed scripts.
echo.

REM ---- Check that mysqldump exists ----
where mysqldump >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] mysqldump was NOT found.
  echo  It comes with MySQL. If MySQL is installed but this fails,
  echo  look for "mysqldump.exe" inside your MySQL bin folder, e.g.:
  echo    C:\Program Files\MySQL\MySQL Server 8.0\bin
  echo  and run this script again from there, or add that folder to PATH.
  pause
  exit /b 1
)

REM ---- Database details ----
echo.
echo  Enter the details of the database you want to EXPORT (your end).
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
echo  Testing the connection...
mysql -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Could not connect to MySQL. Check the password and try again.
  pause
  exit /b 1
)
echo  [OK] Connected to %DBNAME% on %DBHOST%.

REM ---- Run the dump ----
echo.
echo  Exporting the whole database. This can take a minute or two...
mysqldump -h "%DBHOST%" -P "%DBPORT%" -u "%DBUSER%" -p"%DBPASS%"^
  --routines --events --triggers --single-transaction --quick^
  --no-tablespaces --column-statistics=0 --default-character-set=utf8mb4^
  "%DBNAME%" > "souvari_full.sql"
if errorlevel 1 (
  echo.
  echo  [ERROR] The export failed. See the message above.
  pause
  exit /b 1
)

REM ---- Verify the file ----
if not exist "souvari_full.sql" (
  echo  [ERROR] souvari_full.sql was not created.
  pause
  exit /b 1
)
for %%A in ("souvari_full.sql") do set SZ=%%~zA
if "%SZ%"=="0" (
  echo  [ERROR] souvari_full.sql is empty. Did the export work?
  pause
  exit /b 1
)

echo.
echo  ============================================================
echo   EXPORT COMPLETE!
echo  ============================================================
echo.
echo   Created: souvari_full.sql  (%SZ% bytes)
echo.
echo   To give this to a client:
echo     1. Copy the WHOLE project folder (including the new code)
echo        together with souvari_full.sql to the client PC.
echo     2. On the client: run setup.bat - it will detect the file
echo        and import it automatically instead of seeding.
echo     3. If the client's system is ALREADY running: copy the
echo        folder + souvari_full.sql and run import-database.bat.
echo.
pause