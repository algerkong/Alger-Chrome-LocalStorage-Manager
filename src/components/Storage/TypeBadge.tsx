import React from 'react';
import { StorageValueType } from '../../types';

const badgeStyles: Record<StorageValueType, string> = {
  JSON: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Timestamp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Number: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Boolean: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  String: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const TypeBadge: React.FC<{ type: StorageValueType }> = ({ type }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${badgeStyles[type]}`}>
    {type}
  </span>
);
