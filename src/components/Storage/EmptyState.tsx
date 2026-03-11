import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

export const EmptyState: React.FC = () => {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <p className="text-sm font-medium">{t('noData')}</p>
    </div>
  );
};
