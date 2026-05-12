const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const serverConfig = require('../config/server');
const messageHandler = require('./messageHandler');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './public/index.html';
  } else {
    filePath = './public' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let currentRoom = null;
  let playerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join') {
        currentRoom = data.roomId;
        playerId = data.playerId;
      }
      
      messageHandler.handleMessage(ws, message);
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  });

  ws.on('close', () => {
    if (currentRoom && playerId) {
      messageHandler.handleDisconnect(currentRoom, playerId);
    }
  });
});

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`服务器已启动，监听 http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`WebSocket服务器已启动，监听 ws://${serverConfig.host}:${serverConfig.port}`);
});

module.exports = server;