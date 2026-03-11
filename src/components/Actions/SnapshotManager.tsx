import React, { useState, useRef, useEffect } from 'react';
import { Snapshot } from '../../types';
import { useLocale } from '../../contexts/LocaleContext';

interface SnapshotManagerProps {
  snapshots: Snapshot[];
  onSave: (name: string) => void;
  onRestore: (id: string, mode: 'merge' | 'replace') => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const SnapshotManager: React.FC<SnapshotManagerProps> = ({
  snapshots, onSave, onRestore, onDelete, onExport, onImport
}) => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNameInput(false);
        setRestoreId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = () => {
    if (!snapshotName.trim()) return;
    onSave(snapshotName.trim());
    setSnapshotName('');
    setShowNameInput(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}K`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
          dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        title={t('snapshots')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl shadow-xl border
          bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Save */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            {showNameInput ? (
              <div className="flex gap-2">
                <input
                  value={snapshotName}
                  onChange={e => setSnapshotName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={t('snapshotName')}
                  autoFocus
                  className="flex-1 text-sm px-2 py-1.5 rounded-lg border
                    border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={handleSave}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-white
                    bg-blue-500 hover:bg-blue-600 transition-colors">
                  {t('save')}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowNameInput(true)}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg
                  text-blue-600 dark:text-blue-400
                  hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                + {t('saveSnapshot')}
              </button>
            )}
          </div>

          {/* Snapshot list */}
          <div className="max-h-60 overflow-y-auto">
            {snapshots.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                {t('noData')}
              </div>
            ) : (
              snapshots.map(snap => (
                <div key={snap.id} className="px-3 py-2 border-b border-gray-50 dark:border-gray-800/50
                  hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {restoreId === snap.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('restoreMode')}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { onRestore(snap.id, 'merge'); setRestoreId(null); }}
                          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg
                            text-blue-700 bg-blue-50 hover:bg-blue-100
                            dark:text-blue-300 dark:bg-blue-950/50 dark:hover:bg-blue-900/50">
                          {t('merge')}
                        </button>
                        <button onClick={() => { onRestore(snap.id, 'replace'); setRestoreId(null); }}
                          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg
                            text-amber-700 bg-amber-50 hover:bg-amber-100
                            dark:text-amber-300 dark:bg-amber-950/50 dark:hover:bg-amber-900/50">
                          {t('replace')}
                        </button>
                        <button onClick={() => setRestoreId(null)}
                          className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700
                            dark:text-gray-400 dark:hover:text-gray-200">
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {snap.name}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">
                          {snap.itemCount} items · {formatSize(snap.totalSize)} · {formatTime(snap.createdAt)}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button onClick={() => setRestoreId(snap.id)}
                          className="px-2 py-1 text-[11px] font-medium rounded
                            text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50
                            transition-colors">
                          {t('restoreSnapshot')}
                        </button>
                        <button onClick={() => onDelete(snap.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50
                            dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={onExport}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                transition-colors">
              {t('exportSnapshots')}
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                transition-colors">
              {t('importSnapshots')}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
};
