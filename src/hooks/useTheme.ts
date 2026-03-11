import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    chrome.storage.local.get(['isDarkMode'], (result) => {
      if (typeof result.isDarkMode === 'undefined') {
        setIsDarkMode(mediaQuery.matches);
        chrome.storage.local.set({ isDarkMode: mediaQuery.matches });
      } else {
        setIsDarkMode(result.isDarkMode);
      }
    });

    const handleSystemChange = (e: MediaQueryListEvent) => {
      chrome.storage.local.get(['isDarkMode'], (result) => {
        if (typeof result.isDarkMode === 'undefined') {
          setIsDarkMode(e.matches);
          chrome.storage.local.set({ isDarkMode: e.matches });
        }
      });
    };

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.isDarkMode) {
        setIsDarkMode(changes.isDarkMode.newValue);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    chrome.storage.local.set({ isDarkMode: next });
  }, [isDarkMode]);

  return { isDarkMode, toggleTheme };
}
