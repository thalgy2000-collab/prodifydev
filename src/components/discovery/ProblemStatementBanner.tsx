import { useState } from 'react';
import { ChevronDown, ChevronUp, Target, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProblemStatement } from '@/hooks/useProblemStatement';

/**
 * Faixa fina e colapsável exibida no topo dos frameworks de Discovery.
 * Reforça o "norte" do produto sem ocupar espaço excessivo.
 */
export default function ProblemStatementBanner() {
  const { current, loading } = useProblemStatement();
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;

  if (!current) {
    return (
      <Link
        to="/inicio"
        className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-muted-foreground hover:bg-primary/10 transition-colors"
      >
        <Plus className="h-3.5 w-3.5 text-primary" />
        <span>Defina o <span className="text-foreground font-medium">Problema e Objetivo</span> do produto para guiar seus frameworks.</span>
      </Link>
    );
  }

  const short = current.problem.length > 80 ? current.problem.slice(0, 80) + '…' : current.problem;

  return (
    <div className="mb-4 rounded-lg border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/40 rounded-lg transition-colors"
      >
        <Target className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground truncate flex-1">
          <span className="text-foreground font-medium">Problema:</span> "{short}"
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
          {expanded ? 'Recolher' : 'Ver completo'}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-2">
          <p className="text-xs text-foreground italic">"{current.problem}"</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-amber-400 font-semibold">🏆 Objetivo:</span> "{current.objective}"
          </p>
          {current.target_audience && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Público-alvo:</span> {current.target_audience}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
