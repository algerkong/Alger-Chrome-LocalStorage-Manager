import React, { useEffect, useState } from 'react';
import { StorageItem } from '../../types';
import { CodeEditor } from '../Editor/CodeEditor';
import { TypeBadge } from '../Storage/TypeBadge';
import { useLocale } from '../../contexts/LocaleContext';
import { isTimestamp, formatTimestamp, getValueType } from '../../utils/typeDetection';
import { Tooltip } from '../Common/Tooltip';

interface SidePanelProps {
  item: StorageItem | null;
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSave: (key: string, value: string) => void;
  onOpenDetail: (item: StorageItem) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  item, open, isDarkMode, onClose, onSave, onOpenDetail
}) => {
  const { t } = useLocale();
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (item) {
      if (getValueType(item.value) === 'JSON') {
        try {
          setEditValue(JSON.stringify(JSON.parse(item.value), null, 2));
        } catch {
          setEditValue(item.value);
        }
      } else {
        setEditValue(item.value);
      }
    }
  }, [item]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleSave = () => {
    if (!item) return;
    const type = getValueType(editValue);
    let saveValue = editValue;
    if (type === 'JSON') {
      try {
        saveValue = JSON.stringify(JSON.parse(editValue));
      } catch {
        // keep as-is if invalid
      }
    }
    onSave(item.key, saveValue);
  };

  const handleUpdateTimestamp = () => {
    if (!item) return;
    const newValue = item.value.length === 10
      ? Math.floor(Date.now() / 1000).toString()
      : Date.now().toString();
    setEditValue(newValue);
  };

  const isTs = isTimestamp(editValue);
  const currentType = getValueType(editValue);

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
        flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item?.key}
              </span>
              <TypeBadge type={currentType} />
            </div>
            {isTs && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('timestamp')}: {formatTimestamp(editValue)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-3">
            {item && (
              <Tooltip content="Open in new window">
                <button onClick={() => onOpenDetail(item)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                    dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </Tooltip>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-5">
          <CodeEditor
            value={editValue}
            onChange={setEditValue}
            height="calc(100vh - 180px)"
            isJson={currentType === 'JSON'}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            {isTs && (
              <button onClick={handleUpdateTimestamp}
                className="px-3 py-1.5 text-xs font-medium rounded-lg
                  text-emerald-700 bg-emerald-50 hover:bg-emerald-100
                  dark:text-emerald-300 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50
                  transition-colors">
                {t('updateToNow')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
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
      </div>
    </>
  );
};
