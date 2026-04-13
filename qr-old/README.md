# QR Wallet (Solana)

一个基于 Solana 的钱包应用，主要用于 POS 扫码支付场景。用户可以连接钱包、展示收款二维码，并查看交易记录。

## 功能特性

- ✅ 连接 Phantom 钱包（使用 Wallet Adapter）
- ✅ 展示钱包地址二维码（用于 POS 扫码支付）
- ✅ 查看交易记录（Activity List），支持分页
- ✅ 移动端自适应布局（响应式设计）
- ✅ 暗色主题界面
- ✅ 未连接钱包状态提示

## 技术栈

- **React 18** + Create React App (react-scripts 5.0.1)
- **@solana/web3.js** - Solana 区块链交互
- **@solana/wallet-adapter-react** - 钱包适配器 React Hook
- **@solana/wallet-adapter-react-ui** - 钱包 UI 组件
- **@solana/wallet-adapter-phantom** - Phantom 钱包支持
- **styled-components** - CSS-in-JS 样式方案
- **qrcode.react** - 二维码生成（使用 QRCodeSVG）
- **react-app-rewired** + **customize-cra** - Webpack 配置自定义

## 项目结构

```
qr-wallet/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx                    # 主应用组件，包含 Provider 配置
│   ├── index.jsx                  # 应用入口
│   ├── components/
│   │   ├── Header.jsx             # 页面顶部 Logo (WEA)
│   │   ├── WalletConnect.jsx     # 钱包连接按钮组件
│   │   ├── AddressQR.jsx          # 地址二维码展示组件
│   │   ├── ActivityList.jsx       # 交易记录列表（支持分页）
│   │   ├── BalancePanel.jsx       # 余额查询组件（暂未使用）
│   │   ├── TransferForm.jsx       # 转账表单组件（暂未使用）
│   │   ├── WebSocketPanel.jsx     # WebSocket 面板组件（暂未使用）
│   │   └── styled/
│   │       └── Layout.jsx         # 通用样式组件
│   └── utils/
│       └── base64.js              # base64 与 Uint8Array 互转工具
├── config-overrides.js            # Webpack 配置覆盖（禁用 source map 警告）
├── package.json
└── README.md
```

## 页面布局

### 未连接钱包状态
- 顶部显示 "WEA" Logo
- 中央显示 "W" 占位符和提示文字
- 底部显示 "Connect Wallet" 按钮

### 已连接钱包状态
- **顶部**：WEA Logo（固定头部）
- **内容区域**（单列布局）：
  - **钱包连接区域**：显示已连接的钱包信息
  - **二维码区域**：居中显示钱包地址二维码
  - **交易记录区域**：显示 Activity 列表，支持分页

## 开发运行

### 安装依赖

```bash
cd qr-wallet
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm start
# 或
yarn start
```

应用将在 `http://localhost:3000` 启动。

### 其他端口

```bash
# 使用端口 3001
npm run start:3001
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建产物在 `build/` 目录。

## 配置说明

### 环境变量配置

项目需要配置以下环境变量（必须以 `REACT_APP_` 开头）：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `REACT_APP_API_BASE_URL` | ⚠️ | API 基础 URL（默认空字符串） |
| `REACT_APP_PAY_BASE_URL` | ⚠️ | 支付 API 基础 URL（默认空字符串） |
| `REACT_APP_WS_URL` | ⚠️ | WebSocket URL（默认空字符串） |

#### 本地开发配置

在项目根目录创建 `.env` 文件（已加入 `.gitignore`）：

```bash
REACT_APP_API_BASE_URL=
REACT_APP_PAY_BASE_URL=
REACT_APP_WS_URL=
```

配置完成后重启开发服务器：
```bash
npm start
```

#### 生产环境部署

详细的环境变量配置和部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)，包括：
- Vercel / Netlify 部署配置
- Docker 部署配置
- CI/CD 配置（GitHub Actions）
- 服务器部署配置
- 故障排查指南

### RPC 端点

默认使用 QuickNode 主网 RPC。如需更换，修改 `src/App.jsx` 中的 `endpoint` 常量：

```javascript
const endpoint = 'https://your-rpc-endpoint.com';
```

### Webpack 配置

项目使用 `react-app-rewired` 自定义 Webpack 配置：
- `config-overrides.js` - 禁用 source map loader 警告
- 默认关闭 source map 生成（生产构建）

## 组件说明

### Header
页面顶部 Logo 组件，显示 "WEA" 品牌标识。

### WalletConnect
钱包连接按钮，使用 `WalletMultiButton` 组件，支持连接/断开钱包操作。

### AddressQR
地址二维码展示组件：
- 当钱包连接后显示钱包地址的二维码
- 使用 `QRCodeSVG` 组件渲染
- 同时显示完整地址文本（可复制）

### ActivityList
交易记录列表组件：
- 支持分页显示（默认每页 10 条）
- 按日期分组显示交易记录
- 目前使用 mock 数据（可替换为真实 API 数据）
- 显示交易类型、状态、金额等信息


