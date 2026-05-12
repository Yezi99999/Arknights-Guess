#!/bin/bash

echo "=============================================="
echo "       明日方舟猜干员游戏 - 启动脚本"
echo "=============================================="

PS3="请选择启动模式: "
options=("本地模式" "内网穿透模式" "退出")

select opt in "${options[@]}"
do
    case $opt in
        "本地模式")
            echo "启动本地模式..."
            node server/index.js
            break
            ;;
        "内网穿透模式")
            echo "启动内网穿透模式..."
            echo "注意：请确保已安装ngrok并配置环境变量"
            echo "或在config/ngrok.js中配置authtoken"
            export NGROK_ENABLED=true
            node scripts/start-with-ngrok.js
            break
            ;;
        "退出")
            echo "退出..."
            break
            ;;
        *) echo "无效的选择 $REPLY";;
    esac
done