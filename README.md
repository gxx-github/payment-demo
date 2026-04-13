# MetaMask QR Payment Demo

加密货币扫码支付方案的演示项目合集，涵盖钱包管理、二维码支付、Gas 赞助服务等完整链路，支持 EVM 链和 Solana。

## 子项目

| 项目 | 说明 | 链 | 技术栈 |
|------|------|-----|--------|
| [crypto-wallet-app](./crypto-wallet-app) | 跨平台 USDC 钱包（创建/导入/转账/二维码） | EVM（ETH/Polygon/BSC/Arbitrum） | Expo + ethers.js |
| [native-wallet](./native-wallet) | 多链移动钱包 + WebSocket 实时支付 | EVM + Solana | React Native + TypeScript |
| [qr-old](./qr-old) | Solana POS 扫码支付前端（已部署） | Solana | React + Phantom + Docker |
| [qr-wallet](./qr-wallet) | 扫码支付环境配置模板 | - | 仅 .env 配置 |
| [SolanaRelayService](./SolanaRelayService) | Solana Gas 赞助服务（Fee Payer） | Solana | Express + React + Phantom |
| [wallet-pay-demo](./wallet-pay-demo) | EVM 扫码支付最小演示 | EVM | Express + Socket.IO + MetaMask |

## 快速开始

各子项目独立运行，进入对应目录安装依赖即可：

```bash
cd <子项目目录>
npm install  # 或 yarn
npm start
```

### 各项目启动方式

**crypto-wallet-app**
```bash
cd crypto-wallet-app
yarn install
npx expo start
```

**native-wallet**
```bash
cd native-wallet
yarn install
# iOS
npx react-native run-ios
# Android
npx react-native run-android
```

**qr-old**
```bash
cd qr-old
yarn install
yarn start  # 开发模式
# 或 Docker 部署
docker-compose up --build
```

**SolanaRelayService**
```bash
# 后端
cd SolanaRelayService/backend
yarn install
node server.js  # 端口 3001

# 前端
cd SolanaRelayService/frontend
yarn install
yarn start
```

**wallet-pay-demo**
```bash
cd wallet-pay-demo
npm install
node server/server.js  # 端口 8787
# 访问 http://localhost:8787/dapp/ (用户端)
# 访问 http://localhost:8787/merchant/ (商家端)
```

## 支付流程概览

```
用户钱包生成支付二维码 → 商家/POS 扫码 → 通过 WebSocket 推送支付请求
→ 用户在钱包中确认签名 → 交易上链 → 支付完成
```

详细功能分析见 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)。

## 钱包支持

- **MetaMask** — EVM 链钱包（wallet-pay-demo 使用）
- **Phantom** — Solana 钱包（qr-old、SolanaRelayService 使用）
- **内置钱包** — crypto-wallet-app 和 native-wallet 自行管理密钥

## License

MIT
