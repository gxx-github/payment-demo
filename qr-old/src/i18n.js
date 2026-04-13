import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';
import ja from './locales/ja.json';

// 从 localStorage 读取保存的语言设置，默认为英文
// 如果之前保存的是中文，自动转换为英文
let savedLanguage = localStorage.getItem('app_language') || 'en';
if (savedLanguage === 'zh') {
    savedLanguage = 'en';
    localStorage.setItem('app_language', 'en');
}

i18n
    .use(initReactI18next)
    .init({
        resources: {
            zh: { translation: zh },
            en: { translation: en },
            ja: { translation: ja },
        },
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React 已经转义了
        },
    });

export default i18n;