@echo off
chcp 65001 >nul
cls
echo ========================================
echo   EchoListen 开发模式启动
echo ========================================
echo.
echo 正在启动开发服务器...
echo.
cd /d "D:\manus\echolisten\echolisten"
echo.
echo 服务器地址: http://localhost:3000
echo.
echo 正在尝试自动打开浏览器...
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
echo.
echo ========================================
echo.
echo 开发模式已启动！
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

npm run dev

pause
