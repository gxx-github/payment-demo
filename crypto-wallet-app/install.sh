#!/bin/bash

echo "🚀 开始安装 Crypto Wallet App 依赖..."

# 清理缓存
echo "📦 清理 npm/yarn 缓存..."
npm cache clean --force
yarn cache clean

# 删除 node_modules 和 lock 文件
echo "🗑️ 清理旧的依赖文件..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# 使用 npm 安装依赖
echo "📥 使用 npm 安装依赖..."
npm install

# 检查安装结果
if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功！"
    echo ""
    echo "🎉 现在可以运行以下命令启动项目："
    echo "   npm start          # 启动开发服务器"
    echo "   npm run android    # 运行 Android 版本"
    echo "   npm run ios        # 运行 iOS 版本"
    echo "   npm run web        # 运行 Web 版本"
else
    echo "❌ 依赖安装失败，请检查网络连接或尝试以下解决方案："
    echo ""
    echo "🔧 解决方案："
    echo "1. 检查网络连接"
    echo "2. 尝试使用不同的镜像源："
    echo "   npm config set registry https://registry.npmjs.org/"
    echo "3. 或者使用 yarn："
    echo "   yarn install"
fi
