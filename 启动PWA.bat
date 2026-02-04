@echo off
chcp 65001 >nul
cls
echo ========================================
echo   EchoListen PWA 服务器
echo ========================================
echo.
echo 正在清理旧进程...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo.
echo 切换到构建目录...
cd /d "%~dp0"
cd dist
echo.
echo 启动 HTTP 服务器（端口 8080）...
echo ========================================
echo.
echo 服务器地址: http://localhost:8080
echo.
start "" http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

python -m http.server 8080

pause
