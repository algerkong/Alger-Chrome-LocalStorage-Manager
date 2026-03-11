import { useCallback } from 'react';
import { StorageType, StorageItem } from '../types';
import { getValueType, getItemSize } from '../utils/typeDetection';

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

export function useStorage() {
  const fetchAll = useCallback(async (storageType: StorageType): Promise<StorageItem[]> => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    const result = await chrome.scripting.executeScript<[string], Record<string, string>>({
      target: { tabId },
      func: (type: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        const data: Record<string, string> = {};
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) data[key] = storage.getItem(key) || '';
        }
        return data;
      },
      args: [storageType],
    });

    const storageData = result?.[0]?.result;
    if (!storageData) return [];

    return Object.entries(storageData).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      type: getValueType(typeof value === 'string' ? value : JSON.stringify(value)),
      size: getItemSize(typeof value === 'string' ? value : JSON.stringify(value)),
    }));
  }, []);

  const setItem = useCallback(async (storageType: StorageType, key: string, value: string) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, k: string, v: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        storage.setItem(k, v);
      },
      args: [storageType, key, value],
    });
  }, []);

  const removeItem = useCallback(async (storageType: StorageType, key: string) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, k: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        storage.removeItem(k);
      },
      args: [storageType, key],
    });
  }, []);

  const removeItems = useCallback(async (storageType: StorageType, keys: string[]) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, ks: string[]) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        ks.forEach(k => storage.removeItem(k));
      },
      args: [storageType, keys],
    });
  }, []);

  const importData = useCallback(async (
    storageType: StorageType,
    data: Record<string, string>,
    mode: 'merge' | 'replace'
  ) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, d: Record<string, string>, m: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        if (m === 'replace') storage.clear();
        Object.entries(d).forEach(([k, v]) => storage.setItem(k, v));
      },
      args: [storageType, data, mode],
    });
  }, []);

  const getCapacity = useCallback(async (storageType: StorageType): Promise<{ used: number; total: number }> => {
    const tabId = await getActiveTabId();
    if (!tabId) return { used: 0, total: 5 * 1024 * 1024 };

    const result = await chrome.scripting.executeScript<[string], number>({
      target: { tabId },
      func: (type: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        let size = 0;
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            size += key.length + (storage.getItem(key) || '').length;
          }
        }
        return size * 2;
      },
      args: [storageType],
    });

    return { used: result?.[0]?.result || 0, total: 5 * 1024 * 1024 };
  }, []);

  return { fetchAll, setItem, removeItem, removeItems, importData, getCapacity };
}
