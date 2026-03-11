import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

interface IDBNavigatorProps {
  databases: Array<{ name: string; version: number }>;
  objectStores: string[];
  selectedDB: string | null;
  selectedStore: string | null;
  totalCount: number;
  onSelectDB: (name: string) => void;
  onSelectStore: (name: string) => void;
}

export const IDBNavigator: React.FC<IDBNavigatorProps> = ({
  databases, objectStores, selectedDB, selectedStore, totalCount,
  onSelectDB, onSelectStore
}) => {
  const { t } = useLocale();

  const selectClass = `text-sm px-3 py-2 rounded-lg border
    border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    transition-colors`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t('database')}
        </label>
        <select
          value={selectedDB || ''}
          onChange={e => onSelectDB(e.target.value)}
          className={selectClass + ' w-full'}
        >
          <option value="" disabled>{t('noDatabases')}</option>
          {databases.map(db => (
            <option key={db.name} value={db.name}>{db.name} (v{db.version})</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t('objectStore')}
        </label>
        <select
          value={selectedStore || ''}
          onChange={e => onSelectStore(e.target.value)}
          className={selectClass + ' w-full'}
          disabled={!selectedDB}
        >
          <option value="" disabled>{t('noStores')}</option>
          {objectStores.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      {selectedStore && (
        <div className="pt-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {t('records')}: {totalCount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
