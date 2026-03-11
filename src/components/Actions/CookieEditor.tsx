import React, { useState, useEffect } from 'react';
import { CookieItem } from '../../types';
import { useLocale } from '../../contexts/LocaleContext';

interface CookieEditorProps {
  cookie: CookieItem | null;
  open: boolean;
  isNew?: boolean;
  onClose: () => void;
  onSave: (cookie: CookieItem) => void;
  onCopyAsCode: (cookie: CookieItem) => void;
}

export const CookieEditor: React.FC<CookieEditorProps> = ({
  cookie, open, isNew, onClose, onSave, onCopyAsCode
}) => {
  const { t } = useLocale();
  const [form, setForm] = useState<CookieItem>({
    name: '', value: '', domain: '', path: '/',
    expires: null, httpOnly: false, secure: false,
    sameSite: 'lax', size: 0,
  });

  useEffect(() => {
    if (cookie) setForm({ ...cookie });
    else setForm({
      name: '', value: '', domain: '', path: '/',
      expires: null, httpOnly: false, secure: false,
      sameSite: 'lax', size: 0,
    });
  }, [cookie]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const update = (field: keyof CookieItem, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExtend = (days: number) => {
    const newExpires = Math.floor(Date.now() / 1000) + days * 86400;
    update('expires', newExpires);
  };

  const handleSave = () => {
    onSave(form);
  };

  const inputClass = `w-full text-sm px-3 py-2 rounded-lg border
    border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    transition-colors`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
          onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full z-40 w-[45%] min-w-[380px] max-w-[600px]
        transform transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
        bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl
        flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? t('addCookie') : t('editCookie')}
          </span>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
              dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('cookieName')}</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('value')}</label>
            <textarea value={form.value} onChange={e => update('value', e.target.value)}
              rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('cookieDomain')}</label>
              <input value={form.domain} onChange={e => update('domain', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('cookiePath')}</label>
              <input value={form.path} onChange={e => update('path', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('cookieExpires')}</label>
            <input
              type="datetime-local"
              value={form.expires ? new Date(form.expires * 1000).toISOString().slice(0, 16) : ''}
              onChange={e => {
                const val = e.target.value;
                update('expires', val ? Math.floor(new Date(val).getTime() / 1000) : null);
              }}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.httpOnly} onChange={e => update('httpOnly', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500" />
              {t('httpOnly')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.secure} onChange={e => update('secure', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500" />
              {t('secure')}
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('sameSite')}</label>
            <select value={form.sameSite} onChange={e => update('sameSite', e.target.value)}
              className={inputClass}>
              <option value="strict">Strict</option>
              <option value="lax">Lax</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Quick Actions */}
          {!isNew && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onCopyAsCode(form)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-gray-700 bg-gray-100 hover:bg-gray-200
                    dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                  {t('copyAsCookie')}
                </button>
                <button onClick={() => handleExtend(7)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-blue-700 bg-blue-50 hover:bg-blue-100
                    dark:text-blue-300 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 transition-colors">
                  {t('extendDays').replace('{days}', '7')}
                </button>
                <button onClick={() => handleExtend(30)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg
                    text-blue-700 bg-blue-50 hover:bg-blue-100
                    dark:text-blue-300 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 transition-colors">
                  {t('extendDays').replace('{days}', '30')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium rounded-lg
              text-gray-700 bg-gray-100 hover:bg-gray-200
              dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-white
              bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500
              transition-colors shadow-sm">
            {t('save')}
          </button>
        </div>
      </div>
    </>
  );
};
