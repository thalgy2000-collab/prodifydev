import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { useUndoStack } from '@/hooks/useUndoStack';
import CreateRoadmapDialog from '@/components/CreateRoadmapDialog';
import EditRoadmapDialog from '@/components/EditRoadmapDialog';
import { getCurrentQuarter, getQuarterMonths } from '@/types/okr';
import { RoadmapItem, parseDateOnly } from '@/types/roadmap';
import QuarterSelector from '@/components/QuarterSelector';
import { Map, Trash2, Link2, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { roadmapTourSteps } from '@/lib/featureTours';

/** Returns [leftPct, widthPct] for an item bar within the selected quarter's 3-month grid. */
const computeBarPosition = (item: RoadmapItem, quarter: string): { left: number; width: number } => {
  const m = quarter.match(/Q(\d)\s+(\d{4})/);
  if (!m) return { left: 0, width: 100 };
  const q = parseInt(m[1]);
  const year = parseInt(m[2]);
  const qStart = new Date(year, (q - 1) * 3, 1);
  const qEnd = new Date(year, (q - 1) * 3 + 3, 1); // exclusive
  const totalMs = qEnd.getTime() - qStart.getTime();

  const startD = parseDateOnly(item.startDate);
  const endD = parseDateOnly(item.endDate);

  if (startD && endD) {
    const s = Math.max(startD.getTime(), qStart.getTime());
    // include the end day fully
    const endInclusive = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() + 1).getTime();
    const e = Math.min(endInclusive, qEnd.getTime());
    const left = Math.max(0, ((s - qStart.getTime()) / totalMs) * 100);
    const width = Math.max(1, ((e - s) / totalMs) * 100);
    return { left, width: Math.min(100 - left, width) };
  }
  // Fallback to month-based positioning
  const left = (item.startMonth / 3) * 100;
  const width = ((item.endMonth - item.startMonth + 1) / 3) * 100;
  return { left, width };
};

const getProgressColor = (p: number) => {
  if (p >= 100) return 'hsl(var(--success))';
  if (p >= 50) return 'hsl(38 92% 50%)'; // amber/orange
  if (p > 0) return 'hsl(var(--primary))'; // blue
  return 'hsl(var(--muted-foreground))'; // gray
};

const RoadmapPage = () => {
  const [selectedQuarter, setSelectedQuarter] = usePersistedState('roadmap_filter', getCurrentQuarter());
  const months = getQuarterMonths(selectedQuarter);

  const { items, addItem, updateItem, deleteItem, getByQuarter, refresh } = useRoadmapStore();
  const { objectives } = useOKRStore();
  const { push, undoLast } = useUndoStack(5);

  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const filtered = getByQuarter(selectedQuarter);

  const handleQuarterChange = (val: string) => {
    setSelectedQuarter(val);
  };

  // Ctrl+Z is handled globally by UndoProvider

  const handleAdd = useCallback(async (data: Omit<RoadmapItem, 'id' | 'createdAt'>) => {
    await addItem(data);
    push({
      description: `Iniciativa criada: ${data.title}`,
      undo: async () => {
        const target = [...items].reverse().find(i => i.title === data.title && i.quarter === data.quarter);
        if (target) await deleteItem(target.id);
      },
    });
    toast.success('Iniciativa criada', {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  }, [addItem, items, deleteItem, push, undoLast]);

  const handleUpdate = useCallback(async (updated: RoadmapItem) => {
    const snapshot = items.find(i => i.id === updated.id);
    await updateItem(updated);
    if (snapshot) {
      push({
        description: `Iniciativa editada: ${snapshot.title}`,
        undo: async () => { await updateItem(snapshot); },
      });
      toast.success('Iniciativa atualizada', {
        duration: 8000,
        action: { label: '↩ Desfazer', onClick: () => undoLast() },
      });
    }
  }, [items, updateItem, push, undoLast]);

  const handleDelete = useCallback(async (id: string) => {
    const snapshot = items.find(i => i.id === id);
    if (!snapshot) return;
    await deleteItem(id);
    push({
      description: `Iniciativa excluída: ${snapshot.title}`,
      undo: async () => {
        const { id: _omit, createdAt: _c, ...rest } = snapshot;
        await addItem(rest);
      },
    });
    toast.success('Iniciativa excluída', {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  }, [items, deleteItem, addItem, push, undoLast]);


  // Sort by startMonth then endMonth
  const sorted = [...filtered].sort((a, b) => {
    const aS = parseDateOnly(a.startDate)?.getTime() ?? a.startMonth;
    const bS = parseDateOnly(b.startDate)?.getTime() ?? b.startMonth;
    if (aS !== bS) return aS - bS;
    const aE = parseDateOnly(a.endDate)?.getTime() ?? a.endMonth;
    const bE = parseDateOnly(b.endDate)?.getTime() ?? b.endMonth;
    return aE - bE;
  });

  // Group by theme (preserving sorted order). Items without a theme go to "Sem tema".
  const SEM_TEMA = 'Sem tema';
  const grouped = sorted.reduce<Record<string, RoadmapItem[]>>((acc, it) => {
    const key = (it.theme && it.theme.trim()) || SEM_TEMA;
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
  const themeOrder = Object.keys(grouped).sort((a, b) => {
    if (a === SEM_TEMA) return 1;
    if (b === SEM_TEMA) return -1;
    return a.localeCompare(b, 'pt-BR');
  });

  // Unique themes for autocomplete in dialogs
  const existingThemes = Array.from(
    new Set(items.map(i => (i.theme || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const { TourElement } = useFeatureTour('roadmap', roadmapTourSteps);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {TourElement}
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
            <p className="text-sm text-muted-foreground">Cronograma visual das iniciativas</p>
          </div>
          <CreateRoadmapDialog quarter={selectedQuarter} objectives={objectives} existingThemes={existingThemes} onAdd={handleAdd} />
        </div>

        {/* Quarter & Year Navigation */}
        <div data-tour-feature="roadmap-quarter">
          <QuarterSelector selectedQuarter={selectedQuarter} onQuarterChange={handleQuarterChange} />
        </div>

        {/* Gantt Chart */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Map className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Nenhuma iniciativa encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Crie sua primeira iniciativa para este trimestre</p>
          </div>
        ) : (
          <div data-tour-feature="roadmap-grid" className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            {/* Header Row */}
            <div className="flex border-b border-border bg-muted/10">
              <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/50 flex items-center">
                Temas
              </div>
              <div className="flex-1 grid grid-cols-3">
                {months.map((month, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center ${i < 2 ? 'border-r border-border/50' : ''}`}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* Theme groups */}
            {themeOrder.map((themeName) => (
              <div key={themeName} className="flex border-b border-border/50 last:border-b-0">
                {/* Theme Sidebar Cell */}
                <div className="w-48 shrink-0 p-4 border-r border-border/50 bg-muted/5 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
                    <h3 className="text-sm font-semibold tracking-tight truncate" title={themeName}>
                      {themeName}
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider pl-4">
                    {grouped[themeName].length} {grouped[themeName].length === 1 ? 'iniciativa' : 'iniciativas'}
                  </span>
                </div>
                
                {/* Timeline Grid Cell */}
                <div className="flex-1 flex flex-col">
                  {grouped[themeName].map((item, idx) => {
                    const progress = Math.max(0, Math.min(100, item.progress ?? 0));
                    const progressColor = getProgressColor(progress);
                    const pos = computeBarPosition(item, selectedQuarter);
                    const startD = parseDateOnly(item.startDate);
                    const endD = parseDateOnly(item.endDate);
                    return (
                      <div
                        key={item.id}
                        className={`group relative hover:bg-muted/30 transition-colors ${idx < grouped[themeName].length - 1 ? 'border-b border-border/30' : ''}`}
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
                            left: `${pos.left}%`,
                            width: `${pos.width}%`,
                          }}
                        >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              data-tour-feature="roadmap-card"
                              className="pointer-events-auto mx-1 my-2 h-8 w-full rounded-md flex items-center gap-1.5 px-3 cursor-pointer transition-all hover:brightness-110 hover:shadow-md relative overflow-hidden"
                              style={{
                                backgroundColor: item.color,
                                opacity: 0.85,
                              }}
                              onClick={() => setEditItem(item)}
                            >
                              {/* Progress fill overlay */}
                              <div
                                data-tour-feature="roadmap-progress"
                                className="absolute inset-y-0 left-0 transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: progressColor,
                                  opacity: 0.55,
                                }}
                              />
                              <Link2 className="relative h-3.5 w-3.5 text-white/90 shrink-0" />
                              <span className="relative text-xs font-medium text-white truncate drop-shadow-sm">
                                {item.title}
                              </span>
                              <span className="relative ml-auto text-xs font-mono font-semibold text-white drop-shadow-sm shrink-0">
                                {progress}%
                              </span>
                              <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                                  className="rounded p-0.5 hover:bg-white/20 transition-colors"
                                >
                                  <Pencil className="h-3 w-3 text-white/90" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  className="rounded p-0.5 hover:bg-white/20 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3 text-white/90" />
                                </button>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-semibold">{item.title}</p>
                            {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                            <p className="text-xs mt-1">
                              {startD && endD
                                ? `${startD.toLocaleDateString('pt-BR')} — ${endD.toLocaleDateString('pt-BR')}`
                                : `${months[item.startMonth]} — ${months[item.endMonth]}`} · {progress}%
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ))}
          </div>
        )}

        {editItem && (
          <EditRoadmapDialog
            item={editItem}
            objectives={objectives}
            existingThemes={existingThemes}
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            onSave={handleUpdate}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoadmapPage;
