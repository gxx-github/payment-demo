# Crypto Wallet App

一个跨平台的加密货币钱包应用，支持 Web、Android 和 iOS 平台。

## 功能特性

### 🔐 钱包管理
- 创建新钱包（生成助记词、私钥、地址）
- 导入现有钱包（通过助记词或私钥）
- 安全存储钱包数据
- 钱包详情查看和管理

### 💰 交易功能
- USDC 转账（支持多个网络）
- 交易历史查询
- Gas 费用估算
- 交易状态跟踪

### 📱 跨平台支持
- Web 应用
- Android 应用
- iOS 应用
- 响应式设计

### 🔒 安全特性
- 数据加密存储
- 生物识别认证
- 密码强度验证
- 钱包备份和恢复

### 🌐 多网络支持
- Ethereum 主网
- Polygon 网络
- BSC 网络
- Arbitrum 网络

### 📷 二维码功能
- 生成钱包地址二维码
- 扫描二维码进行转账
- 支持多种二维码格式

## 技术栈

- **前端框架**: React Native + Expo
- **区块链交互**: Ethers.js
- **加密算法**: BIP39, AES-256-CBC
- **存储**: Expo SecureStore
- **网络请求**: Axios
- **UI组件**: 自定义组件库

## 安装和运行

### 环境要求
- Node.js 16+
- npm 或 yarn
- Expo CLI
- Android Studio (Android开发)
- Xcode (iOS开发)

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 运行项目
```bash
# 启动开发服务器
npm start

# 运行在 Android 设备
npm run android

# 运行在 iOS 设备
npm run ios

# 运行在 Web 浏览器
npm run web
```

## 配置说明

### 1. 网络配置
在 `src/utils/constants.js` 中配置网络参数：

```javascript
export const NETWORKS = {
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    usdcAddress: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C'
  }
  // ... 其他网络配置
};
```

### 2. API 配置
在 `src/services/APIService.js` 中配置后端API：

```javascript
export const API_CONFIG = {
  baseUrl: 'https://api.cryptowallet.com',
  timeout: 30000
};
```

### 3. 区块链浏览器API
在 `src/services/TransactionService.js` 中配置API密钥：

```javascript
const apiKey = 'YOUR_ETHERSCAN_API_KEY';
```

## 项目结构

```
src/
├── components/          # 可复用UI组件
│   ├── Button.js
│   ├── Input.js
│   ├── Card.js
│   ├── QRCode.js
│   ├── LoadingSpinner.js
│   ├── Alert.js
│   └── index.js
├── screens/            # 页面组件
│   ├── HomeScreen.js
│   ├── CreateWalletScreen.js
│   ├── ImportWalletScreen.js
│   ├── WalletDetailScreen.js
│   ├── SendScreen.js
│   ├── ReceiveScreen.js
│   ├── QRScannerScreen.js
│   └── index.js
├── services/           # 业务逻辑服务
│   ├── WalletService.js
│   ├── TransactionService.js
│   ├── QRService.js
│   ├── APIService.js
│   └── SecurityService.js
├── utils/              # 工具函数
│   ├── helpers.js
│   └── constants.js
└── types/              # 类型定义
    └── index.js
```

## 安全注意事项

1. **私钥安全**: 私钥和助记词永远不会发送到服务器，只在本地加密存储
2. **数据加密**: 所有敏感数据都使用AES-256-CBC加密
3. **生物识别**: 支持指纹和面部识别认证
4. **网络安全**: 使用HTTPS进行所有网络通信
5. **代码混淆**: 生产环境建议启用代码混淆

## 开发指南

### 添加新网络
1. 在 `src/utils/constants.js` 中添加网络配置
2. 在 `src/services/WalletService.js` 中添加网络支持
3. 在 `src/services/TransactionService.js` 中添加交易支持

### 添加新代币
1. 在 `src/utils/constants.js` 中添加代币配置
2. 在 `src/services/WalletService.js` 中添加代币余额查询
3. 在 `src/services/TransactionService.js` 中添加代币转账

### 自定义UI主题
在 `src/utils/constants.js` 中的 `UI_CONFIG` 部分修改颜色和样式配置。

## 构建和部署

### Android 构建
```bash
expo build:android
```

### iOS 构建
```bash
expo build:ios
```

### Web 构建
```bash
expo build:web
```

## 常见问题

### Q: 如何获取 Infura API Key？
A: 访问 [Infura](https://infura.io/) 注册账号并创建项目，获取API Key。

### Q: 如何获取 Etherscan API Key？
A: 访问 [Etherscan](https://etherscan.io/apis) 注册账号并申请API Key。

### Q: 如何配置后端API？
A: 需要搭建后端服务，提供钱包管理、交易查询等API接口。

### Q: 如何启用生物识别？
A: 需要集成 `expo-local-authentication` 库，并在设备上配置生物识别。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 联系方式

如有问题，请联系开发团队。
