@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo       明日方舟猜干员游戏 - 启动脚本
echo ==============================================

:MENU
cls
echo.
echo 请选择启动模式：
echo 1. 本地模式 (仅本机访问)
echo 2. 内网穿透模式 (外网可访问)
echo 3. 退出
echo.
set /p choice=请输入选择 (1/2/3): 

if "%choice%"=="1" (
    echo 启动本地模式...
    node server/index.js
    goto END
)

if "%choice%"=="2" (
    echo 启动内网穿透模式...
    echo 注意：请确保已安装ngrok并配置环境变量
    echo 或在config/ngrok.js中配置authtoken
    set NGROK_ENABLED=true
    node scripts/start-with-ngrok.js
    goto END
)

if "%choice%"=="3" (
    echo 退出...
    goto END
)

echo 无效的选择，请重新输入
pause
goto MENU

:END
endlocal