const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverConfig = require('../config/server');
const ngrokConfig = require('../config/ngrok');

async function startNgrok(port) {
  return new Promise((resolve, reject) => {
    let ngrokPath = 'ngrok';
    
    if (process.platform === 'win32') {
      ngrokPath = path.join(__dirname, '../tools/ngrok.exe');
      if (!fs.existsSync(ngrokPath)) {
        ngrokPath = 'ngrok';
      }
    }

    const args = ['http', port];
    
    if (ngrokConfig.authtoken) {
      args.push('--authtoken', ngrokConfig.authtoken);
    }
    
    if (ngrokConfig.region) {
      args.push('--region', ngrokConfig.region);
    }

    const ngrok = spawn(ngrokPath, args);

    ngrok.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/https?:\/\/[\w.-]+.ngrok.io/);
      if (match) {
        console.log(`\n🎉 ngrok 内网穿透已启动！`);
        console.log(`📡 公网访问地址: ${match[0]}`);
        console.log(`🔗 WebSocket地址: ${match[0].replace('http', 'ws')}`);
        resolve(match[0]);
      }
    });

    ngrok.stderr.on('data', (data) => {
      console.log(`ngrok stderr: ${data}`);
    });

    ngrok.on('close', (code) => {
      console.log(`ngrok进程已退出，退出码: ${code}`);
    });
  });
}

async function main() {
  console.log('🚀 明日方舟猜干员游戏启动中...');
  console.log(`📦 服务器配置: http://${serverConfig.host}:${serverConfig.port}`);

  const ngrokEnabled = process.env.NGROK_ENABLED === 'true' || ngrokConfig.enabled;

  if (ngrokEnabled) {
    console.log('🔄 正在启动ngrok内网穿透...');
    try {
      await startNgrok(serverConfig.port);
    } catch (error) {
      console.error('❌ ngrok启动失败:', error);
      console.log('⚠️ 将继续使用本地服务器');
    }
  }

  require('../server/index.js');
}

main().catch(console.error);