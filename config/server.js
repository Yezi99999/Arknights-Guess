module.exports = {
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  gameTimeout: 30 * 60 * 1000,
  maxPlayersPerRoom: 2,
  defaultRoomList: ['拉特兰', '罗德岛', '萨卡兹']
};

module.exports.rooms = {
  room1: '拉特兰',
  room2: '罗德岛',
  room3: '萨卡兹'
};