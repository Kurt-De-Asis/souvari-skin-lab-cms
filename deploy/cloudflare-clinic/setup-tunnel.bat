@echo off
setlocal

REM ============================================================
REM  Souvari Skin Lab - Cloudflare named tunnel setup
REM  Run AFTER setup-server.bat. First install cloudflared:
REM    choco install cloudflared   (or download from
REM    https://github.com/cloudflare/cloudflared/releases)
REM ============================================================

set "TUNNEL_NAME=souvari"
set "HOSTNAME=your-domain.com"

where cloudflared >nul 2>&1 || (echo [ERROR] cloudflared not found. Install it first (see notes at top). & pause & exit /b 1)

echo [1/4] Authorizing this machine to your Cloudflare account...
echo    A browser window will open - log in to Cloudflare and approve.
call cloudflared tunnel login
if errorlevel 1 (echo [ERROR] cloudflared login failed. & pause & exit /b 1)

echo [2/4] Creating the named tunnel...
call cloudflared tunnel create %TUNNEL_NAME% 2>nul
echo    (It is fine if it says it already exists.)

echo [3/4] Pointing DNS for %HOSTNAME% at the tunnel...
call cloudflared tunnel route dns %TUNNEL_NAME% %HOSTNAME%
if errorlevel 1 (echo [ERROR] DNS route failed. Confirm %HOSTNAME% is on your Cloudflare zone and nameservers point to Cloudflare. & pause & exit /b 1)

echo [4/4] Printing the tunnel token...
REM The token is used by "cloudflared service install <TOKEN>" to run
REM the tunnel as a Windows service that starts on boot.
call cloudflared tunnel token %TUNNEL_NAME%

echo.
echo Now install the service. Copy the token printed above and run:
echo    cloudflared service install ^<PASTE_TOKEN_HERE^>
echo.
echo Then verify:  cloudflared tunnel info %TUNNEL_NAME%   and visit
echo your site at https://%HOSTNAME%/api/health
pause