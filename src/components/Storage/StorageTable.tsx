import React, { useMemo } from 'react';
import { StorageItem, SortField, SortOrder } from '../../types';
import { StorageRow } from './StorageRow';
import { EmptyState } from './EmptyState';
import { useLocale } from '../../contexts/LocaleContext';

interface StorageTableProps {
  items: StorageItem[];
  selectedKeys: Set<string>;
  searchText: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onToggleSelect: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClickItem: (item: StorageItem) => void;
  onCopy: (value: string) => void;
  onDelete: (key: string) => void;
  onSort: (field: SortField) => void;
}

export const StorageTable: React.FC<StorageTableProps> = ({
  items, selectedKeys, searchText, sortField, sortOrder,
  onToggleSelect, onSelectAll, onDeselectAll, onClickItem, onCopy, onDelete, onSort
}) => {
  const { t } = useLocale();

  const filteredAndSorted = useMemo(() => {
    const lower = searchText.toLowerCase();
    let result = items.filter(i =>
      i.key.toLowerCase().includes(lower) || i.value.toLowerCase().includes(lower)
    );
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'key') cmp = a.key.localeCompare(b.key);
        else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
        else if (sortField === 'size') cmp = a.size - b.size;
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [items, searchText, sortField, sortOrder]);

  const allSelected = filteredAndSorted.length > 0 && filteredAndSorted.every(i => selectedKeys.has(i.key));

  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5H5z" />
      </svg>
    );
    return (
      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        {sortOrder === 'asc'
          ? <path d="M5 12l5-5 5 5H5z" />
          : <path d="M5 8l5 5 5-5H5z" />
        }
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,1.2fr)_80px_minmax(0,2fr)_60px_100px] gap-3 items-center
        px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
              text-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer"
          />
        </div>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          onClick={() => onSort('key')}>
          {t('key')} <SortIndicator field="key" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          onClick={() => onSort('type')}>
          {t('type')} <SortIndicator field="type" />
        </button>
        <div>{t('value')}</div>
        <button className="flex items-center gap-1 justify-end hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          onClick={() => onSort('size')}>
          {t('size')} <SortIndicator field="size" />
        </button>
        <div className="text-right">{t('actions')}</div>
      </div>

      {/* Body */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
        {filteredAndSorted.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAndSorted.map(item => (
            <StorageRow
              key={item.key}
              item={item}
              selected={selectedKeys.has(item.key)}
              onToggleSelect={() => onToggleSelect(item.key)}
              onClick={() => onClickItem(item)}
              onCopy={() => onCopy(item.value)}
              onDelete={() => onDelete(item.key)}
            />
          ))
        )}
      </div>
    </div>
  );
};
