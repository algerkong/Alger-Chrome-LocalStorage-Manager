export interface StorageItem {
  key: string;
  value: string;
  type: StorageValueType;
  size: number;
  extraInfo?: string;
}

export type StorageValueType = 'JSON' | 'String' | 'Number' | 'Boolean' | 'Timestamp';

export type StorageType = 'localStorage' | 'sessionStorage';

export type DataSourceType = 'localStorage' | 'sessionStorage' | 'cookie' | 'indexedDB';

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

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number | null;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none' | 'unspecified';
  size: number;
}

export interface Snapshot {
  id: string;
  name: string;
  url: string;
  storageType: 'localStorage' | 'sessionStorage';
  data: Record<string, string>;
  createdAt: number;
  itemCount: number;
  totalSize: number;
}

export interface AppState {
  items: StorageItem[];
  selectedKeys: Set<string>;
  editingItem: StorageItem | null;
  storageType: StorageType;
  dataSource: DataSourceType;
  searchText: string;
  searchRegex: boolean;
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
  | { type: 'SET_DATA_SOURCE'; payload: DataSourceType }
  | { type: 'SET_SEARCH_REGEX'; payload: boolean }
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
