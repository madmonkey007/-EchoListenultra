@echo off
chcp 65001 >nul
cls
echo ========================================
echo   EchoListen PWA 服务器
echo ========================================
echo.
echo [1/3] 清理旧进程...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo [2/3] 切换到构建目录...
cd /d "%~dp0dist"
echo [3/3] 启动 HTTP 服务器...
echo.
echo ========================================
echo.
echo 服务器已启动！
echo.
echo 访问地址: http://localhost:8080
echo.
echo 正在尝试自动打开浏览器...
start "" http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

python -m http.server 8080

pause
