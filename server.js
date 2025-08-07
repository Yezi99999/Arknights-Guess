const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// 加载干员数据
const operators = JSON.parse(fs.readFileSync(path.join(__dirname, 'operators.json'), 'utf-8'));

// WebSocket服务器
const wss = new WebSocket.Server({ host: '127.0.0.1', port: 8080 });

// 游戏房间
const rooms = {};

// 游戏超时检查
const gameTimeouts = {};

// 设置游戏超时
function setGameTimeout(roomId) {
  if (gameTimeouts[roomId]) {
    clearTimeout(gameTimeouts[roomId]);
  }
  
  // 30分钟游戏超时
  gameTimeouts[roomId] = setTimeout(() => {
    if (rooms[roomId]) {
      broadcastToRoom(roomId, {
        type: 'game_timeout',
        message: '游戏已超时，自动结束'
      });
      
      // 清理游戏状态
      rooms[roomId].gameState = {
        selectedOperators: [],
        targetOperators: {},
        displayOperators: []
      };
      
      // 重置准备状态
      rooms[roomId].readyPlayers = new Set();
      
      broadcastRoomState(roomId);
    }
  }, 30 * 60 * 1000); // 30分钟
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  let playerId = null;
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join':
        // 处理玩家加入房间
        if (!rooms[data.roomId]) {
          rooms[data.roomId] = {
            players: {},
            readyPlayers: new Set(),
            gameState: {
              selectedOperators: [],
              targetOperators: {},
              displayOperators: []
            }
          };
        }
        
        currentRoom = data.roomId;
        playerId = data.playerId;
        
        // 防止重复加入
        if (rooms[currentRoom].players[playerId]) {
          return;
        }
        
        rooms[currentRoom].players[playerId] = {
          ws,
          nickname: data.nickname,
          role: data.role,
          difficulty: data.difficulty,
          isReady: false
        };
        
        // 通知所有玩家更新
        broadcastRoomState(currentRoom);
        break;
        
      case 'ready':
        // 处理准备状态
        const player = rooms[currentRoom].players[playerId];
        if (!player.isReady) {
          player.isReady = true;
          rooms[currentRoom].readyPlayers.add(playerId);
          
          // 检查是否所有玩家都准备就绪
          if (rooms[currentRoom].readyPlayers.size === 2 && 
              Object.keys(rooms[currentRoom].players).length === 2) {
            
            // 确保两个玩家都准备就绪且连接正常
            const allPlayersReady = Array.from(rooms[currentRoom].readyPlayers).every(id => {
              const p = rooms[currentRoom].players[id];
              return p && p.ws && p.ws.readyState === WebSocket.OPEN && p.isReady;
            });
            
            // 额外检查玩家数量是否匹配
            const playersCount = Object.keys(rooms[currentRoom].players).length;
            if (allPlayersReady && playersCount === 2) {
              // 重置准备状态
              rooms[currentRoom].readyPlayers.clear();
              Object.values(rooms[currentRoom].players).forEach(p => p.isReady = false);
              
              setupGame(currentRoom);
              // 广播游戏开始消息
              broadcastToRoom(currentRoom, {
                type: 'game_start',
                message: '游戏已开始！'
              });
            }
          }
          
          broadcastRoomState(currentRoom);
        } else {
          // 如果玩家已经准备过，直接发送当前房间状态
          broadcastRoomState(currentRoom);
        }
        break;
        
      case 'message':
        // 处理聊天消息
        broadcastToRoom(currentRoom, {
          type: 'chat_message',
          roomId: currentRoom,
          nickname: rooms[currentRoom].players[playerId].nickname,
          content: data.content
        });
        break;
        
      case 'get_operators':
        // 发送干员数据
        ws.send(JSON.stringify({
          type: 'operators_data',
          operators: operators
        }));
        break;
        
      case 'refresh':
        // 处理刷新请求
        if (currentRoom && playerId && rooms[currentRoom] && rooms[currentRoom].players[playerId]) {
          // 返回刷新响应
          ws.send(JSON.stringify({
            type: 'refresh_response',
            success: true,
            state: rooms[currentRoom].gameState
          }));
          
          // 广播最新游戏状态给所有玩家
          broadcastToRoom(currentRoom, {
            type: 'game_state',
            state: rooms[currentRoom].gameState
          });
        } else {
          ws.send(JSON.stringify({
            type: 'refresh_response',
            success: false,
            message: '无效的房间或玩家信息'
          }));
        }
        break;
        
      case 'confirm_operator':
        // 处理干员确认
        if (currentRoom && playerId && rooms[currentRoom] && rooms[currentRoom].players[playerId]) {
          // 存储确认的干员信息
          rooms[currentRoom].players[playerId].confirmedOperator = data.operator;
          
          // 通知所有玩家更新
          broadcastToRoom(currentRoom, {
            type: 'operator_confirmed',
            playerId: playerId,
            operator: data.operator
          });
        }
        break;
        
      default:
        console.log('未知消息类型:', data.type);
        break;
        
      case 'operator_confirmed':
        console.log('收到干员确认消息:', data);
        // 广播确认消息给所有玩家
        broadcastToRoom(currentRoom, {
          type: 'operator_confirmed',
          playerId: playerId,
          operator: data.operator,
          message: `玩家 ${rooms[currentRoom].players[playerId].nickname} 已确认选择干员 ${data.operator.name}`
        });
        break;
      // 猜干员提交按钮逻辑
      case 'check_operator':
        // 检查玩家提交的干员是否与confirmedOperator一致
        const currentPlayer = rooms[data.roomId].players[data.playerId];
        const opponentId = Object.keys(rooms[data.roomId].players).find(id => id !== data.playerId);
        const opponent = rooms[data.roomId].players[opponentId];
        
        if (opponent && opponent.confirmedOperator && 
            data.operator.name === opponent.confirmedOperator.name) {
          // 猜对了
          broadcastToRoom(data.roomId, {
            type: 'guess_correct',
            playerId: data.playerId,
            operator: data.operator,
            message: ` ${rooms[data.roomId].players[data.playerId].nickname} 猜对了！干员是：${opponent.confirmedOperator.name}！`
          });
        } else {
          // 猜错了
          broadcastToRoom(data.roomId, {
            type: 'guess_wrong',
            playerId: data.playerId,
            operator: data.operator,
            message: ` ${rooms[data.roomId].players[data.playerId].nickname} 猜错了，请继续尝试！`
          });
        }
        break;
        
      case 'restart_game':
        // 处理再来一局请求
        if (rooms[data.roomId]) {
          const player = rooms[data.roomId].players[data.playerId];
          if (player) {
            player.wantsRestart = true;
            
            // 检查是否所有玩家都想重新开始
            const allPlayersWantRestart = Object.values(rooms[data.roomId].players).every(p => p.wantsRestart);
            
            if (allPlayersWantRestart) {
              // 重置游戏状态但保留玩家信息
              rooms[data.roomId].gameState = {
                selectedOperators: [],
                targetOperators: {},
                displayOperators: []
              };
              
              // 重置玩家状态
              Object.values(rooms[data.roomId].players).forEach(p => {
                p.wantsRestart = false;
                p.isReady = false;
                p.confirmedOperator = null;
              });
              
              // 通知客户端重置界面
              broadcastToRoom(data.roomId, {
                type: 'game_reset',
                message: '游戏已重置，请点击开始按钮重新开始'
              });
            }
          }
        }
        break;
    }
  });
  
  ws.on('close', () => {
    if (currentRoom && playerId) {
      // 清理玩家数据
      delete rooms[currentRoom].players[playerId];
      
      // 如果房间为空则清理房间
      if (Object.keys(rooms[currentRoom].players).length === 0) {
        delete rooms[currentRoom];
      } else {
        // 如果游戏正在进行中，通知剩余玩家
        if (rooms[currentRoom].gameState.selectedOperators.length > 0) {
          // 检查剩余玩家数量是否不足1人
          if (Object.keys(rooms[currentRoom].players).length < 1) {
            // 广播游戏结束消息
            broadcastToRoom(currentRoom, {
              type: 'game_end',
              message: '人数不足，游戏结束'
            });
            
            // 重置游戏状态
            rooms[currentRoom].gameState = {
              selectedOperators: [],
              targetOperators: {},
              displayOperators: []
            };
            
            // 重置准备状态
            rooms[currentRoom].readyPlayers = new Set();
            
            // 清理房间
            delete rooms[currentRoom];
          } else {
            broadcastToRoom(currentRoom, {
              type: 'player_disconnected',
              playerId: playerId,
              message: '有玩家断开连接，游戏已终止'
            });
          }
        }
        broadcastRoomState(currentRoom);
      }
    }
  });
});

// 设置游戏
function setupGame(roomId) {
  // 设置游戏超时
  setGameTimeout(roomId);
  const room = rooms[roomId];
  
  // 清空游戏状态
  room.gameState = {
    selectedOperators: [],
    targetOperators: {},
    displayOperators: []
  };
  
  // 获取房间难度设置
  const players = Object.values(room.players);
  if (players.length > 0) {
    room.difficulty = players[0].difficulty || 'hard';
  }
  
  // 根据难度筛选干员
  let filteredOperators = [...operators];
  if (room.difficulty === 'medium') {
    filteredOperators = operators.filter(op => op.rarity === 6);
  }
  
  // 随机选择25名干员
  const shuffled = [...filteredOperators].sort(() => 0.5 - Math.random());
  room.gameState.selectedOperators = shuffled.slice(0, 25);
  
  // 为每个玩家随机分配目标干员
  if (room.gameState.selectedOperators.length >= 25) {
    const players = Object.keys(room.players);
    room.gameState.targetOperators = {
      [players[0]]: room.gameState.selectedOperators[Math.floor(Math.random() * 25)],
      [players[1]]: room.gameState.selectedOperators[Math.floor(Math.random() * 25)]
    };
  }
  
  // 随机排序显示顺序
  room.gameState.displayOperators = [...room.gameState.selectedOperators].sort(() => 0.5 - Math.random());
  
  // 发送游戏状态
  broadcastToRoom(roomId, {
    type: 'game_state',
    state: room.gameState
  });
}

// 广播房间状态
function broadcastRoomState(roomId) {
  const room = rooms[roomId];
  const players = Object.values(room.players).map(p => ({
    nickname: p.nickname,
    isReady: p.isReady
  }));
  
  broadcastToRoom(roomId, {
    type: 'player_joined',
    players: players,
    readyCount: room.readyPlayers.size
  });
}

// 向房间广播消息
function broadcastToRoom(roomId, message) {
  if (!rooms[roomId]) return;
  
  Object.values(rooms[roomId].players).forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

console.log('WebSocket服务器已启动，监听端口8080');