import React, { useState, useRef, useEffect } from 'react';
import { StorageItem } from '../../types';
import { TypeBadge } from './TypeBadge';
import { formatTimestamp } from '../../utils/typeDetection';

interface StorageRowProps {
  item: StorageItem;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onInlineSave: (key: string, value: string) => void;
}

export const StorageRow: React.FC<StorageRowProps> = ({
  item, selected, onToggleSelect, onClick, onCopy, onDelete, onInlineSave
}) => {
  const [inlineEditing, setInlineEditing] = useState(false);
  const [inlineValue, setInlineValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inlineEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.value.length >= 100 || item.type === 'JSON') {
      onClick();
      return;
    }
    setInlineValue(item.value);
    setInlineEditing(true);
  };

  const handleInlineSave = () => {
    if (inlineValue !== item.value) {
      onInlineSave(item.key, inlineValue);
    }
    setInlineEditing(false);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInlineSave();
    } else if (e.key === 'Escape') {
      setInlineEditing(false);
    }
  };

  return (
    <div
      className={`group grid grid-cols-[40px_minmax(0,1.2fr)_80px_minmax(0,2fr)_60px_100px] gap-3 items-center
        px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer
        transition-colors duration-150
        ${selected
          ? 'bg-blue-50 dark:bg-blue-950/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
            text-blue-500 focus:ring-blue-500 focus:ring-offset-0
            dark:bg-gray-800 cursor-pointer"
        />
      </div>

      {/* Key */}
      <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={item.key}>
        {item.key}
      </div>

      {/* Type */}
      <div>
        <TypeBadge type={item.type} />
      </div>

      {/* Value */}
      <div onDoubleClick={handleDoubleClick}>
        {inlineEditing ? (
          <input
            ref={inputRef}
            value={inlineValue}
            onChange={e => setInlineValue(e.target.value)}
            onBlur={handleInlineSave}
            onKeyDown={handleInlineKeyDown}
            className="w-full text-sm font-mono px-2 py-0.5 rounded border
              border-blue-400 dark:border-blue-500
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono" title={item.value}>
            {item.type === 'Timestamp' ? (
              <span className="flex items-center gap-1.5">
                <span className="truncate">{item.value}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  {formatTimestamp(item.value)}
                </span>
              </span>
            ) : item.value}
          </div>
        )}
      </div>

      {/* Size */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-right tabular-nums">
        {item.size < 1024 ? `${item.size}B` : `${(item.size / 1024).toFixed(1)}K`}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCopy}
          className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50
            dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
          title="Copy"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50
            dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
