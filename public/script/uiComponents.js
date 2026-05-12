import { gameState } from './gameState.js';

export function setupRulesModal() {
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

  rulesModal.innerHTML = `
    <h2>游戏规则</h2>
    <p>1. 选择难度和身份后点击准备按钮</p>
    <p>2. 开始游戏需要房间内准备的玩家再次点击"开始按钮"</p>
    <p>3. 猜干员需要找出对方选择的目标干员</p>
    <p>4. 通过问问题来缩小范围</p>
    <p>5. 单击干员图片可以标记为候选</p>
    <p>6. 提问的人点击"确定"按钮来确定提问的干员</p>
    <p>7. 聪明的博士需要点击"提交"按钮提交最终答案</p>
    <p>"再来一局">>>游戏结束后，点击准备>>开始，当双方都点击开始后会自动刷新卡牌</p>
    <p>OS. 不要乱点真的不想修BUG 酋酋惹/(ㄒoㄒ)/~~[by.yezi🍀]</p>
    <button id="close-rules-btn">关闭</button>
  `;

  document.body.appendChild(rulesModal);

  rulesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    rulesModal.style.display = rulesModal.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('close-rules-btn').addEventListener('click', () => {
    rulesModal.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!rulesModal.contains(e.target) && e.target !== rulesBtn) {
      rulesModal.style.display = 'none';
    }
  });
}

export function showOperatorConfirmCard(operator, onConfirm) {
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
      <img src="./avatars/${operator.name || 'land'}.png" alt="${operator.name}" style="width: 128px; height: 128px; object-fit: cover; margin: 10px 0;" onerror="this.src='./avatars/land.png'">
      <p>确定选择 ${operator.name} 作为提问干员吗？</p>
      <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
          <button id="confirm-yes-btn" class="game-button primary">确定</button>
          <button id="confirm-no-btn" class="game-button secondary">取消</button>
      </div>
  `;

  document.body.appendChild(card);

  document.getElementById('confirm-yes-btn').addEventListener('click', () => {
    card.remove();
    if (onConfirm) onConfirm();
  });

  document.getElementById('confirm-no-btn').addEventListener('click', () => {
    card.remove();
    const confirmBtn = document.getElementById('confirm-operator-btn');
    if (confirmBtn) confirmBtn.disabled = false;
  });
}

export function createStartButton() {
  if (document.getElementById('start-button')) return;

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

  startButton.addEventListener('click', () => {
    if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
      gameState.ws.send(JSON.stringify({
        type: 'ready',
        roomId: gameState.roomId,
        playerId: gameState.playerId
      }));
    }
  });

  const gameControls = document.getElementById('game-controls');
  if (gameControls) {
    gameControls.appendChild(startButton);
  }
}

export function setupGameControls(role) {
  const gameControlButton = document.getElementById('game-control-button');
  gameControlButton.innerHTML = '';

  if (role === 'guess') {
    gameControlButton.innerHTML = `
        <button id="exclude-btn" class="game-button secondary" style="padding: 12px 24px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s;margin-top: 12px;">排除</button>
        <button id="submit-btn" class="game-button primary" style="background-color: #4CAF50; color: white; padding: 12px 24px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s;margin-top: 12px;">提交</button>
    `;

    document.getElementById('exclude-btn').addEventListener('click', () => {
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

    document.getElementById('submit-btn').addEventListener('click', () => {
      if (!gameState.selectedOperator) {
        alert('请先选择一名干员！');
        return;
      }

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

    document.getElementById('confirm-operator-btn').addEventListener('click', function() {
      if (!gameState.selectedOperator) {
        showOperatorConfirmCard({ name: '提示', avatar: '/avatars/land.png' });
        return;
      }

      showOperatorConfirmCard(gameState.selectedOperator, () => {
          if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
            gameState.ws.send(JSON.stringify({
              type: 'confirm_operator',
              roomId: gameState.roomId,
              playerId: gameState.playerId,
              operator: gameState.selectedOperator
            }));
          }
        });

      this.disabled = true;
    });
  }
}

export function addRestartButton() {
  const gameControlButton = document.getElementById('game-control-button');
  gameControlButton.innerHTML = `
    <button id="restart-btn" class="game-button primary">再来一局</button>
  `;

  document.getElementById('restart-btn').addEventListener('click', () => {
    if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
      gameState.ws.send(JSON.stringify({
        type: 'restart_game',
        roomId: gameState.roomId,
        playerId: gameState.playerId
      }));
    }
  });
}