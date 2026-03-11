import React, { useMemo, useState } from 'react';
import { CookieItem, SortOrder } from '../../types';
import { EmptyState } from './EmptyState';
import { useLocale } from '../../contexts/LocaleContext';

interface CookieTableProps {
  cookies: CookieItem[];
  selectedNames: Set<string>;
  searchText: string;
  searchRegex: boolean;
  onToggleSelect: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClickCookie: (cookie: CookieItem) => void;
  onCopy: (value: string) => void;
  onDelete: (name: string) => void;
}

type CookieSortField = 'name' | 'domain' | 'expires' | null;

export const CookieTable: React.FC<CookieTableProps> = ({
  cookies, selectedNames, searchText, searchRegex,
  onToggleSelect, onSelectAll, onDeselectAll, onClickCookie, onCopy, onDelete
}) => {
  const { t } = useLocale();
  const [sortField, setSortField] = useState<CookieSortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: CookieSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = cookies;
    if (searchText) {
      if (searchRegex) {
        try {
          const re = new RegExp(searchText, 'i');
          result = cookies.filter(c => re.test(c.name) || re.test(c.value) || re.test(c.domain));
        } catch { result = cookies; }
      } else {
        const lower = searchText.toLowerCase();
        result = cookies.filter(c =>
          c.name.toLowerCase().includes(lower) ||
          c.value.toLowerCase().includes(lower) ||
          c.domain.toLowerCase().includes(lower)
        );
      }
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'domain') cmp = a.domain.localeCompare(b.domain);
        else if (sortField === 'expires') cmp = (a.expires ?? Infinity) - (b.expires ?? Infinity);
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [cookies, searchText, searchRegex, sortField, sortOrder]);

  const allSelected = filtered.length > 0 && filtered.every(c => selectedNames.has(c.name));

  const formatExpiry = (expires: number | null) => {
    if (expires === null) return t('sessionCookie');
    const now = Date.now() / 1000;
    if (expires < now) return t('expired');
    const diff = expires - now;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const SortIndicator: React.FC<{ field: CookieSortField }> = ({ field }) => {
    if (sortField !== field) return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5H5z" />
      </svg>
    );
    return (
      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        {sortOrder === 'asc' ? <path d="M5 12l5-5 5 5H5z" /> : <path d="M5 8l5 5 5-5H5z" />}
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_100px_80px_70px_80px] gap-2 items-center
        px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="flex justify-center">
          <input type="checkbox" checked={allSelected}
            onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500
              focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer" />
        </div>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => handleSort('name')}>
          {t('cookieName')} <SortIndicator field="name" />
        </button>
        <div>{t('value')}</div>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => handleSort('domain')}>
          {t('cookieDomain')} <SortIndicator field="domain" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => handleSort('expires')}>
          {t('cookieExpires')} <SortIndicator field="expires" />
        </button>
        <div>{t('cookieFlags')}</div>
        <div className="text-right">{t('actions')}</div>
      </div>

      {/* Body */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map(cookie => (
            <div key={`${cookie.name}-${cookie.domain}`}
              className={`group grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_100px_80px_70px_80px] gap-2 items-center
                px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer
                transition-colors duration-150
                ${selectedNames.has(cookie.name)
                  ? 'bg-blue-50 dark:bg-blue-950/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              onClick={() => onClickCookie(cookie)}
            >
              <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedNames.has(cookie.name)}
                  onChange={() => onToggleSelect(cookie.name)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500
                    focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer" />
              </div>
              <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={cookie.name}>
                {cookie.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono" title={cookie.value}>
                {cookie.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={cookie.domain}>
                {cookie.domain}
              </div>
              <div className={`text-xs ${
                cookie.expires !== null && cookie.expires < Date.now() / 1000
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatExpiry(cookie.expires)}
              </div>
              <div className="flex gap-1 text-xs">
                {cookie.httpOnly && <span title="HttpOnly" className="text-amber-500">H</span>}
                {cookie.secure && <span title="Secure" className="text-green-500">S</span>}
                <span title={`SameSite: ${cookie.sameSite}`} className="text-gray-400">
                  {cookie.sameSite === 'strict' ? 'St' : cookie.sameSite === 'lax' ? 'Lx' : cookie.sameSite === 'none' ? 'No' : '?'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => onCopy(cookie.value)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50
                    dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(cookie.name)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50
                    dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
