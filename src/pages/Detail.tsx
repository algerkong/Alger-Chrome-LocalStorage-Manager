import { useEffect, useState } from 'react';
import { CodeEditor } from '../components/Editor/CodeEditor';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../components/Common/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { getValueType } from '../utils/typeDetection';
import { StorageType } from '../types';

function Detail() {
  const [value, setValue] = useState('');
  const [key, setKey] = useState('');
  const [isJson, setIsJson] = useState(false);
  const [originalTabId, setOriginalTabId] = useState<number | null>(null);
  const [storageType, setStorageType] = useState<StorageType>('localStorage');
  const { isDarkMode } = useTheme();
  const { addToast } = useToast();
  const { t } = useLocale();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');
    const st = params.get('storageType') as StorageType;

    if (tabId) setOriginalTabId(parseInt(tabId));
    if (st) setStorageType(st);

    const keyParam = params.get('key');
    const valueParam = params.get('value');

    if (keyParam && valueParam) {
      setKey(keyParam);
      try {
        const parsed = JSON.parse(valueParam);
        setValue(JSON.stringify(parsed, null, 2));
        setIsJson(true);
      } catch {
        setValue(valueParam);
        setIsJson(false);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      if (isJson) JSON.parse(value);

      if (!originalTabId) {
        addToast('error', t('getTabError'));
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: originalTabId },
        func: (type: string, k: string, v: string) => {
          const storage = type === 'localStorage' ? localStorage : sessionStorage;
          storage.setItem(k, v);
        },
        args: [storageType, key, value],
      });

      addToast('success', t('saveSuccess'));
    } catch {
      if (isJson) {
        addToast('error', t('jsonFormatError'));
      } else {
        addToast('error', t('saveFailed'));
      }
    }
  };

  const currentType = getValueType(value);

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300
      ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 border-b
        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {t('editLS')}: {key}
          </span>
          {isJson && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase
              bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
              JSON
            </span>
          )}
        </div>
        <button onClick={handleSave}
          className="px-4 py-1.5 text-sm font-medium rounded-lg text-white
            bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500
            transition-colors shadow-sm">
          {t('save')}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className={`h-full rounded-xl overflow-hidden border
          ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <CodeEditor
            value={value}
            onChange={setValue}
            height="calc(100vh - 100px)"
            isJson={currentType === 'JSON'}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
}

export default Detail;
