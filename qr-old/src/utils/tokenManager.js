const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRES_KEY = 'auth_token_expires';

function normalizeExpiresAt(expiresAt) {
    if (!expiresAt) {
        return Date.now() + 24 * 60 * 60 * 1000;
    }

    if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
        return expiresAt;
    }

    if (typeof expiresAt === 'string') {
        const numeric = Number(expiresAt);
        if (!Number.isNaN(numeric)) {
            return numeric;
        }
        const parsed = Date.parse(expiresAt);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return Date.now() + 24 * 60 * 60 * 1000;
}

export function saveToken(token, expiresAt) {
    if (!token) return;
    const normalized = normalizeExpiresAt(expiresAt);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRES_KEY, String(normalized));
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

export function getTokenExpiresAt() {
    const value = localStorage.getItem(TOKEN_EXPIRES_KEY);
    if (!value) return 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

export function hasValidToken() {
    const token = getToken();
    if (!token) return false;
    // 前端不进行过期时间校验，只要 token 存在就认为有效
    // 后端会进行校验，如果过期会返回 401 或 403
    return true;
}

export function getValidToken() {
    // 只要 token 存在就返回，不检查过期时间
    // 后端会进行校验，如果过期会返回相应的状态码
    return getToken();
}