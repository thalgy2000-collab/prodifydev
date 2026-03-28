import { useState } from 'react';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import CreateRoadmapDialog from '@/components/CreateRoadmapDialog';
import EditRoadmapDialog from '@/components/EditRoadmapDialog';
import { getCurrentQuarter, getQuarterMonths } from '@/types/okr';
import { RoadmapItem } from '@/types/roadmap';
import QuarterSelector from '@/components/QuarterSelector';
import { Map, Pencil, Trash2, Circle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusIcons = {
  planned: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
};

const statusLabels = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

const RoadmapPage = () => {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const months = getQuarterMonths(selectedQuarter);

  const { items, addItem, updateStatus, updateItem, deleteItem, getByQuarter } = useRoadmapStore();
  const { objectives } = useOKRStore();

  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const filtered = getByQuarter(selectedQuarter);

  const handleQuarterChange = (val: string) => {
    setSelectedQuarter(val);
  };

  // Sort by startMonth then endMonth
  const sorted = [...filtered].sort((a, b) => a.startMonth - b.startMonth || a.endMonth - b.endMonth);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
            <p className="text-sm text-muted-foreground">Cronograma visual das iniciativas</p>
          </div>
          <CreateRoadmapDialog quarter={selectedQuarter} objectives={objectives} onAdd={addItem} />
        </div>

        {/* Quarter & Year Navigation */}
        <QuarterSelector selectedQuarter={selectedQuarter} onQuarterChange={handleQuarterChange} />

        {/* Gantt Chart */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Map className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Nenhuma iniciativa encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Crie sua primeira iniciativa para este trimestre</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Month Headers */}
            <div className="grid grid-cols-3 border-b border-border">
              {months.map((month, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center ${i < 2 ? 'border-r border-border/50' : ''}`}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Rows */}
            {sorted.map((item) => {
              const StatusIcon = statusIcons[item.status];
              return (
                <div
                  key={item.id}
                  className="group relative border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="grid grid-cols-3 min-h-[52px]">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`${i < 2 ? 'border-r border-border/30' : ''}`} />
                    ))}
                  </div>
                  {/* Bar overlay */}
                  <div
                    className="absolute top-0 bottom-0 flex items-center pointer-events-none"
                    style={{
                      left: `${(item.startMonth / 3) * 100}%`,
                      width: `${((item.endMonth - item.startMonth + 1) / 3) * 100}%`,
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="pointer-events-auto mx-1 my-2 h-8 w-full rounded-md flex items-center gap-1.5 px-3 cursor-pointer transition-all hover:brightness-110 hover:shadow-md"
                          style={{
                            backgroundColor: item.color,
                            opacity: item.status === 'done' ? 0.5 : 0.85,
                          }}
                          onClick={() => setEditItem(item)}
                        >
                          <Link2 className="h-3.5 w-3.5 text-white/80 shrink-0" />
                          <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                            {item.title}
                          </span>
                          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                              className="rounded p-0.5 hover:bg-white/20 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white/80" />
                            </button>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                        <p className="text-xs mt-1">{months[item.startMonth]} — {months[item.endMonth]} · {statusLabels[item.status]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editItem && (
          <EditRoadmapDialog
            item={editItem}
            objectives={objectives}
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            onSave={updateItem}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoadmapPage;
