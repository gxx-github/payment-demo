// @ts-nocheck
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Card, Value, Helper, CopyIcon } from './styled/Layout.jsx';
import { useToast } from './Toast.jsx';
import { createQRCode, getWsBaseUrl } from '../utils/api.js';
import { getValidToken, clearToken } from '../utils/tokenManager.js';
import copyIcon from '../assest/copy@2x.png';
import logoIcon from '../assest/icon.svg';

// WebSocket 心跳配置
const HEARTBEAT_INTERVAL = 30000; // 每 30 秒发送一次心跳
const HEARTBEAT_TIMEOUT = 10000; // 10 秒内没收到 pong 认为连接断开

// 加载/刷新容器（共用样式）
const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 180px;
`;

// 图标容器（包装 SVG）
const IconWrapper = styled.div`
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    color: #7c4dff;
    
    svg {
        width: 100%;
        height: 100%;
        color: currentColor;
    }
    
    &.animated {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const StatusText = styled(Helper)`
    color: #8b90a2;
    font-size: 12px;
`;

// 二维码容器（相对定位，用于叠加logo）
const QRCodeContainer = styled.div`
    position: relative;
    display: inline-block;
    width: 180px;
    height: 180px;
    margin: 0 auto;
    
    /* 当有遮罩层时禁用所有交互 */
    &.payment-processing {
        pointer-events: none;
        
        img {
            pointer-events: none;
            cursor: not-allowed;
        }
    }
`;

// 二维码图片
const QRCodeImage = styled.img`
    width: 100%;
    height: 100%;
    display: block;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 8px;
    
    &:hover:not(.disabled) {
        /* transform: scale(1.02); */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &:active:not(.disabled) {
        transform: scale(0.98);
    }
    
    &.disabled {
        cursor: not-allowed;
        /* opacity: 0.7; */
    }
    
    &.loading {
        opacity: 0.8;
        cursor: wait;
    }
`;

// Logo叠加层（居中显示）
const QRCodeLogo = styled.img`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 8px;
    padding: 4px;
    box-sizing: border-box;
`;

// 支付成功遮罩层
const SuccessOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, .9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    z-index: 999;
    pointer-events: auto;
    cursor: not-allowed;
`;

// 支付成功图标容器
const SuccessIconWrapper = styled.div`
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    color: #4caf50;
    
    svg {
        width: 100%;
        height: 100%;
        color: currentColor;
        filter: drop-shadow(0 2px 8px rgba(76, 175, 80, 0.3));
    }
    
    &.animated {
        animation: successPulse 0.6s ease-out;
    }
    
    @keyframes successPulse {
        0% {
            transform: scale(0.3);
            opacity: 0;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.8;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

// // 支付成功文字
// const SuccessText = styled.div`
//     color: #4caf50;
//     font-size: 18px;
//     font-weight: 600;
//     margin-bottom: 16px;
//     text-align: center;
// `;

// // 刷新图标容器
// const RefreshIconWrapper = styled.div`
//     width: 48px;
//     height: 48px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     background: rgba(255, 255, 255, 0.2);
//     border-radius: 50%;
//     transition: all 0.3s ease;

//     &:hover {
//         background: rgba(255, 255, 255, 0.3);
//         transform: scale(1.1);
//     }

//     &:active {
//         transform: scale(0.95);
//     }

//     svg {
//         width: 24px;
//         height: 24px;
//         color: white;
//     }

//     &.refreshing {
//         animation: spin 1s linear infinite;
//     }

//     @keyframes spin {
//         from {
//             transform: rotate(0deg);
//         }
//         to {
//             transform: rotate(360deg);
//         }
//     }
// `;

// 刷新容器（可点击）
const RefreshContainer = styled(LoadingContainer)`
    cursor: pointer;
    transition: opacity 0.3s ease;
    
    &:hover {
        opacity: 0.8;
    }
    
    &:active {
        opacity: 0.6;
    }
`;
/**
 * 浏览器兼容：base64 转 Uint8Array（替换 Buffer.from）
 * @param {string} base64 - base64 字符串
 * @returns {Uint8Array}
 */
function base64ToBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * 浏览器兼容：Uint8Array 转 base64（替换 .toString('base64')）
 * @param {Uint8Array} buffer - Uint8Array
 * @returns {string}
 */
function bufferToBase64(buffer) {
    const binaryString = String.fromCharCode(...buffer);
    return btoa(binaryString);
}


function AddressQR({ onRefreshActivityList }) {
    const { publicKey, connected, signTransaction } = useWallet();
    const { connection } = useConnection();
    const { t } = useTranslation();
    const address = useMemo(() => (publicKey ? publicKey.toString() : ''), [publicKey]);
    const { showToast } = useToast();
    // 使用 ref 存储翻译函数，避免语言切换时触发接口重新请求
    const tRef = useRef(t);
    useEffect(() => {
        tRef.current = t;
    }, [t]);
    const [qrCodeValue, setQrCodeValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false); // 支付成功状态
    const [lastQRClickTime, setLastQRClickTime] = useState(0); // 最后一次点击二维码的时间
    const [isQRClickDisabled, setIsQRClickDisabled] = useState(false); // 二维码点击是否被禁用
    const timerRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null); // 重连逻辑已注释
    const heartbeatTimerRef = useRef(null); // 心跳定时器
    const heartbeatIntervalRef = useRef(null); // 心跳间隔定时器
    const lastPongTimeRef = useRef(null); // 最后一次收到 pong 的时间
    const [reconnectTrigger, setReconnectTrigger] = useState(0); // 用于强制触发重连 - 重连逻辑已注释
    const processedTxIdsRef = useRef(new Set()); // 已处理的 transaction_id 集合，避免重复签名
    const qrClickTimerRef = useRef(null); // 二维码点击防抖定时器
    const fetchQRCodeRef = useRef(null); // fetchQRCode 函数引用，避免WebSocket重连
    const showToastRef = useRef(null); // showToast 函数引用，避免依赖问题
    const handleOrderMessageRef = useRef(null); // handleOrderMessage 函数引用，避免WebSocket重连
    const qrCodeValueRef = useRef(''); // qrCodeValue 引用，避免WebSocket重连

    // 检查是否过期
    useEffect(() => {
        if (!expiresAt) {
            setIsExpired(false);
            return;
        }

        const checkExpiration = () => {
            const now = new Date().getTime();
            const expires = new Date(expiresAt).getTime();
            const expired = now >= expires;
            setIsExpired(expired);
        };

        // 立即检查一次
        checkExpiration();

        // 每秒检查一次
        timerRef.current = setInterval(checkExpiration, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [expiresAt]);

    // 获取二维码数据
    const fetchQRCode = useCallback(async () => {
        if (!connected || !address) {
            setQrCodeValue('');
            setError(null);
            setExpiresAt(null);
            setIsExpired(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsRefreshing(false);
        setIsPaymentSuccess(false); // 获取新二维码时重置支付成功状态

        try {
            // 生成 user_id（可以使用钱包地址或其他唯一标识）
            const userId = address; // 或者可以从其他地方获取实际用户ID

            const result = await createQRCode({
                user_locale: 'en-US',
                chain_name: 'solana',
                user_address: address,
                cryptocurrency: 'USDC', // 可以根据实际需求修改
                user_id: userId,
            });

            // 严格验证 API 返回的二维码数据
            // 根据实际 API 响应结构调整字段名
            let qrData = result.qr_code || result.data || result.qrcode;
            if (!qrData) {
                throw new Error('QR code not found in API response');
            }

            // 确保 base64 数据包含 data URI 前缀
            // 如果已经是完整的 data URI，则直接使用；否则添加前缀
            if (!qrData.startsWith('data:image')) {
                // 检测图片格式（PNG、JPEG 等）
                let mimeType = 'image/png'; // 默认 PNG
                if (qrData.startsWith('/9j/')) {
                    mimeType = 'image/jpeg';
                } else if (qrData.startsWith('iVBORw0KGgo')) {
                    mimeType = 'image/png';
                }
                qrData = `data:${mimeType};base64,${qrData}`;
            }

            setQrCodeValue(qrData);

            // 保存过期时间
            if (result.expires_at) {
                setExpiresAt(result.expires_at);
                setIsExpired(false);
            } else {
                setExpiresAt(null);
            }

            // 二维码生成成功后，建立 WebSocket 连接
            // 注意：只有在二维码生成成功后才连接
        } catch (err) {
            console.error('Failed to fetch QR code:', err);
            setError(err.message || tRef.current('qrCode.loadFailed'));
            // @ts-ignore - showToast 类型检查
            showToast(tRef.current('payment.fetchQRFailed'));
            // 失败时不设置二维码值，不显示二维码
            setQrCodeValue('');
            setExpiresAt(null);
            setIsExpired(false);
        } finally {
            setLoading(false);
            setIsRefreshing(false); // 重置刷新状态
        }
    }, [connected, address, showToast]);

    // 将函数引用存储到 ref 中，避免 WebSocket 重连
    useEffect(() => {
        fetchQRCodeRef.current = fetchQRCode;
        showToastRef.current = showToast;
        qrCodeValueRef.current = qrCodeValue;
    }, [fetchQRCode, showToast, qrCodeValue]);

    useEffect(() => {
        fetchQRCode();
    }, [connected, address, fetchQRCode]);



    // 处理订单消息（签名并发送到后端）
    const handleOrderMessage = useCallback(async (orderData) => {
        try {
            console.log('🔄 Processing order message:', orderData);

            if (!connected || !signTransaction || !publicKey) {
                // 使用 ref 引用避免依赖问题
                if (showToastRef.current) {
                    showToastRef.current(tRef.current('wallet.pleaseConnect'));
                }
                console.error('Wallet not connected');
                return;
            }

            if (!orderData.serializedTx) {
                console.error('serializedTx missing in order data');
                // 使用 ref 引用避免依赖问题
                if (showToastRef.current) {
                    showToastRef.current(tRef.current('payment.invalidFormat'));
                }
                return;
            }
            const token = getValidToken();
            if (!token) {
                console.error('No valid JWT token available for WebSocket connection');
                if (showToastRef.current) {
                    showToastRef.current(t('payment.websocketAuthFailed') || 'Authentication required. Please connect wallet and sign in.');
                }
                return;
            }

            // 使用传入的 orderData（来自后端 response）
            const { serializedTx, userPubkey, userATA, targetATA, crypto_amount, status } = orderData;
            const oldStatus = status;
            if (!serializedTx) throw new Error('Failed to build transaction');

            // 验证钱包地址与商家已知地址是否匹配
            if (publicKey.toString() !== userPubkey) {
                throw new Error(tRef.current('payment.addressMismatch'));
            }

            // 精确比较余额与订单金额（按 token 最小单位，避免浮点误差）
            const userATAPubkey = new PublicKey(userATA);
            const userBalance = await connection.getTokenAccountBalance(userATAPubkey);
            console.log('userBalance', userBalance);

            // 十进制字符串 → 最小单位（字符串整数），如 0.0068 USDC → "006800"（再做归一化）
            const decimalToBaseUnitsStr = (amountStr, decimals) => {
                if (!amountStr || typeof amountStr !== 'string') return '0';
                const trimmed = amountStr.trim();
                if (trimmed === '') return '0';
                const neg = trimmed.startsWith('-');
                const s = neg ? trimmed.slice(1) : trimmed;
                const parts = s.split('.');
                const intPart = parts[0] || '0';
                const fracPartRaw = parts[1] || '';
                const fracPart = (fracPartRaw + '0'.repeat(decimals)).slice(0, decimals);
                const combined = (intPart === '' ? '0' : intPart) + fracPart;
                const normalized = combined.replace(/^0+(?=\d)/, '');
                const nonEmpty = normalized === '' ? '0' : normalized;
                // 金额比较仅关心绝对值大小
                return nonEmpty;
            };

            const compareIntStrings = (a, b) => {
                const na = (a || '0').replace(/^0+(?=\d)/, '');
                const nb = (b || '0').replace(/^0+(?=\d)/, '');
                if (na.length !== nb.length) return na.length - nb.length;
                if (na === nb) return 0;
                return na < nb ? -1 : 1;
            };

            const decimals = typeof userBalance.value.decimals === 'number' ? userBalance.value.decimals : 6;
            const userAmountStr = (userBalance.value.amount || '0');
            const needAmountStr = decimalToBaseUnitsStr(crypto_amount || '0', decimals);
            console.log('🔄 Comparing amounts:', userAmountStr, needAmountStr, 'userAmountStr, needAmountStr');
            if (compareIntStrings(userAmountStr, needAmountStr) < 0) {
                throw new Error(tRef.current('payment.insufficientBalance', { amount: crypto_amount }));
            }

            console.log('📝 Parsing transaction...', {
                serializedTx: serializedTx.substring(0, 50) + '...',
                userPubkey: userPubkey,
                userATA: userATA,
                targetATA: targetATA
            });

            // 从 base64 解码交易（浏览器兼容方式）
            // const txBuffer = Uint8Array.from(atob(serializedTx), c => c.charCodeAt(0));
            // const tx = Transaction.from(txBuffer);

            // 步骤2: 反序列化（用浏览器兼容解码）
            const txBytes = base64ToBuffer(serializedTx);
            const tx = Transaction.from(txBytes);

            console.log('📋 Transaction info:', {
                feePayer: tx.feePayer?.toString(),
                signatures: tx.signatures.length,
                instructions: tx.instructions.length,
                recentBlockhash: tx.recentBlockhash?.toString()
            });
            console.log(tx, 'tx');

            // 调试：检查连接的钱包类型和地址
            console.log('🔍 [DEBUG] Wallet info:', {
                connectedPubkey: publicKey?.toString(),
                expectedPubkey: userPubkey,
                addressMatch: publicKey?.toString() === userPubkey
            });

            // 调试：检查 blockhash 是否仍然有效
            try {
                const bhValid = await connection.isBlockhashValid(tx.recentBlockhash, { commitment: 'confirmed' });
                console.log('🔍 [DEBUG] Blockhash valid:', bhValid);
            } catch (bhErr) {
                console.error('🔍 [DEBUG] Blockhash check error:', bhErr);
            }

            // 调试：手动模拟交易，打印详细失败原因
            try {
                const simResult = await connection.simulateTransaction(tx);
                console.log('🔍 [DEBUG] Simulation result:', JSON.stringify(simResult, null, 2));
                if (simResult.value.err) {
                    console.error('🔍 [DEBUG] Simulation error:', simResult.value.err);
                    console.error('🔍 [DEBUG] Simulation logs:', simResult.value.logs);
                }
            } catch (simErr) {
                console.error('🔍 [DEBUG] Simulation exception:', simErr);
            }

            // 显示 Toast 提示用户签名
            if (showToastRef.current) {
                showToastRef.current(tRef.current('payment.requestReceived'));
            }
            // 设置支付成功状态，显示遮罩层
            setIsPaymentSuccess(true);
            // 使用钱包签名交易
            console.log('✍️ Requesting wallet signature...');
            let signedTx;
            try {
                signedTx = await signTransaction(tx);
            } catch (signErr) {
                console.error('Signature rejected or failed:', signErr);
                // 用户取消或签名失败时，通过 WS 回传状态变更
                try {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        const payload = {
                            type: 'status_changed',
                            change_type: 'status_changed',
                            data: {
                                // transaction_id: txId,
                                old_status: oldStatus || 'CREATED',
                                new_status: 'CANCELLED'
                            },
                            timestamp: new Date().toISOString()
                        };
                        wsRef.current.send(JSON.stringify(payload));
                        console.log('WS status change sent (cancel/fail):', payload);
                    }
                } catch (wsErr) {
                    console.warn('Failed to send WS status change:', wsErr);
                }
                throw signErr; // 继续走外层 catch 的提示逻辑
            }
            console.log('✅ Transaction signed successfully', {
                signatures: signedTx.signatures.length,
                feePayer: signedTx.feePayer?.toString()
            });

            // 序列化签名后的交易（浏览器兼容方式，requireAllSignatures: false）
            // const signedTxBuffer = signedTx.serialize({ requireAllSignatures: false });
            // const signedSerializedTx = btoa(String.fromCharCode(...signedTxBuffer));
            // 步骤3: 部分序列化（requireAllSignatures: false）
            const signedSerializedTx = bufferToBase64(signedTx.serialize({ requireAllSignatures: false }));
            console.log('📦 Serialized signed transaction', {
                length: signedSerializedTx.length,
                preview: signedSerializedTx
            });

            // 发送到后端 API（支持运行时配置的 API_BASE_URL）
            console.log('📤 Sending signed transaction to backend...');
            // const apiBase = await getApiBaseUrl();
            // console.log('apiBase', apiBase);
            const signUrl = `/api/signTx`;
            console.log('signUrl', signUrl);
            const response = await fetch(signUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serializedTx: signedSerializedTx
                })
            });

            // 处理 403 状态码（权限不足，需要重新签名）
            if (response.status === 403) {
                clearToken();
                throw new Error('Access forbidden. Please reconnect wallet and sign in again.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Backend request failed: ${response.status}`);
            }

            const result = await response.json();
            const { signature } = result;
            console.log('🎉 Transaction broadcast succeeded:', result);



            if (showToastRef.current) {
                showToastRef.current(tRef.current('payment.signatureSuccess', {
                    signature: signature?.substring(0, 8),
                    amount: crypto_amount
                }));
            }

         

            // 交易成功后关闭遮罩层并刷新二维码
            setTimeout(() => {
                setIsPaymentSuccess(false);
                // 刷新二维码
                if (fetchQRCodeRef.current) {
                    fetchQRCodeRef.current();
                }
            }, 2000); // 2秒后关闭遮罩层并刷新

            // 刷新活动列表
            if (onRefreshActivityList) {
                onRefreshActivityList();
            }

        } catch (error) {
            console.error('❌ Failed to process order message:', error);
            if (showToastRef.current) {
                showToastRef.current(tRef.current('payment.processingFailed', { error: error.message }));
            }
            // 失败时重置支付成功状态
            setIsPaymentSuccess(false);
            // 使用 ref 引用避免依赖问题
            if (fetchQRCodeRef.current) {
                fetchQRCodeRef.current();
            }

            // 刷新活动列表（即使失败也刷新，因为可能订单状态已更新）
            if (onRefreshActivityList) {
                onRefreshActivityList();
            }

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, signTransaction, publicKey, connection, onRefreshActivityList]);

    // 更新 handleOrderMessage 引用
    useEffect(() => {
        handleOrderMessageRef.current = handleOrderMessage;
    }, [handleOrderMessage]);

    // 当二维码首次生成时触发 WebSocket 连接
    useEffect(() => {
        if (qrCodeValue && address && !wsRef.current) {
            // 触发 WebSocket 连接
            setReconnectTrigger(prev => prev + 1);
        }
    }, [qrCodeValue, address]);




    // WebSocket 连接管理
    useEffect(() => {
        // 地址变更时清空已处理列表，避免跨会话误判
        processedTxIdsRef.current.clear();

        // 只有当二维码生成成功且有地址时才建立连接
        if (!qrCodeValueRef.current || !address) {
            // 如果没有二维码或地址，断开现有连接
            if (wsRef.current) {
                try {
                    wsRef.current.close(1000, 'QR code or address missing');
                } catch (e) {
                    console.error('Failed to close WebSocket connection:', e);
                }
                wsRef.current = null;
            }
            return;
        }

        // 如果已连接且状态正常，不需要重新连接
        if (wsRef.current) {
            const currentWs = wsRef.current;
            if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
                console.log('WebSocket already connected or connecting; skipping duplicate connection');
                return;
            }
            // 如果连接已关闭或出错，清理旧的连接
            if (currentWs.readyState === WebSocket.CLOSED || currentWs.readyState === WebSocket.CLOSING) {
                wsRef.current = null;
            }
        }

        // 建立 WebSocket 连接（从环境变量读取 WS 基址）
        // 例如 REACT_APP_WS_URL=wss://pay.8lab.cn
        (async () => {
            // 获取 JWT token
            const token = getValidToken();
            if (!token) {
                console.error('No valid JWT token available for WebSocket connection');
                showToast(t('payment.websocketAuthFailed') || 'Authentication required. Please connect wallet and sign in.');
                return;
            }

            const wsBase = await getWsBaseUrl().catch(() => '');
            const base = wsBase || 'wss://pay.8lab.cn';
            const wsUrl = `${base}/api/v1/ws/orders?token=${encodeURIComponent(token)}`;
            console.log('=== Establishing WebSocket connection ===');

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            // 清理心跳定时器
            const clearHeartbeat = () => {
                if (heartbeatTimerRef.current) {
                    clearTimeout(heartbeatTimerRef.current);
                    heartbeatTimerRef.current = null;
                }
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }
                lastPongTimeRef.current = null;
            };

            // 发送心跳消息
            const sendHeartbeat = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        // 发送心跳消息（根据服务器协议调整）
                        const heartbeatMessage = JSON.stringify({ type: 'ping' });
                        ws.send(heartbeatMessage);
                        console.log('💓 Sending heartbeat message');

                        // 设置超时检测，如果指定时间内没收到 pong，认为连接断开
                        if (heartbeatTimerRef.current) {
                            clearTimeout(heartbeatTimerRef.current);
                        }

                        heartbeatTimerRef.current = setTimeout(() => {
                            const now = Date.now();
                            // 检查是否在超时时间内收到过 pong
                            if (!lastPongTimeRef.current ||
                                (now - lastPongTimeRef.current) > HEARTBEAT_TIMEOUT) {
                                console.warn('⚠️ Heartbeat timeout; connection may be closed');
                                // 关闭连接（重连逻辑已注释，不会自动重连）
                                // 使用 1000 正常关闭，或 3001 表示心跳超时（自定义代码范围：3000-4999）
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.close(3001, 'Heartbeat timeout');
                                }
                            }
                        }, HEARTBEAT_TIMEOUT);
                    } catch (error) {
                        console.error('Failed to send heartbeat:', error);
                    }
                }
            };

            // 连接成功
            ws.onopen = () => {
                console.log('✅ WebSocket connection established');
                // 重置 pong 时间
                lastPongTimeRef.current = Date.now();

                // 启动心跳：立即发送一次，然后每隔一定时间发送
                sendHeartbeat();
                heartbeatIntervalRef.current = setInterval(() => {
                    sendHeartbeat();
                }, HEARTBEAT_INTERVAL);
            };

            // 接收消息
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received WebSocket message:', data);

                    // 处理心跳响应
                    if (data.type === 'pong' || data.type === 'ping') {
                        if (data.type === 'pong') {
                            console.log('💓 Received heartbeat response (pong)');
                            // 更新最后一次收到 pong 的时间
                            lastPongTimeRef.current = Date.now();
                            // 清除超时定时器
                            if (heartbeatTimerRef.current) {
                                clearTimeout(heartbeatTimerRef.current);
                                heartbeatTimerRef.current = null;
                            }
                        }
                        return; // 心跳消息不进行业务处理
                    }

                    // 处理订单消息（新的 ws 数据结构）
                    if (data.type === 'tx_data' && data.data) {
                        const txId = data.transaction_id || data.id;
                        const txData = data.data;
                        const status = txData.status;

                        // 仅当状态为 created 时触发签名
                        if (status !== 'CREATED') {
                            console.log('Skipping order: status is not created', { txId, status });
                            return;
                        }

                        // 相同 transaction_id 去重
                        if (txId && processedTxIdsRef.current.has(txId)) {
                            console.log('Order already processed, skipping duplicate signature', { txId });
                            return;
                        }
                        if (txId) processedTxIdsRef.current.add(txId);

                        // 在订单数据上挂载元信息，供签名失败时回传
                        txData._wsMeta = { txId, oldStatus: status };

                        console.log('📦 Received order message (validated), preparing to sign', { txId });
                        if (handleOrderMessageRef.current) {
                            handleOrderMessageRef.current(txData).catch(error => {
                                console.error('Error handling order message:', error);
                                // 签名失败回滚去重标记，允许后续重试
                                if (txId) processedTxIdsRef.current.delete(txId);
                            });
                        }
                        return;
                    }

                    // 兼容旧结构：直接在顶层携带 serializedTx
                    if (data.serializedTx) {
                        console.log('📦 Received order message (legacy format), preparing to sign');
                        if (handleOrderMessageRef.current) {
                            handleOrderMessageRef.current(data).catch(error => {
                                console.error('Error handling order message:', error);
                            });
                        }
                        return;
                    }

                    // 这里可以处理其他类型的消息
                    // 例如：更新订单状态、显示通知等

                } catch (err) {
                    // 如果不是 JSON，可能是文本心跳消息
                    if (event.data === 'pong' || event.data === 'ping') {
                        console.log('💓 Received text heartbeat response');
                        lastPongTimeRef.current = Date.now();
                        if (heartbeatTimerRef.current) {
                            clearTimeout(heartbeatTimerRef.current);
                            heartbeatTimerRef.current = null;
                        }
                        return;
                    }
                    console.error('Failed to parse WebSocket message:', err);
                    console.log('Raw message:', event.data);
                }
            };

            // 连接错误
            ws.onerror = (error) => {
                console.error('❌ WebSocket connection error:', error);
                // 清理心跳
                clearHeartbeat();
                // 错误时不要显示 Toast，避免干扰
            };

            // 连接关闭
            ws.onclose = (event) => {
                console.log('🔌 WebSocket connection closed:', event.code, event.reason);

                // 清理心跳
                clearHeartbeat();

                // 清理 ref，避免后续判断出错
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }

                // 处理认证失败的情况
                // 1008: 策略违规（通常表示认证失败或 token 无效）
                // 1001: 端点离开（可能是服务器主动断开认证失败的连接）
                // 1003: 数据类型错误（可能是认证相关）
                // 如果后端在握手阶段验证 token 失败，通常会返回这些状态码
                // 403 相关错误也会通过关闭代码或 reason 传递
                const isAuthError = event.code === 1008 || event.code === 1003 ||
                    (event.code === 1001 && event.reason && (event.reason.includes('auth') || event.reason.includes('token') || event.reason.includes('unauthorized'))) ||
                    (event.reason && (event.reason.includes('403') || event.reason.includes('forbidden') || event.reason.includes('403')));

                if (isAuthError) {
                    console.error('WebSocket authentication failed during handshake, clearing token');
                    clearToken();
                    showToast(t('payment.websocketAuthFailed') || 'Authentication failed. Please reconnect wallet and sign in again.');
                    return; // 认证失败时不重连
                }

                // 重连逻辑已注释
                // 如果不是正常关闭（code 1000 表示正常关闭）且二维码和地址仍然存在，尝试重连
                // 注意：3001 是心跳超时关闭代码，也会触发重连
                if (event.code !== 1000 && qrCodeValueRef.current && address) {
                    console.log('WebSocket closed unexpectedly, retrying in 3 seconds...');

                    // 清理之前的重连定时器
                    if (reconnectTimerRef.current) {
                        clearTimeout(reconnectTimerRef.current);
                    }

                    // 设置重连定时器
                    reconnectTimerRef.current = setTimeout(() => {
                        // 检查是否仍然需要连接（二维码和地址仍然存在，且没有其他连接）
                        if (qrCodeValueRef.current && address && !wsRef.current) {
                            console.log('Starting WebSocket reconnection');
                            // 通过更新 state 来强制触发 useEffect 重新执行
                            setReconnectTrigger(prev => prev + 1);
                            reconnectTimerRef.current = null;
                        } else {
                            console.log('Cancelling reconnection: conditions not met');
                            reconnectTimerRef.current = null;
                        }
                    }, 3000);
                } else {
                    console.log('WebSocket closed normally; no reconnection');
                }
            };

        })().catch((error) => {
            console.error('Failed to create WebSocket connection:', error);
            showToast(t('payment.websocketFailed'));
        });

        // 清理函数：组件卸载或依赖变化时断开连接
        return () => {
            // 清理心跳定时器
            if (heartbeatTimerRef.current) {
                clearTimeout(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
            lastPongTimeRef.current = null;

            // 清理重连定时器 - 重连逻辑已注释
            // if (reconnectTimerRef.current) {
            //     clearTimeout(reconnectTimerRef.current);
            //     reconnectTimerRef.current = null;
            // }

            // 清理二维码点击防抖定时器
            if (qrClickTimerRef.current) {
                clearTimeout(qrClickTimerRef.current);
                qrClickTimerRef.current = null;
            }

            if (wsRef.current) {
                try {
                    // 移除所有事件监听器，避免在清理时触发事件
                    const ws = wsRef.current;
                    // 先移除事件监听器，避免在关闭时触发 onclose 事件
                    ws.onopen = null;
                    ws.onmessage = null;
                    ws.onerror = null;
                    ws.onclose = null;

                    // 如果连接还在，关闭它
                    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                        ws.close(1000, 'Component unmounted or dependencies changed');
                    }
                } catch (e) {
                    console.error('Failed to close WebSocket connection:', e);
                }
                wsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, reconnectTrigger, t]); // 移除 qrCodeValue 和 handleOrderMessage 避免重连

    // 处理刷新点击
    const handleRefresh = useCallback(() => {
        if (loading || isRefreshing) {
            return;
        }
        setIsRefreshing(true);
        setIsPaymentSuccess(false); // 重置支付成功状态
        fetchQRCode();
    }, [loading, isRefreshing, fetchQRCode]);

    // 处理支付成功后的刷新
    // const handleSuccessRefresh = useCallback(() => {
    //     if (loading || isRefreshing) {
    //         return;
    //     }
    //     setIsRefreshing(true);
    //     setIsPaymentSuccess(false); // 重置支付成功状态
    //     fetchQRCode();
    // }, [loading, isRefreshing, fetchQRCode]);

    // 处理二维码点击刷新（带防抖限制）
    const handleQRCodeClick = useCallback(() => {
        const now = Date.now();
        const timeSinceLastClick = now - lastQRClickTime;

        // 如果正在加载、刷新或支付成功状态，不允许点击
        if (loading || isRefreshing || isPaymentSuccess) {
            return;
        }

        // 10秒内不允许重复点击
        if (timeSinceLastClick < 10000) {
            const remainingTime = Math.ceil((10000 - timeSinceLastClick) / 1000);
            if (showToastRef.current) {
                showToastRef.current(tRef.current('qrCode.clickTooFrequent', { seconds: remainingTime }));
            }
            return;
        }

        // 更新最后点击时间
        setLastQRClickTime(now);
        setIsQRClickDisabled(true);

        // 显示点击反馈
        if (showToastRef.current) {
            showToastRef.current(tRef.current('qrCode.refreshing'));
        }

        // 刷新二维码
        setIsRefreshing(true);
        if (fetchQRCodeRef.current) {
            fetchQRCodeRef.current();
        }

        // 清理防抖定时器
        if (qrClickTimerRef.current) {
            clearTimeout(qrClickTimerRef.current);
        }

        // 10秒后重新启用点击
        qrClickTimerRef.current = setTimeout(() => {
            setIsQRClickDisabled(false);
            qrClickTimerRef.current = null;
        }, 10000);

    }, [loading, isRefreshing, isPaymentSuccess, lastQRClickTime]);

    const handleCopy = async () => {
        // 复制钱包地址
        if (!address) {
            showToast(t('wallet.addressUnavailable'));
            return;
        }

        try {
            await navigator.clipboard.writeText(address);
            showToast(t('wallet.addressCopied'));
        } catch (err) {
            // 降级方案：使用传统的复制方法
            const textArea = document.createElement('textarea');
            textArea.value = address;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(t('wallet.addressCopied'));
            } catch (e) {
                console.error('Copy failed:', e);
                showToast(t('wallet.copyFailed'));
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <Card className='addressQRCard'>
            {/* <CardTitle>Address QR</CardTitle> */}
            {connected && address ? (
                <>
                    {loading ? (
                        <LoadingContainer>
                            <IconWrapper className="animated">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeDasharray="60 40"
                                        fill="none"
                                        opacity="0.3"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeDasharray="60 40"
                                        fill="none"
                                    />
                                </svg>
                            </IconWrapper>
                            <StatusText>{t('qrCode.loading')}</StatusText>
                        </LoadingContainer>
                    ) : isExpired && qrCodeValue ? (
                        <RefreshContainer onClick={handleRefresh} title={t('qrCode.refreshTitle')}>
                            <IconWrapper className={isRefreshing ? 'animated' : ''}>
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </IconWrapper>
                            <StatusText>{t('qrCode.expired')}</StatusText>
                        </RefreshContainer>
                    ) : qrCodeValue ? (
                        <div className='addressQR'>
                            <QRCodeContainer className={isPaymentSuccess ? 'payment-processing' : ''}>
                                <QRCodeImage
                                    src={qrCodeValue}
                                    alt="Payment QR Code"
                                    onClick={isPaymentSuccess ? undefined : handleQRCodeClick}
                                    className={`${isQRClickDisabled || isPaymentSuccess ? 'disabled' : ''} ${loading || isRefreshing ? 'loading' : ''}`}
                                    title={isPaymentSuccess ? 
                                        tRef.current('payment.processing') :
                                        isQRClickDisabled ?
                                        tRef.current('qrCode.clickDisabled') :
                                        tRef.current('qrCode.clickToRefresh')
                                    }
                                />
                                <QRCodeLogo
                                    src={logoIcon}
                                    alt="Logo"
                                />
                                { isPaymentSuccess && (
                                    <SuccessOverlay>
                                        <SuccessIconWrapper className="animated">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    fill="currentColor"
                                                    opacity="0.1"
                                                />
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                />
                                                <path
                                                    d="M8 12l2 2 4-4"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    fill="none"
                                                />
                                            </svg>
                                        </SuccessIconWrapper>
                                        {/* <SuccessText>{t('qrCode.paymentSuccess')}</SuccessText> */}
                                        {/* <RefreshIconWrapper 
                                            className={isRefreshing ? 'refreshing' : ''}
                                            onClick={handleSuccessRefresh}
                                            title={t('qrCode.refreshTitle')}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </RefreshIconWrapper> */}
                                    </SuccessOverlay>
                                )}
                            </QRCodeContainer>
                        </div>
                    ) : error ? (
                        <LoadingContainer>
                            <IconWrapper style={{ color: '#ff6b6b' }}>
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        opacity="0.2"
                                    />
                                    <path
                                        d="M12 8v4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="12"
                                        cy="16"
                                        r="1"
                                        fill="currentColor"
                                    />
                                </svg>
                            </IconWrapper>
                            <StatusText style={{ color: '#ff6b6b' }}>{t('qrCode.loadFailed')}</StatusText>
                        </LoadingContainer>
                    ) : null}
                    {connected && address && (
                        <Value>
                            {address}
                            <CopyIcon
                                src={copyIcon}
                                alt="copy"
                                onClick={handleCopy}
                                style={{ cursor: 'pointer' }}
                                title={t('qrCode.copyTitle')}
                            />
                        </Value>
                    )}
                </>
            ) : (
                <Helper>{t('wallet.pleaseConnect')}</Helper>
            )}
        </Card>
    );
}

export default AddressQR;

