import React, { useMemo } from 'react';
import { EmptyState } from './EmptyState';
import { useLocale } from '../../contexts/LocaleContext';

interface IDBRecord {
  key: IDBValidKey;
  value: any;
}

interface IDBTableProps {
  records: IDBRecord[];
  totalCount: number;
  loading: boolean;
  selectedKeys: Set<string>;
  searchText: string;
  searchRegex: boolean;
  onToggleSelect: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClickRecord: (record: IDBRecord) => void;
  onDelete: (key: IDBValidKey) => void;
  onLoadMore: () => void;
}

export const IDBTable: React.FC<IDBTableProps> = ({
  records, totalCount, loading, selectedKeys, searchText, searchRegex,
  onToggleSelect, onSelectAll, onDeselectAll, onClickRecord, onDelete, onLoadMore
}) => {
  const { t } = useLocale();

  const keyStr = (key: IDBValidKey) => String(key);
  const valuePreview = (val: any) => {
    try {
      const s = JSON.stringify(val);
      return s.length > 120 ? s.slice(0, 120) + '...' : s;
    } catch {
      return String(val);
    }
  };
  const valueSize = (val: any) => {
    try {
      const s = JSON.stringify(val);
      return new Blob([s]).size;
    } catch {
      return 0;
    }
  };

  const filtered = useMemo(() => {
    if (!searchText) return records;
    if (searchRegex) {
      try {
        const re = new RegExp(searchText, 'i');
        return records.filter(r => re.test(keyStr(r.key)) || re.test(JSON.stringify(r.value)));
      } catch { return records; }
    }
    const lower = searchText.toLowerCase();
    return records.filter(r =>
      keyStr(r.key).toLowerCase().includes(lower) ||
      JSON.stringify(r.value).toLowerCase().includes(lower)
    );
  }, [records, searchText, searchRegex]);

  const allSelected = filtered.length > 0 && filtered.every(r => selectedKeys.has(keyStr(r.key)));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(0,2fr)_60px_80px] gap-3 items-center
        px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="flex justify-center">
          <input type="checkbox" checked={allSelected}
            onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500
              focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer" />
        </div>
        <div>{t('key')}</div>
        <div>{t('value')}</div>
        <div className="text-right">{t('size')}</div>
        <div className="text-right">{t('actions')}</div>
      </div>

      {/* Body */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filtered.map((record, idx) => {
              const ks = keyStr(record.key);
              return (
                <div key={`${ks}-${idx}`}
                  className={`group grid grid-cols-[40px_minmax(0,1fr)_minmax(0,2fr)_60px_80px] gap-3 items-center
                    px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer
                    transition-colors duration-150
                    ${selectedKeys.has(ks) ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  onClick={() => onClickRecord(record)}
                >
                  <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedKeys.has(ks)}
                      onChange={() => onToggleSelect(ks)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500
                        focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer" />
                  </div>
                  <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={ks}>
                    {ks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono">
                    {valuePreview(record.value)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-right tabular-nums">
                    {(() => { const s = valueSize(record.value); return s < 1024 ? `${s}B` : `${(s / 1024).toFixed(1)}K`; })()}
                  </div>
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => onDelete(record.key)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50
                        dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            {records.length < totalCount && (
              <div className="py-3 text-center">
                <button onClick={onLoadMore} disabled={loading}
                  className="px-4 py-2 text-sm font-medium rounded-lg
                    text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30
                    disabled:opacity-50 transition-colors">
                  {loading ? '...' : `${t('loadMore')} (${records.length}/${totalCount})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Read-only badge */}
      <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-800
        text-[11px] text-gray-400 dark:text-gray-500 text-center">
        {t('readOnly')}
      </div>
    </div>
  );
};
