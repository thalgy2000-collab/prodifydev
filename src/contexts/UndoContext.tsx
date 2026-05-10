import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface UndoAction {
  id?: string;
  description: string;
  undo: () => Promise<void> | void;
}

interface UndoContextValue {
  push: (action: UndoAction) => void;
  undoLast: () => Promise<void>;
  canUndo: boolean;
  last: UndoAction | null;
}

const UndoContext = createContext<UndoContextValue>({
  push: () => {},
  undoLast: async () => {},
  canUndo: false,
  last: null,
});

const MAX_STACK = 5;

export const UndoProvider = ({ children }: { children: ReactNode }) => {
  const [stack, setStack] = useState<UndoAction[]>([]);

  const push = useCallback((action: UndoAction) => {
    setStack(prev => [{ id: action.id ?? crypto.randomUUID(), ...action }, ...prev].slice(0, MAX_STACK));
  }, []);

  const undoLast = useCallback(async () => {
    let target: UndoAction | undefined;
    setStack(prev => {
      if (!prev.length) return prev;
      target = prev[0];
      return prev.slice(1);
    });
    if (!target) return;
    try {
      await target.undo();
      toast.success('Ação desfeita!');
    } catch {
      toast.error('Não foi possível desfazer esta ação');
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const inField =
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inField) {
        e.preventDefault();
        undoLast();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoLast]);

  return (
    <UndoContext.Provider value={{ push, undoLast, canUndo: stack.length > 0, last: stack[0] ?? null }}>
      {children}
    </UndoContext.Provider>
  );
};

export const useUndo = () => useContext(UndoContext);
