# Native Wallet 快速开始

## 5 分钟快速启动指南

### 准备工作

确保已安装：
- Node.js 18+
- npm 或 yarn
- iOS: Xcode + CocoaPods
- Android: Android Studio + JDK 11+

### 安装

\`\`\`bash
# 1. 进入项目目录
cd native-wallet

# 2. 安装依赖
npm install

# 3. iOS 安装 Pods（仅 macOS）
cd ios && pod install && cd ..

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，至少配置一个 RPC 节点
\`\`\`

### 运行

#### iOS (仅 macOS)

\`\`\`bash
npm run ios
\`\`\`

#### Android

\`\`\`bash
npm run android
\`\`\`

### 首次使用

1. 启动应用后选择"创建新钱包"
2. **重要**: 抄写并保存 12 个助记词
3. 确认已备份后进入主界面
4. 在首页查看钱包地址和余额
5. 在"收款码"标签生成二维码

### 配置说明

编辑 `.env` 文件：

\`\`\`env
# 必填：WebSocket 服务器（如果需要支付功能）
WS_URL=wss://your-backend.com/ws

# 必填：至少配置一个 RPC 节点
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 可选：其他链的 RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
\`\`\`

### 获取测试币

测试网水龙头：
- Sepolia ETH: https://sepoliafaucet.com/
- BSC Testnet: https://testnet.binance.org/faucet-smart
- Solana Devnet: https://solfaucet.com/

### 常见问题

**Q: Metro Bundler 报错？**
\`\`\`bash
npm start -- --reset-cache
\`\`\`

**Q: iOS 构建失败？**
\`\`\`bash
cd ios
pod deintegrate && pod install
cd ..
\`\`\`

**Q: Android 构建失败？**
\`\`\`bash
cd android
./gradlew clean
cd ..
\`\`\`

**Q: 看不到余额？**
- 检查 RPC 配置是否正确
- 确保网络连接正常
- 检查是否选择了正确的网络

### 下一步

- 📖 阅读 [完整文档](README.md)
- 🏗️ 查看 [架构设计](ARCHITECTURE.md)
- 🔌 了解 [API 接口](API_DOCUMENTATION.md)
- ⚙️ 详细 [部署指南](SETUP_GUIDE.md)

### 安全提示

⚠️ **重要**:
- 助记词是恢复钱包的唯一方式
- 请勿截图或通过网络传输
- 先在测试网充分测试
- 生产环境使用前进行安全审计

### 支持的功能

✅ 创建/导入钱包
✅ 多链支持（ETH, BSC, Polygon, Solana）
✅ 余额查询
✅ 二维码收款
✅ WebSocket 实时通信
✅ 交易历史（需后端支持）

### 开发中功能

🚧 代币支持（ERC-20/SPL）
🚧 发送交易界面
🚧 交易加速/取消
🚧 NFT 支持

---

需要帮助？查看完整文档或提交 Issue。

