@echo off
setlocal
REM Runs the Souvari API on login via Task Scheduler "SouvariServer".
set "SERVER_DIR=C:\clinic\souvari-skin-lab-cms\server"
cd /d "%SERVER_DIR%"
call pm2 resurrect >nul 2>&1
if errorlevel 1 (
  call pm2 start ecosystem.config.js
  call pm2 save
)
endlocal