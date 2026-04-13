import React, { useEffect, useState, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Card, PrimaryButton } from './styled/Layout.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast.jsx';

const WalletConnectActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: nowrap;
`;

const MobileLanguageSwitcher = styled.div`
    display: none;
    
    @media (max-width: 480px) {
        display: flex;
        align-items: center;
    }
    
    & button {
        padding: 6px 10px;
        font-size: 12px;
    }
`;

const ResetButton = styled(PrimaryButton)`
    padding: 10px 20px;
    font-size: 14px;
    min-width: 120px;
    width: 100%;
    margin: 16px auto 0;
    display: block;
    background: #ff6b6b;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
        background: #ff5252;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    @media (max-width: 480px) {
        padding: 10px 16px;
        font-size: 13px;
        min-width: 100px;
        margin: 12px auto 0;
    }
`;

// 检测是否为移动设备
function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
}

function WalletConnect() {
    const { connecting, connected, disconnect, select, wallet } = useWallet();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [showReset, setShowReset] = useState(false);
    const timeoutRef = useRef(null);
    const prevConnectingRef = useRef(false);
    // @ts-ignore - Wallet 类型
    const prevWalletRef = useRef(null);
    const checkedWalletRef = useRef(new Set()); // 记录已检查过的钱包，避免重复提示
    const isMobile = useMemo(() => isMobileDevice(), []);

    // 检测钱包是否安装（在钱包被选择时立即检测）
    useEffect(() => {
        // 如果钱包发生变化（被选择）
        if (wallet && wallet !== prevWalletRef.current) {
            // @ts-ignore - Wallet 类型
            prevWalletRef.current = wallet;
            
            // 检查是否已经检查过这个钱包
            const walletKey = wallet.adapter?.name || 'unknown';
            if (checkedWalletRef.current.has(walletKey)) {
                return;
            }

            if (wallet?.adapter) {
                const adapter = wallet.adapter;
                const isPhantom = adapter.name?.toLowerCase().includes('phantom');
                
                // 移动端：允许 Installed 或 Loadable 状态
                // 桌面端：只允许 Installed 状态
                const validReadyState = isMobile 
                    ? (adapter.readyState === WalletReadyState.Installed || adapter.readyState === WalletReadyState.Loadable)
                    : (adapter.readyState === WalletReadyState.Installed);
                
                let isNotInstalled = !validReadyState;
                
                // 对于 Phantom，在桌面端额外检查 window.solana
                // 移动端不强制要求 window.solana，因为可能通过深度链接打开
                if (isPhantom && !isMobile && typeof window !== 'undefined') {
                    // @ts-ignore - window.solana 是动态属性
                    isNotInstalled = isNotInstalled || !window.solana?.isPhantom;
                }

                if (isNotInstalled) {
                    const walletName = adapter.name || 'Wallet';
                    console.log(`${walletName} not installed, clearing selection and showing toast`);
                    
                    // 显示提示
                    // @ts-ignore - showToast 类型检查
                    showToast(t('wallet.notInstalled', { wallet: walletName }) || `${walletName} 未安装，请先安装`);
                    
                    // 清除选择，让用户重新选择
                    if (select) {
                        select(null);
                    }
                    
                    // 标记已检查过，避免重复提示
                    checkedWalletRef.current.add(walletKey);
                    
                    // 3秒后清除标记，允许用户再次尝试
                    setTimeout(() => {
                        checkedWalletRef.current.delete(walletKey);
                    }, 3000);
                    
                    return;
                } else {
                    // 钱包已安装，清除检查标记
                    checkedWalletRef.current.delete(walletKey);
                }
            }
        }
    }, [wallet, select, showToast, t, isMobile]);

    // 检测连接超时或钱包未安装的情况
    useEffect(() => {
        // 清理之前的超时
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (connecting) {
            // 检测钱包是否未安装（立即检查）
            if (wallet?.adapter) {
                const adapter = wallet.adapter;
                const isPhantom = adapter.name?.toLowerCase().includes('phantom');
                
                // 移动端：允许 Installed 或 Loadable 状态
                // 桌面端：只允许 Installed 状态
                const validReadyState = isMobile 
                    ? (adapter.readyState === WalletReadyState.Installed || adapter.readyState === WalletReadyState.Loadable)
                    : (adapter.readyState === WalletReadyState.Installed);
                
                let isNotInstalled = !validReadyState;
                
                // 对于 Phantom，在桌面端额外检查 window.solana
                // 移动端不强制要求 window.solana，因为可能通过深度链接打开
                if (isPhantom && !isMobile && typeof window !== 'undefined') {
                    // @ts-ignore - window.solana 是动态属性
                    isNotInstalled = isNotInstalled || !window.solana?.isPhantom;
                }

                if (isNotInstalled) {
                    console.log('Wallet not installed during connection, showing reset button immediately');
                    setShowReset(true);
                    // 显示提示
                    const walletName = adapter.name || 'Wallet';
                    // @ts-ignore - showToast 类型检查
                    showToast(t('wallet.notInstalled', { wallet: walletName }) || `${walletName} 未安装，请先安装`);
                    return;
                }
            }

            // 设置超时检测（10秒，缩短时间以便更快显示）
            // @ts-ignore - setTimeout 返回类型在不同环境可能不同
            timeoutRef.current = setTimeout(() => {
                if (connecting) {
                    console.log('Wallet connection timeout, showing reset button');
                    setShowReset(true);
                }
            }, 10000);
        } else {
            // 连接完成或取消，隐藏重置按钮
            // 但只在从连接状态变为非连接状态时才隐藏
            if (prevConnectingRef.current && !connecting) {
                // 延迟一点隐藏，给用户时间看到按钮
                setTimeout(() => {
                    setShowReset(false);
                }, 1000);
            } else if (!connecting) {
                setShowReset(false);
            }
        }

        prevConnectingRef.current = connecting;

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [connecting, wallet, showToast, t, isMobile]);

    // 监听钱包适配器错误
    useEffect(() => {
        if (!wallet?.adapter) return;

        const adapter = wallet.adapter;
        const handleError = (error) => {
            const errorMessage = error?.message || error?.toString() || '';
            const normalizedMessage = errorMessage.toLowerCase();
            
            console.log('Wallet adapter error:', errorMessage);
            
            // 检测钱包未安装的错误
            if (normalizedMessage.includes('not installed') ||
                normalizedMessage.includes('not found') ||
                normalizedMessage.includes('not available') ||
                normalizedMessage.includes('unavailable')) {
                console.log('Wallet not installed error detected, showing reset button');
                setShowReset(true);
            }
        };

        if (adapter.on) {
            adapter.on('error', handleError);
        }

        return () => {
            if (adapter.off) {
                adapter.off('error', handleError);
            }
        };
    }, [wallet]);

    const handleReset = async () => {
        try {
            console.log('Resetting wallet connection...');
            // 清理超时
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            // 断开当前连接
            if (wallet?.adapter && (connecting || connected)) {
                await disconnect();
            }
            
            // 清除选择，这样会重新显示钱包选择弹框
            if (select) {
                const walletName = wallet?.adapter?.name || '';
                if (walletName) {
                    checkedWalletRef.current.delete(walletName);
                }
                select(null);
            }
            
            setShowReset(false);
            prevWalletRef.current = null;
        } catch (error) {
            console.error('Failed to reset wallet connection:', error);
            // 即使出错也清除选择
            if (select) {
                select(null);
            }
            setShowReset(false);
            prevWalletRef.current = null;
        }
    };

    return (
        <Card>
            <WalletConnectActions>
                <WalletMultiButton />
             
                <MobileLanguageSwitcher>
                    <LanguageSwitcher compact={true} />
                </MobileLanguageSwitcher>
            </WalletConnectActions>
            {showReset && (
                <ResetButton onClick={handleReset}>
                    {t('wallet.resetConnection') || '重置连接'}
                </ResetButton>
            )}
        </Card>
    );
}

export default WalletConnect;

