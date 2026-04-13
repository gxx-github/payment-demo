// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { createGlobalStyle } from 'styled-components';
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
// const endpoint = 'https://mainnet.helius-rpc.com/?api-key=c872a6f0-6f80-4144-9cf6-ffbe1f371a5b';
const endpoint = 'https://mainnet.helius-rpc.com/?api-key=871a9988-c945-43bd-8571-b6a9e6175a1d';

const wallets = [new PhantomWalletAdapter()];

const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background: #000; color: #eaeaf0; }
  * { box-sizing: border-box; }
`;


// 内部组件，在 Provider 内部使用 hooks
function AppContent() {
    const { connected, publicKey, wallet, disconnect, connecting } = useWallet();
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
    const [connectionError, setConnectionError] = useState('');
    const connectionTimeoutRef = React.useRef(null);

    const handleWalletError = React.useCallback((error, adapter) => {
        const errorMessage = error?.message || error?.toString() || t('wallet.connectionFailed') || 'Wallet connection failed';
        const normalizedMessage = (errorMessage || '').toLowerCase();
        console.error('Wallet connection error:', errorMessage);
        setConnectionError(errorMessage);
        if (connecting || connected) {
            disconnect().catch(err => console.error('Failed to disconnect:', err));
        }

        const walletName = adapter?.name || 'Wallet';
        if (normalizedMessage.includes('not installed') ||
            normalizedMessage.includes('not found') ||
            (walletName.toLowerCase().includes('phantom') && !window?.solana?.isPhantom)) {
            showToast(t('wallet.notInstalled', { wallet: walletName }) || `${walletName} not installed. Please install it first.`);
        } else if (normalizedMessage.includes('port not connected') || normalizedMessage.includes('port closed')) {
            const tip = t('wallet.portNotConnected') || 'Browser wallet port is not connected. Please reopen or refresh.';
            showToast(tip);
            setConnectionError(tip);
        } else if (normalizedMessage.includes('user rejected') || normalizedMessage.includes('request rejected')) {
            const tip = t('wallet.userRejected') || 'Request rejected. Please approve in your wallet.';
            showToast(tip);
            setConnectionError(tip);
        } else if (normalizedMessage.includes('timeout')) {
            const tip = t('wallet.connectionTimeout') || 'Connection timeout. Please try again.';
            showToast(tip);
            setConnectionError(tip);
        } else {
            showToast(errorMessage);
        }
    }, [connected, connecting, disconnect, showToast, t]);

    useEffect(() => {
        if (!wallet?.adapter) return;
        const adapter = wallet.adapter;

        const errorListener = (error) => handleWalletError(error, adapter);

        if (adapter.on) {
            adapter.on('error', errorListener);
        }

        // 如果钱包未安装（readyState 非 Installed），立即提示
        if (adapter.readyState !== WalletReadyState.Installed ||
            (adapter.name?.toLowerCase().includes('phantom') && !window?.solana?.isPhantom)) {
            handleWalletError(new Error(`${adapter.name || 'Wallet'} wallet is not installed`), adapter);
        } else {
            // 保险起见再延迟检测一次
            const readyCheckTimeout = setTimeout(() => {
                if (connecting && adapter.name?.toLowerCase().includes('phantom') && !window?.solana?.isPhantom) {
                    handleWalletError(new Error(`${adapter.name} wallet is not installed`), adapter);
                }
            }, 30000);
            return () => {
                clearTimeout(readyCheckTimeout);
                if (adapter.off) {
                    adapter.off('error', errorListener);
                }
            };
        }

        return () => {
            if (adapter.off) {
                adapter.off('error', errorListener);
            }
        };
    }, [wallet, connecting, handleWalletError]);

    useEffect(() => {
        if (connecting) {
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = setTimeout(() => {
                if (connecting && !connected) {
                    const msg = t('wallet.connectionTimeout') || 'Connection timeout. Please try again.';
                    setConnectionError(msg);
                    showToast(msg);
                    disconnect().catch(err => console.error('Timeout disconnect failed:', err));
                }
            },30000);
        } else {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
            if (connected && connectionError) {
                setConnectionError('');
            }
        }

        return () => {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
        };
    }, [connecting, connected, disconnect, showToast, t, connectionError]);

    // 连接钱包后查询协议状态
    useEffect(() => {
        let cancelled = false;

        if (!connected || !publicKey) {
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
    }, [connected, publicKey]);

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

    const walletReady = connected && Boolean(publicKey);
    const canShowBusiness = walletReady && agreementConfirmed;

    return (
        <>
            <GlobalStyle />
            <Header />
            <AppContainer>
                {!walletReady ? (
                    <CardWraper>
                        <Card className='noConnectCard'>
                            <img src={icon1} alt="icon1" className='icon1' />
                            <div className='noConnectCardText'>{t('app.qrWarning')}</div>
                            <WalletConnect />
                            {connectionError && (
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Helper style={{ marginBottom: 12, color: '#ff6b6b' }}>
                                        {connectionError}
                                    </Helper>
                                    <PrimaryButton
                                        onClick={async () => {
                                            try {
                                                await disconnect();
                                            } catch (err) {
                                                console.error('Failed to disconnect:', err);
                                            } finally {
                                                setConnectionError('');
                                                showToast(t('wallet.resetConnection') || 'Connection reset');
                                            }
                                        }}
                                        style={{ marginTop: 8 }}
                                    >
                                        {t('wallet.resetConnection') || 'Reset Connection'}
                                    </PrimaryButton>
                                </div>
                            )}
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
                            {walletReady && (
                                <>
                                    {agreementChecking && (
                                        <Helper style={{ textAlign: 'center', marginTop: 24 }}>
                                            {t('agreement.checkingStatus')}
                                        </Helper>
                                    )}
                                    {!agreementChecking && canShowBusiness && (
                                        <>
                                            <AddressQR onRefreshActivityList={() => {
                                                if (activityListRef.current) {
                                                    activityListRef.current.refresh();
                                                }
                                            }} />
                                            <ActivityList ref={activityListRef} pageSize={5} />
                                        </>
                                    )}
                                    {!agreementChecking && !canShowBusiness && (
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
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets}>
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

