# 明日方舟干员猜猜猜

一款基于WebSocket的双人在线猜干员游戏，玩家通过提问和猜测来找出对方选择的明日方舟干员。

## 🎮 游戏功能

### 核心玩法
- **双人对战**: 两位玩家进入同一房间进行游戏
- **身份选择**: 选择"我要猜"或"我要问"身份
- **难度设置**: 
  - 6星模式: 仅使用6星干员
  - 海猫模式: 使用所有干员（包含隐藏干员）
- **房间系统**: 支持多个房间同时进行游戏

### 游戏流程
1. 玩家选择难度、身份和房间后点击"准备"
2. 双方准备就绪后自动开始游戏
3. 系统随机生成25名干员作为候选池
4. 双方各自选择一名目标干员
5. 通过聊天提问缩小范围，点击干员图片标记候选
6. 猜干员玩家提交答案，猜对获胜

### 交互功能
- ✅ 实时聊天系统
- ✅ 干员信息查看（双击显示详细信息）
- ✅ 排除功能（标记已排除的干员）
- ✅ 再来一局（游戏结束后快速重开）
- ✅ 游戏超时自动重置（30分钟）

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **后端**: Node.js + WebSocket (ws库)
- **部署**: Docker + Docker Compose
- **内网穿透**: ngrok

## 📁 项目结构

```
Arknights-Guess/
├── config/                    # 配置文件
│   ├── server.js              # 服务器配置
│   └── ngrok.js               # 内网穿透配置
├── public/                    # 前端静态资源
│   ├── avatars/               # 干员头像
│   ├── script/                # JavaScript模块
│   │   ├── gameState.js       # 游戏状态管理
│   │   ├── uiComponents.js    # UI组件
│   │   ├── renderer.js        # 渲染器
│   │   ├── messageHandler.js  # 消息处理器
│   │   └── main.js            # 主入口
│   ├── style/                 # 样式文件
│   │   ├── guess.css          # 游戏样式
│   │   └── message.css        # 聊天样式
│   └── index.html             # 首页
├── scripts/                   # 启动脚本
│   ├── start.cmd              # Windows启动脚本
│   ├── start.sh               # Linux/Mac启动脚本
│   └── start-with-ngrok.js    # ngrok启动脚本
├── server/                    # 后端代码
│   ├── gameLogic.js           # 游戏逻辑
│   ├── messageHandler.js      # 消息处理
│   ├── roomManager.js         # 房间管理
│   └── index.js               # 服务器入口
├── operators.json             # 干员数据
├── Dockerfile                 # Docker配置
├── docker-compose.yml         # Docker Compose配置
└── package.json               # 项目配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 运行方式

#### 方式一：本地模式（仅本机访问）

```bash
npm start
```

或使用启动脚本：

```bash
# Windows
scripts\start.cmd

# Linux/Mac
bash scripts/start.sh
```

#### 方式二：Docker部署

```bash
# 构建并启动
docker-compose up -d

# 停止服务
docker-compose down
```

#### 方式三：内网穿透模式（外网可访问）

```bash
# 方式1：使用脚本
export NGROK_ENABLED=true
node scripts/start-with-ngrok.js

# 方式2：使用启动脚本选择"内网穿透模式"
```

**注意**: 使用内网穿透需要先安装ngrok：
1. 下载ngrok: https://ngrok.com/download
2. 注册账号获取authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. 在 `config/ngrok.js` 中配置authtoken

### 访问地址

- **本地**: http://localhost:8080
- **Docker**: http://localhost:8080
- **内网穿透**: 启动后控制台会显示公网地址

## 🎯 游戏规则

1. **身份说明**
   - **我要猜**: 需要找出对方选择的干员
   - **我要问**: 选择干员让对方猜测，可以回答对方的问题

2. **操作说明**
   - **单击干员图片**: 选中该干员作为候选
   - **双击干员图片**: 查看干员详细信息
   - **排除按钮**: 将选中的干员标记为已排除
   - **提交按钮**: 提交最终答案（仅猜干员身份可用）
   - **确定按钮**: 确认选择的干员（仅问问题身份可用）

3. **胜利条件**: 猜干员玩家正确猜出对方选择的干员即获胜

4. **游戏重置**: 游戏结束后，双方点击"再来一局"即可重新开始

## ⚙️ 配置说明

### 服务器配置 (`config/server.js`)

```js
{
  host: '0.0.0.0',        // 监听地址
  port: 8080,              // 监听端口
  gameTimeout: 1800000,    // 游戏超时时间（毫秒）
  maxPlayersPerRoom: 2,    // 每房间最大玩家数
  defaultRoomList: ['拉特兰', '罗德岛', '萨卡兹']
}
```

### ngrok配置 (`config/ngrok.js`)

```js
{
  enabled: false,           // 是否启用ngrok
  authtoken: '',           // ngrok authtoken
  region: 'us',            // 区域 (us, eu, ap, au, sa, jp, in)
  port: 8080               // 转发端口
}
```

## 📝 开发说明

### 代码规范
- 使用ES6+语法
- 前端采用模块化设计（ES Module）
- 后端采用类和模块划分

### 消息协议

客户端与服务端通过JSON格式消息通信：

```json
{
  "type": "message_type",
  "data": {...}
}
```

**消息类型**:
- `join`: 加入房间
- `ready`: 准备就绪
- `message`: 聊天消息
- `get_operators`: 获取干员数据
- `confirm_operator`: 确认选择干员
- `check_operator`: 检查猜测答案
- `restart_game`: 重新开始游戏

## 📄 许可证

本项目仅供学习交流，不得用于商业用途。

图片素材来源于 [PRTS Wiki](https://prts.wiki/)

## 👥 参与人员

- **技术实现**: 叶子🍀 >> [叶子大冤种](https://space.bilibili.com/435289695)
- **想法建设**: 瞳老师 >> [绯瞳Hitomi](https://space.bilibili.com/700489083)

---

⭐ 如果觉得这个项目有趣，请给个Star支持一下！