import { useCallback } from 'react';
import { UndoAction, StorageType, AppAction } from '../types';
import { useStorage } from './useStorage';

export function useUndoRedo(
  undoStack: UndoAction[],
  redoStack: UndoAction[],
  storageType: StorageType,
  dispatch: React.Dispatch<AppAction>,
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
