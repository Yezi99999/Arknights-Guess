const serverConfig = require('../config/server');

class RoomManager {
  constructor() {
    this.rooms = {};
    this.gameTimeouts = {};
  }

  createRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        players: {},
        readyPlayers: new Set(),
        gameState: {
          selectedOperators: [],
          targetOperators: {},
          displayOperators: []
        },
        difficulty: 'hard'
      };
    }
    return this.rooms[roomId];
  }

  getRoom(roomId) {
    return this.rooms[roomId] || null;
  }

  addPlayer(roomId, playerId, playerData) {
    const room = this.createRoom(roomId);
    if (!room.players[playerId]) {
      room.players[playerId] = {
        ws: playerData.ws,
        nickname: playerData.nickname,
        role: playerData.role,
        difficulty: playerData.difficulty,
        isReady: false,
        wantsRestart: false,
        confirmedOperator: null
      };
    } else {
      room.players[playerId].ws = playerData.ws;
      room.players[playerId].nickname = playerData.nickname;
      room.players[playerId].role = playerData.role;
      room.players[playerId].difficulty = playerData.difficulty;
    }
    return room;
  }

  removePlayer(roomId, playerId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    delete room.players[playerId];
    room.readyPlayers.delete(playerId);

    if (Object.keys(room.players).length === 0) {
      this.clearTimeout(roomId);
      delete this.rooms[roomId];
      return true;
    }
    return false;
  }

  setPlayerReady(roomId, playerId) {
    const room = this.getRoom(roomId);
    if (!room || !room.players[playerId]) return false;

    room.players[playerId].isReady = true;
    room.readyPlayers.add(playerId);
    return room;
  }

  resetReadyState(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.readyPlayers.clear();
    Object.values(room.players).forEach(p => p.isReady = false);
  }

  setGameTimeout(roomId, callback) {
    this.clearTimeout(roomId);
    this.gameTimeouts[roomId] = setTimeout(callback, serverConfig.gameTimeout);
  }

  clearTimeout(roomId) {
    if (this.gameTimeouts[roomId]) {
      clearTimeout(this.gameTimeouts[roomId]);
      delete this.gameTimeouts[roomId];
    }
  }

  isAllPlayersReady(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const playerCount = Object.keys(room.players).length;
    return playerCount === serverConfig.maxPlayersPerRoom && 
           room.readyPlayers.size === playerCount;
  }

  resetGameState(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.gameState = {
      selectedOperators: [],
      targetOperators: {},
      displayOperators: []
    };

    Object.values(room.players).forEach(p => {
      p.wantsRestart = false;
      p.isReady = false;
      p.confirmedOperator = null;
    });

    room.readyPlayers.clear();
  }

  getAllPlayersReadyForRestart(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    return Object.values(room.players).every(p => p.wantsRestart);
  }
}

module.exports = new RoomManager();