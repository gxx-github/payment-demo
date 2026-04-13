import bs58 from 'bs58';

const DEFAULT_AUTH_DOMAIN = 'WEA Pay';
const DEFAULT_SIGN_MESSAGE = `Sign in to ${DEFAULT_AUTH_DOMAIN}`;

/**
 * 获取签名消息
 * @returns {string} 签名消息
 */
function getSignMessage() {
    // 开发模式：从 process.env 读取，否则使用默认值
    return process.env.REACT_APP_SIGN_MESSAGE || DEFAULT_SIGN_MESSAGE;
}

export function buildAuthMessage(domain) {
    const targetDomain = domain || DEFAULT_AUTH_DOMAIN;
    return `Sign in to ${targetDomain}`;
}

export function getWalletAddress(publicKey) {
    if (!publicKey) {
        return '';
    }
    if (typeof publicKey === 'string') {
        return publicKey;
    }
    if (typeof publicKey.toBase58 === 'function') {
        return publicKey.toBase58();
    }
    if (typeof publicKey.toString === 'function') {
        return publicKey.toString();
    }
    return String(publicKey);
}

export async function signAuthMessage(signMessage, message) {
    if (typeof signMessage !== 'function') {
        throw new Error('Current wallet does not support signMessage');
    }
    const encoder = new TextEncoder();
    const bytes = encoder.encode(message);
    const signatureBytes = await signMessage(bytes);
    return bs58.encode(signatureBytes);
}

export async function requestAuthToken({ apiBaseUrl, walletAddress, signature }) {
    if (!apiBaseUrl) {
        throw new Error('API base url is not configured');
    }
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/get_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            signature,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Auth failed with status ${response.status}`);
    }

    return response.json();
}

export async function authenticateWithWallet({ publicKey, signMessage, apiBaseUrl, message }) {
    if (!publicKey) {
        throw new Error('Wallet not connected');
    }
    const walletAddress = getWalletAddress(publicKey);
    if (!walletAddress) {
        throw new Error('Wallet address is invalid');
    }
    // 优先使用传入的 message，否则从环境变量读取，最后使用默认值
    const finalMessage = message || getSignMessage();
    const signature = await signAuthMessage(signMessage, finalMessage);
    const result = await requestAuthToken({
        apiBaseUrl,
        walletAddress,
        signature,
    });
    console.log('result', result);
    return {
        token: result.data,
        expiresAt: result.expires_at || result.expiresAt || result.expire_at || result.expireAt,
    };
}