import React, { useMemo, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { CardSectionTitle, ActivityRow, ActivityLeft, ActivityRight, Pagination, PageBtn, CardActiveDom, ActivityDom, SkeletonOrderItem, SkeletonOrderId, SkeletonDate, SkeletonIcon, SkeletonText, SkeletonRow, SkeletonLeft, SkeletonRight } from './styled/Layout.jsx';
import Empty from './Empty.jsx';
import { getOrderList } from '../utils/api.js';
import { formatDateDisplay } from '../utils/date.js';

// 简单的分页列表，使用真实 API 数据
const ActivityList = forwardRef(function ActivityList({ items = [], pageSize = 10 }, ref) {
    const { publicKey, connected } = useWallet();
    const { t } = useTranslation();
    const address = useMemo(() => (publicKey ? publicKey.toString() : ''), [publicKey]);
    // 使用 ref 存储翻译函数，避免语言切换时触发接口重新请求
    const tRef = React.useRef(t);
    React.useEffect(() => {
        tRef.current = t;
    }, [t]);
    
    const [page, setPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // 标记是否为首次加载
    const [error, setError] = useState(null);
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [expandedOrders, setExpandedOrders] = useState(new Set()); // 存储展开的订单ID

    // 监听窗口大小变化
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 状态映射：将 API 状态转换为显示状态
    const mapStatus = useCallback((apiStatus) => {
        const statusMap = {
            'CREATED': tRef.current('activity.status.created'),
            'WAITING_FOR_PAYER_CONFIRMATION': tRef.current('activity.status.waitingForPayment'),
            'WAITING_FOR_PAYEE_CONFIRMATION': tRef.current('activity.status.waitingForPayeeConfirmation'),
            'SUBMITTING_TO_CHAIN': tRef.current('activity.status.submitting'),
            'SUCCESS': tRef.current('activity.status.success'),
            'CANCELLED': tRef.current('activity.status.cancelled'),
            'REFUNDING': tRef.current('activity.status.refunding'),
            'REFUNDED': tRef.current('activity.status.refunded'),
            'REVOKED': tRef.current('activity.status.revoked'),
        };
        return statusMap[apiStatus] || apiStatus || tRef.current('activity.status.confirmed');
    }, []);

    // 统一日期格式化
    const formatDate = useCallback((dateStr) => formatDateDisplay(dateStr), []);

    // 格式化金额：保留合理的小数位数
    const formatAmount = useCallback((amountStr) => {
        if (!amountStr) return '0';
        const num = parseFloat(amountStr);
        if (isNaN(num)) return '0';
        // 如果金额小于 0.01，显示更多小数位；否则显示 2-4 位
        if (num < 0.01) {
            return num.toFixed(8).replace(/\.?0+$/, ''); // 最多8位，去掉末尾0
        } else if (num < 1) {
            return num.toFixed(4).replace(/\.?0+$/, '');
        } else {
            return num.toFixed(2).replace(/\.?0+$/, '');
        }
    }, []);

    // 切换订单展开/收起状态
    const toggleOrderExpand = useCallback((orderId) => {
        setExpandedOrders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    }, []);

    // 转换 API 返回的订单数据为组件需要的格式
    const transformOrderData = useCallback((order) => {
        // 根据实际 API 返回的数据结构映射字段
        const cryptoAmount = order.crypto_amount || '0';
        const fiatAmount = order.fiat_amount || '0';
        const cryptocurrency = (order.cryptocurrency || 'USDC').toUpperCase();
        console.log('🪐 order', order.created_at,formatDate(order.created_at));
        return {
            id: order.transaction_id ,
            amount: formatAmount(cryptoAmount),
            symbol: cryptocurrency,
            fiat: parseFloat(fiatAmount).toFixed(2),
            date: order.created_at ? formatDate(order.created_at) : null,
            status: mapStatus(order.status),
            // 保留原始数据，方便后续使用
            raw: order,
        };
    }, [formatDate, formatAmount, mapStatus]);

    // 获取订单列表数据
    const fetchOrders = useCallback(async (isPolling = false) => {
        if (!connected || !address) {
            setOrders([]);
            setTotal(0);
            setError(null);
            setIsInitialLoad(false); // 重置首次加载状态
            return;
        }

        // 只有在非轮询且为首次加载时才显示loading
        if (!isPolling) {
            setLoading(true);
        }
        setError(null);

        try {
            const offset = (page - 1) * pageSize;
            const result = await getOrderList({
                user_address: address,
                limit: pageSize,
                offset: offset,
            });

            // 根据实际 API 响应结构调整数据提取逻辑
            // 假设 API 返回格式可能是：{ code, message, data: { orders: [], total: 0 } }
            const orderList = result.orders || result.data?.orders || result.data || [];
            const orderTotal = result.total || result.data?.total || result.count || orderList.length;

            // 转换数据格式
            const transformedOrders = orderList.map(transformOrderData);

            setOrders(transformedOrders);
            setTotal(orderTotal || transformedOrders.length);
            
            // 首次加载完成后，标记为非首次加载
            if (isInitialLoad) {
                setIsInitialLoad(false);
            }
        } catch (err) {
            console.error('Failed to fetch order list:', err);
            setError(err.message || tRef.current('activity.fetchFailed'));
            setOrders([]);
            setTotal(0);
        } finally {
            if (!isPolling) {
                setLoading(false);
            }
        }
    }, [connected, address, page, pageSize, transformOrderData, isInitialLoad]);

    // 当钱包地址或页码变化时，重新获取订单列表
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // 60s 轮询一次，确保订单列表保持最新
    useEffect(() => {
        if (!connected || !address) {
            return;
        }

        const intervalId = setInterval(() => {
            fetchOrders(true); // 传入 true 表示这是轮询请求
        }, 60000);

        return () => clearInterval(intervalId);
    }, [connected, address, fetchOrders]);

    // 暴露刷新函数给父组件
    useImperativeHandle(ref, () => ({
        refresh: () => {
            fetchOrders(true); // 手动刷新也不显示骨架屏
        }
    }), [fetchOrders]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pageCount);
    const pageItems = orders; // 直接使用 API 返回的数据，不再做客户端分页

    // 生成分页页码数组
    const getPageNumbers = useMemo(() => {
        const totalPages = pageCount;
        const currentPage = current;
        const maxVisible = isMobile ? 3 : 5; // 移动端显示3个，PC端显示5个
        
        if (totalPages <= maxVisible + 2) {
            // 总页数较少，显示所有页码
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        
        const pages = [];
        const halfVisible = Math.floor(maxVisible / 2);
        
        // 总是显示第一页
        pages.push(1);
        
        // 计算起始和结束页码
        let start = Math.max(2, currentPage - halfVisible);
        let end = Math.min(totalPages - 1, currentPage + halfVisible);
        
        // 确保显示足够的页码
        if (currentPage <= halfVisible + 1) {
            end = Math.min(totalPages - 1, maxVisible);
        } else if (currentPage >= totalPages - halfVisible) {
            start = Math.max(2, totalPages - maxVisible);
        }
        
        // 添加起始页前的省略号
        if (start > 2) {
            pages.push('ellipsis-start');
        }
        
        // 添加中间页码
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        // 添加结束页后的省略号
        if (end < totalPages - 1) {
            pages.push('ellipsis-end');
        }
        
        // 总是显示最后一页
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    }, [current, pageCount, isMobile]);

    // 如果没有连接钱包，显示空状态
    if (!connected || !address) {
        return (
            <CardActiveDom>
                <CardSectionTitle>{t('activity.title')}</CardSectionTitle>
                <Empty text={t('activity.pleaseConnectWallet')} />
            </CardActiveDom>
        );
    }

    // 骨架屏组件
    const SkeletonLoader = () => (
        <>
            {Array.from({ length: pageSize }).map((_, idx) => (
                <SkeletonOrderItem key={idx}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px'
                    }}>
                        <SkeletonOrderId />
                        <SkeletonDate />
                    </div>
                    <SkeletonRow>
                        <SkeletonLeft>
                            <SkeletonIcon />
                            <div>
                                <SkeletonText 
                                    height="20px" 
                                    width="100px" 
                                    marginBottom="8px"
                                    mobileHeight="16px"
                                    mobileWidth="80px"
                                />
                                <SkeletonText 
                                    height="16px" 
                                    width="80px"
                                    mobileHeight="16px"
                                    mobileWidth="70px"
                                />
                            </div>
                        </SkeletonLeft>
                        <SkeletonRight>
                            <SkeletonText 
                                height="20px" 
                                width="120px" 
                                marginBottom="4px"
                                mobileHeight="16px"
                                mobileWidth="100px"
                            />
                            <SkeletonText 
                                height="16px" 
                                width="100px"
                                mobileHeight="14px"
                                mobileWidth="80px"
                            />
                        </SkeletonRight>
                    </SkeletonRow>
                </SkeletonOrderItem>
            ))}
        </>
    );

    // 加载中状态 - 只在首次加载且没有数据时显示骨架屏
    if (loading && isInitialLoad && pageItems.length === 0) {
        return (
            <CardActiveDom className='activityList'>
                <CardSectionTitle>Activity</CardSectionTitle>
                <div className='activityListContent'>
                    <SkeletonLoader />
                </div>
            </CardActiveDom>
        );
    }

    // 错误状态
    if (error && pageItems.length === 0) {
        return (
            <CardActiveDom>
                <CardSectionTitle>{t('activity.title')}</CardSectionTitle>
                <Empty text={error || t('activity.fetchFailed')} />
            </CardActiveDom>
        );
    }

    // 空数据状态
    if (!total || pageItems.length === 0) {
        return (
            <CardActiveDom>
                <CardSectionTitle>{t('activity.title')}</CardSectionTitle>
                <Empty  />
            </CardActiveDom>
        );
    }
    return (
        <CardActiveDom className='activityList'>
            <CardSectionTitle>{t('activity.title')}</CardSectionTitle>
            <div className='activityListContent' style={{ position: 'relative', minHeight: (loading && isInitialLoad) ? '400px' : 'auto' }}>
                {/* 只在首次加载时显示骨架屏覆盖层 */}
                {loading && isInitialLoad && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: '#101213',
                        zIndex: 10,
                        paddingTop: '8px',
                        overflow: 'hidden'
                    }}>
                        <SkeletonLoader />
                    </div>
                )}
                {/* 实际内容 - 只在首次加载时降低透明度 */}
                <div style={{ 
                    opacity: (loading && isInitialLoad) ? 0.3 : 1,
                    transition: 'opacity 0.2s'
                }}>
                    {pageItems.map((tx, idx) => {
                    const isRefunded = tx.raw?.status === 'REFUNDED';
                    const hasRefunds = isRefunded && tx.raw?.refund_list && tx.raw.refund_list.length > 0;
                    const isExpanded = expandedOrders.has(tx.id);
                    
                    return (
                        <ActivityDom key={tx.id}>
                          
                             <div style={{ color: '#8b90a2', fontSize: 12, padding: '8px 0 4px 0' ,display: 'flex', justifyContent: 'space-between'}}>
                               
                                <span>{t('activity.orderId')}: {tx.id}</span>
                                <span>{tx.date}</span>
                             </div>
                            
                            <ActivityRow>
                                <ActivityLeft>
                                    <div className='img'>
                                            <div className="icon"></div>
                                    </div>
                                    {/* <img src={consumptionIcon} alt="icon" className='img' /> */}
                                    <div className='activityLeftText'>
                                        <div className='activityLeftTextTitle'>{t('activity.shopping')}</div>
                                        <div className='activityLeftTextSubTitle'>{tx.status || t('activity.status.confirmed')}</div>
                                    </div>
                                   
                                </ActivityLeft>
                                <ActivityRight>
                                    <div className='activityRightText'>−{tx.amount} {tx.symbol}</div>
                                    <div className='activityRightTextFiat'>−{tx.fiat} JPY </div>
                                </ActivityRight>
                            </ActivityRow>
                            
                            {/* 退款记录展开/收起按钮 */}
                            {hasRefunds && (
                                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(220, 220, 220, .2)' }}>
                                    <button
                                        onClick={() => toggleOrderExpand(tx.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#7c4dff',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            padding: '4px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontFamily: 'PingFangSC, PingFang SC',
                                        }}
                                    >
                                        <span>{isExpanded ? t('activity.refund.hideDetails') : t('activity.refund.showDetails')}</span>
                                        <span style={{ fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </button>
                                    
                                    {/* 退款记录列表 */}
                                    {isExpanded && (
                                        <div style={{ 
                                            marginTop: '12px', 
                                            paddingLeft: '16px',
                                            borderLeft: '2px solid rgba(124, 77, 255, 0.3)'
                                        }}>
                                            {tx.raw.refund_list.map((refund, refundIdx) => (
                                                <div 
                                                    key={refund.refund_id || refundIdx}
                                                    style={{
                                                        padding: '12px 0',
                                                        borderBottom: refundIdx < tx.raw.refund_list.length - 1 ? '1px solid rgba(220, 220, 220, .1)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <span style={{ 
                                                            color: '#8b90a2', 
                                                            fontSize: '12px',
                                                            fontFamily: 'PingFangSC, PingFang SC'
                                                        }}>
                                                            {t('activity.refund.refundTime')}
                                                        </span>
                                                        <span style={{ 
                                                            color: '#FFFFFF', 
                                                            fontSize: '12px',
                                                            fontFamily: 'PingFangSC, PingFang SC'
                                                        }}>
                                                            {refund.refund_at ? formatDate(refund.refund_at) : '-'}
                                                        </span>
                                                    </div>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-end'
                                                    }}>
                                                        <div>
                                                            <div style={{ 
                                                                color: '#FFFFFF', 
                                                                fontSize: '16px',
                                                                fontFamily: 'PingFangSC, PingFang SC',
                                                                fontWeight: 500,
                                                                lineHeight: '20px',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {formatAmount(refund.refund_crypto_amount)} {tx.symbol}
                                                            </div>
                                                            <div style={{ 
                                                                color: '#A0AEC0', 
                                                                fontSize: '14px',
                                                                fontFamily: 'PingFangSC, PingFang SC',
                                                                lineHeight: '16px'
                                                            }}>
                                                                {parseFloat(refund.refund_fiat_amount || '0').toFixed(2)} JPY
                                                            </div>
                                                        </div>
                                                        <span style={{ 
                                                            color: '#1EBE30', 
                                                            fontSize: '12px',
                                                            fontFamily: 'PingFangSC, PingFang SC',
                                                            padding: '2px 8px',
                                                            background: 'rgba(30, 190, 48, 0.1)',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {refund.status === 'confirmed' ? t('activity.refund.confirmed') : refund.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ActivityDom>
                    );
                    })}
                </div>
            </div>
            {/* 加载完成后才显示分页组件 */}
            {!loading && (
            <Pagination>
                <PageBtn 
                    disabled={current === 1 || loading} 
                    onClick={() => {
                        setIsInitialLoad(true); // 翻页时重新标记为首次加载，显示骨架屏
                        setOrders([]); // 先清空列表，显示骨架屏
                        setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-label="Previous page"
                >
                    {'<'}
                </PageBtn>
                {getPageNumbers.map((pageNum, index) => {
                    if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                        return (
                            <PageBtn 
                                key={`ellipsis-${index}`} 
                                className="ellipsis"
                                disabled
                            >
                                ...
                            </PageBtn>
                        );
                    }
                    const pageNumber = typeof pageNum === 'number' ? pageNum : parseInt(pageNum, 10);
                    return (
                        <PageBtn
                            key={pageNum}
                            className={pageNumber === current ? 'active' : ''}
                            disabled={loading}
                            onClick={() => {
                                setIsInitialLoad(true); // 翻页时重新标记为首次加载，显示骨架屏
                                setOrders([]); // 先清空列表，显示骨架屏
                                setPage(pageNumber);
                            }}
                        >
                            {pageNum}
                        </PageBtn>
                    );
                })}
                <PageBtn 
                    disabled={current === pageCount || loading} 
                    onClick={() => {
                        setIsInitialLoad(true); // 翻页时重新标记为首次加载，显示骨架屏
                        setOrders([]); // 先清空列表，显示骨架屏
                        setPage((p) => Math.min(pageCount, p + 1));
                    }}
                    aria-label="Next page"
                >
                    {'>'}
                </PageBtn>
            </Pagination>
            )}
        </CardActiveDom>
    );
});

export default ActivityList;

ActivityList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        amount: PropTypes.number.isRequired,
        symbol: PropTypes.string.isRequired,
        fiat: PropTypes.number.isRequired,
    })),
    pageSize: PropTypes.number,
};



