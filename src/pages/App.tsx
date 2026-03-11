import { useEffect, useCallback, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useStorageWatch } from '../hooks/useStorageWatch';
import { useDebounce } from '../hooks/useDebounce';
import { useSnapshots } from '../hooks/useSnapshots';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useToast } from '../components/Common/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { Header } from '../components/Layout/Header';
import { SidePanel } from '../components/Layout/SidePanel';
import { StorageTable } from '../components/Storage/StorageTable';
import { StorageCapacity } from '../components/Common/StorageCapacity';
import { AddDialog } from '../components/Actions/AddDialog';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import { SnapshotManager } from '../components/Actions/SnapshotManager';
import { CookieTable } from '../components/Storage/CookieTable';
import { CookieEditor } from '../components/Actions/CookieEditor';
import { IDBNavigator } from '../components/Storage/IDBNavigator';
import { IDBTable } from '../components/Storage/IDBTable';
import { StorageItem, SortField, CookieItem } from '../types';
import { copyToClipboard, generateSetupCode } from '../utils/clipboard';
import { exportToJson, parseImportFile } from '../utils/exportImport';
import { getValueType, getItemSize } from '../utils/typeDetection';

const isFullPage = new URLSearchParams(window.location.search).get('mode') === 'fullpage';

function App() {
  const { state, dispatch } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const storage = useStorage();
  const { addToast } = useToast();
  const { t } = useLocale();
  const snapshotHook = useSnapshots();
  const idb = useIndexedDB();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showImportChoice, setShowImportChoice] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Record<string, string> | null>(null);
  const [capacity, setCapacity] = useState({ used: 0, total: 5 * 1024 * 1024 });

  // Cookie state
  const [cookieItems, setCookieItems] = useState<CookieItem[]>([]);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);
  const [cookieEditorOpen, setCookieEditorOpen] = useState(false);
  const [isNewCookie, setIsNewCookie] = useState(false);
  const [selectedCookieNames, setSelectedCookieNames] = useState<Set<string>>(new Set());

  // IDB state
  const [idbSelectedKeys, setIdbSelectedKeys] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(state.searchText, 300);

  // Storage refresh
  const refreshItems = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const items = await storage.fetchAll(state.storageType);
      dispatch({ type: 'SET_ITEMS', payload: items });
      const cap = await storage.getCapacity(state.storageType);
      setCapacity(cap);
    } catch {
      addToast('error', t('getLSError'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storage, state.storageType, dispatch, addToast, t]);

  // Cookie refresh
  // Get current tab URL helper
  const getTabUrl = useCallback(async (): Promise<string | null> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url || null;
  }, []);

  // Cookie refresh
  const refreshCookies = useCallback(async () => {
    try {
      if (!chrome.cookies) {
        addToast('error', 'cookies API unavailable — please reload the extension');
        return;
      }
      const url = await getTabUrl();
      if (!url) {
        addToast('error', t('getTabError'));
        return;
      }
      // chrome:// and edge:// pages don't support cookies API
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setCookieItems([]);
        return;
      }
      dispatch({ type: 'SET_LOADING', payload: true });
      // Use domain-based query for broader cookie access
      const urlObj = new URL(url);
      const cookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
      const items: CookieItem[] = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expirationDate ? Math.floor(c.expirationDate) : null,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite as CookieItem['sameSite'],
        size: new Blob([c.name + '=' + c.value]).size,
      }));
      setCookieItems(items);
    } catch (e) {
      console.error('Failed to load cookies:', e);
      addToast('error', String(e));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, addToast, t, getTabUrl]);

  const { pushUndo, undo, redo, canUndo, canRedo } = useUndoRedo(
    state.undoStack, state.redoStack, state.storageType, dispatch, refreshItems
  );

  // Data fetch based on data source
  useEffect(() => {
    if (state.dataSource === 'localStorage' || state.dataSource === 'sessionStorage') {
      refreshItems();
    } else if (state.dataSource === 'cookie') {
      refreshCookies();
    } else if (state.dataSource === 'indexedDB') {
      idb.listDatabases();
    }
    setSelectedCookieNames(new Set());
    setIdbSelectedKeys(new Set());
  }, [state.dataSource]);

  // Load snapshots
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) snapshotHook.loadSnapshots(tab.url);
    });
  }, []);

  // Watch for external changes (only for storage tabs)
  useStorageWatch(state.storageType, state.sidePanelOpen || state.dataSource === 'cookie' || state.dataSource === 'indexedDB', useCallback(() => {
    if (state.dataSource === 'localStorage' || state.dataSource === 'sessionStorage') {
      refreshItems();
      addToast('info', t('dataChanged'));
    }
  }, [refreshItems, addToast, t, state.dataSource]));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo().then(ok => {
          if (ok) addToast('success', t('undoSuccess'));
          else addToast('info', t('noUndoActions'));
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo().then(ok => {
          if (ok) addToast('success', t('redoSuccess'));
          else addToast('info', t('noRedoActions'));
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, addToast, t]);

  // === Storage handlers ===
  const handleAdd = async (key: string, value: string) => {
    try {
      await storage.setItem(state.storageType, key, value);
      const item: StorageItem = { key, value, type: getValueType(value), size: getItemSize(value) };
      dispatch({ type: 'ADD_ITEM', payload: item });
      pushUndo({ type: 'ADD', key, newValue: value });
      addToast('success', t('addSuccess'));
      const cap = await storage.getCapacity(state.storageType);
      setCapacity(cap);
    } catch {
      addToast('error', t('addFailed'));
      throw new Error('Add failed');
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      const oldItem = state.items.find(i => i.key === key);
      await storage.setItem(state.storageType, key, value);
      dispatch({ type: 'UPDATE_ITEM', payload: { key, value } });
      pushUndo({ type: 'UPDATE', key, oldValue: oldItem?.value, newValue: value });
      dispatch({ type: 'SET_EDITING', payload: null });
      addToast('success', t('saveSuccess'));
      await refreshItems();
    } catch {
      addToast('error', t('saveFailed'));
    }
  };

  const handleInlineSave = async (key: string, value: string) => {
    try {
      const oldItem = state.items.find(i => i.key === key);
      await storage.setItem(state.storageType, key, value);
      dispatch({ type: 'UPDATE_ITEM', payload: { key, value } });
      pushUndo({ type: 'UPDATE', key, oldValue: oldItem?.value, newValue: value });
      addToast('success', t('inlineEditSave'));
      await refreshItems();
    } catch {
      addToast('error', t('saveFailed'));
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const item = state.items.find(i => i.key === key);
      await storage.removeItem(state.storageType, key);
      dispatch({ type: 'DELETE_ITEM', payload: key });
      if (item) pushUndo({ type: 'DELETE', key, oldValue: item.value });
      addToast('success', t('deleteSuccess'));
      const cap = await storage.getCapacity(state.storageType);
      setCapacity(cap);
    } catch {
      addToast('error', t('deleteFailed'));
    }
  };

  const handleBatchDelete = async () => {
    try {
      const keys = Array.from(state.selectedKeys);
      const oldItems = state.items
        .filter(i => keys.includes(i.key))
        .map(i => ({ key: i.key, value: i.value }));
      await storage.removeItems(state.storageType, keys);
      dispatch({ type: 'DELETE_ITEMS', payload: keys });
      pushUndo({ type: 'BATCH_DELETE', key: keys[0], keys, oldItems });
      addToast('success', t('deleteSuccess'));
      const cap = await storage.getCapacity(state.storageType);
      setCapacity(cap);
    } catch {
      addToast('error', t('deleteFailed'));
    }
  };

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    addToast('success', t('copied'));
  };

  const handleCopySetupCode = async () => {
    const code = generateSetupCode(state.items);
    await copyToClipboard(code);
    addToast('success', t('copied'));
  };

  const handleExport = () => {
    exportToJson(state.items);
    addToast('success', t('exportSuccess'));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseImportFile(file);
      setPendingImportData(data);
      setShowImportChoice(true);
    } catch {
      addToast('error', t('importFailed'));
    }
    e.target.value = '';
  };

  const handleImport = async (mode: 'merge' | 'replace') => {
    if (!pendingImportData) return;
    try {
      await storage.importData(state.storageType, pendingImportData, mode);
      await refreshItems();
      addToast('success', t('importSuccess'));
    } catch {
      addToast('error', t('importFailed'));
    }
    setPendingImportData(null);
    setShowImportChoice(false);
  };

  const handleClickItem = (item: StorageItem) => {
    dispatch({ type: 'SET_EDITING', payload: item });
  };

  const handleOpenDetail = (item: StorageItem) => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const params = new URLSearchParams({
        key: item.key,
        value: item.value,
        tabId: tab.id?.toString() || '',
        isDarkMode: isDarkMode.toString(),
        storageType: state.storageType,
      });
      chrome.windows.create({
        url: chrome.runtime.getURL(`detail.html?${params.toString()}`),
        type: 'popup',
        width: 1200,
        height: 800,
      });
    });
  };

  const handleSort = (field: SortField) => {
    if (state.sortField === field) {
      dispatch({ type: 'SET_SORT', payload: { field, order: state.sortOrder === 'asc' ? 'desc' : 'asc' } });
    } else {
      dispatch({ type: 'SET_SORT', payload: { field, order: 'asc' } });
    }
  };

  const handleDeleteClick = (key: string) => {
    setDeleteTarget(key);
    setShowDeleteConfirm(true);
  };

  // === Cookie handlers ===
  const getCookieUrl = (cookie: CookieItem): string => {
    const protocol = cookie.secure ? 'https://' : 'http://';
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    return `${protocol}${domain}${cookie.path}`;
  };

  const handleSaveCookie = async (cookie: CookieItem) => {
    if (!chrome.cookies) { addToast('error', 'cookies API unavailable'); return; }
    const url = await getTabUrl();
    if (!url) return;
    try {
      const cookieUrl = cookie.domain ? getCookieUrl(cookie) : url;
      const details: chrome.cookies.SetDetails = {
        url: cookieUrl,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite === 'unspecified' ? undefined : cookie.sameSite as chrome.cookies.SameSiteStatus,
      };
      // Only set domain if explicitly provided (for new cookies, let browser default)
      if (cookie.domain) {
        details.domain = cookie.domain;
      }
      if (cookie.expires !== null) {
        details.expirationDate = cookie.expires;
      }
      await chrome.cookies.set(details);
      setCookieEditorOpen(false);
      setEditingCookie(null);
      await refreshCookies();
      addToast('success', t('saveSuccess'));
    } catch (e) {
      console.error('Failed to save cookie:', e);
      addToast('error', t('saveFailed'));
    }
  };

  const handleDeleteCookie = async (name: string) => {
    if (!chrome.cookies) { addToast('error', 'cookies API unavailable'); return; }
    const url = await getTabUrl();
    if (!url) return;
    try {
      // Find cookie to get its exact domain for proper URL
      const cookie = cookieItems.find(c => c.name === name);
      const removeUrl = cookie ? getCookieUrl(cookie) : url;
      await chrome.cookies.remove({ url: removeUrl, name });
      await refreshCookies();
      addToast('success', t('deleteSuccess'));
    } catch {
      addToast('error', t('deleteFailed'));
    }
  };

  const handleCopyAsCookieCode = (cookie: CookieItem) => {
    const parts = [`${cookie.name}=${cookie.value}`];
    if (cookie.path) parts.push(`path=${cookie.path}`);
    if (cookie.domain) parts.push(`domain=${cookie.domain}`);
    if (cookie.secure) parts.push('secure');
    if (cookie.sameSite !== 'unspecified') parts.push(`SameSite=${cookie.sameSite}`);
    if (cookie.expires) parts.push(`expires=${new Date(cookie.expires * 1000).toUTCString()}`);
    const code = `document.cookie = "${parts.join('; ')}"`;
    copyToClipboard(code);
    addToast('success', t('copied'));
  };

  // === IDB handlers ===
  const handleDeleteIDBRecord = async (key: IDBValidKey) => {
    if (!idb.selectedDB || !idb.selectedStore) return;
    try {
      await idb.deleteRecord(idb.selectedDB, idb.selectedStore, key);
      await idb.selectStore(idb.selectedDB, idb.selectedStore);
      addToast('success', t('deleteSuccess'));
    } catch {
      addToast('error', t('deleteFailed'));
    }
  };

  // === Computed ===
  const isStorageTab = state.dataSource === 'localStorage' || state.dataSource === 'sessionStorage';

  const currentSelectedCount = state.dataSource === 'cookie'
    ? selectedCookieNames.size
    : state.dataSource === 'indexedDB'
    ? idbSelectedKeys.size
    : state.selectedKeys.size;

  return (
    <div className={`${isFullPage ? '' : 'min-w-[784px]'} min-h-screen transition-colors duration-300
      ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {state.loading && state.items.length === 0 && isStorageTab ? (
        <div className="flex items-center justify-center h-[600px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <Header
            dataSource={state.dataSource}
            onDataSourceChange={(ds) => dispatch({ type: 'SET_DATA_SOURCE', payload: ds })}
            searchText={state.searchText}
            searchRegex={state.searchRegex}
            onSearchChange={(text) => dispatch({ type: 'SET_SEARCH', payload: text })}
            onSearchRegexChange={(v) => dispatch({ type: 'SET_SEARCH_REGEX', payload: v })}
            onRefresh={
              state.dataSource === 'cookie' ? refreshCookies
                : state.dataSource === 'indexedDB' ? idb.listDatabases
                : refreshItems
            }
            onAdd={
              state.dataSource === 'cookie'
                ? () => { setEditingCookie(null); setCookieEditorOpen(true); setIsNewCookie(true); }
                : isStorageTab
                ? () => setShowAddDialog(true)
                : undefined
            }
            onImport={isStorageTab ? handleImportClick : undefined}
            onExport={isStorageTab ? handleExport : undefined}
            onCopySetupCode={handleCopySetupCode}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            loading={state.loading}
            selectedCount={currentSelectedCount}
            onBatchDelete={() => {
              if (state.dataSource === 'cookie') {
                if (!chrome.cookies) { addToast('error', 'cookies API unavailable'); return; }
                const names = Array.from(selectedCookieNames);
                const toDelete = cookieItems.filter(c => names.includes(c.name));
                Promise.all(toDelete.map(c => chrome.cookies.remove({ url: getCookieUrl(c), name: c.name }))).then(() => {
                  setSelectedCookieNames(new Set());
                  refreshCookies();
                  addToast('success', t('deleteSuccess'));
                });
              } else if (state.dataSource === 'indexedDB') {
                if (idb.selectedDB && idb.selectedStore) {
                  const keys = idb.records.filter(r => idbSelectedKeys.has(String(r.key))).map(r => r.key);
                  idb.deleteRecords(idb.selectedDB, idb.selectedStore, keys).then(() => {
                    setIdbSelectedKeys(new Set());
                    idb.selectStore(idb.selectedDB!, idb.selectedStore!);
                    addToast('success', t('deleteSuccess'));
                  });
                }
              } else {
                setShowBatchDeleteConfirm(true);
              }
            }}
            onDeselectAll={() => {
              if (state.dataSource === 'cookie') setSelectedCookieNames(new Set());
              else if (state.dataSource === 'indexedDB') setIdbSelectedKeys(new Set());
              else dispatch({ type: 'DESELECT_ALL' });
            }}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={() => undo().then(ok => {
              if (ok) addToast('success', t('undoSuccess'));
              else addToast('info', t('noUndoActions'));
            })}
            onRedo={() => redo().then(ok => {
              if (ok) addToast('success', t('redoSuccess'));
              else addToast('info', t('noRedoActions'));
            })}
          >
            {/* Snapshot Manager - only for storage tabs */}
            {isStorageTab && (
              <SnapshotManager
                snapshots={snapshotHook.snapshots}
                onSave={(name) => {
                  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                    snapshotHook.saveSnapshot(
                      name,
                      tab?.url || '',
                      state.storageType,
                      state.items.map(i => ({ key: i.key, value: i.value }))
                    ).then(() => addToast('success', t('snapshotSaved')));
                  });
                }}
                onRestore={(id, mode) => {
                  snapshotHook.restoreSnapshot(id, mode, state.storageType).then(() => {
                    refreshItems();
                    addToast('success', t('snapshotRestored'));
                  });
                }}
                onDelete={(id) => {
                  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                    snapshotHook.removeSnapshot(id, tab?.url);
                    addToast('success', t('snapshotDeleted'));
                  });
                }}
                onExport={snapshotHook.exportSnapshots}
                onImport={(file) => {
                  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                    snapshotHook.importSnapshotsFromFile(file, tab?.url)
                      .then(() => addToast('success', t('importSuccess')));
                  });
                }}
              />
            )}
          </Header>

          {/* Content based on data source */}
          {isStorageTab && (
            <>
              <StorageCapacity used={capacity.used} total={capacity.total} />
              <StorageTable
                items={state.items}
                selectedKeys={state.selectedKeys}
                searchText={debouncedSearch}
                searchRegex={state.searchRegex}
                sortField={state.sortField}
                sortOrder={state.sortOrder}
                onToggleSelect={(key) => dispatch({ type: 'TOGGLE_SELECT', payload: key })}
                onSelectAll={() => dispatch({ type: 'SELECT_ALL', payload: state.items.map(i => i.key) })}
                onDeselectAll={() => dispatch({ type: 'DESELECT_ALL' })}
                onClickItem={handleClickItem}
                onCopy={handleCopy}
                onDelete={handleDeleteClick}
                onSort={handleSort}
                onInlineSave={handleInlineSave}
              />
            </>
          )}

          {state.dataSource === 'cookie' && (
            <CookieTable
              cookies={cookieItems}
              selectedNames={selectedCookieNames}
              searchText={debouncedSearch}
              searchRegex={state.searchRegex}
              onToggleSelect={(name) => setSelectedCookieNames(prev => {
                const next = new Set(prev);
                if (next.has(name)) next.delete(name); else next.add(name);
                return next;
              })}
              onSelectAll={() => setSelectedCookieNames(new Set(cookieItems.map(c => c.name)))}
              onDeselectAll={() => setSelectedCookieNames(new Set())}
              onClickCookie={(cookie) => { setEditingCookie(cookie); setCookieEditorOpen(true); setIsNewCookie(false); }}
              onCopy={handleCopy}
              onDelete={handleDeleteCookie}
            />
          )}

          {state.dataSource === 'indexedDB' && (
            <>
              <IDBNavigator
                databases={idb.databases}
                objectStores={idb.objectStores}
                selectedDB={idb.selectedDB}
                selectedStore={idb.selectedStore}
                totalCount={idb.totalCount}
                onSelectDB={(name) => idb.selectDatabase(name)}
                onSelectStore={(name) => idb.selectedDB && idb.selectStore(idb.selectedDB, name)}
              />
              {idb.selectedStore && (
                <IDBTable
                  records={idb.records}
                  totalCount={idb.totalCount}
                  loading={idb.loading}
                  selectedKeys={idbSelectedKeys}
                  searchText={debouncedSearch}
                  searchRegex={state.searchRegex}
                  onToggleSelect={(key) => setIdbSelectedKeys(prev => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key); else next.add(key);
                    return next;
                  })}
                  onSelectAll={() => setIdbSelectedKeys(new Set(idb.records.map(r => String(r.key))))}
                  onDeselectAll={() => setIdbSelectedKeys(new Set())}
                  onClickRecord={(record) => {
                    const value = JSON.stringify(record.value, null, 2);
                    dispatch({ type: 'SET_EDITING', payload: {
                      key: String(record.key),
                      value,
                      type: 'JSON',
                      size: new Blob([value]).size,
                    }});
                  }}
                  onDelete={handleDeleteIDBRecord}
                  onLoadMore={idb.loadMore}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Side Panel */}
      <SidePanel
        item={state.editingItem}
        open={state.sidePanelOpen}
        isDarkMode={isDarkMode}
        onClose={() => dispatch({ type: 'SET_SIDE_PANEL', payload: false })}
        onSave={handleSave}
        onOpenDetail={handleOpenDetail}
        addToast={(type, msg) => addToast(type, msg)}
        readOnly={state.dataSource === 'indexedDB'}
      />

      {/* Cookie Editor */}
      <CookieEditor
        cookie={editingCookie}
        open={cookieEditorOpen}
        isNew={isNewCookie}
        onClose={() => { setCookieEditorOpen(false); setEditingCookie(null); }}
        onSave={handleSaveCookie}
        onCopyAsCode={handleCopyAsCookieCode}
      />

      {/* Add Dialog */}
      <AddDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAdd}
        isDarkMode={isDarkMode}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        title={t('delete')}
        message={t('deleteConfirm')}
        variant="danger"
      />

      {/* Batch Delete Confirm */}
      <ConfirmDialog
        open={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title={t('batchDelete')}
        message={t('batchDeleteConfirm').replace('{count}', String(state.selectedKeys.size))}
        variant="danger"
      />

      {/* Import Choice */}
      {showImportChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4 animate-modal-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('importChoice')}</h3>
            <div className="flex gap-3">
              <button onClick={() => handleImport('merge')}
                className="flex-1 px-4 py-3 text-sm font-medium rounded-lg
                  text-blue-700 bg-blue-50 hover:bg-blue-100
                  dark:text-blue-300 dark:bg-blue-950/50 dark:hover:bg-blue-900/50
                  transition-colors">
                {t('mergeImport')}
              </button>
              <button onClick={() => handleImport('replace')}
                className="flex-1 px-4 py-3 text-sm font-medium rounded-lg
                  text-amber-700 bg-amber-50 hover:bg-amber-100
                  dark:text-amber-300 dark:bg-amber-950/50 dark:hover:bg-amber-900/50
                  transition-colors">
                {t('replaceImport')}
              </button>
            </div>
            <button onClick={() => { setShowImportChoice(false); setPendingImportData(null); }}
              className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-700
                dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default App;
