# Native Wallet 安装指南

## 🚀 快速安装（5分钟）

### 第一步：安装依赖

\`\`\`bash
cd /Users/gxx/Desktop/native-wallet
npm install
\`\`\`

### 第二步：配置环境变量

\`\`\`bash
# 创建环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置 RPC 节点
# 至少需要配置 ETHEREUM_RPC_URL 和 SOLANA_RPC_URL
\`\`\`

**推荐的 RPC 服务商**:
- Infura: https://infura.io/ (免费)
- Alchemy: https://www.alchemy.com/ (免费)
- QuickNode: https://www.quicknode.com/ (免费套餐)

### 第三步（iOS）：安装 Pods

\`\`\`bash
cd ios
pod install
cd ..
\`\`\`

### 第四步：运行应用

**iOS**:
\`\`\`bash
npm run ios
\`\`\`

**Android**:
\`\`\`bash
# 确保 Android 模拟器已启动或设备已连接
npm run android
\`\`\`

## ⚙️ 详细配置

### 环境变量说明

编辑 `.env` 文件：

\`\`\`env
# WebSocket 服务器（可选，如果不需要支付功能可暂时不配置）
WS_URL=wss://your-backend.com/ws

# Ethereum（必填）
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_TESTNET_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# BSC（可选，使用公共节点）
BSC_RPC_URL=https://bsc-dataseed1.binance.org
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Polygon（可选，使用公共节点）
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_TESTNET_RPC_URL=https://rpc-mumbai.maticvigil.com

# Arbitrum（可选，使用公共节点）
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Optimism（可选，使用公共节点）
OPTIMISM_RPC_URL=https://mainnet.optimism.io

# Solana（必填）
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_TESTNET_RPC_URL=https://api.testnet.solana.com
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com

# 后端 API（可选）
API_BASE_URL=http://localhost:3000/api

# 应用配置
APP_ENV=development
ENABLE_TESTNET=true
\`\`\`

## 🔧 故障排除

### Metro Bundler 问题

\`\`\`bash
# 清理缓存
npm start -- --reset-cache

# 或删除缓存目录
rm -rf /tmp/metro-*
\`\`\`

### iOS 构建问题

\`\`\`bash
# 清理 Xcode 缓存
rm -rf ~/Library/Developer/Xcode/DerivedData

# 重新安装 Pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
\`\`\`

### Android 构建问题

\`\`\`bash
# 清理 Gradle
cd android
./gradlew clean
cd ..

# 如果还有问题，删除 .gradle 文件夹
rm -rf android/.gradle
\`\`\`

### 依赖安装问题

\`\`\`bash
# 清理所有依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 如果使用 yarn
rm -rf node_modules yarn.lock
yarn install
\`\`\`

## 📱 获取测试币

在测试网测试应用功能：

### Ethereum Sepolia
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

### BSC Testnet
- https://testnet.binance.org/faucet-smart

### Polygon Mumbai
- https://faucet.polygon.technology/

### Solana Devnet
- https://solfaucet.com/

## ✅ 验证安装

启动应用后：

1. ✓ 看到欢迎页面
2. ✓ 点击"创建新钱包"
3. ✓ 看到 12 个助记词
4. ✓ 确认备份后进入主页
5. ✓ 主页显示钱包地址
6. ✓ 可以刷新余额（初始为 0）
7. ✓ 二维码标签可以显示收款码
8. ✓ 交易历史标签可以打开

## 🎯 下一步

1. **测试网测试**
   - 从水龙头获取测试币
   - 测试余额查询
   - 测试二维码功能

2. **后端集成**
   - 部署 WebSocket 服务器
   - 配置 WS_URL
   - 测试支付流程

3. **自定义配置**
   - 根据需要调整链配置
   - 配置自己的 RPC 节点
   - 自定义 UI 样式

4. **生产部署**
   - 实现加密存储
   - 添加生物识别
   - 进行安全审计
   - 准备发布

## 📚 更多资源

- 📖 [README.md](README.md) - 完整项目说明
- 🚀 [QUICKSTART.md](QUICKSTART.md) - 快速开始
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - 架构文档
- 🔌 [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API 文档
- 📝 [CHANGELOG.md](CHANGELOG.md) - 更新日志

## 💡 提示

- 开发时建议使用测试网
- 确保 .env 文件不被提交到 Git
- 定期备份助记词
- 主网使用前进行充分测试

---

安装遇到问题？查看 [SETUP_GUIDE.md](SETUP_GUIDE.md) 获取详细帮助。

