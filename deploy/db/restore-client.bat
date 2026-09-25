@echo off
setlocal EnableExtensions
chcp 65001 >nul

rem ============================================================
rem  restore-client.bat  (run on the CLIENT laptop, MySQL 8)
rem  Replaces the local iave_clinic database with the snapshot
rem  deploy/db/souvari-live.sql from this same repo.
rem ============================================================

set "BAT_DIR=%~dp0"
for %%I in ("%BAT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "SERVER_DIR=%REPO_ROOT%\server"
set "DUMP=%BAT_DIR%souvari-live.sql"

echo Repo root : %REPO_ROOT%
echo Dump file : %DUMP%
echo.

rem ---- [1/6] pull the latest snapshot from Git ----
echo [1/6] Pulling latest snapshot from Git...
git -C "%REPO_ROOT%" pull
if errorlevel 1 echo Warning: git pull failed - continuing with the file already on disk.

if not exist "%DUMP%" (
  echo ERROR: %DUMP% not found. Run from within a fresh clone/pull.
  pause
  exit /b 1
)

rem ---- [2/6] locate mysql.exe ----
set "MYSQL_EXE="
where mysql >nul 2>&1 && set "MYSQL_EXE=mysql"
if not defined MYSQL_EXE (
  for /d %%D in ("%ProgramFiles%\MySQL\MySQL Server 8*") do (
    if exist "%%D\bin\mysql.exe" set "MYSQL_EXE=%%D\bin\mysql.exe"
  )
)
if not defined MYSQL_EXE (
  echo ERROR: mysql.exe not found. Install the MySQL 8 client or add its bin to PATH.
  pause
  exit /b 1
)
echo Using MySQL client: %MYSQL_EXE%

rem ---- [3/6] credentials ----
set /p MYSQL_PWD=Enter MySQL root password (blank if none): 

rem ---- check server version (utf8mb4_0900_ai_ci needs MySQL 8) ----
set "DB_VERSION="
for /f "delims=" %%V in ('"%MYSQL_EXE%" -u root --password=%MYSQL_PWD% -N -e "SELECT VERSION();" 2^>nul') do set "DB_VERSION=%%V"
if "%DB_VERSION%"=="" (
  echo ERROR: could not connect to MySQL as root. Check the password and that MySQL is running.
  pause
  exit /b 1
)
echo MySQL server version: %DB_VERSION%
if not "%DB_VERSION:~0,2%"=="8." (
  echo WARNING: this dump uses utf8mb4_0900_ai_ci which requires MySQL 8.x.
  set /p GO=Proceed anyway? First replications are unlikely... type y/N: 
  if /i not "%GO%"=="y" exit /b 1
)

rem ---- [4/6] drop and recreate the database ----
echo.
echo [4/6] Dropping and recreating database iave_clinic...
"%MYSQL_EXE%" -u root --password=%MYSQL_PWD% --default-character-set=utf8mb4 -e "DROP DATABASE IF EXISTS iave_clinic; CREATE DATABASE iave_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;" || goto :fail

rem ---- [5/6] import ----
echo [5/6] Importing %DUMP%...
"%MYSQL_EXE%" -u root --password=%MYSQL_PWD% --default-character-set=utf8mb4 iave_clinic < "%DUMP%" || goto :fail

rem ---- [6/6] baseline Prisma migrations (so future migrate commands stay clean) ----
echo [6/6] Recording Prisma migration history...
cd /d "%SERVER_DIR%"
call npx prisma migrate resolve --applied 20260817083218_init || echo Warning: baseline 1 failed
call npx prisma migrate resolve --applied 20260912060000_add_appointment_reschedule_reason || echo Warning: baseline 2 failed
call npx prisma migrate resolve --applied 20260920180043_allow_appointmentless_treatment_records || echo Warning: baseline 3 failed

rem ---- verify ----
echo.
echo Verifying counts (appointments customers treatment_records transactions users)...
set "COUNTS="
for /f "delims=" %%C in ('"%MYSQL_EXE%" -u root --password=%MYSQL_PWD% -N iave_clinic -e "SELECT (SELECT COUNT(*) FROM appointments),(SELECT COUNT(*) FROM customers),(SELECT COUNT(*) FROM treatment_records),(SELECT COUNT(*) FROM transactions),(SELECT COUNT(*) FROM users);"') do set "COUNTS=%%C"
echo Got      : %COUNTS%
echo Expected : 81 22 47 45 33
if "%COUNTS%"=="81 22 47 45 33" (
  echo.
  echo *** PASS - the client laptop database now matches the developer snapshot. ***
) else (
  echo.
  echo *** CHECK - counts differ from the snapshot. Review above. ***
)

echo.
echo Next: open the app and log in with the real admin account, then open a client record.
pause
exit /b 0

:fail
echo Restore FAILED. See the error above.
pause
exit /b 1