import React from 'react';
import { Modal } from './Modal';
import { useLocale } from '../../contexts/LocaleContext';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message, variant = 'default'
}) => {
  const { t } = useLocale();
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg
            text-gray-700 bg-gray-100 hover:bg-gray-200
            dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
            variant === 'danger'
              ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500'
              : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
          }`}
        >
          {t('confirm')}
        </button>
      </>
    }>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
};
