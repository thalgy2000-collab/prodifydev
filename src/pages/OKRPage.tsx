import { useState, useMemo } from 'react';
import { useOKRStore } from '@/hooks/useOKRStore';
import OKRCard from '@/components/OKRCard';
import CreateOKRDialog from '@/components/CreateOKRDialog';
import { getCurrentQuarter, OKR_CATEGORIES } from '@/types/okr';
import QuarterSelector from '@/components/QuarterSelector';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Search } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';

const OKRPage = () => {
  const [selectedQuarter, setSelectedQuarter] = usePersistedState('okr_quarter', getCurrentQuarter());
  const [searchText, setSearchText] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const { objectives, loading, addObjective, updateObjective, updateKeyResult, deleteObjective, getObjectivesByQuarter, getObjectiveProgress } = useOKRStore();

  const filtered = getObjectivesByQuarter(selectedQuarter);

  const filteredAndSearched = filtered.filter(obj => {
    const progress = getObjectiveProgress(obj);
    const matchesSearch = obj.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesProgress =
      progressFilter === 'all' ? true :
      progressFilter === 'low' ? progress < 40 :
      progressFilter === 'medium' ? progress >= 40 && progress < 70 :
      progress >= 70;
    return matchesSearch && matchesProgress;
  });

  const overallProgress = useMemo(() => {
    const allKRs = filteredAndSearched.flatMap(o => o.keyResults);
    if (allKRs.length === 0) return 0;
    const total = allKRs.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0);
    return Math.round(total / allKRs.length);
  }, [filteredAndSearched]);

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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar objetivo..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={progressFilter} onValueChange={v => setProgressFilter(v as 'all' | 'low' | 'medium' | 'high')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por progresso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="low">Baixo (abaixo de 40%)</SelectItem>
            <SelectItem value="medium">Médio (40% a 70%)</SelectItem>
            <SelectItem value="high">Alto (acima de 70%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Barra de progresso geral */}
      {filteredAndSearched.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Progresso geral — {selectedQuarter}</p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl font-bold text-foreground">{overallProgress}%</span>
            <span className="text-sm font-medium text-muted-foreground">{filteredAndSearched.length} {filteredAndSearched.length === 1 ? 'objetivo' : 'objetivos'}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overallProgress >= 70 ? 'bg-success' : overallProgress >= 40 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {filteredAndSearched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Target className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhum objetivo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie seu primeiro objetivo para este trimestre</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const grouped = OKR_CATEGORIES.reduce((acc, cat) => {
              const items = filteredAndSearched.filter(o => o.category === cat.value);
              if (items.length > 0) acc.push({ category: cat, items });
              return acc;
            }, [] as { category: typeof OKR_CATEGORIES[number]; items: typeof filteredAndSearched }[]);

            return grouped.map(({ category, items }) => (
              <div key={category.value} className="space-y-4">
                {items.map(obj => (
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
            ));
          })()}
        </div>
      )}
    </div>
  );
};

export default OKRPage;
