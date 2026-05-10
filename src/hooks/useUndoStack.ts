import { useUndo, UndoAction as ContextUndoAction } from '@/contexts/UndoContext';

export type UndoAction = ContextUndoAction;

/**
 * @deprecated Use `useUndo` from `@/contexts/UndoContext` directly.
 * This wrapper preserves the original API but delegates to the global undo stack
 * so all screens share a single Ctrl+Z/Cmd+Z history.
 */
export const useUndoStack = (_maxSize = 5) => {
  const { push, undoLast, canUndo, last } = useUndo();
  return { push, undoLast, canUndo, last };
};
