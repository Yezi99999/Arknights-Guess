import { gameState, resetGameState } from './gameState.js';
import { renderOperators, updatePlayerList, updateGameStatus, displayChatMessage } from './renderer.js';
import { createStartButton, addRestartButton, setupGameControls } from './uiComponents.js';

export function handleMessage(message) {
  try {
    if (!message || !message.type) {
      throw new Error('无效的消息格式');
    }

    switch (message.type) {
      case 'game_start':
        console.log('游戏开始:', message.message);
        resetGameState();
        gameState.guessCount = 0;
        renderOperators();
        setupGameControls(gameState.role);
        break;

      case 'player_joined':
        updatePlayerList(message.players);
        if (message.wantsRestartCount !== undefined) {
          const playerCount = gameState.players.length;
          if (message.wantsRestartCount > 0 && message.wantsRestartCount < playerCount) {
            updateGameStatus(`等待对方点击再来一局 (${message.wantsRestartCount}/${playerCount})`);
          }
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

      case 'operator_confirmed':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
        }
        break;

      case 'operators_data':
        if (Array.isArray(message.operators)) {
          gameState.operatorPool = message.operators;
          renderOperators();
        }
        break;

      case 'refresh_response':
        updateGameStatus('数据同步完成');
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

          gameState.gameOver = true;
          gameState.winner = message.playerId;

          const winnerPlayer = gameState.players.find(p => p.playerId === message.playerId);
          const winnerName = winnerPlayer ? winnerPlayer.nickname : '玩家';

          updateGameStatus(`${winnerName} 猜对了！干员是：${message.operator.name}！`);
          addRestartButton();
        }
        break;

      case 'guess_waiting':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
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

      case 'guess_result':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
          
          if (message.guessCount !== undefined) {
            gameState.guessCount = message.guessCount;
          }
        }
        break;

      case 'game_lost':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });

          gameState.gameOver = true;
          updateGameStatus('游戏结束！猜错次数过多，挑战失败！');
          addRestartButton();
        }
        break;

      case 'restart_notification':
        if (message.message) {
          displayChatMessage({
            roomId: gameState.roomId,
            nickname: '系统',
            content: message.message
          });
        }
        break;

      case 'game_reset':
        updateGameStatus(message.message);
        document.getElementById('game-control-button').innerHTML = '';
        resetGameState();
        createStartButton();
        break;

      default:
        console.log('未知消息类型:', message.type);
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
  }
}

function updateGameState(state) {
  if (state.selectedOperators) {
    gameState.selectedOperators = state.selectedOperators;
  }
  if (state.targetOperators) {
    gameState.targetOperators = state.targetOperators;
  }
  if (state.displayOperators) {
    gameState.displayOperators = state.displayOperators;
  }

  updateGameStatus('游戏进行中');
  renderOperators();
}
