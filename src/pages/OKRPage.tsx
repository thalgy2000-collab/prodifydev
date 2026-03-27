import { useState } from 'react';
import { useOKRStore } from '@/hooks/useOKRStore';
import OKRCard from '@/components/OKRCard';
import CreateOKRDialog from '@/components/CreateOKRDialog';
import { getCurrentQuarter, getQuarters } from '@/types/okr';
import QuarterSelector from '@/components/QuarterSelector';
import { Target } from 'lucide-react';

const OKRPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const quarters = getQuarters(currentYear);

  const { objectives, loading, addObjective, updateObjective, updateKeyResult, deleteObjective, getObjectivesByQuarter, getObjectiveProgress } = useOKRStore();

  const filtered = getObjectivesByQuarter(selectedQuarter);

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

      <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {quarters.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
        </SelectContent>
      </Select>

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
