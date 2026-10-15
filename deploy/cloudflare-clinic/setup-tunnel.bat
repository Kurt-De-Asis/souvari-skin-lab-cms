@echo off
setlocal

REM ============================================================
REM  Souvari Skin Lab - Cloudflare Tunnel install (Windows)
REM  Run AFTER setup-server.bat, as Administrator.
REM
REM  Uses a REMOTELY-MANAGED tunnel created in the Cloudflare
REM  dashboard, so there is no config.yml and no registry editing.
REM  The dashboard also creates the DNS record for you.
REM
REM  First install cloudflared:
REM    choco install cloudflared
REM  or download cloudflared-windows-amd64.exe from
REM    https://github.com/cloudflare/cloudflared/releases
REM  and put it on PATH.
REM ============================================================

set "TUNNEL_NAME=souvari"
set "HOSTNAME=souvari-skin-lab.site"
set "SERVICE_URL=http://localhost:3000"

where cloudflared >nul 2>&1 || (echo [ERROR] cloudflared not found in PATH. Install it first ^(see notes at top^). & pause & exit /b 1)

REM If the service is already installed and running, do not ask for the token
REM again - just verify.
sc query cloudflared >nul 2>&1 && goto :VERIFY

echo ==================================================================
echo  Part A - create the tunnel in the Cloudflare dashboard (one time)
echo ==================================================================
echo  1. Go to  https://one.dash.cloudflare.com
echo  2. Networks  ^>  Tunnels  ^>  Create a tunnel  ^>  Cloudflared
echo  3. Name it "%TUNNEL_NAME%" and select Create.
echo  4. Add a Published application route:
echo       Hostname : %HOSTNAME%
echo       Service  : %SERVICE_URL%
echo     (add a second route for www.%HOSTNAME% if you want www too)
echo  5. Copy the tunnel TOKEN shown on the install screen.
echo.
echo ==================================================================
echo  Part B - install the tunnel service on THIS PC
echo ==================================================================
set /p CF_TOKEN=Paste the tunnel token and press Enter: 
if "%CF_TOKEN%"=="" (echo [ERROR] No token entered. & pause & exit /b 1)

echo Installing the cloudflared Windows service...
call cloudflared service install "%CF_TOKEN%"
if errorlevel 1 (
  echo [ERROR] service install failed. Make sure you ran this script as Administrator.
  pause
  exit /b 1
)
sc start cloudflared >nul 2>&1

:VERIFY
sc start cloudflared >nul 2>&1

echo.
echo Service status:
sc query cloudflared

echo.
echo In the dashboard, tunnel "%TUNNEL_NAME%" should show as HEALTHY and have a
echo Published application route:  %HOSTNAME%  -^>  %SERVICE_URL%
echo Verify in a browser:  https://%HOSTNAME%/api/health
pause
