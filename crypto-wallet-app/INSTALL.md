# 安装指南

## 解决依赖安装问题

### 方法1：使用安装脚本（推荐）

```bash
# 运行安装脚本
./install.sh
```

### 方法2：手动安装

```bash
# 1. 清理缓存和旧文件
npm cache clean --force
rm -rf node_modules package-lock.json yarn.lock

# 2. 设置正确的npm镜像源
npm config set registry https://registry.npmjs.org/

# 3. 安装依赖
npm install
```

### 方法3：使用yarn

```bash
# 1. 清理缓存
yarn cache clean

# 2. 设置yarn镜像源
yarn config set registry https://registry.npmjs.org/

# 3. 安装依赖
yarn install
```

## 常见问题解决

### 问题1：expo-qr-code 包不存在
**解决方案**：已从package.json中移除此包，使用react-native-qrcode-svg替代

### 问题2：react-native-camera 兼容性问题
**解决方案**：已替换为expo-camera，更稳定且兼容性更好

### 问题3：网络连接问题
**解决方案**：
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com/
# 或
yarn config set registry https://registry.npmmirror.com/
```

### 问题4：权限问题
**解决方案**：
```bash
# 给安装脚本执行权限
chmod +x install.sh
```

## 验证安装

安装完成后，运行以下命令验证：

```bash
# 启动开发服务器
npm start

# 如果成功，你应该看到Expo开发工具界面
```

## 下一步

1. 配置API密钥（见README.md）
2. 运行项目：`npm start`
3. 在手机或模拟器上测试应用

## 技术支持

如果遇到其他问题，请检查：
1. Node.js版本（需要16+）
2. 网络连接
3. 防火墙设置
4. 代理配置
