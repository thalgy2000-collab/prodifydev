import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useUndoStack } from '@/hooks/useUndoStack';
import { useOKRStore } from '@/hooks/useOKRStore';
import { KeyResult, OKRCategory, Objective } from '@/types/okr';
import OKRCard from '@/components/OKRCard';
import CreateOKRDialog from '@/components/CreateOKRDialog';
import ImportOKRDialog from '@/components/ImportOKRDialog';
import GenerateOKRWithAIDialog from '@/components/GenerateOKRWithAIDialog';
import { getCurrentQuarter, OKR_CATEGORIES } from '@/types/okr';
import QuarterSelector from '@/components/QuarterSelector';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Search } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { okrTourSteps } from '@/lib/featureTours';

const OKRPage = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { push, undoLast } = useUndoStack(5);
  const [selectedQuarter, setSelectedQuarter] = usePersistedState('okr_quarter', getCurrentQuarter());
  const [searchText, setSearchText] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceCategory = useRef<string | null>(null);

  const { objectives, loading, addObjective, updateObjective, updateKeyResult, deleteObjective, reorderObjectives, getObjectivesByQuarter, getObjectiveProgress, refetch } = useOKRStore();

  // Ctrl+Z is handled globally by UndoProvider


  const handleAddObjective = useCallback(async (title: string, quarter: string, category: OKRCategory, keyResults: Omit<KeyResult, 'id'>[]) => {
    if (!user || !activeProduct) return;
    const { data: obj } = await (supabase.from('objectives') as any)
      .insert({ title, quarter, category, user_id: user.id, product_id: activeProduct.id })
      .select().single();
    if (obj && keyResults.length > 0) {
      await (supabase.from('key_results') as any).insert(keyResults.map(kr => ({
        title: kr.title, unit: kr.unit, objective_id: obj.id, user_id: user.id, product_id: activeProduct.id,
        current_value: kr.currentValue, target_value: kr.targetValue,
      })));
    }
    await refetch();
    if (obj) {
      push({
        description: `Objetivo criado: ${title}`,
        undo: async () => {
          await (supabase.from('key_results') as any).delete().eq('objective_id', obj.id);
          await (supabase.from('objectives') as any).delete().eq('id', obj.id);
          await refetch();
        },
      });
      toast.success('Objetivo criado', {
        duration: 8000,
        action: { label: '↩ Desfazer', onClick: () => undoLast() },
      });
    }
  }, [user, activeProduct, refetch, push, undoLast]);

  const handleDeleteObjective = useCallback(async (id: string) => {
    const snapshot = objectives.find(o => o.id === id);
    if (!snapshot) return;
    await deleteObjective(id);
    push({
      description: `Objetivo excluído: ${snapshot.title}`,
      undo: async () => {
        if (!user || !activeProduct) return;
        await (supabase.from('objectives') as any).insert({
          id: snapshot.id, title: snapshot.title, quarter: snapshot.quarter,
          category: snapshot.category, user_id: user.id, product_id: activeProduct.id,
          sort_order: snapshot.sortOrder ?? 0,
        });
        if (snapshot.keyResults.length > 0) {
          await (supabase.from('key_results') as any).insert(snapshot.keyResults.map(kr => ({
            id: kr.id, title: kr.title, unit: kr.unit, objective_id: snapshot.id,
            user_id: user.id, product_id: activeProduct.id,
            current_value: kr.currentValue, target_value: kr.targetValue,
          })));
        }
        await refetch();
      },
    });
    toast.success('Objetivo excluído', {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  }, [objectives, deleteObjective, user, activeProduct, refetch, push, undoLast]);

  const handleUpdateObjective = useCallback(async (id: string, updates: { title?: string; category?: OKRCategory; keyResults?: Omit<KeyResult, 'id'>[] }) => {
    const snapshot = objectives.find(o => o.id === id);
    await updateObjective(id, updates);
    if (snapshot) {
      push({
        description: `Objetivo editado: ${snapshot.title}`,
        undo: async () => {
          await updateObjective(id, {
            title: snapshot.title,
            category: snapshot.category,
            keyResults: snapshot.keyResults.map(({ id: _i, ...rest }) => rest),
          });
        },
      });
      toast.success('Objetivo atualizado', {
        duration: 8000,
        action: { label: '↩ Desfazer', onClick: () => undoLast() },
      });
    }
  }, [objectives, updateObjective, push, undoLast]);

  const handleUpdateKR = useCallback(async (objectiveId: string, krId: string, value: number) => {
    const obj = objectives.find(o => o.id === objectiveId);
    const prev = obj?.keyResults.find(k => k.id === krId)?.currentValue;
    await updateKeyResult(objectiveId, krId, value);
    if (prev !== undefined && prev !== value) {
      push({
        description: `KR atualizado`,
        undo: async () => { await updateKeyResult(objectiveId, krId, prev); },
      });
    }
  }, [objectives, updateKeyResult, push]);

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

  const { TourElement } = useFeatureTour('okrs', okrTourSteps);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando OKRs...</div>;
  }

  return (
    <div className="space-y-6">
      {TourElement}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OKRs</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus objetivos e resultados-chave</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span data-tour-feature="okr-generate-ai"><GenerateOKRWithAIDialog onImported={refetch} quarter={selectedQuarter} /></span>
          <span data-tour-feature="okr-import"><ImportOKRDialog onImported={refetch} quarter={selectedQuarter} /></span>
          <span data-tour-feature="okr-create"><CreateOKRDialog quarter={selectedQuarter} onAdd={handleAddObjective} /></span>
        </div>
      </div>

      <div data-tour-feature="okr-quarter">
        <QuarterSelector selectedQuarter={selectedQuarter} onQuarterChange={setSelectedQuarter} />
      </div>

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
        <div data-tour-feature="okr-overall" className="rounded-xl border border-border bg-card p-5">
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

            const dragEnabled = searchText.trim() === '' && progressFilter === 'all';

            const handleDrop = (categoryValue: string, targetId: string, items: typeof filteredAndSearched) => {
              if (!draggingId || draggingId === targetId) return;
              if (dragSourceCategory.current !== categoryValue) return;
              const ids = items.map(i => i.id);
              const fromIdx = ids.indexOf(draggingId);
              const toIdx = ids.indexOf(targetId);
              if (fromIdx < 0 || toIdx < 0) return;
              const next = [...ids];
              next.splice(fromIdx, 1);
              next.splice(toIdx, 0, draggingId);
              reorderObjectives(next);
            };

            return grouped.map(({ category, items }) => (
              <div key={category.value} className="space-y-4">
                {items.map(obj => (
                  <OKRCard
                    key={obj.id}
                    objective={obj}
                    progress={getObjectiveProgress(obj)}
                    onUpdateKR={handleUpdateKR}
                    onDelete={handleDeleteObjective}
                    onEdit={handleUpdateObjective}
                    dragHandlers={dragEnabled ? {
                      draggable: true,
                      isDragging: draggingId === obj.id,
                      isDragOver: dragOverId === obj.id && draggingId !== obj.id,
                      onDragStart: (e) => {
                        setDraggingId(obj.id);
                        dragSourceCategory.current = category.value;
                        e.dataTransfer.effectAllowed = 'move';
                      },
                      onDragOver: (e) => {
                        if (dragSourceCategory.current === category.value && draggingId && draggingId !== obj.id) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverId(obj.id);
                        }
                      },
                      onDrop: (e) => {
                        e.preventDefault();
                        handleDrop(category.value, obj.id, items);
                        setDragOverId(null);
                      },
                      onDragEnd: () => {
                        setDraggingId(null);
                        setDragOverId(null);
                        dragSourceCategory.current = null;
                      },
                    } : undefined}
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
