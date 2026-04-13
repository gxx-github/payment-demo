// 判断是否为生产构建（打包后的环境）
const isProductionBuild = process.env.NODE_ENV === 'production';

// 配置缓存（避免重复请求）
let configCache = null;
let configLoadingPromise = null;

/**
 * 从 build 目录的 config.json 文件读取配置（仅在生产构建时使用）
 * @returns {Promise<object>} 配置对象
 */
async function loadRuntimeConfig() {
    // 如果已经有缓存，直接返回
    if (configCache) {
        return configCache;
    }

    // 如果正在加载，返回加载中的 Promise
    if (configLoadingPromise) {
        return configLoadingPromise;
    }

    // 开始加载配置
    configLoadingPromise = (async() => {
        try {
            const response = await fetch('/config.json');
            if (!response.ok) {
                throw new Error(`Failed to load config.json: ${response.status}`);
            }
            const config = await response.json();

            // 缓存配置
            configCache = config;

            return config;
        } catch (error) {
            console.error('❌ Failed to load config.json:', error);
            // 返回空配置，避免阻塞应用
            configCache = {
                REACT_APP_API_BASE_URL: '',
                REACT_APP_PAY_BASE_URL: '',
                REACT_APP_WS_URL: ''
            };
            return configCache;
        } finally {
            configLoadingPromise = null;
        }
    })();

    return configLoadingPromise;
}

/**
 * 获取配置值（支持开发模式和生产构建）
 * @param {string} key - 配置键名
 * @returns {Promise<string>} 配置值
 */
export async function getConfigValue(key) {
    // 开发模式：从 process.env 读取
    if (!isProductionBuild) {
        return process.env[key] || '';
    }

    // 生产构建：从 config.json 读取（使用缓存机制）
    const config = await loadRuntimeConfig();
    return config[key] || '';
}

// 获取环境变量配置（同步方式，用于初始化，开发模式）
// 使用 JWT Token 认证，不再需要 CLIENT_ID 和 CLIENT_SECRET
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
let PAY_BASE_URL = process.env.REACT_APP_PAY_BASE_URL || '';
let WS_BASE_URL = process.env.REACT_APP_WS_URL || '';

// 如果是生产构建，异步加载配置
if (isProductionBuild) {
    // 立即加载配置（不阻塞，使用空值作为初始值）
    loadRuntimeConfig().then(config => {
        // 使用 JWT Token 认证，不再需要 CLIENT_ID 和 CLIENT_SECRET
        API_BASE_URL = config.REACT_APP_API_BASE_URL || '';
        PAY_BASE_URL = config.REACT_APP_PAY_BASE_URL || '';
        WS_BASE_URL = config.REACT_APP_WS_URL || '';
    }).catch(err => {
        console.error('Failed to initialize runtime config:', err);
    });
}


/**
 * 获取 API 基础地址（支持开发/生产构建）
 * @returns {Promise<string>} - API Base URL，如 http://47.243.86.140:41023
 */
export async function getApiBaseUrl() {
    if (isProductionBuild) {
        return await getConfigValue('REACT_APP_PAY_BASE_URL');
    }
    return PAY_BASE_URL || '';
}

export async function getBackendApiBaseUrl() {
    if (isProductionBuild) {
        return await getConfigValue('REACT_APP_API_BASE_URL');
    }
    return API_BASE_URL || '';
}

/**
 * 获取 WebSocket 基础地址（如 wss://pay.8lab.cn）
 */
export async function getWsBaseUrl() {
    if (isProductionBuild) {
        return await getConfigValue('REACT_APP_WS_URL');
    }
    return WS_BASE_URL || '';
}

// Token 刷新函数注册机制
let tokenRefreshCallback = null;
let isRefreshing = false;
let refreshPromise = null;

/**
 * 注册 token 刷新回调函数
 * @param {Function} callback - 刷新 token 的函数，返回 Promise<void>
 */
export function registerTokenRefresh(callback) {
    tokenRefreshCallback = callback;
}

/**
 * 取消注册 token 刷新回调函数
 */
export function unregisterTokenRefresh() {
    tokenRefreshCallback = null;
}

/**
 * 检查响应是否为 token 过期错误
 * @param {Response} response - fetch Response 对象
 * @returns {Promise<boolean>} - 是否为 token 过期
 */
async function isTokenExpired(response) {
    try {
        const data = await response.clone().json();
        // 检测两种 token 过期情况：
        // 1. code: "40001", message: "Token authentication failure"
        // 2. code: "40002", message: "Token expired"
        return (data.code === '40001' && data.message === 'Token authentication failure') ||
            (data.code === '40002' && data.message === 'Token expired');
    } catch (error) {
        return false;
    }
}

/**
 * 创建带 Token 的请求（使用 JWT Token 认证）
 * @param {string} url - API 端点
 * @param {string} method - HTTP 方法
 * @param {object} data - 请求体数据
 * @param {boolean} retryOnExpired - 是否在 token 过期时自动重试（默认 true）
 * @returns {Promise<Response>} - fetch Response 对象
 */
export async function createAuthenticatedRequest(url, method = 'POST', data = {}, retryOnExpired = true) {
    // 导入 tokenManager
    const { getValidToken } = await
    import ('./tokenManager.js');

    // 获取 Token
    let token = getValidToken();
    if (!token) {
        throw new Error('No valid authentication token. Please connect wallet and sign in.');
    }

    // 获取 API 基础地址
    const currentApiBaseUrl = isProductionBuild ? (await getConfigValue('REACT_APP_API_BASE_URL')) : API_BASE_URL;

    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : `${currentApiBaseUrl}${url}`;

    // 将请求体转换为 JSON 字符串
    const requestBody = JSON.stringify(data);

    // 发送请求（使用 Authorization header）
    const makeRequest = async(authToken) => {
        return await fetch(fullUrl, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: requestBody,
        });
    };

    let response = await makeRequest(token);

    // 检查是否为 token 过期错误（code: 40001）
    if (retryOnExpired && await isTokenExpired(response)) {
        console.log('Token expired detected, attempting to refresh...');

        // 如果正在刷新，等待刷新完成
        if (isRefreshing && refreshPromise) {
            await refreshPromise;
            // 刷新后重新获取 token
            token = getValidToken();
            if (token) {
                // 重试请求
                response = await makeRequest(token);
                // 如果重试后仍然过期，抛出错误
                if (await isTokenExpired(response)) {
                    const { clearToken } = await
                    import ('./tokenManager.js');
                    clearToken();
                    throw new Error('Token refresh failed. Please reconnect wallet and sign in.');
                }
            } else {
                throw new Error('Token refresh failed. Please reconnect wallet and sign in.');
            }
        } else if (tokenRefreshCallback) {
            // 开始刷新 token
            isRefreshing = true;
            refreshPromise = (async() => {
                try {
                    await tokenRefreshCallback();
                } finally {
                    isRefreshing = false;
                    refreshPromise = null;
                }
            })();

            await refreshPromise;

            // 刷新后重新获取 token
            token = getValidToken();
            if (token) {
                // 重试请求（只重试一次，避免无限循环）
                response = await makeRequest(token);

                // 如果重试后仍然过期，抛出错误
                if (await isTokenExpired(response)) {
                    const { clearToken } = await
                    import ('./tokenManager.js');
                    clearToken();
                    throw new Error('Token refresh failed. Please reconnect wallet and sign in.');
                }
            } else {
                throw new Error('Token refresh failed. Please reconnect wallet and sign in.');
            }
        } else {
            // 没有注册刷新回调，清除 token 并抛出错误
            const { clearToken } = await
            import ('./tokenManager.js');
            clearToken();
            throw new Error('Token expired. Please reconnect wallet and sign in.');
        }
    }

    // 处理其他认证失败的情况（401, 403）
    if (response.status === 401 || response.status === 403) {
        // 如果不是 token 过期错误（已经处理过），则清除 token
        if (!(await isTokenExpired(response))) {
            const { clearToken } = await
            import ('./tokenManager.js');
            clearToken();
            const errorMessage = response.status === 403 ?
                'Access forbidden. Please reconnect wallet and sign in again.' :
                'Token expired. Please reconnect wallet.';
            throw new Error(errorMessage);
        }
    }

    return response;
}

/**
 * 创建带签名的请求（已废弃，保留用于向后兼容）
 * @deprecated 使用 createAuthenticatedRequest 代替
 */
export async function createSignedRequest(url, method = 'POST', data = {}) {
    return createAuthenticatedRequest(url, method, data);
}

/**
 * 创建二维码 API 请求
 * @param {object} params - 请求参数
 * @param {string} params.request_id - 请求ID（可选，默认生成UUID）
 * @param {string} params.user_locale - 用户语言区域
 * @param {string} params.chain_name - 链名称（如：solana）
 * @param {string} params.user_address - 用户钱包地址
 * @param {string} params.cryptocurrency - 加密货币类型（如：SOL, USDC）
 * @param {string} params.user_id - 用户ID
 * @returns {Promise<object>} - API 响应数据
 */
export async function createQRCode(params) {
    const {
        request_id,
        user_locale = 'zh-CN',
        chain_name,
        user_address,
        cryptocurrency,
        user_id,
    } = params;

    // 验证必填参数
    if (!chain_name) {
        throw new Error('chain_name is required');
    }
    if (!user_address) {
        throw new Error('user_address is required');
    }
    if (!cryptocurrency) {
        throw new Error('cryptocurrency is required');
    }
    if (!user_id) {
        throw new Error('user_id is required');
    }

    // 生成请求ID（如果没有提供）
    const finalRequestId = request_id || generateRequestId();

    // 构建请求体
    const requestData = {
        request_id: finalRequestId,
        user_locale,
        chain_name,
        user_address,
        cryptocurrency,
        user_id,
    };

    try {
        const response = await createSignedRequest('/api/v1/createqr', 'POST', requestData);

        // 检查响应状态
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }

        // 解析响应数据
        const responseData = await response.json();

        return responseData;
    } catch (error) {
        console.error('Create QR Code API Error:', error);
        throw error;
    }
}

/**
 * 获取订单列表 API 请求
 * @param {object} params - 请求参数
 * @param {string} params.request_id - 请求ID（可选，默认生成UUID）
 * @param {string} params.user_address - 用户钱包地址（必填）
 * @param {number} params.limit - 返回数量（可选，默认 10，范围 1-100）
 * @param {number} params.offset - 偏移量（可选，默认 0）
 * @returns {Promise<object>} - API 响应数据
 */
export async function getOrderList(params) {
    const {
        request_id,
        user_address,
        limit = 10,
        offset = 0,
    } = params;

    // 验证必填参数
    if (!user_address) {
        throw new Error('user_address is required');
    }

    // 验证 limit 范围
    const finalLimit = Math.max(1, Math.min(100, limit || 10));
    const finalOffset = Math.max(0, offset || 0);

    // 生成请求ID（如果没有提供）
    const finalRequestId = request_id || generateRequestId();

    // 构建请求体
    const requestData = {
        request_id: finalRequestId,
        user_address,
        limit: finalLimit,
        offset: finalOffset,
    };

    try {
        const response = await createSignedRequest('/api/v1/order/list', 'POST', requestData);

        // 检查响应状态
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }

        // 解析响应数据
        const responseData = await response.json();

        return responseData;
    } catch (error) {
        console.error('Get Order List API Error:', error);
        throw error;
    }
}

/**
 * 生成请求ID（UUID v4 格式的简化版本）
 * @returns {string} - 请求ID
 */
export function generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}