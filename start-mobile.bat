@echo off
chcp 65001 >nul
cls
echo ========================================
echo   EchoListen 手机配置助手
echo ========================================
echo.
echo 正在获取你的电脑 IP 地址...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
)

echo ========================================
echo.
echo 电脑 IP 地址: !IP!
echo.
echo 手机访问地址: http://!IP!:4173
echo.
echo ========================================
echo.
echo 正在启动服务器...
echo.

cd /d "D:\manus\echolisten\echolisten"

echo.
echo 服务器已启动！
echo.
echo 手机安装步骤：
echo 1. 确保手机连接同一 Wi-Fi
echo 2. 打开手机浏览器（Chrome/Safari）
echo 3. 访问: http://!IP!:4173
echo 4. 按照提示安装 PWA
echo.
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

start http://localhost:4173
npm run preview

pause
