<div align="center">

<img src="public/icons/icon128.png" alt="Alger Storage Manager" width="96" height="96" />

# Alger Storage Manager

**A full-featured Chrome extension for managing LocalStorage, SessionStorage, Cookies & IndexedDB.**

[![CI](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/algerkong/Alger-Chrome-LocalStorage-Manager?color=blue)](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)

[简体中文](README_ZH.md)&nbsp;&nbsp;·&nbsp;&nbsp;[Usage Guide](USAGE.md)&nbsp;&nbsp;·&nbsp;&nbsp;[Releases](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases)

[![Donate](https://img.shields.io/badge/Donate-Support%20This%20Project-ff69b4?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://donate.alger.fun/donate)

</div>

---

## Highlights

<table>
<tr>
<td width="50%">

### 🗂 Unified Data Management
Switch between **LocalStorage**, **SessionStorage**, **Cookie**, and **IndexedDB** through a single tabbed interface — no more juggling DevTools panels.

</td>
<td width="50%">

### ✏️ Powerful Editing
Double-click for inline editing, CodeMirror-powered side panel for complex values, and a **diff view** to review changes before saving.

</td>
</tr>
<tr>
<td width="50%">

### 📸 Snapshots
Save and restore entire storage states as bookmarks — perfect for switching between dev/staging/production environments.

</td>
<td width="50%">

### 🔍 Advanced Search
Toggle between plain text and **regex** search mode. Debounced filtering (300ms) with highlight matching across keys and values.

</td>
</tr>
</table>

---

## Features

<details>
<summary><strong>Storage (LocalStorage & SessionStorage)</strong></summary>

- Smart type detection — JSON, Timestamp, Number, Boolean, String
- Batch select, delete, export
- Undo / Redo — Ctrl+Z / Ctrl+Shift+Z (up to 50 steps)
- Import / Export — JSON files with merge or replace modes
- Storage capacity bar — visual usage vs 5 MB limit
- Auto refresh on external changes (3s polling)
- Column sorting — by key, type, or size
- Copy Setup Code — generate console-executable script to replicate data

</details>

<details>
<summary><strong>Cookie Management</strong></summary>

- Full CRUD — create, read, update, delete with all attributes
- Flag indicators — HttpOnly (H), Secure (S), SameSite (St/Lx/No)
- Copy as `document.cookie` code
- Batch select & delete
- Quick actions — extend expiry by 7 or 30 days

</details>

<details>
<summary><strong>IndexedDB Browsing</strong></summary>

- Database & object store navigator
- Paginated record listing with JSON display
- Search within records
- Delete individual or batch entries

</details>

<details>
<summary><strong>Snapshots</strong></summary>

- Save entire storage state as a named snapshot
- One-click restore
- Export / import snapshots as JSON
- Stored in extension-side IndexedDB (persists across page reloads)

</details>

<details>
<summary><strong>Editing</strong></summary>

- Double-click inline edit for short values
- Side panel with CodeMirror (JSON syntax highlighting)
- Diff view — red/green line-level diff before saving
- Detail window — full-screen popup for large values
- Timestamp tools — auto-format & one-click update to now

</details>

<details>
<summary><strong>UI & UX</strong></summary>

- Dark / Light mode with system detection
- i18n — English & Chinese, auto-detected
- Right-click context menu — Quick View & Full Manager
- Error boundary — graceful crash recovery
- Responsive full-page mode via context menu

</details>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 |
| Editor | CodeMirror 6 |
| Extension | Chrome Manifest V3 |
| State | useReducer + Context |
| CI/CD | GitHub Actions |

---

## Architecture

```
src/
├── background.ts            # Service worker — context menus
├── contentScript.ts         # Content script — storage access
├── pages/                   # App (popup) · Detail (editor window)
├── contexts/                # AppContext (useReducer) · LocaleContext (i18n)
├── hooks/
│   ├── useStorage           # LocalStorage / SessionStorage CRUD
│   ├── useCookies           # Cookie CRUD via chrome.cookies
│   ├── useIndexedDB         # IndexedDB browsing via chrome.scripting
│   ├── useSnapshots         # Snapshot save / restore / export
│   ├── useUndoRedo          # Undo / redo stack
│   └── ...                  # useTheme · useDebounce · useStorageWatch
├── components/
│   ├── Layout/              # Header (4-tab bar) · SidePanel (diff view)
│   ├── Storage/             # StorageTable · CookieTable · IDBTable · IDBNavigator
│   ├── Actions/             # AddDialog · SnapshotManager · CookieEditor
│   ├── Common/              # Toast · ConfirmDialog · ErrorBoundary · StorageCapacity
│   └── Editor/              # CodeEditor (CodeMirror wrapper)
├── utils/                   # typeDetection · clipboard · exportImport · snapshotDB · lineDiff
├── types/                   # Shared TypeScript interfaces
└── locales/                 # en_US · zh_CN
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** or **Bun**
- Chrome / Edge / Brave (Chromium-based)

### Install & Build

```bash
# Clone
git clone https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager.git
cd Alger-Chrome-LocalStorage-Manager

# Install
bun install

# Dev server (HMR)
bun run dev

# Production build
bun run build
```

### Load into Chrome

1. Run `bun run build`
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `dist/` folder
5. Pin the extension to the toolbar

---

## Release

Push a version tag to trigger an automated release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions builds the extension and publishes a `.zip` to [Releases](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases).

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Close side panel | `Escape` |
| Inline edit | `Double-click` value cell |
| Save inline edit | `Enter` |
| Cancel inline edit | `Escape` |

---

## License

[GPL-3.0](LICENSE)

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/algerkong">algerkong</a></sub>
</div>
