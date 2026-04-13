import { createSignedRequest, generateRequestId } from './api.js';

export const DEFAULT_AGREEMENT_VERSION = '1.0.0';

/**
 * 提取响应中的业务数据，兼容 data/result 等包裹格式
 * @param {object} responseData
 * @returns {object}
 */
function normalizeAgreementPayload(responseData = {}) {
    if (responseData.data && typeof responseData.data === 'object') {
        return responseData.data;
    }
    if (responseData.result && typeof responseData.result === 'object') {
        return responseData.result;
    }
    return responseData;
}

/**
 * 从响应中提取错误信息
 * @param {object} responseData
 * @param {string} fallback
 * @returns {string}
 */
function extractErrorMessage(responseData, fallback = 'Request failed') {
    if (!responseData || typeof responseData !== 'object') {
        return fallback;
    }
    return responseData.message || responseData.error || fallback;
}

/**
 * 判断响应数据是否表示协议已确认
 * @param {object} payload
 * @returns {boolean}
 */
export function isAgreementConfirmed(payload) {
    if (!payload || typeof payload !== 'object') {
        return false;
    }
    if (typeof payload.agreement_accepted === 'boolean') {
        return payload.agreement_accepted;
    }
    if (typeof payload.confirmed === 'boolean') {
        return payload.confirmed;
    }
    if (typeof payload.confirm_status === 'boolean') {
        return payload.confirm_status;
    }
    if (typeof payload.confirm_status === 'string') {
        const normalized = payload.confirm_status.toUpperCase();
        return normalized === 'CONFIRMED' || normalized === 'ACCEPTED' || normalized === 'SUCCESS';
    }
    if (typeof payload.status === 'boolean') {
        return payload.status;
    }
    if (typeof payload.status === 'string') {
        const normalized = payload.status.toUpperCase();
        return normalized === 'CONFIRMED' || normalized === 'ACCEPTED' || normalized === 'SUCCESS';
    }
    return false;
}

/**
 * 统一封装协议相关接口请求
 * @param {string} path
 * @param {object} body
 * @returns {Promise<object>}
 */
async function sendAgreementRequest(path, body) {
    const response = await createSignedRequest(path, 'POST', body);
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(extractErrorMessage(responseData, `API request failed with status ${response.status}`));
    }

    return normalizeAgreementPayload(responseData);
}

/**
 * 查询协议确认状态
 * @param {object} params
 * @param {string} params.user_address
 * @param {string} [params.request_id]
 * @returns {Promise<object>}
 */
export async function queryAgreementStatus({ user_address, request_id }) {
    if (!user_address) {
        throw new Error('user_address is required');
    }

    const finalRequestId = request_id || generateRequestId();

    const payload = {
        request_id: finalRequestId,
        user_address,
    };

    return await sendAgreementRequest('/api/v1/query-agreement-status', payload);
}

/**
 * 确认协议
 * @param {object} params
 * @param {string} params.user_address
 * @param {string} [params.agreement_version]
 * @param {string} [params.request_id]
 * @returns {Promise<object>}
 */
export async function acceptAgreement({ user_address, agreement_version = DEFAULT_AGREEMENT_VERSION, request_id }) {
    if (!user_address) {
        throw new Error('user_address is required');
    }

    const finalRequestId = request_id || generateRequestId();

    const payload = {
        request_id: finalRequestId,
        user_address,
        agreement_version,
    };

    return await sendAgreementRequest('/api/v1/accept-agreement', payload);
}