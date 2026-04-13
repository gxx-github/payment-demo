const { override } = require('customize-cra');

module.exports = override(
    (config) => {
        // 移除 source-map-loader，因为它会导致第三方库的警告
        if (config.module && config.module.rules) {
            config.module.rules = config.module.rules.filter(
                (rule) => {
                    // 过滤掉包含 source-map-loader 的规则
                    if (rule.enforce === 'pre') {
                        if (rule.loader && typeof rule.loader === 'string' && rule.loader.includes('source-map-loader')) {
                            return false;
                        }
                        if (rule.use && Array.isArray(rule.use)) {
                            const hasSourceMapLoader = rule.use.some(
                                (loader) => {
                                    if (typeof loader === 'object' && loader !== null && loader.loader) {
                                        return typeof loader.loader === 'string' && loader.loader.includes('source-map-loader');
                                    }
                                    return false;
                                }
                            );
                            if (hasSourceMapLoader) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
            );
        }

        // 也通过 ignoreWarnings 作为备用方案（webpack 5 支持）
        if (!config.ignoreWarnings) {
            config.ignoreWarnings = [];
        }
        config.ignoreWarnings.push(
            /Failed to parse source map/,
            /ENOENT: no such file or directory/,
        );

        return config;
    }
);