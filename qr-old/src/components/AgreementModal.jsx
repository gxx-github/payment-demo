import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { acceptAgreement, DEFAULT_AGREEMENT_VERSION } from '../utils/agreement.js';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    
    @media (max-width: 768px) {
        padding: 10px;
    }
`;

const ModalContainer = styled.div`
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 16px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    
    @media (max-width: 768px) {
        max-height: 95vh;
        border-radius: 12px;
    }
`;

const ModalHeader = styled.div`
    padding: 24px;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const ModalTitle = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #eaeaf0;
    
    @media (max-width: 768px) {
        font-size: 18px;
    }
`;

const AgreementContent = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    color: #eaeaf0;
    line-height: 1.8;
    font-size: 14px;
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 13px;
    }
    
    /* 自定义滚动条 */
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-track {
        background: #0f0f15;
        border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
        
        &:hover {
            background: #555;
        }
    }
    
    h3 {
        margin-top: 24px;
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        
        &:first-child {
            margin-top: 0;
        }
    }
    
    p {
        margin-bottom: 16px;
        color: #cfd4e6;
    }
    
    ul, ol {
        margin-bottom: 16px;
        padding-left: 24px;
        
        li {
            margin-bottom: 8px;
            color: #cfd4e6;
        }
    }
    
    strong {
        color: #fff;
        font-weight: 600;
    }
`;

const ScrollIndicator = styled.div`
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 24px;
    background: linear-gradient(to top, rgba(26, 26, 26, 0.95), transparent);
    text-align: center;
    color: #8b90a2;
    font-size: 12px;
    pointer-events: none;
    transition: opacity 0.3s;
    opacity: ${props => props.hidden ? 0 : 1};
    
    @media (max-width: 768px) {
        padding: 8px 16px;
    }
`;

const ModalFooter = styled.div`
    padding: 20px 24px;
    border-top: 1px solid #333;
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    
    @media (max-width: 768px) {
        padding: 16px;
        flex-direction: column;
        align-items: stretch;
    }
`;

const FooterButtons = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    
    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column-reverse;
        gap: 8px;
    }
`;

const Button = styled.button`
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
        width: 100%;
        padding: 12px 24px;
    }
`;

const CancelButton = styled(Button)`
    background: transparent;
    color: #8b90a2;
    border: 1px solid #333;
    
    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        border-color: #444;
    }
`;

const AgreeButton = styled(Button)`
    background: #7c4dff;
    color: #fff;
    
    &:hover:not(:disabled) {
        background: #6a3fe0;
    }
    
    &:active:not(:disabled) {
        transform: translateY(1px);
    }
`;

const CheckboxContainer = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 0;
    
    @media (max-width: 768px) {
        margin-bottom: 16px;
        width: 100%;
    }
    
    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #7c4dff;
        flex-shrink: 0;
    }
    
    span {
        color: #cfd4e6;
        font-size: 14px;
        line-height: 1.5;
    }
`;

const WalletInfo = styled.div`
    margin: 0 24px;
    padding: 12px 16px;
    border: 1px solid #333;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    color: #cfd4e6;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-all;
    
    @media (max-width: 768px) {
        margin: 0 16px;
        font-size: 12px;
    }
    
    strong {
        display: block;
        margin-bottom: 6px;
        color: #fff;
        font-weight: 600;
    }
`;

function AgreementModal({ onAgree, onCancel, walletAddress, agreementVersion = DEFAULT_AGREEMENT_VERSION }) {
    const { t } = useTranslation();
    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const contentRef = useRef(null);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 获取当前语言的协议内容
    const agreementContent = t('agreement.content', { returnObjects: true });
    const agreementContentHtml = typeof agreementContent === 'string' ? agreementContent : '';

    // 检查是否滚动到底部
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        const checkScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = content;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px 容差
            setHasScrolledToBottom(isAtBottom);
        };

        checkScroll();
        content.addEventListener('scroll', checkScroll);
        
        return () => {
            content.removeEventListener('scroll', checkScroll);
        };
    }, [agreementContent]);

    const handleAgree = async () => {
        if (!isAgreed || !hasScrolledToBottom || isSubmitting) return;
        if (!walletAddress) {
            alert(t('agreement.walletMissing'));
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await acceptAgreement({
                user_address: walletAddress,
                agreement_version: agreementVersion || DEFAULT_AGREEMENT_VERSION,
            });

            onAgree(response);
        } catch (error) {
            console.error('Failed to sign agreement:', error);
            alert(error.message || t('agreement.signFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const canAgree = hasScrolledToBottom && isAgreed && !isSubmitting && Boolean(walletAddress);

    return (
        <ModalOverlay>
            <ModalContainer>
                <ModalHeader>
                    <ModalTitle>{t('agreement.title')}</ModalTitle>
                </ModalHeader>
                
                {walletAddress && (
                    <WalletInfo>
                        <strong>{t('agreement.currentWalletLabel')}</strong>
                        <span>{walletAddress}</span>
                    </WalletInfo>
                )}
                
                <AgreementContent ref={contentRef}>
                    {Array.isArray(agreementContent) ? (
                        agreementContent.map((paragraph, index) => {
                            if (typeof paragraph === 'string') {
                                return <p key={index}>{paragraph}</p>;
                            }
                            // 如果是对象，可以支持更复杂的格式
                            return <p key={index}>{paragraph.text || paragraph}</p>;
                        })
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: agreementContentHtml }} />
                    )}
                </AgreementContent>
                
                <ScrollIndicator hidden={hasScrolledToBottom}>
                    {t('agreement.scrollToBottom')}
                </ScrollIndicator>
                
                <ModalFooter>
                    <CheckboxContainer>
                        <input
                            type="checkbox"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            disabled={!hasScrolledToBottom || isSubmitting || !walletAddress}
                        />
                        <span>{t('agreement.confirmText')}</span>
                    </CheckboxContainer>
                    <FooterButtons>
                        <CancelButton onClick={onCancel} disabled={isSubmitting}>
                            {t('agreement.cancel')}
                        </CancelButton>
                        <AgreeButton
                            onClick={handleAgree}
                            disabled={!canAgree}
                        >
                            {isSubmitting ? t('agreement.submitting') : t('agreement.agree')}
                        </AgreeButton>
                    </FooterButtons>
                </ModalFooter>
            </ModalContainer>
        </ModalOverlay>
    );
}

export default AgreementModal;

