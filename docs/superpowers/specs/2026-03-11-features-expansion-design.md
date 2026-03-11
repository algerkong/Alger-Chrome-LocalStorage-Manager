# Chrome Storage Manager — Features Expansion Design Spec

## Overview

Add 7 new features to the Chrome Storage Manager extension, expanding it from a localStorage/sessionStorage tool into a comprehensive client-side data manager.

## Design Decisions

- **Architecture:** Unified Tab navigation — `Local | Session | Cookie | IndexedDB`
- **Snapshots storage:** Extension-side IndexedDB (`alger-storage-snapshots`)
- **Diff view:** Inline unified diff in the side panel editor (red/green line highlights)
- **Cookie management:** Full CRUD + quick actions (copy as code, extend expiry)
- **IndexedDB:** Read-only browsing + delete, three-level navigation (DB → Store → Records)
- **Right-click menu:** Two options — "Quick View" (popup) and "Full Manager" (new tab)
- **Search:** Toggle between plain text and regex mode

## Implementation Phases

| Phase | Features | Complexity |
|-------|----------|------------|
| Phase 1 | Regex search, double-click inline edit, right-click context menu | Low |
| Phase 2 | Snapshot system, diff view | Medium |
| Phase 3 | Cookie management, IndexedDB browsing | High |

---

## Phase 1: Quick Wins

### 1.1 Regex Search

**Modified files:**
- `src/components/Storage/StorageTable.tsx` — regex filter logic
- `src/types/index.ts` — add `searchRegex` to AppState
- `src/contexts/AppContext.tsx` — handle `SET_SEARCH_REGEX` action
- `src/components/Layout/Header.tsx` — add regex toggle button

**Behavior:**
- Toggle button `.*` next to search input, activates blue when on
- When enabled, search text is treated as a regex pattern
- Invalid regex: input border turns red, no filtering applied (prevents crash mid-typing)
- Matches against both key and value
- State: `AppState.searchRegex: boolean`

### 1.2 Double-Click Inline Editing

**Modified files:**
- `src/components/Storage/StorageRow.tsx` — add inline edit mode
- `src/pages/App.tsx` — add inline save handler

**Rules:**
- Activates on double-click of the Value cell
- Only for short values: `value.length < 100` AND type is NOT `JSON`
- Value cell becomes an `<input>` with auto-focus and full text selection
- **Enter** → save, **Escape** → cancel, **blur** → save
- Long values / JSON → double-click opens side panel (existing behavior)

### 1.3 Right-Click Context Menu

**New files:**
- `src/background.ts` — service worker, registers context menus, handles clicks

**Modified files:**
- `public/manifest.json` — add `background` service worker, `contextMenus` permission
- `vite.config.ts` — add `background.ts` as build entry
- `src/pages/App.tsx` — detect `?mode=fullpage` URL parameter for full-screen mode

**Menu items:**
- "Quick View" → opens popup window (chrome.windows.create with popup type, 800x600)
- "Full Manager" → opens `index.html?mode=fullpage` in a new tab

**Full-page mode:**
- Same App component, removes `min-w-[784px]` constraint
- Table and side panel stretch to full viewport

---

## Phase 2: Snapshots & Diff

### 2.1 Snapshot System

**New files:**
- `src/utils/snapshotDB.ts` — IndexedDB wrapper for snapshots
- `src/hooks/useSnapshots.ts` — snapshot CRUD hook
- `src/components/Actions/SnapshotManager.tsx` — dropdown panel UI

**Database schema (extension-side IndexedDB):**
```
Database: alger-storage-snapshots
  ObjectStore: snapshots
    keyPath: id
    Indexes: url, createdAt
```

**Data model:**
```typescript
interface Snapshot {
  id: string;
  name: string;
  url: string;
  storageType: 'localStorage' | 'sessionStorage';
  data: Record<string, string>;
  createdAt: number;
  itemCount: number;
  totalSize: number;
}
```

**snapshotDB.ts API:**
- `openDB()` — open/create the database
- `saveSnapshot(snapshot)` — add a snapshot
- `getSnapshots(url?)` — list snapshots, optionally filtered by URL
- `deleteSnapshot(id)` — remove a snapshot
- `exportAll()` — export all snapshots as JSON
- `importSnapshots(data)` — import snapshots from JSON

**useSnapshots hook:**
- `snapshots` — list for current URL
- `saveSnapshot(name)` — capture current storage state
- `restoreSnapshot(id, mode: 'merge' | 'replace')` — write back to tab
- `deleteSnapshot(id)`
- `exportSnapshots()` / `importSnapshots(file)`

**UI — Snapshots dropdown in Header:**
- "Snapshots" button with dropdown panel
- "Save Current State..." → name input modal → save
- List of snapshots for current site, each with:
  - Name, item count, timestamp
  - [Restore] button → confirm dialog (merge/replace)
  - [Delete] button
- "Export All" / "Import" at bottom of dropdown

### 2.2 Diff View

**New files:**
- `src/components/Editor/DiffHighlight.ts` — CodeMirror decoration for diff lines

**Modified files:**
- `src/components/Layout/SidePanel.tsx` — add diff mode before save

**Flow:**
1. User edits value in side panel
2. Clicks "Save"
3. If value unchanged → toast "No changes", close panel
4. If value changed → switch to diff mode:
   - Editor becomes read-only
   - Deleted lines get red background (`bg-red-100 dark:bg-red-900/30`)
   - Added lines get green background (`bg-emerald-100 dark:bg-emerald-900/30`)
   - Header shows "Review changes before saving"
   - Footer buttons: [Cancel] (back to edit mode) [Confirm Save] (execute save)

**Implementation approach:**
- Compute line-level diff between original and edited value
- Use CodeMirror `Decoration.line()` to apply background colors
- Simple line diff algorithm: split by `\n`, compare sequences

**Inline-edited values (short values):**
- Skip diff flow, save directly (change is obvious)

---

## Phase 3: Cookie & IndexedDB

### 3.1 Cookie Management

**New files:**
- `src/hooks/useCookies.ts` — Cookie CRUD via chrome.cookies API
- `src/components/Storage/CookieTable.tsx` — Cookie-specific table layout
- `src/components/Actions/CookieEditor.tsx` — Cookie edit side panel

**Modified files:**
- `public/manifest.json` — add `cookies` permission
- `src/types/index.ts` — add `CookieItem` type, extend `DataSourceType`
- `src/contexts/AppContext.tsx` — add `dataSource` state (replaces `storageType` for tab selection)
- `src/components/Layout/Header.tsx` — extend tab bar to 4 tabs
- `src/pages/App.tsx` — route to CookieTable when cookie tab active

**Data model:**
```typescript
interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number | null;  // null = session cookie
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none' | 'unspecified';
  size: number;
}
```

**useCookies hook API:**
- `fetchAll(url)` → `chrome.cookies.getAll({ url })`
- `setCookie(cookie)` → `chrome.cookies.set(details)`
- `removeCookie(name, url)` → `chrome.cookies.remove({ name, url })`
- `removeCookies(names, url)` → batch remove

**CookieTable columns:**
```
☑ | Name | Value | Domain | Path | Expires | Flags | Actions
```
- Flags: icon indicators for httpOnly (🔒), Secure (🛡), SameSite (icon per value)
- Expires: "Session", relative time ("2h left"), or "Expired" with red text
- Sorting on Name, Domain, Expires columns

**CookieEditor side panel (form-based, not code editor):**
- Input fields: Name, Value, Domain, Path
- Date picker: Expires
- Checkboxes: HttpOnly, Secure
- Dropdown: SameSite (Strict/Lax/None)
- Quick actions section:
  - "Copy as document.cookie" → generates `document.cookie = "name=value; path=...; ..."` string
  - "Extend 7 days" → updates expiry to now + 7 days
  - "Extend 30 days" → updates expiry to now + 30 days

**Search/batch:**
- Reuses SearchBar (with regex mode), searches name + value + domain
- Reuses batch select + delete flow

### 3.2 IndexedDB Browsing

**New files:**
- `src/hooks/useIndexedDB.ts` — IndexedDB enumeration and read via chrome.scripting
- `src/components/Storage/IDBNavigator.tsx` — database/store selector dropdowns
- `src/components/Storage/IDBTable.tsx` — record listing table

**Modified files:**
- `src/pages/App.tsx` — route to IDBNavigator + IDBTable when IndexedDB tab active

**Data access (via chrome.scripting.executeScript in page context):**
- List databases: `indexedDB.databases()`
- List object stores: open db → `db.objectStoreNames`
- Read records: `objectStore.openCursor()` with pagination
- Count records: `objectStore.count()`
- Delete record: `objectStore.delete(key)`

**useIndexedDB hook API:**
- `databases` — list of `{ name, version }` for current tab
- `objectStores` — list of store names for selected database
- `records` — array of `{ key, value }` for selected store
- `totalCount` — total record count
- `loading` — fetch state
- `selectDatabase(name)` — set active DB
- `selectStore(name)` — set active store, fetch first page
- `loadMore()` — fetch next 100 records
- `deleteRecord(key)` — delete single record
- `deleteRecords(keys)` — batch delete

**Three-level navigation UI:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Database ▾   │ │ Store ▾      │ │ Records: 1,234   │
│ myapp-db     │ │ users        │ │                  │
└──────────────┘ └──────────────┘ └──────────────────┘
```
- Two dropdown selects + record count badge
- Changing database reloads stores list, resets store selection
- Changing store loads first 100 records

**IDBTable columns:**
```
☑ | Key | Value (preview, truncated) | Size | Actions
```
- Click row → side panel shows full JSON (read-only CodeEditor)
- Actions: view detail, delete
- Batch select + batch delete

**Pagination:**
- Load 100 records at a time
- "Load more" button at bottom when more records exist
- Search: client-side filter on loaded records (key + JSON.stringify(value))

**Capability boundaries:**
- Read-only browsing + delete only
- No create/edit records (too risky for data integrity)
- No create/delete databases or object stores (application-level concern)

---

## Shared Changes

### manifest.json final state
```json
{
  "permissions": ["activeTab", "storage", "scripting", "tabs", "contextMenus", "cookies"],
  "background": {
    "service_worker": "background.js"
  }
}
```

### vite.config.ts
Add `background.ts` as additional build entry point.

### i18n new keys needed
Phase 1: `regexSearch`, `regexInvalid`, `inlineEditSave`, `quickView`, `fullManager`, `noChanges`
Phase 2: `snapshots`, `saveSnapshot`, `restoreSnapshot`, `snapshotName`, `snapshotSaved`, `snapshotRestored`, `snapshotDeleted`, `exportSnapshots`, `importSnapshots`, `reviewChanges`, `confirmSave`
Phase 3: `cookies`, `indexedDB`, `cookieName`, `cookieDomain`, `cookiePath`, `cookieExpires`, `cookieFlags`, `httpOnly`, `secure`, `sameSite`, `sessionCookie`, `expired`, `extendDays`, `copyAsCookie`, `database`, `objectStore`, `records`, `loadMore`, `readOnly`, `deleteRecord`

### Type system extension
- `DataSourceType` replaces `StorageType` in AppState for tab selection
- `StorageType` still used internally for localStorage/sessionStorage operations
- `CookieItem` and IDB record types added to `src/types/index.ts`
