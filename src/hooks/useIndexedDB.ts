import { useState, useCallback } from 'react';

interface IDBDatabaseInfo {
  name: string;
  version: number;
}

export interface IDBRecord {
  key: IDBValidKey;
  value: any;
}

export function useIndexedDB() {
  const [databases, setDatabases] = useState<IDBDatabaseInfo[]>([]);
  const [objectStores, setObjectStores] = useState<string[]>([]);
  const [records, setRecords] = useState<IDBRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDB, setSelectedDB] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const executeInTab = useCallback(async <T>(func: (...args: any[]) => T, args?: any[]): Promise<T> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func,
      args: args || [],
      world: 'MAIN' as any,
    });
    return results[0]?.result as T;
  }, []);

  const listDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const dbs = await executeInTab(() => {
        return indexedDB.databases().then(dbs =>
          dbs.map(db => ({ name: db.name || '', version: db.version || 0 }))
        );
      });
      setDatabases(dbs);
      setObjectStores([]);
      setRecords([]);
      setSelectedDB(null);
      setSelectedStore(null);
    } finally {
      setLoading(false);
    }
  }, [executeInTab]);

  const selectDatabase = useCallback(async (dbName: string) => {
    setLoading(true);
    setSelectedDB(dbName);
    setSelectedStore(null);
    setRecords([]);
    try {
      const stores = await executeInTab((name: string) => {
        return new Promise<string[]>((resolve, reject) => {
          const request = indexedDB.open(name);
          request.onsuccess = () => {
            const db = request.result;
            const names = Array.from(db.objectStoreNames);
            db.close();
            resolve(names);
          };
          request.onerror = () => reject(request.error);
        });
      }, [dbName]);
      setObjectStores(stores);
    } finally {
      setLoading(false);
    }
  }, [executeInTab]);

  const selectStore = useCallback(async (dbName: string, storeName: string, offset = 0) => {
    setLoading(true);
    setSelectedStore(storeName);
    if (offset === 0) setRecords([]);
    try {
      const result = await executeInTab((dbN: string, storeN: string, off: number) => {
        return new Promise<{ records: Array<{ key: any; value: any }>; count: number }>((resolve, reject) => {
          const request = indexedDB.open(dbN);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeN, 'readonly');
            const store = tx.objectStore(storeN);
            const countReq = store.count();
            const items: Array<{ key: any; value: any }> = [];
            let skipped = 0;

            const cursorReq = store.openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (!cursor || items.length >= 100) {
                countReq.onsuccess = () => {
                  db.close();
                  resolve({ records: items, count: countReq.result });
                };
                if (countReq.readyState === 'done') {
                  db.close();
                  resolve({ records: items, count: countReq.result });
                }
                return;
              }
              if (skipped < off) {
                skipped++;
                cursor.continue();
                return;
              }
              items.push({ key: cursor.key, value: cursor.value });
              cursor.continue();
            };
            cursorReq.onerror = () => { db.close(); reject(cursorReq.error); };
          };
          request.onerror = () => reject(request.error);
        });
      }, [dbName, storeName, offset]);
      if (offset === 0) {
        setRecords(result.records);
      } else {
        setRecords(prev => [...prev, ...result.records]);
      }
      setTotalCount(result.count);
    } finally {
      setLoading(false);
    }
  }, [executeInTab]);

  const loadMore = useCallback(async () => {
    if (!selectedDB || !selectedStore) return;
    await selectStore(selectedDB, selectedStore, records.length);
  }, [selectedDB, selectedStore, records.length, selectStore]);

  const deleteRecord = useCallback(async (dbName: string, storeName: string, key: IDBValidKey) => {
    await executeInTab((dbN: string, storeN: string, k: any) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbN);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(storeN, 'readwrite');
          tx.objectStore(storeN).delete(k);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
        request.onerror = () => reject(request.error);
      });
    }, [dbName, storeName, key]);
  }, [executeInTab]);

  const deleteRecords = useCallback(async (dbName: string, storeName: string, keys: IDBValidKey[]) => {
    await executeInTab((dbN: string, storeN: string, ks: any[]) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbN);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(storeN, 'readwrite');
          const store = tx.objectStore(storeN);
          for (const k of ks) store.delete(k);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
        request.onerror = () => reject(request.error);
      });
    }, [dbName, storeName, keys]);
  }, [executeInTab]);

  return {
    databases, objectStores, records, totalCount, loading,
    selectedDB, selectedStore,
    listDatabases, selectDatabase, selectStore, loadMore,
    deleteRecord, deleteRecords,
  };
}
