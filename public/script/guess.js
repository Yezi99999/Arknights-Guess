// 游戏状态
let gameState = {
  players: [],
  currentPlayer: null,
  operatorPool: [],
  targetOperators: {},
  selectedOperators: [],
  ws: null,
  roomId: null,
  playerId: null
};

// 游戏规则弹窗逻辑
function setupRulesModal() {
  const rulesBtn = document.getElementById('rules-btn');
  const rulesModal = document.createElement('div');
  rulesModal.id = 'rules-modal';
  rulesModal.style.display = 'none';
  rulesModal.style.position = 'fixed';
  rulesModal.style.top = '50%';
  rulesModal.style.left = '50%';
  rulesModal.style.transform = 'translate(-50%, -50%)';
  rulesModal.style.width = 'auto';
  rulesModal.style.height = 'auto';
  rulesModal.style.backgroundColor = 'white';
  rulesModal.style.zIndex = '9999';
  rulesModal.style.padding = '20px';
  rulesModal.style.borderRadius = '8px';
  rulesModal.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  rulesModal.style.maxWidth = '500px';
  
  const modalContent = document.createElement('div');
  modalContent.style.position = 'absolute';
  modalContent.style.top = '50%';
  modalContent.style.left = '50%';
  modalContent.style.transform = 'translate(-50%, -50%)';
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  modalContent.style.maxWidth = '500px';
  modalContent.style.width = '80%';
  
  modalContent.innerHTML = `
    <h2>游戏规则</h2>
    <p>1. 选择难度和身份后点击准备按钮，</p>
    <p>2. 开始游戏需要房间内准备的玩家再次点击"开始按钮"</p>
    <p>2. 猜干员需要找出对方选择的目标干员</p>
    <p>3. 通过问问题来提问缩小范围</p>
    <p>4. 单击干员图片可以标记为候选</p>
    <p>5. 点击“提交”按钮提交最终答案</p>
    <p>'再来一局'>>>游戏结束后，点击准备>>开始,当双方都点击开始后会自动刷新卡牌</p>
    <p>OS. 不要乱点真的不想修BUG 酋酋惹/(ㄒoㄒ)/~~[by.yezi🍀]</p>
    <button id="close-rules-btn">关闭</button>
  `;
  
  rulesModal.appendChild(modalContent);
  
  rulesModal.innerHTML = `
    <h2>游戏规则</h2>
    <p>1. 选择难度和身份后点击准备按钮，</p>
    <p>2. 开始游戏需要房间内准备的玩家再次点击“开始按钮”</p>
    <p>2. 猜干员需要找出对方选择的目标干员</p>
    <p>3. 通过问问题来提问缩小范围</p>
    <p>4. 单击干员图片可以标记为候选</p>
    <p>5. 提问的人点击“确定”按钮来确定提问的干员<br>
    聪明的博士需要点击“提交”按钮提交最终答案</p>
    <p>'再来一局'>>>游戏结束后，点击准备>>开始,当双方都点击开始后会自动刷新卡牌</p>
    <p>OS. 不要乱点真的不想修BUG 酋酋惹/(ㄒoㄒ)/~~[by.yezi🍀]</p>
    <button id="close-rules-btn">关闭</button>
  `;
  
  document.body.appendChild(rulesModal);
  
  // 点击规则按钮切换显示/隐藏
  rulesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    rulesModal.style.display = rulesModal.style.display === 'none' ? 'block' : 'none';
  });
  
  // 点击关闭按钮隐藏
  document.getElementById('close-rules-btn').addEventListener('click', () => {
    rulesModal.style.display = 'none';
  });
  
  // 点击外部区域隐藏
  document.addEventListener('click', (e) => {
    if (!rulesModal.contains(e.target) && e.target !== rulesBtn) {
      rulesModal.style.display = 'none';
    }
  });
}

// 添加消息输入框键盘事件
function setupMessageInput() {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
  
  // 发送消息时添加玩家标识
  sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
      if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
        gameState.ws.send(JSON.stringify({
          type: 'message',
          content: message,
          playerId: gameState.playerId
        }));
      }
      messageInput.value = '';
    }
  });
}

// 初始化游戏
function initGame() {
  setupMessageInput();
  
  // 确保WebSocket连接已建立
  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    // 从服务器获取干员数据
    gameState.ws.send(JSON.stringify({
      type: 'get_operators'
    }));
  }
}

// 页面加载完成后初始化规则弹窗
document.addEventListener('DOMContentLoaded', () => {
  setupRulesModal();
});

// 设置游戏
function setupGame() {
  // 随机选择25名干员
  gameState.selectedOperators = [];
  const shuffled = [...gameState.operatorPool].sort(() => 0.5 - Math.random());
  gameState.selectedOperators = shuffled.slice(0, 25);
  
  // 为每个玩家随机分配目标干员
  gameState.targetOperators = {
    player1: gameState.selectedOperators[Math.floor(Math.random() * 25)],
    player2: gameState.selectedOperators[Math.floor(Math.random() * 25)]
  };
  
  // 随机排序显示顺序
  gameState.displayOperators = [...gameState.selectedOperators].sort(() => 0.5 - Math.random());
  
  // 显示干员图片
  if(gameState.displayOperators && gameState.displayOperators.length > 0) {
    renderOperators();
  }
}

// 显示干员确认卡片
function showOperatorConfirmCard(operator) {
    // 移除已存在的卡片
    const existingCard = document.querySelector('.operator-confirm-card');
    if (existingCard) {
        existingCard.remove();
    }
    
    const card = document.createElement('div');
    card.className = 'operator-confirm-card';
    card.style = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                 'background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); ' +
                 'z-index: 1000; max-width: 300px; text-align: center;';
    
    card.innerHTML = `
        <h3>确认选择</h3>
        <img src="${operator.avatar ? `c:\\try\\public\\avatars\\${operator.name}.png` : 'c:\\try\\public\\avatars\\land.png'}" alt="${operator.name}" style="width: 128px; height: 128px; object-fit: cover; margin: 10px 0;">
        <p>确定选择 ${operator.name} 作为提问干员吗？</p>
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
            <button id="confirm-yes-btn" class="game-button primary">确定</button>
            <button id="confirm-no-btn" class="game-button secondary">取消</button>
        </div>
    `;
    
    document.body.appendChild(card);
    
    // 确认按钮事件
    document.getElementById('confirm-yes-btn').addEventListener('click', () => {
        card.remove();
        // 发送确认消息到服务器
        if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
            gameState.ws.send(JSON.stringify({
                type: 'confirm_operator',
                operator: gameState.selectedOperator
            }));
        }
    });
    
    // 取消按钮事件
    document.getElementById('confirm-no-btn').addEventListener('click', () => {
        card.remove();
        document.getElementById('confirm-operator-btn').disabled = false;
    });
}

// 渲染干员图片
function renderOperators() {
  const container = document.querySelector('#game-card > div');
  container.innerHTML = '';
  
  (gameState.displayOperators || gameState.selectedOperators).forEach(op => {
    const div = document.createElement('div');
    div.className = 'operator-image-container';
    div.style = 'width: 128px; height: 128px; overflow: hidden; border-radius: 8px;';
    
    const img = document.createElement('img');
    const imgPath = op.avatar ? `c:\\try\\public\\avatars\\${op.name}.png` : 'c:\\try\\public\\avatars\\land.png';
    img.src = imgPath;
    img.alt = op.name;
    img.style = 'width: 100%; height: 100%; object-fit: cover;';
    img.onerror = function() {
      console.error(`图片加载失败: ${imgPath}`);
      this.src='./avatars/land.png';
    };
    
    // 添加双击事件/显示干员信息
    img.addEventListener('dblclick', () => {
      // 移除已存在的卡片
      const existingCard = document.querySelector('.operator-card');
      if (existingCard) {
        existingCard.remove();
      }
      
      const card = document.createElement('div');
      card.className = 'operator-card';
      card.style = 'position: fixed; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000;';
      
      card.innerHTML = `
        <h3>${op.name}</h3>
        <p>性别: ${op.gender}</p>
        <p>职业: ${op.class}</p>
        <p>分支: ${op.subclass}</p>
        <p>出身地: ${op.origin}</p>
        <p>标签: ${op.tags.join(', ')}</p>
      `;
      
      document.body.appendChild(card);
      
      // 定位卡片
      const rect = img.getBoundingClientRect();
      card.style.left = `${rect.right + 10}px`;
      card.style.top = `${rect.top}px`;
      
      // 添加点击外部关闭卡片事件
      document.addEventListener('click', function closeCard(e) {
        if (!card.contains(e.target) && e.target !== img) {
          card.remove();
          document.removeEventListener('click', closeCard);
        }
      });
    });
    
    // 添加点击事件 - 绿色边框效果/选中干员
    img.addEventListener('click', () => {
      // 移除所有图片的边框
      document.querySelectorAll('.operator-image-container img').forEach(img => {
        img.style.border = '';
      });
      
      // 为当前点击的图片添加绿色边框
      img.style.border = '4px solid #4CAF50';
      
      // 清空并保存选中的干员数据到全局状态
      gameState.selectedOperator = null;
      const selectedAlt = img.alt.trim();
      gameState.selectedOperator = { name: selectedAlt };
      console.log('当前选中的干员:', gameState.selectedOperator);
    });
    
    div.appendChild(img);
    container.appendChild(div);
  });
}

// 加入房间
function joinRoom() {
  const nickname = document.getElementById('nickname-input').value;
  const role = document.getElementById('role-select').value;
  const room = document.getElementById('room-select').value;
  const difficulty = document.getElementById('difficulty-select').value;
  
  // 游戏交互按钮
  const gameControlButton = document.getElementById('game-control-button');
  gameControlButton.innerHTML = '';
  
  if (role === 'guess') {
        gameControlButton.innerHTML = `
            <button id="exclude-btn" class="game-button secondary" style="padding: 12px 24px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s;margin-top: 12px;">排除</button>
            <button id="submit-btn" class="game-button primary" style="background-color: #4CAF50; color: white; padding: 12px 24px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s;margin-top: 12px;">提交</button>
        `;
        
        // 添加排除按钮点击事件
        document.getElementById('exclude-btn').addEventListener('click', function() {
            const selectedImg = document.querySelector('.operator-image-container img[style*="border"]');
            if (selectedImg) {
                selectedImg.style.transition = 'transform 0.5s ease';
                if (selectedImg.style.transform === 'scaleX(-1)') {
                    selectedImg.style.transform = '';
                    selectedImg.src = selectedImg.dataset.originalSrc || './avatars/land.png';
                } else {
                    selectedImg.dataset.originalSrc = selectedImg.src;
                    selectedImg.style.transform = 'scaleX(-1)';
                    selectedImg.src = './avatars/land.png';
                }
            }
        });
        
        // 添加提交按钮点击事件
        document.getElementById('submit-btn').addEventListener('click', function() {
            if (!gameState.selectedOperator) {
                alert('请先选择一名干员！');
                return;
            }
            
            // 检查选中的干员是否与confirmedOperator一致
            if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                gameState.ws.send(JSON.stringify({
                    type: 'check_operator',
                    operator: gameState.selectedOperator,
                    playerId: gameState.playerId,
                    roomId: gameState.roomId
                }));
            }
        });
    } else if (role === 'question') {
        gameControlButton.innerHTML = `
            <button id="confirm-operator-btn" class="game-button primary" style="background-color: #4CAF50; color: white; padding: 12px 24px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s;margin-top: 12px;">确定</button>
        `;
        
        // 添加确定按钮点击事件
        document.getElementById('confirm-operator-btn').addEventListener('click', function() {
            if (!gameState.selectedOperator) {
                showOperatorConfirmCard({
                    name: '提示',
                    avatar: '/avatars/land.png'
                });
                return;
            }
            
            // 显示确认卡片
            showOperatorConfirmCard(gameState.selectedOperator);
            
            // 禁用按钮
            this.disabled = true;
        });
    }
    
  
  // 检查是否已有连接
  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    console.log('已有WebSocket连接，无需重复创建');
    return;
  }
  
  // 检查是否已存在开始按钮
  if (!document.getElementById('start-button')) {
    // 创建开始按钮
    const startButton = document.createElement('button');
    startButton.id = 'start-button';
    startButton.className = 'game-button primary';
    startButton.textContent = '开始';
    startButton.style.margin = '10px auto';
    startButton.style.display = 'block';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.color = 'white';
    startButton.style.borderRadius = '4px';
    startButton.style.border = 'none';
    startButton.style.padding = '12px 24px';
    startButton.style.cursor = 'pointer';
    startButton.style.fontSize = '16px';
    startButton.style.transition = 'background-color 0.3s';
    startButton.onmouseover = function() {
      this.style.backgroundColor = '#45a049';
    };
    startButton.onmouseout = function() {
      this.style.backgroundColor = '#4CAF50';
    };
    startButton.onclick = () => {
      if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
        gameState.ws.send(JSON.stringify({
          type: 'ready',
          roomId: gameState.roomId,
          playerId: gameState.playerId
        }));
      }
    };
    const gameControls = document.getElementById('game-controls');
    if (gameControls) {
      gameControls.appendChild(startButton);
    } else {
      console.error('找不到game-controls元素');
    }
  }
  
  // 建立WebSocket连接
  gameState.ws = new WebSocket('ws://localhost:8080');
  gameState.roomId = room;
  gameState.playerId = Date.now().toString();
  
  // WebSocket事件处理
  gameState.ws.onopen = () => {
    // 确保连接完全建立
    const checkConnection = () => {
      if (gameState.ws.readyState === WebSocket.OPEN) {
        // 发送加入房间消息
        gameState.ws.send(JSON.stringify({
          type: 'join',
          roomId: room,
          playerId: gameState.playerId,
          nickname: nickname,
          role: role,
          difficulty: difficulty
        }));
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    checkConnection();
  };
  
  gameState.ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };
  
  gameState.ws.onclose = () => {
    console.log('WebSocket连接已关闭');
  };
}

// 发送消息
function sendMessage() {
  const message = document.getElementById('message-input').value;
  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify({
      type: 'message',
      roomId: gameState.roomId,
      playerId: gameState.playerId,
      content: message
    }));
    document.getElementById('message-input').value = '';
  }
}

// 处理收到的消息
function handleMessage(message) {
  try {
    if (!message || !message.type) {
      throw new Error('无效的消息格式');
    }
    
    switch (message.type) {
      case 'game_start':
        // 游戏开始处理
        console.log('游戏开始:', message.message);
        // 清空干员数据并重新初始化
        gameState.selectedOperators = [];
        gameState.displayOperators = [];
        setupGame();
        break;
      case 'player_joined':
        updatePlayerList(message.players);
        // 更新准备按钮状态
        const readyButton = document.getElementById('ready-button');
        if (readyButton) {
          const currentPlayer = gameState.players.find(p => p.nickname === gameState.nickname);
          readyButton.disabled = currentPlayer && currentPlayer.isReady;
        }
        break;
      case 'game_state':
        if (!message.state || !message.state.selectedOperators) {
          console.error('无效的游戏状态数据');
          return;
        }
        updateGameState(message.state);
        break;
      case 'chat_message':
        if (message.content && message.nickname) {
          displayChatMessage(message);
        }
        break;
      //发送确认消息  
      case 'operator_confirmed':
        if (message.message) {
          displayChatMessage(message);
        }
        break;
      case 'operators_data':
        if (Array.isArray(message.operators)) {
          gameState.operatorPool = message.operators;
          setupGame();
        }
        break;
      case 'refresh_response':
        document.getElementById('game-status').textContent = '数据同步完成';
        if (message.success) {
          updateGameState(message.state);
        }
        break;
      case 'guess_correct':
        if (message.playerId && message.operator && message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
          
          // 更新游戏状态为胜利
          gameState.gameOver = true;
          gameState.winner = message.playerId;
          
          // 获取玩家昵称
          const winnerPlayer = gameState.players.find(p => p.playerId === message.playerId);
          const winnerName = winnerPlayer ? winnerPlayer.nickname : '玩家';
          
          document.getElementById('game-status').textContent = `${winnerName} 猜对了！干员是：${message.operator.name}！`;
          
          // 添加再来一局按钮
          const gameControlButton = document.getElementById('game-control-button');
          gameControlButton.innerHTML = '';
          
          if (gameState.role === 'guess') {
            gameControlButton.innerHTML = `
              <button id="restart-btn" class="game-button primary">再来一局</button>
            `;
          } else if (gameState.role === 'question') {
            gameControlButton.innerHTML = `
              <button id="restart-btn" class="game-button primary">再来一局</button>
            `;
          }
          
          // 添加再来一局按钮事件
          const restartBtn = document.getElementById('restart-btn');
          if (restartBtn) {
            restartBtn.addEventListener('click', function() {
              if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                gameState.ws.send(JSON.stringify({
                  type: 'restart_game',
                  roomId: gameState.roomId,
                  playerId: gameState.playerId
                }));
              }
            });
          }
        }
        break;
        
      case 'guess_wrong':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
        }
        break;
        
      case 'game_reset':
        // 重置游戏界面
        document.getElementById('game-status').textContent = message.message;
        document.getElementById('game-control-button').innerHTML = '';
        
        // 清空干员数据
        gameState.selectedOperators = [];
        gameState.displayOperators = [];
        
        // 重新显示开始按钮
        if (!document.getElementById('start-button'))
 {
          const startButton = document.createElement('button');
          startButton.id = 'start-button';
          startButton.textContent = '开始';
          startButton.onclick = () => {
            if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
              gameState.ws.send(JSON.stringify({
                type: 'ready',
                roomId: gameState.roomId,
                playerId: gameState.playerId
              }));
            }
          };
          const gameControls = document.getElementById('game-controls');
          if (gameControls) {
            gameControls.appendChild(startButton);
          }
        }
        break;
        
      default:
        console.log('未知消息类型:', message.type);
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
  }
}

// 更新玩家列表
function updatePlayerList(players) {
  gameState.players = players;
  document.getElementById('player-count').textContent = players.length;
}

// 更新游戏状态
function updateGameState(state) {
  gameState = {...gameState, ...state};
  document.getElementById('game-status').textContent = '游戏进行中';
  renderOperators();
}

// 显示聊天消息
function displayChatMessage(message) {
  const chatContainer = document.getElementById('chat-container');
  if (!chatContainer) {
    console.error('找不到聊天容器元素');
    return;
  }
  const messageElement = document.createElement('div');
  const now = new Date();
  const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // 设置消息类名
  messageElement.className = 'message';
  if (message.playerId) {
    messageElement.classList.add('chat', `player${message.playerId === gameState.playerId ? '1' : '2'}`);
    if (message.playerId === gameState.playerId) {
      messageElement.style.color = 'green';
    }
  } else if (message.nickname === '系统') {
    messageElement.classList.add('system');
  }
  
  messageElement.textContent = `[房间${message.roomId} - ${timeString}] ${message.nickname}: ${message.content}`;
  chatContainer.appendChild(messageElement);
}

// 初始化事件监听
  document.getElementById('refresh-data-btn').addEventListener('click', () => {
    if (gameState.ws) {
      if (gameState.ws.readyState === WebSocket.OPEN) {
        // 发送刷新请求
        gameState.ws.send(JSON.stringify({
          type: 'refresh',
          roomId: gameState.roomId,
          playerId: gameState.playerId
        }));
        document.getElementById('game-status').textContent = '数据同步中...';
      } else {
        console.log('WebSocket连接未就绪');
        document.getElementById('game-status').textContent = '连接已断开，请重新加入房间';
      }
    } else {
      console.log('WebSocket未初始化');
      document.getElementById('game-status').textContent = '请先加入房间';
    }
  });

  // 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-game-button').addEventListener('click', joinRoom);
  document.getElementById('send-button').addEventListener('click', sendMessage);
  
  // 添加排除按钮点击事件/游戏交互按钮点击事件
  document.addEventListener('click', (e) => {
    const selectedImg = document.querySelector('.operator-image-container img[style*="border: 4px solid #4CAF50"]');
    
    if (e.target.classList.contains('game-button') && e.target.textContent === '排除' && selectedImg) {
      selectedImg.src = './avatars/land.png';
      selectedImg.style.border = '';
    }
    
    if (e.target.classList.contains('game-button') && e.target.textContent === '猜测' && selectedImg) {
      const isGuessing = selectedImg.style.boxShadow.includes('rgba(255, 235, 59, 0.5)');
      selectedImg.style.boxShadow = isGuessing ? '' : '0 0 0 4px rgba(255, 235, 59, 0.5)';
      selectedImg.style.border = '';
    }
  });
});