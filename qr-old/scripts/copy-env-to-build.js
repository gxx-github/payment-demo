const fs = require('fs');
const path = require('path');

/**
 * 将 .env 文件转换为 config.json 并复制到 build 目录
 * 这个脚本在构建后运行，允许运行时动态读取配置
 */
function copyEnvToBuild() {
    const envPath = path.join(__dirname, '..', '.env');
    const buildDir = path.join(__dirname, '..', 'build');
    const configPath = path.join(buildDir, 'config.json');

    // 检查 build 目录是否存在
    if (!fs.existsSync(buildDir)) {
        console.error('❌ Build 目录不存在，请先运行 npm run build');
        process.exit(1);
    }

    // 检查 .env 文件是否存在
    if (!fs.existsSync(envPath)) {
        console.warn('⚠️  .env 文件不存在，跳过生成 config.json');
        // 创建一个空的 config.json，避免运行时错误
        fs.writeFileSync(configPath, JSON.stringify({
            REACT_APP_API_BASE_URL: '',
            REACT_APP_PAY_BASE_URL: '',
            REACT_APP_WS_URL: ''
        }, null, 2));
        console.log('✅ 已创建空的 config.json');
        return;
    }

    // 读取 .env 文件
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const config = {};

    // 解析 .env 文件
    envContent.split('\n').forEach(line => {
        // 跳过注释和空行
        line = line.trim();
        if (!line || line.startsWith('#')) {
            return;
        }

        // 解析 KEY=VALUE 格式
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let key = match[1].trim();
            let value = match[2].trim();

            // 处理 REACT_APP_ 开头的环境变量
            if (key.startsWith('REACT_APP_')) {
                // 移除引号
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // 还原转义的字符（如 \$ 还原为 $）
                value = value.replace(/\\\$/g, '$');

                config[key] = value;
            }
        }
    });

    // 确保必要的字段存在
    if (!config.REACT_APP_API_BASE_URL) { config.REACT_APP_API_BASE_URL = ''; }
    if (!config.REACT_APP_PAY_BASE_URL) { config.REACT_APP_PAY_BASE_URL = ''; }
    if (!config.REACT_APP_WS_URL) { config.REACT_APP_WS_URL = ''; }

    // 写入 config.json
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log('✅ 已成功将 .env 文件转换为 config.json 并复制到 build 目录');
    console.log(`   📁 配置文件位置: ${configPath}`);
    console.log(`   🔑 包含配置项: ${Object.keys(config).join(', ')}`);
}

// 执行
copyEnvToBuild();