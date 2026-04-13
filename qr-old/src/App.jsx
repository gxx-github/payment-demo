// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import '@solana/wallet-adapter-react-ui/styles.css';
import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';
import { AppContainer, Card, CardWraper, FooterDom, FooterImg, Helper, PrimaryButton } from './components/styled/Layout.jsx';
import WalletConnect from './components/WalletConnect.jsx';
import AddressQR from './components/AddressQR.jsx';
import Header from './components/Header.jsx';
import ActivityList from './components/ActivityList.jsx';
import { useWallet } from '@solana/wallet-adapter-react';
import { ToastProvider, useToast } from './components/Toast.jsx';
import AgreementModal from './components/AgreementModal.jsx';
import { queryAgreementStatus, isAgreementConfirmed, DEFAULT_AGREEMENT_VERSION } from './utils/agreement.js';
import icon1 from './assest/icon@2x.png';
import './i18n';
import { useTranslation } from 'react-i18next';
import { getBackendApiBaseUrl, registerTokenRefresh, unregisterTokenRefresh } from './utils/api.js';
import { clearToken, getValidToken, saveToken } from './utils/tokenManager.js';
import { authenticateWithWallet } from './utils/walletAuth.js';

// Loading 容器样式
const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
`;

// Loading 图标容器
const LoadingIconWrapper = styled.div`
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
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

const LoadingText = styled(Helper)`
    color: #8b90a2;
    font-size: 14px;
    text-align: center;
    margin-top: 8px;
`;
// const endpoint = 'https://mainnet.helius-rpc.com/?api-key=c872a6f0-6f80-4144-9cf6-ffbe1f371a5b';
const endpoint = 'https://mainnet.helius-rpc.com/?api-key=871a9988-c945-43bd-8571-b6a9e6175a1d';

// 创建所有可用的钱包适配器
const allWallets = [new PhantomWalletAdapter()];

// 检测是否为移动设备
function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
}

// 过滤出已安装的钱包
function getInstalledWallets() {
    const isMobile = isMobileDevice();
    
    return allWallets.filter(wallet => {
        const isPhantom = wallet.name?.toLowerCase().includes('phantom');
        
        // 移动端：允许 Installed 或 Loadable 状态（Loadable 表示可以通过深度链接打开）
        // 桌面端：只允许 Installed 状态
        const validReadyState = isMobile 
            ? (wallet.readyState === WalletReadyState.Installed || wallet.readyState === WalletReadyState.Loadable)
            : (wallet.readyState === WalletReadyState.Installed);
        
        if (!validReadyState) {
            return false;
        }
        
        // 对于 Phantom，在桌面端额外检查 window.solana
        // 移动端不强制要求 window.solana，因为可能通过深度链接打开
        if (isPhantom && !isMobile && typeof window !== 'undefined') {
            // @ts-ignore - window.solana 是动态属性
            return window.solana?.isPhantom === true;
        }
        
        return true;
    });
}

const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background: #000; color: #eaeaf0; }
  * { box-sizing: border-box; }
`;


// 内部组件，在 Provider 内部使用 hooks
function AppContent() {
    const wallet = useWallet();
    const { connected, publicKey, signMessage, connecting } = wallet;
    const { t } = useTranslation();
    const { showToast } = useToast();
    /** @type {React.MutableRefObject<{ refresh: () => void } | null>} */
    const activityListRef = React.useRef(null);
    const [showAgreement, setShowAgreement] = useState(false);
    const [agreementConfirmed, setAgreementConfirmed] = useState(false);
    const [agreementChecking, setAgreementChecking] = useState(false);
    const [agreementError, setAgreementError] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [agreementVersion, setAgreementVersion] = useState(DEFAULT_AGREEMENT_VERSION);
    const [authenticating, setAuthenticating] = useState(false);
    const [authError, setAuthError] = useState('');
    const [hasAuthToken, setHasAuthToken] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return Boolean(getValidToken());
    });
    // 使用 ref 跟踪之前的钱包连接状态，用于检测断开连接
    const prevWalletReadyRef = React.useRef(false);

    const walletReady = connected && Boolean(publicKey);

    const authenticateWallet = React.useCallback(async () => {
        if (!walletReady) {
            return;
        }
        if (typeof signMessage !== 'function') {
            const message = t('wallet.signNotSupported') || 'Current wallet does not support signMessage';
            setAuthError(message);
            showToast(message);
            return;
        }
        setAuthenticating(true);
        setAuthError('');
        try {
            const apiBaseUrl = await getBackendApiBaseUrl();
            const result = await authenticateWithWallet({
                publicKey,
                signMessage,
                apiBaseUrl,
            });
            saveToken(result.token, result.expiresAt);
            setHasAuthToken(true);
            setAuthError('');
            showToast(t('wallet.authSuccess') || 'Wallet authorized successfully');
        } catch (error) {
            console.error('Wallet authentication failed:', error);
            clearToken();
            setHasAuthToken(false);
            const message = error.message || t('wallet.authFailed') || 'Wallet authorization failed';
            setAuthError(message);
            showToast(message);
        } finally {
            setAuthenticating(false);
        }
    }, [walletReady, signMessage, publicKey, showToast, t]);

    // 注册 token 刷新函数，用于自动刷新过期的 token
    React.useEffect(() => {
        if (walletReady && signMessage && publicKey) {
            const refreshToken = async () => {
                try {
                    console.log('Auto refreshing token...');
                    const apiBaseUrl = await getBackendApiBaseUrl();
                    const result = await authenticateWithWallet({
                        publicKey,
                        signMessage,
                        apiBaseUrl,
                    });
                    saveToken(result.token, result.expiresAt);
                    setHasAuthToken(true);
                    console.log('Token refreshed successfully');
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    clearToken();
                    setHasAuthToken(false);
                    throw error; // 重新抛出错误，让调用方知道刷新失败
                }
            };
            
            registerTokenRefresh(refreshToken);
            
            return () => {
                unregisterTokenRefresh();
            };
        }
    }, [walletReady, signMessage, publicKey]);

    useEffect(() => {
        // 检测钱包从连接状态变为断开状态，清除 token
        if (prevWalletReadyRef.current && !walletReady) {
            console.log('Wallet disconnected, clearing token');
            clearToken();
            setHasAuthToken(false);
            setAuthError('');
            setAuthenticating(false);
            prevWalletReadyRef.current = walletReady;
            return;
        }
        
        // 更新之前的连接状态
        prevWalletReadyRef.current = walletReady;

        // 检查是否有已保存的 token
        if (typeof window !== 'undefined' && getValidToken()) {
            setHasAuthToken(true);
            setAuthError('');
            // 如果钱包已连接，不需要重新签名
            if (walletReady) {
                return;
            }
            // 如果钱包未连接但有 token，保留 token，等待钱包连接
            // 注意：这里保留 token 是为了支持刷新页面时不丢失 token
            // 但如果用户主动断开连接，上面的逻辑已经清除了 token
            return;
        }

        // 如果没有 token，需要等待钱包连接后再签名
        if (!walletReady) {
            setHasAuthToken(false);
            setAuthError('');
            setAuthenticating(false);
            return;
        }

        // 钱包已连接但没有 token，需要签名
        authenticateWallet();
    }, [walletReady, publicKey, authenticateWallet]);

    // 连接钱包后查询协议状态
    useEffect(() => {
        let cancelled = false;

        if (!connected || !publicKey || !hasAuthToken) {
            setWalletAddress('');
            setAgreementConfirmed(false);
            setAgreementChecking(false);
            setAgreementError('');
            setAgreementVersion(DEFAULT_AGREEMENT_VERSION);
            setShowAgreement(false);
            return () => {
                cancelled = true;
            };
        }

        const address = typeof publicKey.toBase58 === 'function'
            ? publicKey.toBase58()
            : publicKey.toString();
        setWalletAddress(address);
        setAgreementChecking(true);
        setAgreementError('');
        setAgreementConfirmed(false);
        setShowAgreement(false);

        (async () => {
            try {
                const result = await queryAgreementStatus({ user_address: address });
                if (cancelled) return;

                if (result.agreement_version || result.version) {
                    setAgreementVersion(result.agreement_version || result.version);
                } else {
                    setAgreementVersion(DEFAULT_AGREEMENT_VERSION);
                }

                const confirmed = isAgreementConfirmed(result);
                setAgreementConfirmed(confirmed);
                setShowAgreement(!confirmed);
            } catch (error) {
                if (cancelled) return;
                console.error('Failed to query agreement status:', error);
                // 只存储错误消息，显示时会根据语言自动翻译
                setAgreementError(error.message || '');
                setAgreementConfirmed(false);
                setShowAgreement(false);
            } finally {
                if (!cancelled) {
                    setAgreementChecking(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [connected, publicKey, hasAuthToken]);

    const handleAgreementAgree = (payload) => {
        if (payload && (payload.agreement_version || payload.version)) {
            setAgreementVersion(payload.agreement_version || payload.version);
        }
        setAgreementConfirmed(true);
        setAgreementError('');
        setShowAgreement(false);
    };

    const handleAgreementCancel = () => {
        setShowAgreement(false);
    };

    const tokenReady = walletReady && hasAuthToken;
    const canShowBusiness = tokenReady && agreementConfirmed;

    return (
        <>
            <GlobalStyle />
            <Header />
            <AppContainer>
                {!walletReady && !connecting ? (
                    <CardWraper>
                        <Card className='noConnectCard'>
                            <img src={icon1} alt="icon1" className='icon1' />
                            <div className='noConnectCardText'>{t('app.qrWarning')}</div>
                            <WalletConnect />
                        </Card>
                        <FooterDom>
                            <FooterImg></FooterImg>
                        </FooterDom>
                    </CardWraper>

                ) : (
                    <CardWraper className='connectCardWraper'>
                        <Card className='connectCard'>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <WalletConnect />
                            </div>
                            {/* 显示统一的 Loading 状态：连接中、签名中或检查协议中 */}
                            {(connecting || authenticating || agreementChecking) ? (
                                <LoadingContainer>
                                    <LoadingIconWrapper className="animated">
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
                                    </LoadingIconWrapper>
                                    <LoadingText>
                                        {connecting ? t('wallet.connecting') : ''}
                                        {!connecting && authenticating ? t('wallet.authenticating') : ''}
                                        {!connecting && !authenticating && agreementChecking ? t('agreement.checkingStatus') : ''}
                                    </LoadingText>
                                </LoadingContainer>
                            ) : (
                                <>
                                    {walletReady && !hasAuthToken && (
                                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                                            <Helper style={{ marginTop: 0, color: '#ff6b6b' }}>
                                                {authError || t('wallet.authFailed')}
                                            </Helper>
                                            <PrimaryButton
                                                style={{ marginTop: 12 }}
                                                onClick={authenticateWallet}
                                                disabled={authenticating}
                                            >
                                                {t('wallet.retryAuth')}
                                            </PrimaryButton>
                                        </div>
                                    )}
                                    {walletReady && hasAuthToken && (
                                        <>
                                            {canShowBusiness && (
                                                <>
                                                    <AddressQR onRefreshActivityList={() => {
                                                        if (activityListRef.current) {
                                                            activityListRef.current.refresh();
                                                        }
                                                    }} />
                                                    <ActivityList ref={activityListRef} pageSize={5} />
                                                </>
                                            )}
                                            {!canShowBusiness && (
                                                <div style={{ textAlign: 'center', marginTop: 200 }}>
                                                    <Helper style={{ marginTop: 0 }}>
                                                        {agreementError || t('agreement.needConfirm')} 
                                                    </Helper>
                                                    <PrimaryButton
                                                        style={{ marginTop: 12 }}
                                                        onClick={() => setShowAgreement(true)}
                                                    >
                                                        {t('agreement.viewButton')}
                                                    </PrimaryButton>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </Card>
                        <FooterDom>
                            <FooterImg></FooterImg>
                        </FooterDom>
                    </CardWraper>
                )}

            </AppContainer>
            {walletReady && showAgreement && !agreementChecking && (
                <AgreementModal
                    onAgree={handleAgreementAgree}
                    onCancel={handleAgreementCancel}
                    walletAddress={walletAddress}
                    agreementVersion={agreementVersion}
                />
            )}
        </>
    );
}

function App() {
    // 动态获取已安装的钱包列表
    const installedWallets = useMemo(() => {
        return getInstalledWallets();
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={installedWallets} autoConnect>
                <WalletModalProvider>
                    <ToastProvider>
                        <AppContent />
                    </ToastProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;

