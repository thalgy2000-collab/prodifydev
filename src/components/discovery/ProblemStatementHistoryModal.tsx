import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProblemStatement, ProblemStatement } from '@/hooks/useProblemStatement';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function ProblemStatementHistoryModal({ open, onOpenChange }: Props) {
  const { listHistory } = useProblemStatement();
  const [items, setItems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listHistory().then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, [open, listHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle>Histórico de versões</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-4">
          {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma versão registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">v{it.version}</span>
                  {it.is_current && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Atual</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    · {new Date(it.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground font-medium">Problema:</span> {it.problem}</p>
                <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground font-medium">Objetivo:</span> {it.objective}</p>
                {it.target_audience && (
                  <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Público-alvo:</span> {it.target_audience}</p>
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
