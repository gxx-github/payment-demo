# Native Wallet - 多链加密货币钱包

一个基于 React Native 开发的多链加密货币钱包应用，支持 iOS 和 Android 平台。

## 功能特性

### ✨ 核心功能

- 🔐 **安全可靠**
  - 助记词生成和备份
  - 本地安全存储私钥
  - 支持助记词导入恢复

- 🌐 **多链支持**
  - Ethereum (ETH)
  - BNB Smart Chain (BSC)
  - Polygon (MATIC)
  - Arbitrum
  - Optimism
  - Solana (SOL)
  - 支持测试网络

- 💰 **支付功能**
  - 二维码收款
  - POS 机扫码支付
  - 实时交易通知
  - 交易历史记录

- 🔗 **后端集成**
  - WebSocket 长连接
  - 实时消息推送
  - 支付请求处理
  - 交易状态同步

## 技术栈

- **框架**: React Native 0.73
- **语言**: TypeScript
- **导航**: React Navigation
- **区块链**:
  - ethers.js (EVM 链)
  - @solana/web3.js (Solana)
  - bip39 (助记词)
- **存储**: AsyncStorage
- **二维码**: react-native-qrcode-svg

## 环境要求

- Node.js >= 18
- npm 或 yarn
- iOS 开发需要 Xcode 和 CocoaPods
- Android 开发需要 Android Studio 和 JDK 11+

## 安装步骤

### 1. 克隆项目

\`\`\`bash
cd native-wallet
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
# 或
yarn install
\`\`\`

### 3. iOS 额外步骤

\`\`\`bash
cd ios
pod install
cd ..
\`\`\`

### 4. 配置环境变量

复制 `.env.example` 到 `.env` 并配置您的环境变量：

\`\`\`bash
cp .env.example .env
\`\`\`

编辑 `.env` 文件，配置以下内容：

\`\`\`env
# WebSocket 服务器地址
WS_URL=wss://your-backend-service.com/ws

# 各区块链 RPC 地址（可使用 Infura、Alchemy 等服务）
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
BSC_RPC_URL=https://bsc-dataseed1.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 后端 API 地址
API_BASE_URL=https://your-backend-service.com/api
\`\`\`

## 运行应用

### iOS 模拟器

\`\`\`bash
npm run ios
# 或指定设备
npm run ios -- --simulator="iPhone 15 Pro"
\`\`\`

### Android 模拟器

\`\`\`bash
npm run android
\`\`\`

### 启动 Metro 服务器

\`\`\`bash
npm start
\`\`\`

## 项目结构

\`\`\`
native-wallet/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── config/           # 配置文件
│   │   ├── chains.ts     # 区块链配置
│   │   └── env.ts        # 环境变量
│   ├── contexts/         # React Context
│   │   └── WebSocketContext.tsx
│   ├── navigation/       # 导航配置
│   │   ├── RootNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── screens/          # 页面组件
│   │   ├── WelcomeScreen.tsx
│   │   ├── CreateWalletScreen.tsx
│   │   ├── ImportWalletScreen.tsx
│   │   ├── BackupMnemonicScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── QRCodeScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── services/         # 服务层
│   │   └── websocket.ts
│   ├── styles/           # 样式
│   │   └── colors.ts
│   ├── types/            # TypeScript 类型
│   │   └── navigation.ts
│   ├── utils/            # 工具函数
│   │   ├── walletManager.ts
│   │   ├── blockchain.ts
│   │   ├── solanaWallet.ts
│   │   └── qrcode.ts
│   └── App.tsx
├── .env.example          # 环境变量示例
├── .gitignore
├── babel.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## 使用说明

### 创建钱包

1. 启动应用，点击"创建新钱包"
2. 阅读安全提示，点击"创建钱包"
3. **重要**: 抄写并妥善保管 12 个助记词
4. 确认已备份后进入主界面

### 导入钱包

1. 启动应用，点击"导入已有钱包"
2. 输入您的 12 个助记词（用空格分隔）
3. 点击"导入钱包"

### 收款

1. 进入"收款码"标签页
2. 向商家展示二维码
3. 等待商家扫描并输入金额
4. 确认支付信息后完成交易

### 查看余额

在"首页"可以查看：
- 当前钱包总余额
- 钱包地址
- 所属网络
- 所有钱包列表

### 交易历史

在"历史"标签页可以查看所有交易记录

## 后端 API 接口说明

### WebSocket 消息格式

所有 WebSocket 消息使用以下格式：

\`\`\`typescript
{
  type: string;      // 消息类型
  data: any;         // 消息数据
  timestamp: number; // 时间戳
}
\`\`\`

### 消息类型

#### 1. 认证 (AUTH)

客户端连接后发送：

\`\`\`json
{
  "type": "AUTH",
  "data": {
    "walletAddress": "0x..."
  },
  "timestamp": 1234567890
}
\`\`\`

#### 2. 支付请求 (PAYMENT_REQUEST)

服务器推送支付请求：

\`\`\`json
{
  "type": "PAYMENT_REQUEST",
  "data": {
    "requestId": "uuid",
    "amount": "0.1",
    "currency": "ETH",
    "merchant": "商家名称",
    "description": "商品描述",
    "chainId": 1
  },
  "timestamp": 1234567890
}
\`\`\`

#### 3. 支付确认 (PAYMENT_ACCEPTED)

用户确认支付：

\`\`\`json
{
  "type": "PAYMENT_ACCEPTED",
  "data": {
    "requestId": "uuid"
  },
  "timestamp": 1234567890
}
\`\`\`

#### 4. 支付成功 (PAYMENT_CONFIRMED)

服务器确认交易：

\`\`\`json
{
  "type": "PAYMENT_CONFIRMED",
  "data": {
    "requestId": "uuid",
    "txHash": "0x..."
  },
  "timestamp": 1234567890
}
\`\`\`

## 安全注意事项

⚠️ **重要提示**

1. **助记词安全**
   - 助记词是恢复钱包的唯一方式
   - 请勿截图或通过网络传输
   - 任何人获得助记词都可以控制您的资产
   - 请抄写在纸上并保存在安全的地方

2. **私钥保护**
   - 应用使用 AsyncStorage 本地存储
   - 生产环境建议使用加密存储（如 react-native-keychain）
   - 永远不要与他人分享私钥

3. **网络安全**
   - 使用 HTTPS/WSS 协议
   - 验证后端服务器证书
   - 避免在公共 WiFi 下进行交易

4. **测试建议**
   - 在主网使用前，先在测试网充分测试
   - 首次使用建议小额转账测试
   - 确认一切正常后再进行大额操作

## 常见问题

### Q: 如何切换网络？

A: 目前默认显示以太坊主网，可以在 `src/config/env.ts` 中配置 `ENABLE_TESTNET` 来启用测试网络。

### Q: 支持哪些代币？

A: 当前版本主要支持各链的原生代币（ETH、BNB、MATIC、SOL 等）。ERC-20/SPL 代币支持可在后续版本添加。

### Q: 如何备份钱包？

A: 保存好您的 12 个助记词即可恢复所有钱包。一个助记词可以派生出多条链的钱包地址。

### Q: 交易失败怎么办？

A: 检查以下几点：
- 钱包余额是否充足（包括 Gas 费用）
- 网络连接是否正常
- RPC 节点是否可用
- 交易参数是否正确

## 开发计划

- [ ] ERC-20 代币支持
- [ ] SPL 代币支持
- [ ] 交易加速和取消
- [ ] 多语言支持
- [ ] 生物识别认证
- [ ] 硬件钱包集成
- [ ] DApp 浏览器
- [ ] NFT 支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 免责声明

本项目仅供学习和研究使用。使用本钱包进行任何交易，风险自负。开发者不对任何资产损失负责。

