# Native Wallet 架构文档

## 系统架构概览

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     Native Wallet App                        │
│                   (React Native + TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  Navigation  │  │   Contexts   │      │
│  │   (Screens)  │  │    Layer     │  │  (WebSocket) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴──────┐      │
│  │              Business Logic Layer                  │      │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │      │
│  │  │  Wallet    │  │  Chain   │  │  WebSocket   │  │      │
│  │  │  Manager   │  │  Config  │  │   Service    │  │      │
│  │  └────────────┘  └──────────┘  └──────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴──────┐      │
│  │              Data & Storage Layer                  │      │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │      │
│  │  │AsyncStorage│  │  Crypto  │  │  Blockchain  │  │      │
│  │  │  (Local)   │  │  Utils   │  │    APIs      │  │      │
│  │  └────────────┘  └──────────┘  └──────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │        External Services              │
        ├───────────────────────────────────────┤
        │  • Backend WebSocket Server           │
        │  • Ethereum RPC (Infura/Alchemy)      │
        │  • BSC RPC                            │
        │  • Polygon RPC                        │
        │  • Solana RPC                         │
        │  • Block Explorers                    │
        └───────────────────────────────────────┘
\`\`\`

## 核心模块说明

### 1. UI Layer (界面层)

#### Screens (页面)
- **WelcomeScreen**: 欢迎页，检查是否已有钱包
- **CreateWalletScreen**: 创建新钱包
- **ImportWalletScreen**: 导入现有钱包
- **BackupMnemonicScreen**: 备份助记词
- **HomeScreen**: 主页，显示余额和钱包列表
- **QRCodeScreen**: 收款二维码页
- **HistoryScreen**: 交易历史

#### Components (组件)
- **Button**: 通用按钮组件
- **Input**: 通用输入框组件
- 可根据需要扩展更多组件

### 2. Navigation Layer (导航层)

#### RootNavigator
- Stack 导航结构
- 管理应用的主要页面流程

#### MainTabNavigator
- Bottom Tab 导航
- 管理主要功能标签页（首页、收款码、历史）

### 3. Business Logic Layer (业务逻辑层)

#### WalletManager (`utils/walletManager.ts`)
**职责**:
- 生成和管理助记词
- 创建 EVM 和 Solana 钱包
- 本地存储钱包信息
- 钱包导入和恢复
- 多链钱包派生

**核心方法**:
\`\`\`typescript
generateMnemonic(): string
createWalletFromMnemonic(mnemonic, chainId, chainName, chainType): Wallet
saveWallet(wallet): void
getCurrentWallet(): Wallet
getWalletByChain(chainId): Wallet
\`\`\`

#### Blockchain Utilities

**EVM 链 (`utils/blockchain.ts`)**:
- 使用 ethers.js
- 获取余额
- 发送交易
- Gas 估算
- 交易历史

**Solana 链 (`utils/solanaWallet.ts`)**:
- 使用 @solana/web3.js
- 密钥派生
- 余额查询
- SOL 转账

#### Chain Configuration (`config/chains.ts`)
- 支持的区块链配置
- RPC 端点
- 区块浏览器链接
- 测试网/主网切换

#### WebSocket Service (`services/websocket.ts`)
**职责**:
- 维持与后端的长连接
- 消息收发
- 自动重连
- 消息路由

**特性**:
- 心跳保活
- 断线重连
- 消息队列
- 错误处理

### 4. Context Layer (上下文层)

#### WebSocketContext
- 全局 WebSocket 连接管理
- 消息广播
- 支付请求处理
- 交易通知

### 5. Data & Storage Layer (数据存储层)

#### AsyncStorage
- 钱包数据持久化
- 用户配置存储
- 交易缓存

**存储结构**:
\`\`\`json
{
  "wallets": [
    {
      "address": "0x...",
      "privateKey": "encrypted",
      "mnemonic": "encrypted",
      "chainId": 1,
      "chainName": "Ethereum",
      "chainType": "EVM"
    }
  ],
  "currentWalletIndex": 0
}
\`\`\`

## 数据流

### 创建钱包流程

\`\`\`
User Action → CreateWalletScreen
                    ↓
            generateMnemonic()
                    ↓
        createMultiChainWallets()
                    ↓
      For each chain: createWalletFromMnemonic()
                    ↓
            saveWallet() → AsyncStorage
                    ↓
        Navigate to BackupMnemonic
                    ↓
            User confirms backup
                    ↓
        Navigate to MainTabs (Home)
\`\`\`

### 支付请求流程

\`\`\`
Backend Server → WebSocket → WebSocketContext
                                    ↓
                        PAYMENT_REQUEST message
                                    ↓
                          handleMessage()
                                    ↓
                    Display Alert to User
                                    ↓
            User Confirms or Rejects
                    ↓                   ↓
        PAYMENT_ACCEPTED        PAYMENT_REJECTED
                    ↓
        Process Transaction
                    ↓
        sendTransaction()
                    ↓
        TRANSACTION_SUBMITTED → Backend
                    ↓
        Wait for Confirmation
                    ↓
        PAYMENT_CONFIRMED ← Backend
\`\`\`

### 余额查询流程

\`\`\`
HomeScreen → loadBalance()
                ↓
        getCurrentWallet()
                ↓
        getChainConfig()
                ↓
    EVM Chain?  ─Yes→  getBalance() (ethers.js)
        │                        ↓
        No                  RPC Request
        │                        ↓
        └→ getSolanaBalance()    │
                ↓                │
        Connection.getBalance()  │
                ↓                │
        Display in UI ←──────────┘
\`\`\`

## 安全架构

### 密钥管理

\`\`\`
Mnemonic (12 words)
        ↓
    BIP39 Seed
        ↓
    ┌───┴────┐
    │        │
EVM Path   Solana Path
m/44'/60'  m/44'/501'
    │        │
Private Key Private Key
    ↓        ↓
AsyncStorage (Plain Text - DEV ONLY)
    │
    └→ Production: Use react-native-keychain
\`\`\`

**安全建议**:
1. 开发环境使用 AsyncStorage
2. 生产环境必须使用加密存储（Keychain/Keystore）
3. 添加生物识别认证
4. 实现 App 锁定功能

### 网络安全

1. **HTTPS/WSS Only**
   - 所有网络请求使用加密协议
   - 验证 SSL 证书

2. **数据验证**
   - 验证所有用户输入
   - 验证交易参数
   - 验证签名

3. **错误处理**
   - 不泄露敏感信息
   - 友好的错误提示
   - 详细日志记录（开发环境）

## 性能优化

### 1. 渲染优化
- 使用 React.memo 避免不必要的重渲染
- FlatList 虚拟化长列表
- 图片懒加载

### 2. 网络优化
- 缓存 RPC 请求结果
- 批量请求
- 请求去重

### 3. 存储优化
- 分页加载交易历史
- 定期清理过期数据
- 压缩存储数据

### 4. Bundle 优化
- 代码分割
- Tree shaking
- 移除未使用的依赖

## 扩展性设计

### 添加新链支持

1. 在 `config/chains.ts` 添加链配置
2. 根据链类型选择实现方式：
   - EVM 兼容：使用现有 blockchain.ts
   - 新类型：创建新的 utils 文件
3. 更新 walletManager 支持新链类型
4. 测试完整流程

### 添加新功能

\`\`\`typescript
// 示例：添加代币支持
1. 创建 utils/tokenManager.ts
2. 定义代币接口和类型
3. 实现代币查询和转账
4. 创建 TokenListScreen
5. 集成到现有流程
\`\`\`

## 测试策略

### 单元测试
- 工具函数（钱包生成、地址验证等）
- 业务逻辑（交易构建、签名等）

### 集成测试
- 钱包创建流程
- 交易发送流程
- WebSocket 通信

### E2E 测试
- 完整用户流程
- 跨页面交互
- 错误场景

## 监控和日志

### 开发环境
- console.log 详细日志
- React Native Debugger
- Network Inspector

### 生产环境
- 错误追踪（Sentry）
- 性能监控
- 用户行为分析
- 崩溃报告

## 部署架构

### iOS
\`\`\`
Source Code
    ↓
Xcode Build
    ↓
Archive
    ↓
TestFlight (Beta)
    ↓
App Store
\`\`\`

### Android
\`\`\`
Source Code
    ↓
Gradle Build
    ↓
Signed APK/AAB
    ↓
Internal Testing
    ↓
Google Play Store
\`\`\`

## 未来规划

### Phase 1 (当前版本)
- ✅ 多链钱包
- ✅ 二维码收款
- ✅ WebSocket 集成
- ✅ 基础交易功能

### Phase 2
- [ ] ERC-20/SPL 代币支持
- [ ] 交易加速/取消
- [ ] 地址簿
- [ ] 生物识别

### Phase 3
- [ ] NFT 支持
- [ ] DApp 浏览器
- [ ] 多账户管理
- [ ] 硬件钱包集成

### Phase 4
- [ ] DeFi 协议集成
- [ ] 跨链桥接
- [ ] 社交恢复
- [ ] DAO 治理

---

此架构文档将随着项目发展持续更新。

