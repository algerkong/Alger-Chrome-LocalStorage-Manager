import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

interface StorageCapacityProps {
  used: number;
  total: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const StorageCapacity: React.FC<StorageCapacityProps> = ({ used, total }) => {
  const { t } = useLocale();
  const percent = Math.min((used / total) * 100, 100);
  const color =
    percent >= 95 ? 'bg-red-500 dark:bg-red-400' :
    percent >= 80 ? 'bg-amber-500 dark:bg-amber-400' :
    'bg-blue-500 dark:bg-blue-400';

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="whitespace-nowrap">{t('storageCapacity')}</span>
      <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="whitespace-nowrap">{formatBytes(used)} / {formatBytes(total)}</span>
    </div>
  );
};
