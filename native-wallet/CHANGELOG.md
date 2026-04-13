# 更新日志

本文件记录了 Native Wallet 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-10-21

### 新增功能

#### 核心功能
- 🎉 首个正式版本发布
- 💼 完整的钱包管理系统
  - 助记词生成（12 个单词）
  - 钱包创建和导入
  - 多钱包管理
  - 安全备份流程

#### 区块链支持
- 🌐 多链支持
  - Ethereum (ETH) - 主网和 Sepolia 测试网
  - BNB Smart Chain (BSC) - 主网和测试网
  - Polygon (MATIC) - 主网和 Mumbai 测试网
  - Arbitrum One
  - Optimism
  - Solana (SOL) - 主网、测试网、开发网

#### 功能特性
- 📱 二维码收款功能
  - 生成钱包收款二维码
  - 包含钱包地址和链信息
  - 支持商家 POS 机扫描

- 💰 余额查询
  - 实时余额更新
  - 下拉刷新
  - 多链余额显示

- 🔗 WebSocket 集成
  - 长连接管理
  - 自动重连机制
  - 心跳保活
  - 支付请求接收
  - 交易状态推送

- 📊 交易历史
  - 交易记录界面
  - 交易状态显示
  - 支持分页加载（待后端实现）

#### 用户界面
- 🎨 现代化 UI 设计
  - 欢迎页面
  - 创建钱包流程
  - 导入钱包流程
  - 助记词备份页面
  - 主页（余额和钱包列表）
  - 二维码收款页
  - 交易历史页

- 🧩 可复用组件
  - Button 按钮组件
  - Input 输入框组件
  - 统一的样式系统

#### 技术实现
- ⚙️ 环境配置系统
  - .env 环境变量支持
  - RPC 节点可配置
  - 测试网/主网切换

- 🔐 安全特性
  - BIP39 标准助记词
  - BIP44 密钥派生
  - 本地安全存储
  - 交易签名

- 📱 跨平台支持
  - iOS 完整支持
  - Android 完整支持
  - 统一的业务逻辑

#### 文档
- 📚 完整的项目文档
  - README.md - 项目说明
  - QUICKSTART.md - 快速开始
  - SETUP_GUIDE.md - 详细部署指南
  - ARCHITECTURE.md - 架构文档
  - API_DOCUMENTATION.md - API 接口文档
  - PROJECT_OVERVIEW.md - 项目概览
  - CHANGELOG.md - 更新日志

### 技术栈

#### 核心框架
- React Native 0.73.2
- TypeScript 5.3.3
- React Navigation 6.x

#### 区块链
- ethers.js 6.10.0 - EVM 链
- @solana/web3.js 1.87.6 - Solana
- bip39 3.1.0 - 助记词
- ed25519-hd-key 1.3.0 - Solana 密钥派生

#### UI 组件
- react-native-qrcode-svg - 二维码
- react-native-svg - SVG 支持

#### 存储
- @react-native-async-storage/async-storage

#### 加密
- crypto-browserify
- react-native-get-random-values

### 已知限制

- ⚠️ 仅支持原生代币（ETH, BNB, MATIC, SOL 等）
- ⚠️ 暂未实现发送交易 UI
- ⚠️ 交易历史依赖后端 API
- ⚠️ 使用 AsyncStorage 存储（建议生产环境使用加密存储）
- ⚠️ 部分 RPC 端点需要 API Key

### 安全提示

- ⚠️ 助记词未加密存储（开发版本）
- ⚠️ 生产环境必须使用 Keychain/Keystore
- ⚠️ 建议添加生物识别认证
- ⚠️ 请在测试网充分测试后再使用主网

## [未来计划]

### v1.1.0 - 计划中
- [ ] ERC-20 代币支持
- [ ] SPL 代币支持
- [ ] 发送交易 UI
- [ ] 交易确认对话框
- [ ] Gas 费用选择
- [ ] 地址簿功能

### v1.2.0 - 计划中
- [ ] 生物识别认证
- [ ] 应用锁定功能
- [ ] 交易加速和取消
- [ ] 多语言支持（英文、中文）
- [ ] 暗黑模式
- [ ] 货币单位切换

### v1.3.0 - 计划中
- [ ] NFT 查看和转账
- [ ] DApp 浏览器
- [ ] WalletConnect 集成
- [ ] 硬件钱包支持
- [ ] 社交恢复

### v2.0.0 - 长期规划
- [ ] DeFi 协议集成
- [ ] 跨链桥接
- [ ] Swap 功能
- [ ] Staking 功能
- [ ] DAO 治理参与

## 贡献者

感谢所有为项目做出贡献的开发者！

## 支持

如果您遇到问题或有功能建议，请：
1. 查看文档
2. 搜索已有 Issues
3. 创建新 Issue

---

**最后更新**: 2025-10-21

