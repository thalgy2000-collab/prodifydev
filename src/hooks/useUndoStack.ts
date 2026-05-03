import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UndoAction {
  description: string;
  undo: () => Promise<void> | void;
}

export const useUndoStack = (maxSize = 5) => {
  const [stack, setStack] = useState<UndoAction[]>([]);

  const push = useCallback((action: UndoAction) => {
    setStack(prev => [action, ...prev].slice(0, maxSize));
  }, [maxSize]);

  const undoLast = useCallback(async () => {
    setStack(prev => {
      if (!prev.length) return prev;
      const [last, ...rest] = prev;
      Promise.resolve(last.undo())
        .then(() => toast.success('Ação desfeita!'))
        .catch(() => toast.error('Não foi possível desfazer'));
      return rest;
    });
  }, []);

  return { push, undoLast, canUndo: stack.length > 0, last: stack[0] };
};
