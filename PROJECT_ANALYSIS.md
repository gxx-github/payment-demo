# MetaMask QR Payment Demo - 项目功能分析

本项目是一个加密货币扫码支付的完整演示合集，包含 6 个子项目，覆盖了从钱包管理、扫码支付、中继服务到支付 Demo 的完整链路。

---

## 项目总览

```
metamask-qr-payment-demo/
├── crypto-wallet-app     # Expo 跨平台加密钱包（EVM 链）
├── native-wallet         # React Native 多链钱包（EVM + Solana）
├── qr-old                # Solana 扫码支付前端（生产版本，含部署配置）
├── qr-wallet             # Solana 扫码支付前端（环境配置模板）
├── SolanaRelayService    # Solana 费用赞助服务（Fee Payer）
└── wallet-pay-demo       # EVM 扫码支付演示（Express + Socket.IO）
```

---

## 1. crypto-wallet-app

### 概述
基于 Expo / React Native 的跨平台加密货币钱包 App，专注于 **USDC 代币**的存储、发送和接收。

### 技术栈
| 类别 | 技术 |
|------|------|
| 框架 | React Native + Expo |
| 区块链 | ethers.js、bip39 |
| 二维码 | expo-camera（扫描）、qrcode（生成） |
| 安全存储 | expo-secure-store、AES-256-CBC 加密 |
| 网络 | axios |

### 核心功能
- **钱包管理**：创建新钱包（12 词助记词）、通过助记词/私钥导入
- **多链支持**：Ethereum、Polygon、BSC、Arbitrum
- **USDC 转账**：多网络 USDC 发送、Gas 费估算、余额检查
- **二维码**：生成收款二维码（支持嵌入金额/备注）、扫描转账二维码
- **安全**：私钥和助记词本地加密存储、密码强度验证

### 架构
```
src/
├── screens/       # 7 个页面（Home、CreateWallet、Import、Send、Receive、QRScanner、WalletDetail）
├── services/      # 业务服务（Wallet、Transaction、QR、API、Security）
├── components/    # UI 组件（Button、Input、Card、QRCode、Alert、LoadingSpinner）
├── utils/         # 工具函数（constants、helpers）
└── types/         # 类型定义
```

### 关键流程
1. **创建钱包**：生成助记词 → 验证备份 → AES 加密存储到 SecureStore
2. **发送 USDC**：输入地址/扫码 → 估算 Gas → 构建交易 → ethers.js 签名发送
3. **收款**：生成含地址/金额的二维码 → 等待付款

---

## 2. native-wallet

### 概述
基于 React Native + TypeScript 的多链移动钱包，支持 **EVM 链 + Solana**，通过 WebSocket 实现实时支付请求推送。

### 技术栈
| 类别 | 技术 |
|------|------|
| 框架 | React Native 0.73 + TypeScript |
| EVM 链 | ethers.js 6、@ethereumjs/wallet |
| Solana | @solana/web3.js、@solana/spl-token |
| 密钥 | bip39、ed25519-hd-key、bs58 |
| 二维码 | react-native-qrcode-svg |
| 实时通信 | WebSocket（自封装） |
| 存储 | AsyncStorage |

### 核心功能
- **多链钱包**：一个助记词派生 EVM（ETH/BSC/Polygon/Arbitrum/Optimism）+ Solana 钱包
- **创建/导入**：助记词生成、导入恢复
- **备份助记词**：独立的备份确认页面
- **二维码收款**：生成含钱包地址和 chainId 的二维码
- **WebSocket 实时支付**：连接后端 → 接收支付请求 → 弹窗确认/拒绝 → 回传结果
- **自动重连**：WebSocket 断线自动重连机制

### 架构
```
src/
├── screens/         # 7 个页面（Welcome、Create、Import、Backup、Home、QRCode、History）
├── navigation/      # Stack + Bottom Tab 导航
├── contexts/        # WebSocketContext（全局 WebSocket 状态管理）
├── services/        # WebSocket 服务封装
├── utils/           # walletManager、blockchain、solanaWallet、qrcode
├── components/      # Button、Input
├── config/          # chains.ts（链配置）、env.ts
└── styles/          # colors.ts
```

### 关键流程
1. **多链派生**：助记词 → BIP39 种子 → EVM 路径 `m/44'/60'/0'/0/0` + Solana 路径 `m/44'/501'/0'/0'`
2. **支付请求**：WebSocket 收到 `PAYMENT_REQUEST` → Alert 弹窗 → 用户确认 → 回传 `PAYMENT_ACCEPTED/REJECTED`

---

## 3. qr-old

### 概述
已部署到生产的 **Solana 扫码支付前端应用**，连接 Phantom 钱包，实现 POS 扫码收款、实时支付通知、交易记录查询等完整业务功能。支持国际化（中/英/日）。

### 技术栈
| 类别 | 技术 |
|------|------|
| 框架 | React 18 + Create React App |
| 区块链 | @solana/web3.js、@solana/wallet-adapter（Phantom） |
| 二维码 | qrcode.react |
| 样式 | styled-components |
| 国际化 | react-i18next（中/英/日） |
| 实时通信 | WebSocket（心跳 30s） |
| 认证 | JWT Token + 钱包签名认证 |
| 部署 | Docker + Nginx + GitLab CI |

### 核心功能
- **Phantom 钱包连接**：检测安装状态、超时处理、移动端深度链接
- **支付二维码**：调用后端 API 生成 → POS 扫码 → WebSocket 推送支付请求 → 用户签名确认
- **交易记录**：分页加载、按日期分组、退款记录展开、骨架屏
- **钱包签名认证**：连接钱包后签名 → 获取 JWT Token → 自动刷新
- **用户协议**：首次使用确认协议
- **WebSocket 心跳**：30s 间隔 ping，10s 无 pong 断连

### 后端 API（qa-pay-api.weajp.com）
| 端点 | 说明 |
|------|------|
| `POST /api/v1/createqr` | 生成支付二维码 |
| `GET /api/v1/order/list` | 获取订单列表 |
| `POST /api/v1/auth/get_token` | 钱包签名认证获取 Token |
| `GET /api/v1/query-agreement-status` | 查询协议状态 |
| `POST /api/v1/accept-agreement` | 确认协议 |
| `POST /api/signTx` | 提交签名交易 |

### 部署架构
Docker 多阶段构建 → Nginx（HTTPS + 静态资源 + SPA 路由） → GitLab CI/CD 自动部署

---

## 4. qr-wallet

### 概述
QR 钱包项目的**环境配置模板**，目前仅包含 `.env` 配置文件，无实际源代码。

### 配置信息
| 变量 | 说明 |
|------|------|
| `REACT_APP_CLIENT_ID` | API 客户端 ID |
| `REACT_APP_CLIENT_SECRET` | API 客户端密钥 |
| `REACT_APP_API_BASE_URL` | API 地址（https://pay.8lab.cn） |
| `REACT_APP_PAY_BASE_URL` | 支付服务地址（内网 172.19.23.172:41023） |
| `REACT_APP_WS_URL` | WebSocket 地址（wss://pay.8lab.cn） |

> 注意：此目录只有环境配置文件，缺少源代码，可能是尚未开发或代码存放在其他位置。

---

## 5. SolanaRelayService

### 概述
Solana **费用赞助服务（Fee Payer / Gas Relay）**，实现第三方代付 Gas 费的 USDC 转账。用户只需支付 USDC，Gas 费由服务端的 payer 账户承担。

### 技术栈
| 类别 | 技术 |
|------|------|
| 后端 | Express.js |
| 前端 | React 18 |
| 区块链 | @solana/web3.js、@solana/spl-token |
| 钱包 | @solana/wallet-adapter（Phantom） |
| RPC | Helius（Solana 主网） |

### 核心功能
- **交易构造**：后端构造包含 USDC Transfer + Memo 的部分签名交易
- **Fee Payer 签名**：服务端用 payer 私钥为交易签名，代付 Gas
- **ATA 自动创建**：自动检查并创建关联代币账户
- **Memo 支持**：交易中可附加备注（最长 566 字节 UTF-8）
- **前端交互**：连接 Phantom → 构造交易 → 用户签名 → 后端赞助签名 → 广播

### API 端点（端口 3001）
| 端点 | 说明 |
|------|------|
| `POST /api/construct-tx` | 构造部分签名交易（返回 base64 序列化交易） |
| `POST /api/sponsor-tx` | Payer 签名 + 广播交易（返回签名和浏览器链接） |

### 关键流程
```
前端构造请求 → 后端构造交易（USDC Transfer + Memo） → 返回序列化交易
     ↓
前端 Phantom 签名 → 发送已签名交易到后端
     ↓
后端 Payer 补充签名 → 广播到 Solana 主网 → 返回交易链接
```

### USDC 合约
Solana 主网：`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

---

## 6. wallet-pay-demo

### 概述
EVM 链扫码支付的**最小可行演示**，展示完整的 Web3 支付流程：用户生成支付二维码 → 商家扫码 → 通过 MetaMask 确认交易。

### 技术栈
| 类别 | 技术 |
|------|------|
| 后端 | Express.js + Socket.IO + UUID |
| 前端 | 原生 HTML/CSS/JS + Axios + QRCode.js |
| 实时通信 | Socket.IO（WebSocket） |
| 钱包 | MetaMask（EIP-1193） |

### 核心功能
- **订单管理**：创建订单、查询状态、生命周期管理（created → pay_requested → paid）
- **用户端（DApp）**：填写支付信息 → 生成二维码 → 接收支付请求 → MetaMask 确认交易
- **商家端（Merchant）**：粘贴二维码 JSON → 连接订单 → 填写收款信息 → 发起支付请求
- **实时同步**：WebSocket 房间机制，支付状态实时推送

### API 端点（端口 8787）
| 端点 | 说明 |
|------|------|
| `POST /api/orders` | 创建订单 |
| `GET /api/orders/:orderId` | 查询订单 |
| `POST /api/orders/:orderId/request-pay` | 发起支付请求 |
| `POST /api/orders/:orderId/paid` | 支付完成回传 txHash |

### 支付流程
```
[DApp 用户] 生成支付二维码（含 orderId）
     ↓
[商家] 扫码 → join_order WebSocket 房间
     ↓
[商家] 填写收款信息 → request-pay
     ↓
[后端] 广播 pay_requested 到房间
     ↓
[DApp 用户] 收到请求 → MetaMask 弹窗确认 → 获得交易哈希
     ↓
[DApp 用户] 回传交易哈希 → 状态更新为已支付 → 广播给商家
```

### 局限性
- 数据存储在内存中，重启丢失
- 交易仅在钱包中模拟，不真正上链
- 缺乏认证和安全校验

---

## 各项目对比总结

| 维度 | crypto-wallet-app | native-wallet | qr-old | SolanaRelayService | wallet-pay-demo |
|------|-------------------|---------------|--------|--------------------|-----------------|
| **定位** | 通用 USDC 钱包 | 多链支付钱包 | 生产级扫码支付 | Gas 赞助服务 | 支付流程演示 |
| **平台** | Expo 跨平台 | React Native | Web（React） | Web（前后端） | Web（原生 JS） |
| **链** | EVM（4链） | EVM + Solana | Solana | Solana | EVM |
| **钱包** | 内置管理 | 内置管理 | Phantom | Phantom | MetaMask |
| **二维码** | 生成+扫描 | 生成 | 生成 | 无 | 生成 |
| **实时通信** | 无 | WebSocket | WebSocket（心跳） | 无 | Socket.IO |
| **成熟度** | Demo | Demo | **生产级** | Demo | Demo |
| **部署** | 未部署 | 未部署 | Docker+Nginx+CI | 未部署 | 未部署 |
