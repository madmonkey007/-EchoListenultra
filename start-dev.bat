@echo off
cls
echo Starting EchoListen Development Server...
echo.
cd /d D:\manus\echolisten\echolisten
echo Server will start at: http://localhost:3000
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
