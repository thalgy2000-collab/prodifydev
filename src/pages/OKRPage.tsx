import { useState, useMemo } from 'react';
import { useOKRStore } from '@/hooks/useOKRStore';
import OKRCard from '@/components/OKRCard';
import CreateOKRDialog from '@/components/CreateOKRDialog';
import { getCurrentQuarter } from '@/types/okr';
import QuarterSelector from '@/components/QuarterSelector';
import { Target } from 'lucide-react';

const OKRPage = () => {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());

  const { objectives, loading, addObjective, updateObjective, updateKeyResult, deleteObjective, getObjectivesByQuarter, getObjectiveProgress } = useOKRStore();

  const filtered = getObjectivesByQuarter(selectedQuarter);

  const overallProgress = useMemo(() => {
    const allKRs = filtered.flatMap(o => o.keyResults);
    if (allKRs.length === 0) return 0;
    const total = allKRs.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0);
    return Math.round(total / allKRs.length);
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando OKRs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OKRs</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus objetivos e resultados-chave</p>
        </div>
        <CreateOKRDialog quarter={selectedQuarter} onAdd={addObjective} />
      </div>

      <QuarterSelector selectedQuarter={selectedQuarter} onQuarterChange={setSelectedQuarter} />

      {/* Barra de progresso geral */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Progresso geral — {selectedQuarter}</p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl font-bold text-foreground">{overallProgress}%</span>
            <span className="text-sm font-medium text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'objetivo' : 'objetivos'}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overallProgress >= 70 ? 'bg-success' : overallProgress >= 40 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Target className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhum objetivo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie seu primeiro objetivo para este trimestre</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(obj => (
            <OKRCard
              key={obj.id}
              objective={obj}
              progress={getObjectiveProgress(obj)}
              onUpdateKR={updateKeyResult}
              onDelete={deleteObjective}
              onEdit={updateObjective}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OKRPage;
