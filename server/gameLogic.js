const fs = require('fs');
const path = require('path');

class GameLogic {
  constructor() {
    this.operators = [];
    this.loadOperators();
  }

  loadOperators() {
    try {
      const operatorsPath = path.join(__dirname, '../operators.json');
      const allOperators = JSON.parse(fs.readFileSync(operatorsPath, 'utf-8'));
      
      const avatarDir = path.join(__dirname, '../public/avatars');
      this.operators = allOperators.filter(op => {
        const avatarPath = path.join(avatarDir, `${op.name}.png`);
        return fs.existsSync(avatarPath);
      });
      
      console.log(`已加载 ${this.operators.length} 名有头像的干员`);
    } catch (error) {
      console.error('加载干员数据失败:', error);
      this.operators = [];
    }
  }

  filterOperatorsByDifficulty(difficulty) {
    let filtered = [...this.operators];
    if (difficulty === 'medium') {
      filtered = this.operators.filter(op => op.rarity === 6);
    }
    return filtered;
  }

  shuffleArray(array) {
    return [...array].sort(() => 0.5 - Math.random());
  }

  selectOperators(difficulty, count = 25) {
    const filtered = this.filterOperatorsByDifficulty(difficulty);
    const shuffled = this.shuffleArray(filtered);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  assignTargets(selectedOperators, playerIds) {
    const targets = {};
    playerIds.forEach(id => {
      targets[id] = selectedOperators[Math.floor(Math.random() * selectedOperators.length)];
    });
    return targets;
  }

  setupNewGame(room) {
    const selected = this.selectOperators(room.difficulty);
    const playerIds = Object.keys(room.players);
    
    room.gameState = {
      selectedOperators: selected,
      targetOperators: this.assignTargets(selected, playerIds),
      displayOperators: this.shuffleArray(selected)
    };

    return room.gameState;
  }

  checkGuess(room, playerId, guessOperator) {
    const opponentId = Object.keys(room.players).find(id => id !== playerId);
    const opponent = room.players[opponentId];

    if (!opponent || !opponent.confirmedOperator) {
      return { correct: false, message: '对方尚未确认选择' };
    }

    const isCorrect = guessOperator.name === opponent.confirmedOperator.name;
    
    return {
      correct: isCorrect,
      message: isCorrect 
        ? `猜对了！干员是：${opponent.confirmedOperator.name}！`
        : '猜错了，请继续尝试！'
    };
  }

  getOperators() {
    return this.operators;
  }
}

module.exports = new GameLogic();