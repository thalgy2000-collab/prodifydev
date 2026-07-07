import { useState } from 'react';
import { Pencil, History, Plus, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProblemStatement } from '@/hooks/useProblemStatement';
import ProblemStatementModal from './ProblemStatementModal';
import ProblemStatementHistoryModal from './ProblemStatementHistoryModal';

interface Props {
  variant?: 'full' | 'compact';
}

export default function ProblemStatementCard({ variant = 'full' }: Props) {
  const { current, loading, reload } = useProblemStatement();
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (loading) return null;

  const compactPad = variant === 'compact' ? 'p-4' : 'p-5';

  if (!current) {
    return (
      <>
        <div className={`rounded-2xl border border-dashed border-primary/40 bg-primary/5 ${compactPad}`}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Defina o problema do seu produto</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Qual problema você está resolvendo? Isso vai guiar todos os frameworks de Discovery.
          </p>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Definir Problema e Objetivo
          </Button>
        </div>
        <ProblemStatementModal open={editOpen} onOpenChange={setEditOpen} initial={null} onSaved={reload} />
      </>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border border-border bg-card ${compactPad}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Problema que estamos resolvendo</h3>
            <span className="text-[10px] text-muted-foreground">v{current.version}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} className="h-7 px-2 text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)} className="h-7 px-2 text-xs">
              <History className="h-3.5 w-3.5 mr-1" /> Histórico
            </Button>
          </div>
        </div>

        <blockquote className="border-l-2 border-primary/60 pl-3 text-sm text-foreground italic mb-3">
          "{current.problem}"
        </blockquote>

        <div className="flex items-start gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-amber-400 mr-1">Objetivo:</span>
            <span className="text-foreground">"{current.objective}"</span>
          </div>
        </div>

        {current.target_audience && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-medium text-foreground">Público-alvo:</span> {current.target_audience}
          </p>
        )}
      </div>

      <ProblemStatementModal open={editOpen} onOpenChange={setEditOpen} initial={current} onSaved={reload} />
      <ProblemStatementHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
