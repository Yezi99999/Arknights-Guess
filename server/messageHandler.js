const roomManager = require('./roomManager');
const gameLogic = require('./gameLogic');

const MAX_GUESSES = 3;

class MessageHandler {
  constructor() {
    this.messageHandlers = {
      'join': this.handleJoin.bind(this),
      'ready': this.handleReady.bind(this),
      'message': this.handleChatMessage.bind(this),
      'get_operators': this.handleGetOperators.bind(this),
      'refresh': this.handleRefresh.bind(this),
      'confirm_operator': this.handleConfirmOperator.bind(this),
      'check_operator': this.handleCheckOperator.bind(this),
      'restart_game': this.handleRestartGame.bind(this)
    };
  }

  handleMessage(ws, message) {
    const data = JSON.parse(message);
    const handler = this.messageHandlers[data.type];

    if (handler) {
      handler(ws, data);
    } else {
      console.log('未知消息类型:', data.type);
    }
  }

  handleJoin(ws, data) {
    const { roomId, playerId, nickname, role, difficulty } = data;

    roomManager.addPlayer(roomId, playerId, {
      ws,
      nickname,
      role,
      difficulty
    });

    this.broadcastRoomState(roomId);
  }

  handleReady(ws, data) {
    const { roomId, playerId } = data;
    const room = roomManager.setPlayerReady(roomId, playerId);

    if (!room) return;

    if (roomManager.isAllPlayersReady(roomId)) {
      roomManager.resetReadyState(roomId);

      const firstPlayer = Object.values(room.players)[0];
      if (firstPlayer) {
        room.difficulty = firstPlayer.difficulty || 'hard';
      }

      gameLogic.setupNewGame(room);

      this.broadcastToRoom(roomId, {
        type: 'game_start',
        message: '游戏已开始！'
      });

      this.broadcastGameState(roomId);
    } else {
      this.broadcastRoomState(roomId);
    }
  }

  handleChatMessage(ws, data) {
    const { roomId, playerId, content } = data;
    const room = roomManager.getRoom(roomId);

    if (!room || !room.players[playerId]) return;

    this.broadcastToRoom(roomId, {
      type: 'chat_message',
      roomId,
      playerId,
      nickname: room.players[playerId].nickname,
      content
    });
  }

  handleGetOperators(ws, data) {
    ws.send(JSON.stringify({
      type: 'operators_data',
      operators: gameLogic.getOperators()
    }));
  }

  handleRefresh(ws, data) {
    const { roomId, playerId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room || !room.players[playerId]) {
      ws.send(JSON.stringify({
        type: 'refresh_response',
        success: false,
        message: '无效的房间或玩家信息'
      }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'refresh_response',
      success: true,
      state: room.gameState
    }));

    this.broadcastGameState(roomId);
  }

  handleConfirmOperator(ws, data) {
    const { roomId, playerId, operator } = data;
    const room = roomManager.getRoom(roomId);

    if (!room || !room.players[playerId]) return;

    room.players[playerId].confirmedOperator = operator;

    ws.send(JSON.stringify({
      type: 'operator_confirmed',
      playerId,
      operator,
      message: `你已确认选择干员 ${operator.name}`
    }));

    const opponentKey = Object.keys(room.players).find(key => key !== playerId);
    const opponent = opponentKey ? room.players[opponentKey] : null;
    if (opponent && opponent.ws && opponent.ws.readyState === 1) {
      opponent.ws.send(JSON.stringify({
        type: 'operator_confirmed',
        playerId,
        message: `玩家 ${room.players[playerId].nickname} 已确认选择，请开始猜测！`
      }));
    }
  }

  handleCheckOperator(ws, data) {
    const { roomId, playerId, operator } = data;
    const room = roomManager.getRoom(roomId);

    if (!room || !room.players[playerId]) {
      ws.send(JSON.stringify({
        type: 'guess_waiting',
        message: '玩家信息无效，请重新加入房间！'
      }));
      return;
    }

    const player = room.players[playerId];
    if (player.role !== 'guess') {
      ws.send(JSON.stringify({
        type: 'guess_waiting',
        message: '只有猜方才能提交猜测！'
      }));
      return;
    }

    const opponentKey = Object.keys(room.players).find(key => key !== playerId);
    const opponent = opponentKey ? room.players[opponentKey] : null;
    if (!opponent || !opponent.confirmedOperator) {
      ws.send(JSON.stringify({
        type: 'guess_waiting',
        message: '请等待对方确认选择后再猜测！'
      }));
      return;
    }

    if (!player.guessCount) {
      player.guessCount = 0;
    }

    const result = gameLogic.checkGuess(room, playerId, operator);

    if (result.correct) {
      this.broadcastToRoom(roomId, {
        type: 'guess_correct',
        playerId,
        operator,
        message: result.message
      });
    } else {
      player.guessCount++;

      if (player.guessCount >= MAX_GUESSES) {
        this.broadcastToRoom(roomId, {
          type: 'game_lost',
          playerId,
          message: `玩家 ${player.nickname} 猜错 ${MAX_GUESSES} 次，游戏结束！正确答案是：${opponent.confirmedOperator.name}`
        });
      } else {
        ws.send(JSON.stringify({
          type: 'guess_result',
          playerId,
          operator,
          guessCount: player.guessCount,
          message: `猜错了！你猜的是：${operator.name}，还剩 ${MAX_GUESSES - player.guessCount} 次机会，请继续尝试！`
        }));

        if (opponent.ws && opponent.ws.readyState === 1) {
          opponent.ws.send(JSON.stringify({
            type: 'guess_wrong',
            message: `玩家 ${player.nickname} 猜错了（第 ${player.guessCount}/${MAX_GUESSES} 次），继续游戏！`
          }));
        }
      }
    }
  }

  handleRestartGame(ws, data) {
    const { roomId, playerId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room || !room.players[playerId]) return;

    room.players[playerId].wantsRestart = true;

    const restartCount = Object.values(room.players).filter(p => p.wantsRestart).length;
    const playerCount = Object.keys(room.players).length;

    if (restartCount < playerCount) {
      this.broadcastToRoom(roomId, {
        type: 'restart_notification',
        message: `玩家 ${room.players[playerId].nickname} 准备再来一局，等待对方确认...`
      });

      this.broadcastRoomState(roomId);
    }

    if (roomManager.getAllPlayersReadyForRestart(roomId)) {
      roomManager.resetGameState(roomId);

      const firstPlayer = Object.values(room.players)[0];
      if (firstPlayer) {
        room.difficulty = firstPlayer.difficulty || 'hard';
      }

      gameLogic.setupNewGame(room);

      this.broadcastToRoom(roomId, {
        type: 'game_start',
        message: '游戏已重新开始！'
      });

      this.broadcastGameState(roomId);
    }
  }

  broadcastToRoom(roomId, message) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    Object.values(room.players).forEach(player => {
      if (player.ws && player.ws.readyState === 1) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastRoomState(roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const players = Object.values(room.players).map(p => ({
      nickname: p.nickname,
      isReady: p.isReady,
      wantsRestart: p.wantsRestart
    }));

    const wantsRestartCount = Object.values(room.players).filter(p => p.wantsRestart).length;

    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      players,
      readyCount: room.readyPlayers.size,
      wantsRestartCount
    });
  }

  broadcastGameState(roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    this.broadcastToRoom(roomId, {
      type: 'game_state',
      state: room.gameState
    });
  }

  handleDisconnect(roomId, playerId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const wasEmpty = roomManager.removePlayer(roomId, playerId);

    if (wasEmpty) return;

    if (room.gameState.selectedOperators.length > 0) {
      if (Object.keys(room.players).length < 1) {
        this.broadcastToRoom(roomId, {
          type: 'game_end',
          message: '人数不足，游戏结束'
        });
        roomManager.resetGameState(roomId);
      } else {
        this.broadcastToRoom(roomId, {
          type: 'player_disconnected',
          playerId,
          message: '有玩家断开连接，游戏已终止'
        });
      }
    }

    this.broadcastRoomState(roomId);
  }
}

module.exports = new MessageHandler();
