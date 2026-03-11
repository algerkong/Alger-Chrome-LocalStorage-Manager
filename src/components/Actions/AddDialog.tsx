import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { CodeEditor } from '../Editor/CodeEditor';
import { useLocale } from '../../contexts/LocaleContext';

interface AddDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string) => Promise<void>;
  isDarkMode: boolean;
}

export const AddDialog: React.FC<AddDialogProps> = ({ open, onClose, onAdd, isDarkMode }) => {
  const { t } = useLocale();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyError, setKeyError] = useState('');

  const handleSubmit = async () => {
    if (!key.trim()) { setKeyError(t('keyRequired')); return; }
    if (key.length > 100) { setKeyError(t('keyTooLong')); return; }
    setKeyError('');
    try {
      setLoading(true);
      await onAdd(key, value);
      handleClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setKey('');
    setValue('');
    setKeyError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('addLS')} width="max-w-2xl" footer={
      <>
        <button onClick={handleClose}
          className="px-4 py-2 text-sm font-medium rounded-lg
            text-gray-700 bg-gray-100 hover:bg-gray-200
            dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
          {t('cancel')}
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg text-white
            bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500
            disabled:opacity-50 transition-colors">
          {loading ? '...' : t('confirm')}
        </button>
      </>
    }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('key')} <span className="text-red-500">*</span>
          </label>
          <input
            value={key}
            onChange={e => { setKey(e.target.value); setKeyError(''); }}
            placeholder={t('keyPlaceholder')}
            className={`w-full px-3 py-2 text-sm rounded-lg border
              ${keyError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 focus:border-blue-500'}
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 transition-colors`}
          />
          {keyError && <p className="mt-1 text-xs text-red-500">{keyError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('value')}
          </label>
          <CodeEditor
            value={value}
            onChange={setValue}
            height="200px"
            isJson={true}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </Modal>
  );
};
