import React, { useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { DataSourceType } from '../../types';
import { Tooltip } from '../Common/Tooltip';

interface HeaderProps {
  dataSource: DataSourceType;
  onDataSourceChange: (ds: DataSourceType) => void;
  searchText: string;
  searchRegex: boolean;
  onSearchChange: (text: string) => void;
  onSearchRegexChange: (enabled: boolean) => void;
  onRefresh: () => void;
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onCopySetupCode: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  loading: boolean;
  selectedCount: number;
  onBatchDelete: () => void;
  onDeselectAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  dataSource, onDataSourceChange,
  searchText, searchRegex, onSearchChange, onSearchRegexChange,
  onRefresh, onAdd, onImport, onExport, onCopySetupCode,
  isDarkMode, onToggleTheme, loading,
  selectedCount, onBatchDelete, onDeselectAll,
  canUndo, canRedo, onUndo, onRedo,
  children,
}) => {
  const { t, setLocale, locale } = useLocale();
  const [showMenu, setShowMenu] = useState(false);

  const tabLabels: Record<DataSourceType, string> = {
    localStorage: 'Local',
    sessionStorage: 'Session',
    cookie: t('cookies'),
    indexedDB: 'IndexedDB',
  };

  return (
    <div className="space-y-3">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          {/* Data Source Tabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {(['localStorage', 'sessionStorage', 'cookie', 'indexedDB'] as DataSourceType[]).map(ds => (
              <button
                key={ds}
                onClick={() => onDataSourceChange(ds)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  dataSource === ds
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tabLabels[ds]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip content={`${t('undo')} (Ctrl+Z)`}>
            <button onClick={onUndo} disabled={!canUndo}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content={`${t('redo')} (Ctrl+Shift+Z)`}>
            <button onClick={onRedo} disabled={!canRedo}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          <Tooltip content={isDarkMode ? t('lightMode') : t('darkMode')}>
            <button onClick={onToggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </Tooltip>

          <Tooltip content={t('language')}>
            <button onClick={() => setLocale(locale === 'zh_CN' ? 'en_US' : 'zh_CN')}
              className="p-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors min-w-[32px]">
              {locale === 'zh_CN' ? 'EN' : '中'}
            </button>
          </Tooltip>

          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg shadow-xl border
                  bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <button onClick={() => { onCopySetupCode(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {t('copySetupCode')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Second row: Search + Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-16 py-2 text-sm rounded-lg border
              border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              dark:focus:ring-blue-400/20 dark:focus:border-blue-400
              transition-colors"
          />
          {searchText && (
            <button onClick={() => onSearchChange('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onSearchRegexChange(!searchRegex)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded
              transition-colors ${searchRegex
                ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            title={t('regexSearch')}
          >
            .*
          </button>
        </div>

        {children}

        {onAdd && (
          <Tooltip content={t('add')}>
            <button onClick={onAdd}
              className="p-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600
                dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </Tooltip>
        )}

        {onImport && (
          <Tooltip content={t('import')}>
            <button onClick={onImport}
              className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
                dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </Tooltip>
        )}

        {onExport && (
          <Tooltip content={t('export')}>
            <button onClick={onExport}
              className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
                dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </Tooltip>
        )}

        <Tooltip content={t('refresh')}>
          <button onClick={onRefresh}
            className={`p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
              dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all
              ${loading ? 'animate-spin' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Batch action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg
          bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {t('selectedCount').replace('{count}', String(selectedCount))}
          </span>
          <div className="flex-1" />
          <button onClick={onDeselectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {t('deselectAll')}
          </button>
          <button onClick={onBatchDelete}
            className="px-3 py-1 text-xs font-medium rounded-md text-white
              bg-red-500 hover:bg-red-600 transition-colors">
            {t('batchDelete')}
          </button>
        </div>
      )}
    </div>
  );
};
