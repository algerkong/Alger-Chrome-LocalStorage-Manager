# Alger Storage Manager

A powerful Chrome extension for managing LocalStorage and SessionStorage data with a modern, professional interface.

[中文文档](README_ZH.md) | [Usage Guide](USAGE.md)

## Features

- **Dual Storage Support** — Manage both LocalStorage and SessionStorage with one-click toggle
- **Smart Type Detection** — Auto-detect JSON, Timestamp, Number, Boolean, and String types
- **Batch Operations** — Multi-select items for bulk delete, export, and more
- **Undo / Redo** — Full operation history with Ctrl+Z / Ctrl+Shift+Z support (up to 50 steps)
- **Import / Export** — Export data as JSON files, import with merge or replace modes
- **Storage Capacity** — Visual indicator showing current usage vs 5MB limit
- **Auto Refresh** — Detects external storage changes and refreshes automatically (3s polling)
- **Column Sorting** — Sort by key name, data type, or value size
- **Debounced Search** — Fast filtering across keys and values (300ms debounce)
- **Side Panel Editor** — Right-side panel with CodeMirror for inline editing
- **Detail Window** — Full-screen editor popup for large JSON or text values
- **Timestamp Tools** — Auto-convert timestamps to readable dates, one-click update to current time
- **Dark / Light Mode** — Adaptive neutral color palette with system detection and manual toggle
- **i18n** — Chinese and English with system language auto-detection
- **Error Boundary** — Graceful error handling prevents full UI crashes
- **Copy Setup Code** — Generate console-executable code to replicate storage data

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- CodeMirror 6
- Chrome Extension Manifest V3

## Architecture

```
src/
├── hooks/          # useStorage, useTheme, useUndoRedo, useStorageWatch, useDebounce
├── contexts/       # AppContext (useReducer), LocaleContext (i18n)
├── components/
│   ├── Common/     # Toast, Modal, Tooltip, ConfirmDialog, ErrorBoundary, StorageCapacity
│   ├── Layout/     # Header, SidePanel
│   ├── Storage/    # StorageTable, StorageRow, TypeBadge, EmptyState
│   ├── Actions/    # AddDialog
│   └── Editor/     # CodeEditor (CodeMirror wrapper)
├── pages/          # App (popup), Detail (editor window)
├── utils/          # typeDetection, clipboard, exportImport
├── types/          # Shared TypeScript interfaces
└── locales/        # zh_CN, en_US
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Chrome browser

### Install & Build

```bash
# Install dependencies
bun install

# Development
bun run dev

# Build for production
bun run build
```

### Load Extension

1. Run `bun run build`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select the `dist/` folder

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |
| Close Side Panel | Escape |

## License

MIT
