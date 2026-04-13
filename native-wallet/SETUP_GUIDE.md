# Native Wallet 部署指南

## 快速开始

### 前置要求

确保您的开发环境已安装以下工具：

#### macOS (iOS + Android 开发)

1. **Node.js 和 npm**
   \`\`\`bash
   # 使用 Homebrew 安装
   brew install node
   # 或从官网下载: https://nodejs.org/
   \`\`\`

2. **Watchman** (可选但推荐)
   \`\`\`bash
   brew install watchman
   \`\`\`

3. **iOS 开发环境**
   - 安装 Xcode (从 App Store)
   - 安装 Xcode Command Line Tools:
     \`\`\`bash
     xcode-select --install
     \`\`\`
   - 安装 CocoaPods:
     \`\`\`bash
     sudo gem install cocoapods
     \`\`\`

4. **Android 开发环境**
   - 安装 Android Studio
   - 安装 Android SDK (API 33+)
   - 安装 Java JDK 11+
   - 配置环境变量:
     \`\`\`bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     \`\`\`

#### Windows (仅 Android 开发)

1. 安装 Node.js 和 npm
2. 安装 Android Studio
3. 安装 Java JDK 11+
4. 配置 ANDROID_HOME 环境变量

#### Linux (仅 Android 开发)

1. 安装 Node.js
2. 安装 Android Studio
3. 安装 Java JDK 11+
4. 配置环境变量

## 详细安装步骤

### 1. 获取项目代码

\`\`\`bash
cd native-wallet
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

如果遇到依赖安装问题，可以尝试：

\`\`\`bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
\`\`\`

### 3. 配置环境变量

#### 创建 .env 文件

\`\`\`bash
cp .env.example .env
\`\`\`

#### 获取 RPC 节点

**Ethereum (推荐使用 Infura 或 Alchemy)**

1. 注册 Infura 账号: https://infura.io/
2. 创建新项目
3. 获取 Project ID
4. 在 .env 中配置:
   \`\`\`
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
   ETHEREUM_TESTNET_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   \`\`\`

**其他公共 RPC 节点**

- BSC: https://bsc-dataseed1.binance.org
- Polygon: https://polygon-rpc.com
- Solana: https://api.mainnet-beta.solana.com

### 4. iOS 特定步骤

\`\`\`bash
# 安装 iOS 依赖
cd ios
pod install
cd ..
\`\`\`

如果遇到 Pod 安装问题：

\`\`\`bash
# 清理 Pod 缓存
cd ios
pod cache clean --all
rm -rf Pods Podfile.lock
pod install
cd ..
\`\`\`

### 5. Android 特定步骤

#### 生成调试密钥

Android 调试密钥会自动生成，但如果需要手动生成：

\`\`\`bash
cd android/app
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
cd ../..
\`\`\`

#### 启动模拟器

\`\`\`bash
# 列出可用模拟器
emulator -list-avds

# 启动模拟器
emulator -avd YOUR_AVD_NAME
\`\`\`

## 运行应用

### Metro Bundler

首先启动 Metro 开发服务器：

\`\`\`bash
npm start
# 或
npx react-native start
\`\`\`

### iOS

在新终端窗口：

\`\`\`bash
# 运行在默认模拟器
npm run ios

# 指定设备
npm run ios -- --simulator="iPhone 15 Pro"

# 运行在真机
npm run ios -- --device

# 清理构建并重新运行
cd ios
xcodebuild clean
cd ..
npm run ios
\`\`\`

### Android

在新终端窗口：

\`\`\`bash
# 运行在连接的设备或模拟器
npm run android

# 清理构建
cd android
./gradlew clean
cd ..
npm run android
\`\`\`

## 常见问题解决

### 1. Metro Bundler 错误

\`\`\`bash
# 清理 Metro 缓存
npm start -- --reset-cache
\`\`\`

### 2. iOS 构建失败

\`\`\`bash
# 清理 Xcode 缓存
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate
pod install
cd ..
\`\`\`

### 3. Android 构建失败

\`\`\`bash
# 清理 Gradle 缓存
cd android
./gradlew clean
cd ..

# 如果还有问题，删除 .gradle 文件夹
rm -rf android/.gradle
\`\`\`

### 4. 依赖冲突

\`\`\`bash
# 重新安装所有依赖
rm -rf node_modules package-lock.json
npm install
\`\`\`

### 5. Solana 相关错误

如果遇到 `ed25519-hd-key` 或 Buffer 相关错误：

\`\`\`bash
# 确保已安装 polyfills
npm install react-native-get-random-values buffer
\`\`\`

## 生产环境构建

### iOS

1. 打开 Xcode
2. 选择 Product -> Archive
3. 上传到 App Store Connect

或使用命令行：

\`\`\`bash
cd ios
xcodebuild -workspace NativeWallet.xcworkspace -scheme NativeWallet -configuration Release archive -archivePath build/NativeWallet.xcarchive
\`\`\`

### Android

生成签名 APK：

\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

APK 文件位于: `android/app/build/outputs/apk/release/app-release.apk`

生成 AAB (用于 Google Play):

\`\`\`bash
cd android
./gradlew bundleRelease
\`\`\`

AAB 文件位于: `android/app/build/outputs/bundle/release/app-release.aab`

## 调试技巧

### 启用调试菜单

- **iOS**: Command + D (模拟器) / 摇动设备
- **Android**: Command + M (模拟器) / 摇动设备

### 查看日志

\`\`\`bash
# iOS 日志
npx react-native log-ios

# Android 日志
npx react-native log-android

# 或使用 adb
adb logcat
\`\`\`

### React DevTools

\`\`\`bash
npm install -g react-devtools
react-devtools
\`\`\`

## 性能优化

### 启用 Hermes

Hermes 已在配置中默认启用，可提升应用性能。

### 减小包体积

\`\`\`bash
# Android - 启用 ProGuard
# 编辑 android/app/build.gradle
def enableProguardInReleaseBuilds = true
\`\`\`

## 测试建议

1. **先在测试网测试**
   - 将 `.env` 中的 RPC URL 改为测试网
   - 从水龙头获取测试代币
   - 充分测试所有功能

2. **小额测试**
   - 主网首次使用时，先用小额测试
   - 确认功能正常后再进行大额操作

3. **备份测试**
   - 测试助记词导入功能
   - 确保能正确恢复钱包

## 后端服务对接

### WebSocket 服务器要求

- 支持 WSS 协议（生产环境必须）
- 实现消息格式（参考 README.md）
- 处理心跳保活
- 支持重连机制

### 测试 WebSocket 连接

可以使用 wscat 工具测试：

\`\`\`bash
npm install -g wscat
wscat -c wss://your-backend-service.com/ws
\`\`\`

## 安全检查清单

- [ ] 已修改所有默认配置
- [ ] 使用 HTTPS/WSS
- [ ] 配置了正确的 RPC 节点
- [ ] 测试网充分测试
- [ ] 备份功能正常工作
- [ ] 助记词安全提示到位
- [ ] 生产环境使用加密存储（推荐）

## 获取帮助

如果遇到问题：

1. 查看 [React Native 文档](https://reactnative.dev/)
2. 查看 [ethers.js 文档](https://docs.ethers.org/)
3. 查看 [Solana Web3.js 文档](https://solana-labs.github.io/solana-web3.js/)
4. 提交 Issue

祝您部署顺利！🚀

