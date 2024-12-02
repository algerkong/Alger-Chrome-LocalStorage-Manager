import React, { createContext, useContext, useState, useEffect } from 'react';
import zh_CN from '../locales/zh_CN';
import en_US from '../locales/en_US';

type Locale = 'zh_CN' | 'en_US';
type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof zh_CN) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>('zh_CN');

  // 初始化时获取存储的语言设置和系统语言
  useEffect(() => {
    const systemLanguage = navigator.language;
    const defaultLocale = systemLanguage.startsWith('zh') ? 'zh_CN' : 'en_US';

    chrome.storage.local.get(['locale'], (result) => {
      if (result.locale) {
        setLocale(result.locale);
      } else {
        // 如果没有存储的语言设置，使用系统语言并保存
        setLocale(defaultLocale);
        chrome.storage.local.set({ locale: defaultLocale });
      }
    });

    // 监听存储变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.locale) {
        setLocale(changes.locale.newValue);
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 当语言改变时保存到存储
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    chrome.storage.local.set({ locale: newLocale });
  };

  const t = (key: keyof typeof zh_CN) => {
    const messages = locale === 'zh_CN' ? zh_CN : en_US;
    return messages[key];
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}; 