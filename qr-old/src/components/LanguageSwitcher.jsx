import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const LanguageSwitcherContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const LanguageIcon = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: currentColor;
`;

const LanguageButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #eaeaf0;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.12);
  }
`;

const LanguageText = styled.span`
  font-weight: 500;
  white-space: nowrap;
`;

const LanguageAbbr = styled.span`
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
`;

const DropdownArrow = styled.span`
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
  font-size: 10px;
  color: #8b90a2;
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
  animation: fadeInDown 0.2s ease;
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LanguageOption = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  color: #eaeaf0;
  padding: 12px 16px;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  
  &.active {
    background: rgba(124, 77, 255, 0.15);
    color: #7c4dff;
    font-weight: 500;
    
    &::before {
      content: '✓';
      color: #7c4dff;
      font-weight: bold;
      margin-right: 4px;
    }
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  &:first-child {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
  
  &:last-child {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;

const languageNames = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

const languageAbbrs = {
  zh: 'ZH',
  en: 'EN',
  ja: 'JA',
};

// 可用的语言列表（隐藏中文）
const availableLanguages = ['en', 'ja'];

function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // 如果当前语言不在可用列表中（如中文），则显示英文作为默认
  const rawLanguage = i18n.language || 'en';
  const currentLanguage = availableLanguages.includes(rawLanguage) ? rawLanguage : 'en';
  const currentLanguageName = languageNames[currentLanguage] || 'English';
  const currentLanguageAbbr = languageAbbrs[currentLanguage] || 'EN';

  // 如果检测到当前语言是中文，自动切换到英文
  useEffect(() => {
    if (rawLanguage === 'zh' && currentLanguage !== 'zh') {
      i18n.changeLanguage('en');
      localStorage.setItem('app_language', 'en');
    }
  }, [rawLanguage, currentLanguage, i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
    setIsOpen(false);
  };

  return (
    <LanguageSwitcherContainer>
      <LanguageButton 
        style={{
          padding: compact ? '6px 8px' : '8px 12px',
          gap: compact ? '4px' : '8px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <LanguageIcon
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="currentColor"
          />
        </LanguageIcon>
        {!compact && <LanguageText>{currentLanguageName}</LanguageText>}
        {compact && <LanguageAbbr>{currentLanguageAbbr}</LanguageAbbr>}
        {!compact && <DropdownArrow style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</DropdownArrow>}
      </LanguageButton>
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <LanguageDropdown>
            {availableLanguages.map((lng) => (
              <LanguageOption
                key={lng}
                className={currentLanguage === lng ? 'active' : ''}
                onClick={() => changeLanguage(lng)}
              >
                {languageNames[lng]}
              </LanguageOption>
            ))}
          </LanguageDropdown>
        </>
      )}
    </LanguageSwitcherContainer>
  );
}

export default LanguageSwitcher;

