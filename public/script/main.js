import { gameState } from './gameState.js';
import { setupRulesModal, setupGameControls, createStartButton } from './uiComponents.js';
import { renderOperators } from './renderer.js';
import { handleMessage } from './messageHandler.js';

function setupMessageInput(inputId, sendButtonId) {
  const messageInput = document.getElementById(inputId);
  const sendButton = document.getElementById(sendButtonId);

  if (!messageInput || !sendButton) return;

  const sendMsg = () => {
    const message = messageInput.value;
    if (message.trim() !== '' && gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
      gameState.ws.send(JSON.stringify({
        type: 'message',
        roomId: gameState.roomId,
        content: message,
        playerId: gameState.playerId
      }));
      messageInput.value = '';
    }
  };

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  });

  sendButton.addEventListener('click', sendMsg);
}

function setupFloatingChat() {
  const floatingChat = document.getElementById('floating-chat');
  const toggleBtn = document.getElementById('toggle-chat');
  const chatContent = document.querySelector('.floating-chat-content');

  if (!floatingChat || !toggleBtn) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chatContent.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
    toggleBtn.textContent = chatContent.classList.contains('collapsed') ? '▲' : '▼';
  });

  floatingChat.addEventListener('click', (e) => {
    if (e.target === floatingChat || e.target === document.querySelector('.floating-chat-header span')) {
      chatContent.classList.toggle('collapsed');
      toggleBtn.classList.toggle('collapsed');
      toggleBtn.textContent = chatContent.classList.contains('collapsed') ? '▲' : '▼';
    }
  });
}

function initGame() {
  setupMessageInput('message-input', 'send-button');
  setupMessageInput('floating-message-input', 'floating-send-button');
  setupFloatingChat();

  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify({
      type: 'get_operators'
    }));
  }
}

function joinRoom() {
  const nickname = document.getElementById('nickname-input').value;
  const role = document.getElementById('role-select').value;
  const room = document.getElementById('room-select').value;
  const difficulty = document.getElementById('difficulty-select').value;

  if (!nickname.trim()) {
    alert('请输入昵称');
    return;
  }

  gameState.role = role;
  setupGameControls(role);

  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    return;
  }

  createStartButton();

  gameState.ws = new WebSocket(`ws://${window.location.host}`);
  gameState.roomId = room;
  
  let storedPlayerId = localStorage.getItem('arknights_player_id');
  if (!storedPlayerId) {
    storedPlayerId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('arknights_player_id', storedPlayerId);
  }
  gameState.playerId = storedPlayerId;

  gameState.ws.onopen = () => {
    gameState.ws.send(JSON.stringify({
      type: 'join',
      roomId: room,
      playerId: gameState.playerId,
      nickname: nickname,
      role: role,
      difficulty: difficulty
    }));
  };

  gameState.ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  gameState.ws.onclose = () => {
    console.log('WebSocket连接已关闭');
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setupRulesModal();

  document.getElementById('start-game-button').addEventListener('click', joinRoom);

  document.getElementById('refresh-data-btn').addEventListener('click', () => {
    if (gameState.ws) {
      if (gameState.ws.readyState === WebSocket.OPEN) {
        gameState.ws.send(JSON.stringify({
          type: 'refresh',
          roomId: gameState.roomId,
          playerId: gameState.playerId
        }));
        document.getElementById('game-status').textContent = '数据同步中...';
      } else {
        document.getElementById('game-status').textContent = '连接已断开，请重新加入房间';
      }
    } else {
      document.getElementById('game-status').textContent = '请先加入房间';
    }
  });

  initGame();
});