# Chrome LocalStorage Manager - Full UI Rebuild Design Spec

## Overview

Complete rewrite of the Chrome LocalStorage Manager extension. Replace Ant Design with pure Tailwind CSS, adopt Bento Grid layout, add all missing features from the analysis report.

## Design Decisions

- **Style:** Bento Grid (Apple-style modular card layout)
- **Colors:** Neutral adaptive (gray-based with accent color highlights), DevTools-like professional feel
- **Theme:** Day/night toggle with system detection, persisted via `chrome.storage.local`
- **Interaction:** Right side panel for editing (pure Tailwind, replaces Ant Design Drawer)
- **Approach:** Complete rewrite — new component tree, hooks-based architecture, `useReducer` global state

## Architecture

### Directory Structure

```
src/
├── main.tsx                    # Popup entry
├── detail.tsx                  # Detail window entry
├── contentScript.ts            # Content script (message-based communication)
├── index.css                   # Tailwind entry + global styles
├── hooks/
│   ├── useStorage.ts           # localStorage + sessionStorage unified CRUD
│   ├── useTheme.ts             # Day/night mode management
│   ├── useUndoRedo.ts          # Undo/redo stack
│   ├── useStorageWatch.ts      # Watch page storage changes, auto-refresh
│   └── useDebounce.ts          # Debounce hook
├── components/
│   ├── Layout/
│   │   ├── Header.tsx          # Top bar (title, action buttons)
│   │   └── SidePanel.tsx       # Right-side edit panel
│   ├── Storage/
│   │   ├── StorageTable.tsx    # Bento Grid data table
│   │   ├── StorageRow.tsx      # Single data row
│   │   ├── TypeBadge.tsx       # Type badge
│   │   └── EmptyState.tsx      # Empty state
│   ├── Actions/
│   │   ├── SearchBar.tsx       # Search with debounce
│   │   ├── AddDialog.tsx       # Add new item modal
│   │   ├── ImportExport.tsx    # Import/export (JSON/CSV)
│   │   ├── BatchActions.tsx    # Batch operation toolbar
│   │   └── SortControl.tsx     # Sort controls
│   ├── Editor/
│   │   └── CodeEditor.tsx      # CodeMirror wrapper
│   └── Common/
│       ├── Toast.tsx           # Lightweight notification system
│       ├── Modal.tsx           # Pure Tailwind modal
│       ├── Tooltip.tsx         # Pure Tailwind tooltip
│       ├── ConfirmDialog.tsx   # Confirm dialog
│       ├── ErrorBoundary.tsx   # React Error Boundary
│       └── StorageCapacity.tsx # Storage capacity indicator bar
├── contexts/
│   ├── LocaleContext.tsx       # i18n (extend existing)
│   └── AppContext.tsx          # Global state with useReducer
├── utils/
│   ├── typeDetection.ts        # Value type detection (fix timestamp logic)
│   ├── clipboard.ts            # Clipboard operations
│   └── exportImport.ts         # JSON/CSV import/export logic
├── locales/
│   ├── zh_CN.ts                # Chinese (extend with new keys)
│   └── en_US.ts                # English (extend with new keys)
├── pages/
│   ├── App.tsx                 # Main page (compose components)
│   └── Detail.tsx              # Detail editor page
└── types/
    └── index.ts                # Unified type definitions
```

### State Management — AppContext with useReducer

```typescript
interface AppState {
  items: StorageItem[];
  selectedItems: Set<string>;
  editingItem: StorageItem | null;
  storageType: 'localStorage' | 'sessionStorage';
  searchText: string;
  sortField: 'key' | 'type' | 'size' | null;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  sidePanelOpen: boolean;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

type AppAction =
  | { type: 'SET_ITEMS'; payload: StorageItem[] }
  | { type: 'SET_STORAGE_TYPE'; payload: 'localStorage' | 'sessionStorage' }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_EDITING'; payload: StorageItem | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: { field: string; order: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SIDE_PANEL' }
  | { type: 'PUSH_UNDO'; payload: UndoAction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_ITEM'; payload: StorageItem }
  | { type: 'UPDATE_ITEM'; payload: StorageItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'DELETE_ITEMS'; payload: string[] };
```

### Hooks

**useStorage(storageType):**
- Unified interface for localStorage and sessionStorage
- `fetchAll()` — get all items from active tab
- `setItem(key, value)` — set a single item
- `removeItem(key)` — remove a single item
- `removeItems(keys)` — batch remove
- `importData(data)` — import from JSON
- All operations go through `chrome.scripting.executeScript`

**useTheme():**
- System theme detection via `matchMedia`
- User preference persistence in `chrome.storage.local`
- Returns `{ isDarkMode, toggleTheme }`
- Applies `dark` class to `document.documentElement`

**useUndoRedo():**
- Maintains undo/redo stacks
- Records actions: ADD, UPDATE, DELETE (single and batch)
- `undo()` reverses last action, `redo()` re-applies
- Max stack size: 50 actions

**useStorageWatch():**
- Polls active tab storage at configurable interval (default 3s)
- Compares with current state, triggers refresh on diff
- Pauses when side panel is open (avoid conflicts during editing)

**useDebounce(value, delay):**
- Standard debounce hook, default 300ms

### Type Detection Fix

```typescript
function isTimestamp(value: string): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (value.length === 13) {
    // millisecond timestamp: 2001-01-01 to 2100-01-01
    return num > 978307200000 && num < 4102444800000;
  }
  if (value.length === 10) {
    // second timestamp: 2001-01-01 to 2100-01-01
    return num > 978307200 && num < 4102444800;
  }
  return false;
}
```

## UI Design — Bento Grid Layout

### Main Popup (min-width: 784px)

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                       │
│ ┌───────────────┐  ┌──────────┐  ┌─────┐ ┌─────┐ ┌───┐     │
│ │ 🔍 Search...  │  │LS │ SS │  │ Add │ │ ••• │ │ ☀ │     │
│ └───────────────┘  └──────────┘  └─────┘ └─────┘ └───┘     │
├─────────────────────────────────────────────────────────────┤
│ Toolbar (batch actions / sort / capacity bar)                │
│ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐  ░░░░░░░░ 2.1MB │
│ │Select│ │ Delete │ │ Import │ │ Export │                    │
│ └──────┘ └────────┘ └────────┘ └────────┘                   │
├─────────────────────────────────────┬───────────────────────┤
│ Storage Table (Bento Grid)          │ Side Panel (Editor)    │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────┤
│ │ ☑ user_token     JSON    ••• │ │ │ Key: user_token      │
│ │   {"id": 1, "name": "al...    │ │ │ Type: JSON           │
│ ├─────────────────────────────────┤ │ │                      │
│ │ ☐ theme          String  ••• │ │ │ ┌──────────────────┐ │
│ │   dark                         │ │ │ │ CodeMirror       │ │
│ ├─────────────────────────────────┤ │ │ │ Editor           │ │
│ │ ☐ last_visit     Timestamp ••• │ │ │ │                  │ │
│ │   1710000000 → 2025-03-09     │ │ │ │                  │ │
│ ├─────────────────────────────────┤ │ │ └──────────────────┘ │
│ │ ☐ count          Number  ••• │ │ │ ┌────┐ ┌────┐ ┌────┐ │
│ │   42                           │ │ │ │Save│ │Undo│ │Redo│ │
│ └─────────────────────────────────┘ │ │ └────┘ └────┘ └────┘ │
└─────────────────────────────────────┴───────────────────────┘
```

### Color Palette

**Light Mode:**
- Background: `gray-50` / `white`
- Card: `white` with `border-gray-200`
- Text: `gray-900` (primary), `gray-500` (secondary)
- Accent: `blue-500` (actions), contextual colors for type badges

**Dark Mode:**
- Background: `gray-950` / `gray-900`
- Card: `gray-900` with `border-gray-800`
- Text: `gray-100` (primary), `gray-400` (secondary)
- Accent: `blue-400` (actions), muted badge colors

**Type Badge Colors:**
- JSON: `blue-100/blue-700` light, `blue-900/blue-300` dark
- Timestamp: `emerald-100/emerald-700` light, `emerald-900/emerald-300` dark
- Number: `amber-100/amber-700` light, `amber-900/amber-300` dark
- Boolean: `violet-100/violet-700` light, `violet-900/violet-300` dark
- String: `gray-100/gray-600` light, `gray-800/gray-400` dark

### Component Behavior

**StorageTable:**
- Checkbox column for batch selection
- Click row to open side panel
- Sort indicators on column headers (key, type, size)
- Timestamp values show converted date inline
- Keyboard navigation: arrow keys to move, Enter to edit, Delete to remove

**SidePanel:**
- 40% width, slides in from right with transition
- Header: key name, type badge, timestamp conversion
- Body: CodeMirror editor (full height)
- Footer: Save, Undo, Redo, Update to Now (for timestamps)
- Close button / Escape key to dismiss

**SearchBar:**
- 300ms debounce
- Searches both key and value
- Clear button
- Result count indicator

**ImportExport:**
- Export: JSON file download of all items
- Import: File picker, parse JSON, merge or replace with user choice
- Copy setup code (existing feature, retained)

**BatchActions:**
- Appears when items are selected
- Actions: Delete selected, Export selected, Deselect all
- Shows selection count

**StorageCapacity:**
- Progress bar showing used/total capacity
- Calculated via `new Blob(Object.entries(storage).flat()).size`
- 5MB typical limit, color changes at 80% (warning) and 95% (danger)

**Toast notifications:**
- Pure Tailwind, positioned top-right
- Auto-dismiss after 3s
- Types: success (green), error (red), info (blue)

### Storage Type Toggle

- Segmented control in header: `localStorage | sessionStorage`
- Switching type refetches data from active tab
- Each type maintains its own state in AppContext

### Data Change Watching

- `useStorageWatch` polls every 3 seconds
- Compares serialized storage snapshot
- On diff: dispatches `SET_ITEMS` with new data
- Visual indicator when auto-refresh occurs
- Pauses during editing to prevent conflicts

### Undo/Redo

- Records: `{ type: 'ADD'|'UPDATE'|'DELETE', key, oldValue?, newValue? }`
- Batch delete records all affected items
- Max 50 entries per stack
- Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z

### Error Boundary

- Wraps main App component
- Shows friendly error message with "Reload" button
- Logs error details to console

## Dependencies Change

**Remove:**
- `antd`
- `@ant-design/icons` (implicit via antd)
- `@tailwindcss/line-clamp` (native CSS `line-clamp` supported)

**Keep:**
- `@codemirror/lang-json`
- `@uiw/react-codemirror`
- `react`, `react-dom`
- `tailwindcss` (dev)

**Add:**
- None (all UI components hand-written with Tailwind)

## i18n Extensions

New translation keys needed:
- `sessionStorage`, `switchToLS`, `switchToSS`
- `import`, `export`, `importSuccess`, `importFailed`, `exportSuccess`
- `selectAll`, `deselectAll`, `selectedCount`, `batchDelete`, `batchDeleteConfirm`
- `undo`, `redo`, `undoSuccess`, `redoSuccess`, `noUndoActions`, `noRedoActions`
- `storageCapacity`, `capacityWarning`, `capacityDanger`
- `sortByKey`, `sortByType`, `sortBySize`
- `autoRefresh`, `dataChanged`
- `mergeImport`, `replaceImport`, `importChoice`
- `reload`, `errorOccurred`
- `size`

## Detail Page

Retained as separate window for large JSON editing. Updated to match new design:
- Pure Tailwind styling (no Ant Design)
- Same neutral color palette
- Day/night sync via `chrome.storage.local`
- Add undo/redo support in editor
