import { useEffect, useRef } from 'react';
import { StorageType } from '../types';

export function useStorageWatch(
  storageType: StorageType,
  isEditing: boolean,
  onDataChange: () => void,
  interval = 3000
) {
  const snapshotRef = useRef<string>('');

  useEffect(() => {
    if (isEditing) return;

    const checkChanges = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        const result = await chrome.scripting.executeScript<[string], string>({
          target: { tabId: tab.id },
          func: (type: string) => {
            const storage = type === 'localStorage' ? localStorage : sessionStorage;
            const data: Record<string, string> = {};
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key) data[key] = storage.getItem(key) || '';
            }
            return JSON.stringify(data);
          },
          args: [storageType],
        });

        const current = result?.[0]?.result || '{}';
        if (snapshotRef.current && snapshotRef.current !== current) {
          onDataChange();
        }
        snapshotRef.current = current;
      } catch {
        // Tab may have been closed or navigated
      }
    };

    const timer = setInterval(checkChanges, interval);
    checkChanges();

    return () => clearInterval(timer);
  }, [storageType, isEditing, onDataChange, interval]);
}
