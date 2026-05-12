export const gameState = {
  players: [],
  currentPlayer: null,
  operatorPool: [],
  targetOperators: {},
  selectedOperators: [],
  displayOperators: [],
  ws: null,
  roomId: null,
  playerId: null,
  role: null,
  selectedOperator: null,
  gameOver: false,
  winner: null
};

export function resetGameState() {
  gameState.players = [];
  gameState.currentPlayer = null;
  gameState.selectedOperators = [];
  gameState.displayOperators = [];
  gameState.selectedOperator = null;
  gameState.gameOver = false;
  gameState.winner = null;
}