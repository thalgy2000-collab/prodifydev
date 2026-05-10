import { Undo2 } from 'lucide-react';
import { useUndo } from '@/contexts/UndoContext';

export const UndoButton = () => {
  const { canUndo, undoLast, last } = useUndo();
  if (!canUndo) return null;
  return (
    <button
      onClick={undoLast}
      title={last?.description ? `${last.description} — Ctrl+Z` : 'Desfazer (Ctrl+Z)'}
      className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
    >
      <Undo2 size={14} />
      Desfazer
    </button>
  );
};
