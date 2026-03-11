# Chrome LocalStorage Manager UI Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete rewrite of the Chrome LocalStorage Manager extension — remove Ant Design, use pure Tailwind CSS with Bento Grid layout, add SessionStorage, batch ops, undo/redo, import/export, storage capacity, data watching, error boundaries, sorting, debounced search.

**Architecture:** Hooks-based architecture with `useReducer` global state in `AppContext`. UI layer is pure Tailwind components receiving props. All Chrome API side effects isolated in hooks (`useStorage`, `useTheme`, `useStorageWatch`). Utility functions extracted for type detection, clipboard, and import/export.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, CodeMirror, Vite, Chrome Extension Manifest V3

**Spec:** `docs/superpowers/specs/2026-03-11-ui-rebuild-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/index.ts` | Create | All shared TypeScript types |
| `src/utils/typeDetection.ts` | Create | Value type detection with fixed timestamp logic |
| `src/utils/clipboard.ts` | Create | Clipboard operations + copy setup code |
| `src/utils/exportImport.ts` | Create | JSON import/export logic |
| `src/hooks/useDebounce.ts` | Create | Generic debounce hook |
| `src/hooks/useTheme.ts` | Create | Dark mode management |
| `src/hooks/useStorage.ts` | Create | localStorage + sessionStorage CRUD via Chrome API |
| `src/hooks/useUndoRedo.ts` | Create | Undo/redo stack |
| `src/hooks/useStorageWatch.ts` | Create | Poll active tab for storage changes |
| `src/contexts/AppContext.tsx` | Create | Global state with useReducer |
| `src/contexts/LocaleContext.tsx` | Modify | Keep, minor cleanup |
| `src/components/Common/Toast.tsx` | Create | Notification system |
| `src/components/Common/Modal.tsx` | Create | Pure Tailwind modal |
| `src/components/Common/ConfirmDialog.tsx` | Create | Confirm dialog |
| `src/components/Common/ErrorBoundary.tsx` | Create | React error boundary |
| `src/components/Common/StorageCapacity.tsx` | Create | Capacity progress bar |
| `src/components/Common/Tooltip.tsx` | Create | Hover tooltip |
| `src/components/Layout/Header.tsx` | Create | Top bar with search, toggle, actions |
| `src/components/Layout/SidePanel.tsx` | Create | Right-side editor panel |
| `src/components/Storage/TypeBadge.tsx` | Create | Color-coded type label |
| `src/components/Storage/StorageRow.tsx` | Create | Single table row |
| `src/components/Storage/StorageTable.tsx` | Create | Bento Grid data table |
| `src/components/Storage/EmptyState.tsx` | Create | Empty state illustration |
| `src/components/Actions/SearchBar.tsx` | Create | Debounced search input |
| `src/components/Actions/AddDialog.tsx` | Create | Add new item modal |
| `src/components/Actions/ImportExport.tsx` | Create | Import/export buttons + logic |
| `src/components/Actions/BatchActions.tsx` | Create | Batch operation toolbar |
| `src/components/Actions/SortControl.tsx` | Create | Sort dropdown |
| `src/components/Editor/CodeEditor.tsx` | Create | CodeMirror wrapper |
| `src/pages/App.tsx` | Create (replace `src/App.tsx`) | Main popup page |
| `src/pages/Detail.tsx` | Rewrite | Detail editor page |
| `src/locales/zh_CN.ts` | Modify | Add new translation keys |
| `src/locales/en_US.ts` | Modify | Add new translation keys |
| `src/index.css` | Rewrite | Tailwind-only styles, remove Ant Design |
| `src/main.tsx` | Modify | Update imports |
| `src/detail.tsx` | Modify | Update imports |
| `package.json` | Modify | Remove antd, remove @tailwindcss/line-clamp |
| `src/App.tsx` | Delete | Replaced by `src/pages/App.tsx` |
| `src/App.css` | Delete | Unused |
| `src/components/CustomTable.tsx` | Delete | Replaced |
| `src/components/AddLocalStorage.tsx` | Delete | Replaced |

---

## Chunk 1: Foundation — Types, Utils, Hooks

### Task 1: Setup — Remove Ant Design, create directory structure

**Files:**
- Modify: `package.json`
- Delete: `src/App.css`, `src/components/CustomTable.tsx`, `src/components/AddLocalStorage.tsx`
- Create: directory scaffolding

- [ ] **Step 1: Remove Ant Design and unused deps from package.json**

Remove `antd` and `@tailwindcss/line-clamp` from dependencies. Run `bun install`.

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p src/{types,utils,hooks,components/{Common,Layout,Storage,Actions,Editor},pages}
```

- [ ] **Step 3: Delete old component files**

```bash
rm src/App.css src/components/CustomTable.tsx src/components/AddLocalStorage.tsx
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove antd, scaffold new directory structure"
```

---

### Task 2: Type definitions

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create unified type definitions**

```typescript
// src/types/index.ts

export interface StorageItem {
  key: string;
  value: string;
  type: StorageValueType;
  size: number;
  extraInfo?: string;
}

export type StorageValueType = 'JSON' | 'String' | 'Number' | 'Boolean' | 'Timestamp';

export type StorageType = 'localStorage' | 'sessionStorage';

export type SortField = 'key' | 'type' | 'size' | null;
export type SortOrder = 'asc' | 'desc';

export interface UndoAction {
  type: 'ADD' | 'UPDATE' | 'DELETE' | 'BATCH_DELETE';
  key: string;
  keys?: string[];
  oldValue?: string;
  newValue?: string;
  oldItems?: Array<{ key: string; value: string }>;
}

export interface AppState {
  items: StorageItem[];
  selectedKeys: Set<string>;
  editingItem: StorageItem | null;
  storageType: StorageType;
  searchText: string;
  sortField: SortField;
  sortOrder: SortOrder;
  loading: boolean;
  sidePanelOpen: boolean;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

export type AppAction =
  | { type: 'SET_ITEMS'; payload: StorageItem[] }
  | { type: 'SET_STORAGE_TYPE'; payload: StorageType }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'SELECT_ALL'; payload: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_EDITING'; payload: StorageItem | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: { field: SortField; order: SortOrder } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SIDE_PANEL'; payload: boolean }
  | { type: 'PUSH_UNDO'; payload: UndoAction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_ITEM'; payload: StorageItem }
  | { type: 'UPDATE_ITEM'; payload: { key: string; value: string } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'DELETE_ITEMS'; payload: string[] };

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add unified type definitions"
```

---

### Task 3: Utility functions

**Files:**
- Create: `src/utils/typeDetection.ts`
- Create: `src/utils/clipboard.ts`
- Create: `src/utils/exportImport.ts`

- [ ] **Step 1: Create typeDetection.ts with fixed timestamp logic**

```typescript
// src/utils/typeDetection.ts
import { StorageValueType } from '../types';

export function isTimestamp(value: string): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (value.length === 13) {
    return num > 978307200000 && num < 4102444800000;
  }
  if (value.length === 10) {
    return num > 978307200 && num < 4102444800;
  }
  return false;
}

export function isNumberValue(value: string): boolean {
  return value.trim() !== '' && !isNaN(Number(value));
}

export function isJsonValue(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

export function getValueType(value: string): StorageValueType {
  if (value === 'true' || value === 'false') return 'Boolean';
  if (isTimestamp(value)) return 'Timestamp';
  if (isJsonValue(value)) return 'JSON';
  if (isNumberValue(value)) return 'Number';
  return 'String';
}

export function formatTimestamp(value: string): string {
  const num = Number(value);
  const ms = value.length === 10 ? num * 1000 : num;
  return new Date(ms).toLocaleString();
}

export function getItemSize(value: string): number {
  return new Blob([value]).size;
}
```

- [ ] **Step 2: Create clipboard.ts**

```typescript
// src/utils/clipboard.ts
import { StorageItem } from '../types';

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function generateSetupCode(items: StorageItem[]): string {
  const data = items.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);
  return `var ls = ${JSON.stringify(data, null, 2)};\nObject.keys(ls).forEach(k => localStorage[k] = ls[k]);`;
}
```

- [ ] **Step 3: Create exportImport.ts**

```typescript
// src/utils/exportImport.ts
import { StorageItem } from '../types';

export function exportToJson(items: StorageItem[]): void {
  const data = items.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(file: File): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          reject(new Error('Invalid format: expected a JSON object'));
          return;
        }
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          result[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        resolve(result);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/ && git commit -m "feat: add utility functions (type detection, clipboard, import/export)"
```

---

### Task 4: Hooks — useDebounce, useTheme

**Files:**
- Create: `src/hooks/useDebounce.ts`
- Create: `src/hooks/useTheme.ts`

- [ ] **Step 1: Create useDebounce**

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

- [ ] **Step 2: Create useTheme**

```typescript
// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    chrome.storage.local.get(['isDarkMode'], (result) => {
      if (typeof result.isDarkMode === 'undefined') {
        setIsDarkMode(mediaQuery.matches);
        chrome.storage.local.set({ isDarkMode: mediaQuery.matches });
      } else {
        setIsDarkMode(result.isDarkMode);
      }
    });

    const handleSystemChange = (e: MediaQueryListEvent) => {
      chrome.storage.local.get(['isDarkMode'], (result) => {
        if (typeof result.isDarkMode === 'undefined') {
          setIsDarkMode(e.matches);
          chrome.storage.local.set({ isDarkMode: e.matches });
        }
      });
    };

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.isDarkMode) {
        setIsDarkMode(changes.isDarkMode.newValue);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    chrome.storage.local.set({ isDarkMode: next });
  }, [isDarkMode]);

  return { isDarkMode, toggleTheme };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDebounce.ts src/hooks/useTheme.ts && git commit -m "feat: add useDebounce and useTheme hooks"
```

---

### Task 5: Hooks — useStorage

**Files:**
- Create: `src/hooks/useStorage.ts`

- [ ] **Step 1: Create useStorage with unified localStorage/sessionStorage support**

```typescript
// src/hooks/useStorage.ts
import { useCallback } from 'react';
import { StorageType, StorageItem } from '../types';
import { getValueType, getItemSize } from '../utils/typeDetection';

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

export function useStorage() {
  const fetchAll = useCallback(async (storageType: StorageType): Promise<StorageItem[]> => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    const result = await chrome.scripting.executeScript<[string], Record<string, string>>({
      target: { tabId },
      func: (type: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        const data: Record<string, string> = {};
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) data[key] = storage.getItem(key) || '';
        }
        return data;
      },
      args: [storageType],
    });

    const storageData = result?.[0]?.result;
    if (!storageData) return [];

    return Object.entries(storageData).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      type: getValueType(typeof value === 'string' ? value : JSON.stringify(value)),
      size: getItemSize(typeof value === 'string' ? value : JSON.stringify(value)),
    }));
  }, []);

  const setItem = useCallback(async (storageType: StorageType, key: string, value: string) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, k: string, v: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        storage.setItem(k, v);
      },
      args: [storageType, key, value],
    });
  }, []);

  const removeItem = useCallback(async (storageType: StorageType, key: string) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, k: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        storage.removeItem(k);
      },
      args: [storageType, key],
    });
  }, []);

  const removeItems = useCallback(async (storageType: StorageType, keys: string[]) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, ks: string[]) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        ks.forEach(k => storage.removeItem(k));
      },
      args: [storageType, keys],
    });
  }, []);

  const importData = useCallback(async (
    storageType: StorageType,
    data: Record<string, string>,
    mode: 'merge' | 'replace'
  ) => {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (type: string, d: Record<string, string>, m: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        if (m === 'replace') storage.clear();
        Object.entries(d).forEach(([k, v]) => storage.setItem(k, v));
      },
      args: [storageType, data, mode],
    });
  }, []);

  const getCapacity = useCallback(async (storageType: StorageType): Promise<{ used: number; total: number }> => {
    const tabId = await getActiveTabId();
    if (!tabId) return { used: 0, total: 5 * 1024 * 1024 };

    const result = await chrome.scripting.executeScript<[string], number>({
      target: { tabId },
      func: (type: string) => {
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        let size = 0;
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            size += key.length + (storage.getItem(key) || '').length;
          }
        }
        return size * 2; // UTF-16 = 2 bytes per char
      },
      args: [storageType],
    });

    return { used: result?.[0]?.result || 0, total: 5 * 1024 * 1024 };
  }, []);

  return { fetchAll, setItem, removeItem, removeItems, importData, getCapacity };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useStorage.ts && git commit -m "feat: add useStorage hook with unified LS/SS support"
```

---

### Task 6: Hooks — useUndoRedo, useStorageWatch

**Files:**
- Create: `src/hooks/useUndoRedo.ts`
- Create: `src/hooks/useStorageWatch.ts`

- [ ] **Step 1: Create useUndoRedo**

```typescript
// src/hooks/useUndoRedo.ts
import { useCallback } from 'react';
import { UndoAction, StorageType } from '../types';
import { useStorage } from './useStorage';

const MAX_STACK = 50;

export function useUndoRedo(
  undoStack: UndoAction[],
  redoStack: UndoAction[],
  storageType: StorageType,
  dispatch: React.Dispatch<any>,
  refreshItems: () => Promise<void>
) {
  const { setItem, removeItem, removeItems: removeStorageItems } = useStorage();

  const pushUndo = useCallback((action: UndoAction) => {
    dispatch({ type: 'PUSH_UNDO', payload: action });
  }, [dispatch]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return false;
    const action = undoStack[undoStack.length - 1];

    switch (action.type) {
      case 'ADD':
        await removeItem(storageType, action.key);
        break;
      case 'UPDATE':
        if (action.oldValue !== undefined) {
          await setItem(storageType, action.key, action.oldValue);
        }
        break;
      case 'DELETE':
        if (action.oldValue !== undefined) {
          await setItem(storageType, action.key, action.oldValue);
        }
        break;
      case 'BATCH_DELETE':
        if (action.oldItems) {
          for (const item of action.oldItems) {
            await setItem(storageType, item.key, item.value);
          }
        }
        break;
    }

    dispatch({ type: 'UNDO' });
    await refreshItems();
    return true;
  }, [undoStack, storageType, dispatch, refreshItems, setItem, removeItem]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return false;
    const action = redoStack[redoStack.length - 1];

    switch (action.type) {
      case 'ADD':
        if (action.newValue !== undefined) {
          await setItem(storageType, action.key, action.newValue);
        }
        break;
      case 'UPDATE':
        if (action.newValue !== undefined) {
          await setItem(storageType, action.key, action.newValue);
        }
        break;
      case 'DELETE':
        await removeItem(storageType, action.key);
        break;
      case 'BATCH_DELETE':
        if (action.keys) {
          await removeStorageItems(storageType, action.keys);
        }
        break;
    }

    dispatch({ type: 'REDO' });
    await refreshItems();
    return true;
  }, [redoStack, storageType, dispatch, refreshItems, setItem, removeItem, removeStorageItems]);

  return { pushUndo, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}
```

- [ ] **Step 2: Create useStorageWatch**

```typescript
// src/hooks/useStorageWatch.ts
import { useEffect, useRef } from 'react';
import { StorageType } from '../types';

export function useStorageWatch(
  storageType: StorageType,
  isEditing: boolean,
  onDataChange: () => void,
  interval = 3000
) {
  const snapshotRef = useRef<string>('');

  useEffect(() => {
    if (isEditing) return;

    const checkChanges = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        const result = await chrome.scripting.executeScript<[string], string>({
          target: { tabId: tab.id },
          func: (type: string) => {
            const storage = type === 'localStorage' ? localStorage : sessionStorage;
            const data: Record<string, string> = {};
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key) data[key] = storage.getItem(key) || '';
            }
            return JSON.stringify(data);
          },
          args: [storageType],
        });

        const current = result?.[0]?.result || '{}';
        if (snapshotRef.current && snapshotRef.current !== current) {
          onDataChange();
        }
        snapshotRef.current = current;
      } catch {
        // Tab may have been closed or navigated
      }
    };

    const timer = setInterval(checkChanges, interval);
    // Take initial snapshot
    checkChanges();

    return () => clearInterval(timer);
  }, [storageType, isEditing, onDataChange, interval]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUndoRedo.ts src/hooks/useStorageWatch.ts && git commit -m "feat: add useUndoRedo and useStorageWatch hooks"
```

---

## Chunk 2: AppContext + Common Components

### Task 7: AppContext with useReducer

**Files:**
- Create: `src/contexts/AppContext.tsx`

- [ ] **Step 1: Create AppContext**

```typescript
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { AppState, AppAction, UndoAction } from '../types';

const MAX_UNDO = 50;

const initialState: AppState = {
  items: [],
  selectedKeys: new Set<string>(),
  editingItem: null,
  storageType: 'localStorage',
  searchText: '',
  sortField: null,
  sortOrder: 'asc',
  loading: false,
  sidePanelOpen: false,
  undoStack: [],
  redoStack: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_STORAGE_TYPE':
      return {
        ...state,
        storageType: action.payload,
        selectedKeys: new Set(),
        editingItem: null,
        sidePanelOpen: false,
        undoStack: [],
        redoStack: [],
      };
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedKeys);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, selectedKeys: next };
    }
    case 'SELECT_ALL':
      return { ...state, selectedKeys: new Set(action.payload) };
    case 'DESELECT_ALL':
      return { ...state, selectedKeys: new Set() };
    case 'SET_EDITING':
      return { ...state, editingItem: action.payload, sidePanelOpen: action.payload !== null };
    case 'SET_SEARCH':
      return { ...state, searchText: action.payload };
    case 'SET_SORT':
      return { ...state, sortField: action.payload.field, sortOrder: action.payload.order };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SIDE_PANEL':
      return { ...state, sidePanelOpen: action.payload, editingItem: action.payload ? state.editingItem : null };
    case 'PUSH_UNDO':
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-MAX_UNDO + 1), action.payload],
        redoStack: [],
      };
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const action_to_undo = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, action_to_undo],
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const action_to_redo = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, action_to_redo],
      };
    }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(i => i.key === action.payload.key ? { ...i, value: action.payload.value } : i),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.key !== action.payload),
        selectedKeys: (() => { const s = new Set(state.selectedKeys); s.delete(action.payload); return s; })(),
      };
    case 'DELETE_ITEMS':
      return {
        ...state,
        items: state.items.filter(i => !action.payload.includes(i.key)),
        selectedKeys: new Set(),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AppContext.tsx && git commit -m "feat: add AppContext with useReducer global state"
```

---

### Task 8: Common components — Toast, Modal, Tooltip

**Files:**
- Create: `src/components/Common/Toast.tsx`
- Create: `src/components/Common/Modal.tsx`
- Create: `src/components/Common/Tooltip.tsx`

- [ ] **Step 1: Create Toast notification system**

A lightweight toast with auto-dismiss. Uses a context for `addToast()` access from anywhere.

```typescript
// src/components/Common/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastType, ToastMessage } from '../../types';

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  };

  const iconColors: Record<ToastType, string> = {
    success: 'text-emerald-500 dark:text-emerald-400',
    error: 'text-red-500 dark:text-red-400',
    info: 'text-blue-500 dark:text-blue-400',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg
              backdrop-blur-sm animate-slide-in text-sm font-medium ${colors[toast.type]}`}
          >
            <span className={`text-base ${iconColors[toast.type]}`}>{icons[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
```

- [ ] **Step 2: Create Modal component**

```typescript
// src/components/Common/Modal.tsx
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, width = 'max-w-lg' }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`${width} w-full mx-4 rounded-xl shadow-2xl
        bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
        animate-modal-in`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
              dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create Tooltip component**

```typescript
// src/components/Common/Tooltip.tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Common/Toast.tsx src/components/Common/Modal.tsx src/components/Common/Tooltip.tsx
git commit -m "feat: add Toast, Modal, Tooltip common components (pure Tailwind)"
```

---

### Task 9: Common components — ConfirmDialog, ErrorBoundary, StorageCapacity

**Files:**
- Create: `src/components/Common/ConfirmDialog.tsx`
- Create: `src/components/Common/ErrorBoundary.tsx`
- Create: `src/components/Common/StorageCapacity.tsx`

- [ ] **Step 1: Create ConfirmDialog**

```typescript
// src/components/Common/ConfirmDialog.tsx
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
```

- [ ] **Step 2: Create ErrorBoundary**

```typescript
// src/components/Common/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4
          bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg
              bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 3: Create StorageCapacity**

```typescript
// src/components/Common/StorageCapacity.tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Common/ConfirmDialog.tsx src/components/Common/ErrorBoundary.tsx src/components/Common/StorageCapacity.tsx
git commit -m "feat: add ConfirmDialog, ErrorBoundary, StorageCapacity components"
```

---

## Chunk 3: Layout + Storage + Action Components

### Task 10: Editor wrapper

**Files:**
- Create: `src/components/Editor/CodeEditor.tsx`

- [ ] **Step 1: Create CodeEditor wrapper**

```typescript
// src/components/Editor/CodeEditor.tsx
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  isJson?: boolean;
  isDarkMode: boolean;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value, onChange, height = '100%', isJson = false, isDarkMode, readOnly = false
}) => {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <CodeMirror
        value={value}
        height={height}
        theme={isDarkMode ? 'dark' : 'light'}
        extensions={[
          ...(isJson ? [json()] : []),
          EditorView.lineWrapping,
        ]}
        onChange={onChange}
        readOnly={readOnly}
        style={{ fontSize: 13 }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Editor/CodeEditor.tsx && git commit -m "feat: add CodeEditor component wrapper"
```

---

### Task 11: Storage display components

**Files:**
- Create: `src/components/Storage/TypeBadge.tsx`
- Create: `src/components/Storage/EmptyState.tsx`
- Create: `src/components/Storage/StorageRow.tsx`
- Create: `src/components/Storage/StorageTable.tsx`

- [ ] **Step 1: Create TypeBadge**

```typescript
// src/components/Storage/TypeBadge.tsx
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
```

- [ ] **Step 2: Create EmptyState**

```typescript
// src/components/Storage/EmptyState.tsx
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
```

- [ ] **Step 3: Create StorageRow**

```typescript
// src/components/Storage/StorageRow.tsx
import React from 'react';
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
}

export const StorageRow: React.FC<StorageRowProps> = ({
  item, selected, onToggleSelect, onClick, onCopy, onDelete
}) => {
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
      <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono" title={item.value}>
        {item.type === 'Timestamp' ? (
          <span className="flex items-center gap-1.5">
            <span className="truncate">{item.value}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              → {formatTimestamp(item.value)}
            </span>
          </span>
        ) : item.value}
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
```

- [ ] **Step 4: Create StorageTable**

```typescript
// src/components/Storage/StorageTable.tsx
import React, { useMemo } from 'react';
import { StorageItem, SortField, SortOrder } from '../../types';
import { StorageRow } from './StorageRow';
import { EmptyState } from './EmptyState';
import { useLocale } from '../../contexts/LocaleContext';

interface StorageTableProps {
  items: StorageItem[];
  selectedKeys: Set<string>;
  searchText: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onToggleSelect: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClickItem: (item: StorageItem) => void;
  onCopy: (value: string) => void;
  onDelete: (key: string) => void;
  onSort: (field: SortField) => void;
}

export const StorageTable: React.FC<StorageTableProps> = ({
  items, selectedKeys, searchText, sortField, sortOrder,
  onToggleSelect, onSelectAll, onDeselectAll, onClickItem, onCopy, onDelete, onSort
}) => {
  const { t } = useLocale();

  const filteredAndSorted = useMemo(() => {
    const lower = searchText.toLowerCase();
    let result = items.filter(i =>
      i.key.toLowerCase().includes(lower) || i.value.toLowerCase().includes(lower)
    );
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'key') cmp = a.key.localeCompare(b.key);
        else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
        else if (sortField === 'size') cmp = a.size - b.size;
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [items, searchText, sortField, sortOrder]);

  const allSelected = filteredAndSorted.length > 0 && filteredAndSorted.every(i => selectedKeys.has(i.key));

  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5H5z" />
      </svg>
    );
    return (
      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        {sortOrder === 'asc'
          ? <path d="M5 12l5-5 5 5H5z" />
          : <path d="M5 8l5 5 5-5H5z" />
        }
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,1.2fr)_80px_minmax(0,2fr)_60px_100px] gap-3 items-center
        px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
              text-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-800 cursor-pointer"
          />
        </div>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => onSort('key')}>
          {t('key')} <SortIndicator field="key" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => onSort('type')}>
          {t('type')} <SortIndicator field="type" />
        </button>
        <div>{t('value')}</div>
        <button className="flex items-center gap-1 justify-end hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => onSort('size')}>
          {t('size')} <SortIndicator field="size" />
        </button>
        <div className="text-right">{t('actions')}</div>
      </div>

      {/* Body */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
        {filteredAndSorted.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAndSorted.map(item => (
            <StorageRow
              key={item.key}
              item={item}
              selected={selectedKeys.has(item.key)}
              onToggleSelect={() => onToggleSelect(item.key)}
              onClick={() => onClickItem(item)}
              onCopy={() => onCopy(item.value)}
              onDelete={() => onDelete(item.key)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Storage/ && git commit -m "feat: add StorageTable, StorageRow, TypeBadge, EmptyState"
```

---

### Task 12: Layout components — Header, SidePanel

**Files:**
- Create: `src/components/Layout/Header.tsx`
- Create: `src/components/Layout/SidePanel.tsx`

- [ ] **Step 1: Create Header**

The header contains: title, storage type toggle (LS/SS), search bar, action buttons (add, import/export, refresh, theme toggle, language, more menu). Bento-style with grouped sections.

```typescript
// src/components/Layout/Header.tsx
import React, { useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { StorageType } from '../../types';
import { Tooltip } from '../Common/Tooltip';

interface HeaderProps {
  storageType: StorageType;
  onStorageTypeChange: (type: StorageType) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onCopySetupCode: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  loading: boolean;
  selectedCount: number;
  onBatchDelete: () => void;
  onDeselectAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storageType, onStorageTypeChange,
  searchText, onSearchChange,
  onRefresh, onAdd, onImport, onExport, onCopySetupCode,
  isDarkMode, onToggleTheme, loading,
  selectedCount, onBatchDelete, onDeselectAll,
  canUndo, canRedo, onUndo, onRedo,
}) => {
  const { t, setLocale, locale } = useLocale();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="space-y-3">
      {/* Top row: Title + Storage Toggle + Theme */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          {/* Storage Type Toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            <button
              onClick={() => onStorageTypeChange('localStorage')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                storageType === 'localStorage'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => onStorageTypeChange('sessionStorage')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                storageType === 'sessionStorage'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Session
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <Tooltip content={`${t('undo')} (Ctrl+Z)`}>
            <button onClick={onUndo} disabled={!canUndo}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content={`${t('redo')} (Ctrl+Shift+Z)`}>
            <button onClick={onRedo} disabled={!canRedo}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Theme toggle */}
          <Tooltip content={isDarkMode ? t('lightMode') : t('darkMode')}>
            <button onClick={onToggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </Tooltip>

          {/* Language toggle */}
          <Tooltip content={t('language')}>
            <button onClick={() => setLocale(locale === 'zh_CN' ? 'en_US' : 'zh_CN')}
              className="p-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
              {locale === 'zh_CN' ? 'EN' : '中'}
            </button>
          </Tooltip>

          {/* More menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg shadow-xl border
                  bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <button onClick={() => { onCopySetupCode(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {t('copySetupCode')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Second row: Search + Action buttons */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-8 py-2 text-sm rounded-lg border
              border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              dark:focus:ring-blue-400/20 dark:focus:border-blue-400
              transition-colors"
          />
          {searchText && (
            <button onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <Tooltip content={t('add')}>
          <button onClick={onAdd}
            className="p-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600
              dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content={t('import')}>
          <button onClick={onImport}
            className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
              dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content={t('export')}>
          <button onClick={onExport}
            className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
              dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content={t('refresh')}>
          <button onClick={onRefresh}
            className={`p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200
              dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all
              ${loading ? 'animate-spin' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Batch action bar (shown when items selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg
          bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {t('selectedCount').replace('{count}', String(selectedCount))}
          </span>
          <div className="flex-1" />
          <button onClick={onDeselectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {t('deselectAll')}
          </button>
          <button onClick={onBatchDelete}
            className="px-3 py-1 text-xs font-medium rounded-md text-white
              bg-red-500 hover:bg-red-600 transition-colors">
            {t('batchDelete')}
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Create SidePanel**

```typescript
// src/components/Layout/SidePanel.tsx
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
    const saveValue = getValueType(editValue) === 'JSON'
      ? JSON.stringify(JSON.parse(editValue)) // minify for storage
      : editValue;
    onSave(item.key, saveValue);
  };

  const handleUpdateTimestamp = () => {
    if (!item) return;
    const newValue = item.value.length === 10
      ? Math.floor(Date.now() / 1000).toString()
      : Date.now().toString();
    setEditValue(newValue);
  };

  const isTs = item ? isTimestamp(editValue) : false;
  const currentType = item ? getValueType(editValue) : 'String';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
          onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full z-40 w-[45%] min-w-[380px] max-w-[600px]
        transform transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
        bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl
        flex flex-col`}
      >
        {/* Panel Header */}
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

        {/* Panel Body */}
        <div className="flex-1 overflow-hidden p-5">
          <CodeEditor
            value={editValue}
            onChange={setEditValue}
            height="calc(100vh - 180px)"
            isJson={currentType === 'JSON'}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Panel Footer */}
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/ && git commit -m "feat: add Header and SidePanel layout components"
```

---

### Task 13: AddDialog component

**Files:**
- Create: `src/components/Actions/AddDialog.tsx`

- [ ] **Step 1: Create AddDialog**

```typescript
// src/components/Actions/AddDialog.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Actions/AddDialog.tsx && git commit -m "feat: add AddDialog component"
```

---

## Chunk 4: Pages, i18n, CSS, Entry Points

### Task 14: Update i18n with all new keys

**Files:**
- Modify: `src/locales/zh_CN.ts`
- Modify: `src/locales/en_US.ts`

- [ ] **Step 1: Rewrite zh_CN.ts with all keys**

Full file with all original + new keys. See spec for the complete key list. Include: `sessionStorage`, `switchToLS`, `switchToSS`, `import`, `export`, `importSuccess`, `importFailed`, `exportSuccess`, `selectAll`, `deselectAll`, `selectedCount`, `batchDelete`, `batchDeleteConfirm`, `undo`, `redo`, `undoSuccess`, `redoSuccess`, `noUndoActions`, `noRedoActions`, `storageCapacity`, `capacityWarning`, `capacityDanger`, `sortByKey`, `sortByType`, `sortBySize`, `autoRefresh`, `dataChanged`, `mergeImport`, `replaceImport`, `importChoice`, `reload`, `errorOccurred`, `size`, `noData`.

- [ ] **Step 2: Rewrite en_US.ts with all keys**

Mirror zh_CN.ts structure with English translations.

- [ ] **Step 3: Commit**

```bash
git add src/locales/ && git commit -m "feat: extend i18n with all new translation keys"
```

---

### Task 15: Rewrite CSS — pure Tailwind

**Files:**
- Rewrite: `src/index.css`

- [ ] **Step 1: Rewrite index.css**

Remove all Ant Design imports and overrides. Keep only:
- Tailwind directives (`@tailwind base/components/utilities`)
- Global scrollbar styles
- CodeMirror dark mode overrides
- Custom animations (`animate-slide-in`, `animate-modal-in`)
- Body background

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 dark:bg-gray-950;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-600;
}

/* CodeMirror dark mode */
.dark .cm-editor { background-color: #1a1a2e !important; }
.dark .cm-gutters { background-color: #16162a !important; border-right-color: #2a2a4a !important; }
.dark .cm-activeLineGutter { background-color: #1f1f3a !important; }
.dark .cm-activeLine { background-color: rgba(255,255,255,0.03) !important; }

/* Animations */
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes modal-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
.animate-modal-in { animation: modal-in 0.2s ease-out; }
```

- [ ] **Step 2: Update tailwind.config.js**

Remove the `@tailwindcss/line-clamp` plugin (native CSS `line-clamp` is now supported). Keep dark mode class strategy.

- [ ] **Step 3: Commit**

```bash
git add src/index.css tailwind.config.js && git commit -m "feat: rewrite CSS to pure Tailwind, remove Ant Design styles"
```

---

### Task 16: Main App page

**Files:**
- Create: `src/pages/App.tsx`
- Delete: `src/App.tsx`

- [ ] **Step 1: Create the main App page**

This is the composition root. It:
- Uses `AppProvider` for global state
- Uses `useStorage` for data operations
- Uses `useTheme` for dark mode
- Uses `useStorageWatch` for auto-refresh
- Uses `useDebounce` for search
- Uses `useUndoRedo` for undo/redo
- Composes `Header`, `StorageTable`, `SidePanel`, `AddDialog`, `ConfirmDialog`, `StorageCapacity`
- Handles keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- Handles import file input
- Opens detail window for large values

The component should:
1. Fetch items on mount and when storageType changes
2. Debounce search text (300ms)
3. Track storage capacity
4. Register keyboard event listeners
5. Wire all handler functions to dispatch actions and call storage hooks

- [ ] **Step 2: Delete old `src/App.tsx`**

```bash
rm src/App.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/App.tsx && git add -A && git commit -m "feat: create new App page with full feature integration"
```

---

### Task 17: Detail page rewrite

**Files:**
- Rewrite: `src/pages/Detail.tsx`

- [ ] **Step 1: Rewrite Detail.tsx**

Remove all Ant Design imports. Use:
- Pure Tailwind for layout and styling
- `CodeEditor` component
- `useTheme` hook
- Same URL parameter reading logic
- Add JSON validation on save
- Match the neutral color palette

- [ ] **Step 2: Commit**

```bash
git add src/pages/Detail.tsx && git commit -m "feat: rewrite Detail page with pure Tailwind"
```

---

### Task 18: Update entry points

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/detail.tsx`

- [ ] **Step 1: Update main.tsx**

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App'
import { LocaleProvider } from './contexts/LocaleContext'
import { AppProvider } from './contexts/AppContext'
import { ToastProvider } from './components/Common/Toast'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
```

- [ ] **Step 2: Update detail.tsx**

```typescript
// src/detail.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import Detail from './pages/Detail'
import { LocaleProvider } from './contexts/LocaleContext'
import { ToastProvider } from './components/Common/Toast'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <ToastProvider>
          <Detail />
        </ToastProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx src/detail.tsx && git commit -m "feat: update entry points with new providers and error boundary"
```

---

### Task 19: Build verification and cleanup

- [ ] **Step 1: Run `bun run build` to verify TypeScript compiles and Vite builds**

Expected: Build succeeds, no type errors, output in `dist/`.

- [ ] **Step 2: Fix any type errors or import issues**

- [ ] **Step 3: Verify `dist/` contains `index.html`, `detail.html`, `contentScript.js`**

- [ ] **Step 4: Remove unused `src/contentScript.ts` message handler code if desired** (optional — it's harmless)

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: build verification and cleanup"
```
