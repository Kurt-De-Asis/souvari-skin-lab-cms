@echo off
setlocal

REM ============================================================
REM  Nightly MySQL backup. Register with Task Scheduler once:
REM    schtasks /create /f /tn "SouvariBackup" /sc daily /st 01:30 /tr "\"C:\clinic\backup-db.bat\""
REM  The .sql files land in C:\clinic\backups\.
REM  Copy that folder somewhere off this PC occasionally (USB/Drive).
REM ============================================================

set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin"
set "DB_USER=root"
set "DB_PASS=YOUR_DB_PASSWORD"
set "DB_NAME=iave_clinic"
set "BACKUP_DIR=C:\clinic\backups"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "D=%%c%%b%%a"
for /f "tokens=1-2 delims=:^ " %%a in ('time /t') do set "T=%%a%%b"
set "STAMP=%D%_%T%"

"%MYSQL_BIN%\mysqldump.exe" -u%DB_USER% -p%DB_PASS% --single-transaction --routines --triggers "%DB_NAME%" > "%BACKUP_DIR%\%DB_NAME%_%STAMP%.sql"
if errorlevel 1 (
  echo [ERROR] mysqldump failed. Check MYSQL_BIN path and DB_PASS in this file.
  exit /b 1
)

echo Backed up to %BACKUP_DIR%\%DB_NAME%_%STAMP%.sql
endlocal