import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { timeoutRef.current = setTimeout(() => setShow(true), 400); }}
      onMouseLeave={() => { clearTimeout(timeoutRef.current); setShow(false); }}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs
          font-medium rounded-lg whitespace-nowrap z-50 shadow-lg
          bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent
            border-t-gray-900 dark:border-t-gray-200" />
        </div>
      )}
    </div>
  );
};
