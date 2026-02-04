@echo off
cls
echo Starting EchoListen PWA Preview Server...
echo.
cd /d D:\manus\echolisten\echolisten
echo Server will start at: http://localhost:4173
echo.
timeout /t 2 /nobreak >nul
start http://localhost:4173
echo.
echo Press Ctrl+C to stop the server
echo.
npm run preview
pause
