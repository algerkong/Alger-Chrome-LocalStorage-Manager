import { useEffect, useCallback, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useStorageWatch } from '../hooks/useStorageWatch';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../components/Common/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { Header } from '../components/Layout/Header';
import { SidePanel } from '../components/Layout/SidePanel';
import { StorageTable } from '../components/Storage/StorageTable';
import { StorageCapacity } from '../components/Common/StorageCapacity';
import { AddDialog } from '../components/Actions/AddDialog';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import { StorageItem, SortField } from '../types';
import { copyToClipboard, generateSetupCode } from '../utils/clipboard';
import { exportToJson, parseImportFile } from '../utils/exportImport';
import { getValueType, getItemSize } from '../utils/typeDetection';

function App() {
  const { state, dispatch } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const storage = useStorage();
  const { addToast } = useToast();
  const { t } = useLocale();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showImportChoice, setShowImportChoice] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Record<string, string> | null>(null);
  const [capacity, setCapacity] = useState({ used: 0, total: 5 * 1024 * 1024 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(state.searchText, 300);

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

  const { pushUndo, undo, redo, canUndo, canRedo } = useUndoRedo(
    state.undoStack, state.redoStack, state.storageType, dispatch, refreshItems
  );

  // Initial fetch
  useEffect(() => {
    refreshItems();
  }, [state.storageType]);

  // Watch for external changes
  useStorageWatch(state.storageType, state.sidePanelOpen, useCallback(() => {
    refreshItems();
    addToast('info', t('dataChanged'));
  }, [refreshItems, addToast, t]));

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

  // Handlers
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
      // Refresh to update type/size
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

  return (
    <div className={`min-w-[784px] min-h-screen transition-colors duration-300
      ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {state.loading && state.items.length === 0 ? (
        <div className="flex items-center justify-center h-[600px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <Header
            storageType={state.storageType}
            onStorageTypeChange={(type) => dispatch({ type: 'SET_STORAGE_TYPE', payload: type })}
            searchText={state.searchText}
            onSearchChange={(text) => dispatch({ type: 'SET_SEARCH', payload: text })}
            onRefresh={refreshItems}
            onAdd={() => setShowAddDialog(true)}
            onImport={handleImportClick}
            onExport={handleExport}
            onCopySetupCode={handleCopySetupCode}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            loading={state.loading}
            selectedCount={state.selectedKeys.size}
            onBatchDelete={() => setShowBatchDeleteConfirm(true)}
            onDeselectAll={() => dispatch({ type: 'DESELECT_ALL' })}
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
          />

          {/* Capacity bar */}
          <StorageCapacity used={capacity.used} total={capacity.total} />

          {/* Table */}
          <StorageTable
            items={state.items}
            selectedKeys={state.selectedKeys}
            searchText={debouncedSearch}
            sortField={state.sortField}
            sortOrder={state.sortOrder}
            onToggleSelect={(key) => dispatch({ type: 'TOGGLE_SELECT', payload: key })}
            onSelectAll={() => dispatch({ type: 'SELECT_ALL', payload: state.items.map(i => i.key) })}
            onDeselectAll={() => dispatch({ type: 'DESELECT_ALL' })}
            onClickItem={handleClickItem}
            onCopy={handleCopy}
            onDelete={handleDeleteClick}
            onSort={handleSort}
          />
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
