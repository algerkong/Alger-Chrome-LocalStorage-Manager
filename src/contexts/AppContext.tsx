import React, { createContext, useContext, useReducer } from 'react';
import { AppState, AppAction, DataSourceType } from '../types';

const MAX_UNDO = 50;

const initialState: AppState = {
  items: [],
  selectedKeys: new Set<string>(),
  editingItem: null,
  storageType: 'localStorage',
  dataSource: 'localStorage' as DataSourceType,
  searchText: '',
  searchRegex: false,
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
        dataSource: action.payload,
        selectedKeys: new Set(),
        editingItem: null,
        sidePanelOpen: false,
        undoStack: [],
        redoStack: [],
      };
    case 'SET_DATA_SOURCE': {
      const ds = action.payload;
      const storageType = (ds === 'localStorage' || ds === 'sessionStorage') ? ds : state.storageType;
      return {
        ...state,
        dataSource: ds,
        storageType,
        selectedKeys: new Set(),
        editingItem: null,
        sidePanelOpen: false,
        undoStack: [],
        redoStack: [],
      };
    }
    case 'SET_SEARCH_REGEX':
      return { ...state, searchRegex: action.payload };
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
        undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), action.payload],
        redoStack: [],
      };
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const undoneAction = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, undoneAction],
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const redoneAction = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, redoneAction],
      };
    }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(i => i.key === action.payload.key ? { ...i, value: action.payload.value } : i),
      };
    case 'DELETE_ITEM': {
      const nextSelected = new Set(state.selectedKeys);
      nextSelected.delete(action.payload);
      return {
        ...state,
        items: state.items.filter(i => i.key !== action.payload),
        selectedKeys: nextSelected,
      };
    }
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
