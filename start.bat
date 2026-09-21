@echo off
title Souvari Skin Lab - Start
echo.
echo  Starting Souvari Skin Lab...
echo  The website will open in your browser at: http://localhost:5173
echo  (Close this window, or press Ctrl+C, to stop the system.)
echo.
start "" http://localhost:5173
call npm run dev