import { gameState } from './gameState.js';

export function renderOperators() {
  const container = document.getElementById('operators-container');
  if (!container) return;

  container.innerHTML = '';

  const operators = gameState.displayOperators.length > 0
    ? gameState.displayOperators
    : gameState.selectedOperators;

  operators.forEach(op => {
    const div = document.createElement('div');
    div.className = 'operator-image-container';

    const img = document.createElement('img');
    const directPath = `./avatars/${op.name}.png`;
    img.src = directPath;
    img.alt = op.name;
    img.onerror = function() {
      const encodedName = encodeURIComponent(op.name);
      const encodedPath = `./avatars/${encodedName}.png`;
      this.src = encodedPath;
      this.onerror = function() {
        this.src = './avatars/land.png';
      };
    };

    img.addEventListener('dblclick', () => {
      showOperatorInfo(op, img);
    });

    img.addEventListener('click', () => {
      document.querySelectorAll('.operator-image-container img').forEach(i => {
        i.classList.remove('selected');
        i.style.border = '';
      });

      img.classList.add('selected');
      img.style.border = '3px solid #4CAF50';

      const selectedAlt = img.alt.trim();
      gameState.selectedOperator = { name: selectedAlt };
    });

    div.appendChild(img);
    container.appendChild(div);
  });
}

function showOperatorInfo(op, img) {
  const existingCard = document.querySelector('.operator-card');
  if (existingCard) {
    existingCard.remove();
  }

  const card = document.createElement('div');
  card.className = 'operator-card';
  card.style = 'position: fixed; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000;';

  card.innerHTML = `
    <h3>${op.name}</h3>
    <p>性别: ${op.gender || '未知'}</p>
    <p>职业: ${op.class || '未知'}</p>
    <p>分支: ${op.subclass || '未知'}</p>
    <p>出身地: ${op.origin || '未知'}</p>
    <p>标签: ${op.tags ? op.tags.join(', ') : '无'}</p>
  `;

  document.body.appendChild(card);

  const rect = img.getBoundingClientRect();
  card.style.left = `${rect.right + 10}px`;
  card.style.top = `${rect.top}px`;

  document.addEventListener('click', function closeCard(e) {
    if (!card.contains(e.target) && e.target !== img) {
      card.remove();
      document.removeEventListener('click', closeCard);
    }
  });
}

export function updatePlayerList(players) {
  gameState.players = players;
  const playerList = document.getElementById('player-list');
  const playerStatus = document.getElementById('player-status');

  if (playerList) {
    playerList.innerHTML = '';

    players.forEach((player) => {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player-item';

      const statusDot = document.createElement('span');
      statusDot.className = `status-dot ${player.isReady ? 'ready' : 'not-ready'}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = player.nickname || '未知玩家';

      const readySpan = document.createElement('span');
      readySpan.className = 'player-ready';
      readySpan.textContent = player.isReady ? '✅' : '';

      playerDiv.appendChild(statusDot);
      playerDiv.appendChild(nameSpan);
      playerDiv.appendChild(readySpan);
      playerList.appendChild(playerDiv);
    });
  }

  if (playerStatus) {
    const maxPlayers = 2;
    const currentCount = players.length;

    if (currentCount >= maxPlayers) {
      playerStatus.textContent = `房间已满 (${currentCount}/${maxPlayers})`;
      playerStatus.classList.add('full');
    } else {
      playerStatus.textContent = `等待玩家加入... (${currentCount}/${maxPlayers})`;
      playerStatus.classList.remove('full');
    }
  }
}

export function updateGameStatus(status) {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.textContent = status;
  }
}

export function displayChatMessage(message) {
  const chatContainer = document.getElementById('chat-container');
  const floatingChatContainer = document.getElementById('floating-chat-container');

  if (!chatContainer) {
    console.error('找不到聊天容器元素');
    return;
  }

  const messageElement = document.createElement('div');
  const now = new Date();
  const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  messageElement.className = 'message';
  if (message.playerId) {
    messageElement.classList.add('chat', `player${message.playerId === gameState.playerId ? '1' : '2'}`);
  } else if (message.nickname === '系统') {
    messageElement.classList.add('system');
  }

  messageElement.textContent = `[${timeString}] ${message.nickname}: ${message.content}`;
  chatContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (floatingChatContainer) {
    const floatingMsg = messageElement.cloneNode(true);
    floatingChatContainer.appendChild(floatingMsg);
    floatingChatContainer.scrollTop = floatingChatContainer.scrollHeight;
  }
}
