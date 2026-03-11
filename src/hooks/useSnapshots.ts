import { useState, useCallback } from 'react';
import { Snapshot, StorageType } from '../types';
import * as snapshotDB from '../utils/snapshotDB';
import { useStorage } from './useStorage';

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const storage = useStorage();

  const loadSnapshots = useCallback(async (url?: string) => {
    const list = await snapshotDB.getSnapshots(url);
    setSnapshots(list);
  }, []);

  const saveSnapshot = useCallback(async (
    name: string,
    url: string,
    storageType: StorageType,
    items: Array<{ key: string; value: string }>
  ) => {
    const data: Record<string, string> = {};
    let totalSize = 0;
    for (const item of items) {
      data[item.key] = item.value;
      totalSize += new Blob([item.key + item.value]).size;
    }
    const snapshot: Snapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      url,
      storageType,
      data,
      createdAt: Date.now(),
      itemCount: items.length,
      totalSize,
    };
    await snapshotDB.saveSnapshot(snapshot);
    await loadSnapshots(url);
  }, [loadSnapshots]);

  const restoreSnapshot = useCallback(async (
    id: string,
    mode: 'merge' | 'replace',
    storageType: StorageType
  ) => {
    const all = await snapshotDB.getSnapshots();
    const snapshot = all.find(s => s.id === id);
    if (!snapshot) return;
    await storage.importData(storageType, snapshot.data, mode);
  }, [storage]);

  const removeSnapshot = useCallback(async (id: string, url?: string) => {
    await snapshotDB.deleteSnapshot(id);
    await loadSnapshots(url);
  }, [loadSnapshots]);

  const exportSnapshots = useCallback(async () => {
    const all = await snapshotDB.exportAll();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshots-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importSnapshotsFromFile = useCallback(async (file: File, currentUrl?: string) => {
    const text = await file.text();
    const data = JSON.parse(text) as Snapshot[];
    await snapshotDB.importSnapshots(data);
    await loadSnapshots(currentUrl);
  }, [loadSnapshots]);

  return {
    snapshots,
    loadSnapshots,
    saveSnapshot,
    restoreSnapshot,
    removeSnapshot,
    exportSnapshots,
    importSnapshotsFromFile,
  };
}
