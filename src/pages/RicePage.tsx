import { useState, useEffect, useCallback } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { RiceSuggestionsHistoryModal } from '@/components/RiceSuggestionsHistoryModal';
import { History } from 'lucide-react';
import { useRiceStore } from '@/hooks/useRiceStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUndo } from '@/contexts/UndoContext';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { calcRiceScore, IMPACT_OPTIONS, CONFIDENCE_OPTIONS, mapAiImpact, mapAiConfidence } from '@/types/rice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, ChevronUp, ChevronDown, ChevronsUpDown, Wand2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { riceTourSteps } from '@/lib/featureTours';

interface AiSuggestion {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  justificativas: {
    reach: string;
    impact: string;
    confidence: string;
    effort: string;
  };
}

const RicePage = () => {
  const { scores, setScore, getScore, deleteScore, refresh: refreshRice } = useRiceStore();
  const { tasks, updateTask, reorderTasks } = useBacklogStore();
  const { items: initiatives } = useRoadmapStore();
  const { objectives } = useOKRStore();
  const { activeProduct } = useProduct();
  const { toast } = useToast();
  const { user } = useAuth();
  const { push, undoLast } = useUndo();
  const [pendingScores, setPendingScores] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = usePersistedState<{ field: string; direction: 'asc' | 'desc' } | null>('rice_sort', null);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AiSuggestion>>({});
  const [suggestionIds, setSuggestionIds] = useState<Record<string, string>>({});
  const [historyCounts, setHistoryCounts] = useState<Record<string, number>>({});
  const [historyOpenFor, setHistoryOpenFor] = useState<{ id: string; title: string; type: 'task' | 'initiative' } | null>(null);
  const [openSuggestion, setOpenSuggestion] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = usePersistedState<'all' | 'task' | 'initiative'>('rice_type_filter', 'all');

  const refreshHistoryCounts = useCallback(async () => {
    if (!activeProduct) return;
    const { data } = await (supabase.from('rice_ai_suggestions') as any)
      .select('task_id')
      .eq('product_id', activeProduct.id);
    if (data) {
      const counts: Record<string, number> = {};
      (data as { task_id: string }[]).forEach(r => { counts[r.task_id] = (counts[r.task_id] || 0) + 1; });
      setHistoryCounts(counts);
    }
  }, [activeProduct]);

  useEffect(() => { refreshHistoryCounts(); }, [refreshHistoryCounts]);

  const handleSort = (field: string) => {
    const newConfig = sortConfig?.field === field
      ? { field, direction: (sortConfig.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' }
      : { field, direction: 'desc' as const };
    setSortConfig(newConfig);
  };

  const allItems = [
    ...tasks.filter(t => t.status !== 'done').map(t => ({ id: t.id, title: t.title, description: t.description, type: 'task' as const })),
    ...initiatives.map(i => ({ id: i.id, title: i.title, description: i.description, type: 'initiative' as const })),
  ];

  const handleSuggestAi = async (itemId: string, title: string, description?: string) => {
    if (!activeProduct) return;
    setLoadingAi(itemId);
    try {
      const keyResults = objectives.flatMap(o => o.keyResults.map(k => ({
        title: k.title,
        current_value: k.currentValue,
        target_value: k.targetValue,
        unit: k.unit,
      })));
      const history = scores.slice(0, 10).map(s => {
        const t = tasks.find(t => t.id === s.itemId) || initiatives.find(i => i.id === s.itemId);
        return {
          title: t?.title || s.itemId,
          reach: s.reach,
          impact: s.impact,
          confidence: s.confidence,
          effort: s.effort,
          score: Number(calcRiceScore(s.reach, s.impact, s.confidence, s.effort).toFixed(2)),
        };
      });

      const { data, error } = await supabase.functions.invoke('suggest-rice-scores', {
        body: { title, description, keyResults, history },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiSuggestions(prev => ({ ...prev, [itemId]: data as AiSuggestion }));

      // Persist suggestion in history before showing it
      if (user) {
        const aiData = data as AiSuggestion;
        const mappedImpact = mapAiImpact(Number(aiData.impact));
        const mappedConfidence = mapAiConfidence(Number(aiData.confidence));
        const computedScore = Number(
          calcRiceScore(Number(aiData.reach) || 0, mappedImpact, mappedConfidence, Number(aiData.effort) || 1).toFixed(2)
        );
        const { data: inserted } = await (supabase.from('rice_ai_suggestions') as any)
          .insert({
            task_id: itemId,
            product_id: activeProduct.id,
            user_id: user.id,
            context_description: description ?? null,
            suggested_reach: Number(aiData.reach) || 0,
            suggested_impact: Number(aiData.impact) || 0,
            suggested_confidence: Number(aiData.confidence) || 0,
            suggested_effort: Number(aiData.effort) || 0,
            suggested_score: computedScore,
            reason_reach: aiData.justificativas?.reach ?? null,
            reason_impact: aiData.justificativas?.impact ?? null,
            reason_confidence: aiData.justificativas?.confidence ?? null,
            reason_effort: aiData.justificativas?.effort ?? null,
            applied: false,
          })
          .select('id')
          .single();
        if (inserted?.id) {
          setSuggestionIds(prev => ({ ...prev, [itemId]: inserted.id }));
          setHistoryCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
        }
      }

      setOpenSuggestion(itemId);
    } catch (e) {
      sonnerToast.error('Erro ao gerar sugestão da IA', {
        description: e instanceof Error ? e.message : 'Tente novamente',
      });
    } finally {
      setLoadingAi(null);
    }
  };

  const handleApplySuggestion = async (itemId: string) => {
    const sug = aiSuggestions[itemId];
    if (!sug) return;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    const mappedImpact = mapAiImpact(Number(sug.impact));
    const mappedConfidence = mapAiConfidence(Number(sug.confidence));
    await setScore(itemId, item.type, {
      reach: Number(sug.reach) || 0,
      impact: mappedImpact,
      confidence: mappedConfidence,
      effort: Number(sug.effort) || 1,
      aiSuggested: true,
    });
    setPendingScores(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
    const sId = suggestionIds[itemId];
    if (sId) {
      await (supabase.from('rice_ai_suggestions') as any)
        .update({ applied: true, applied_at: new Date().toISOString() })
        .eq('id', sId);
    }
    setOpenSuggestion(null);
    sonnerToast.success('Sugestão da IA aplicada ✨');
  };



  const ranked = allItems.map(item => {
    const score = getScore(item.id);
    const r = score?.reach ?? 5;
    const i = score?.impact ?? 1;
    const c = score?.confidence ?? 0.8;
    const e = score?.effort ?? 1;
    return { ...item, r, i, c, e, total: calcRiceScore(r, i, c, e) };
  });

  const filteredRanked = typeFilter === 'all' ? ranked : ranked.filter(r => r.type === typeFilter);

  const sortedItems = sortConfig
    ? [...filteredRanked].sort((a, b) => {
        const valA = a[sortConfig.field as keyof typeof a];
        const valB = b[sortConfig.field as keyof typeof b];
        return sortConfig.direction === 'asc'
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      })
    : filteredRanked;



  const getValue = (id: string, field: string, fallback: any) => {
    return pendingScores[id]?.[field] ?? fallback;
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setPendingScores(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSaveAndReprioritize = () => {
    Object.entries(pendingScores).forEach(([id, fieldsObj]) => {
      const item = allItems.find(i => i.id === id);
      if (item) {
        const normalized: Record<string, any> = {};
        Object.entries(fieldsObj as Record<string, any>).forEach(([k, v]) => {
          normalized[k] = v === '' || v === null || v === undefined ? 0 : v;
        });
        setScore(id, item.type, normalized);
      }
    });
    setPendingScores({});
    
    // Reorder by score
    const reprioritized = allItems.map(item => {
      const score = getScore(item.id);
      const r = score?.reach ?? 5;
      const i = score?.impact ?? 1;
      const c = score?.confidence ?? 0.8;
      const e = score?.effort ?? 1;
      return { ...item, r, i, c, e, total: calcRiceScore(r, i, c, e) };
    }).sort((a, b) => b.total - a.total);
    
    toast({
      title: "Sucesso!",
      description: "Itens repriorizado com sucesso!",
      variant: "default"
    });
  };

  const handleReprioritizeBacklog = async () => {
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const scored = activeTasks
      .map(t => {
        const s = scores.find(sc => sc.itemId === t.id);
        if (!s) return null;
        return { id: t.id, total: calcRiceScore(s.reach, s.impact, s.confidence, s.effort) };
      })
      .filter((x): x is { id: string; total: number } => x !== null)
      .sort((a, b) => b.total - a.total);

    if (scored.length === 0) {
      sonnerToast('Nenhuma tarefa com RICE score para repriorizar');
      return;
    }

    const n = scored.length;
    const updates = scored.map((item, idx) => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (idx < 5) priority = 'high';
      else if (idx >= n - 5 && idx >= 5) priority = 'low';
      return { id: item.id, priority };
    });

    await Promise.all(updates.map(u => updateTask(u.id, { priority: u.priority })));

    // Reorder backlog: scored tasks (by RICE desc) first, then unscored tasks at the end
    const scoredIds = scored.map(s => s.id);
    const unscoredIds = activeTasks.filter(t => !scoredIds.includes(t.id)).map(t => t.id);
    const doneIds = tasks.filter(t => t.status === 'done').map(t => t.id);
    const finalOrder = [...scoredIds, ...unscoredIds, ...doneIds];
    await reorderTasks(finalOrder);

    sonnerToast.success('Backlog reordenado pelo score RICE ✓');
  };

  const { TourElement } = useFeatureTour('rice', riceTourSteps);

  return (
    <div className="space-y-6">
      {TourElement}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RICE Score</h1>
          <p className="text-sm text-muted-foreground">Priorize tarefas e iniciativas com o framework RICE</p>
        </div>
        <div className="flex items-center gap-2">
          <Button data-tour-feature="rice-apply" onClick={handleReprioritizeBacklog} variant="outline" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Repriorizar Backlog
          </Button>
          {Object.keys(pendingScores).length > 0 && (
            <Button onClick={handleSaveAndReprioritize} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar e Repriorizar
              <Badge variant="secondary" className="ml-1">{Object.keys(pendingScores).length}</Badge>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={typeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('all')}
        >
          Todos
          <Badge variant="secondary" className="ml-2">{ranked.length}</Badge>
        </Button>
        <Button
          size="sm"
          variant={typeFilter === 'task' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('task')}
        >
          Tarefas
          <Badge variant="secondary" className="ml-2">{ranked.filter(r => r.type === 'task').length}</Badge>
        </Button>
        <Button
          size="sm"
          variant={typeFilter === 'initiative' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('initiative')}
        >
          Iniciativas
          <Badge variant="secondary" className="ml-2">{ranked.filter(r => r.type === 'initiative').length}</Badge>
        </Button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Calculator className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhum item para priorizar</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie tarefas no backlog ou iniciativas no roadmap</p>
        </div>
      ) : (
        <div data-tour-feature="rice-table" className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th data-tour-feature="rice-inputs" className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('r')}>
                  <span className="flex items-center justify-center gap-1">
                    Alcance
                    {sortConfig?.field === 'r' ? (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('i')}>
                  <span className="flex items-center justify-center gap-1">
                    Impacto
                    {sortConfig?.field === 'i' ? (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('c')}>
                  <span className="flex items-center justify-center gap-1">
                    Confiança
                    {sortConfig?.field === 'c' ? (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('e')}>
                  <span className="flex items-center justify-center gap-1">
                    Esforço
                    {sortConfig?.field === 'e' ? (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </span>
                </th>
                <th data-tour-feature="rice-score" className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('total')}>
                  <span className="flex items-center justify-center gap-1">
                    Score
                    {sortConfig?.field === 'total' ? (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(item => {
                const savedScore = getScore(item.id);
                const isAi = !!savedScore?.aiSuggested;
                const sug = aiSuggestions[item.id];
                return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{item.title}</span>
                      <Popover
                        open={openSuggestion === item.id}
                        onOpenChange={(o) => setOpenSuggestion(o ? item.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            disabled={loadingAi === item.id}
                            onClick={(e) => {
                              e.preventDefault();
                              if (sug) {
                                setOpenSuggestion(item.id);
                              } else {
                                handleSuggestAi(item.id, item.title, item.description);
                              }
                            }}
                          >
                            {loadingAi === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Sugerir
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 p-4" align="start">
                          {sug ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">Sugestão da IA</p>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="rounded-md border border-border bg-muted/30 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Alcance</span>
                                    <span className="font-mono font-bold">{sug.reach}</span>
                                  </div>
                                  <p className="mt-1 text-muted-foreground">{sug.justificativas?.reach}</p>
                                </div>
                                <div className="rounded-md border border-border bg-muted/30 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Impacto</span>
                                    <span className="font-mono font-bold">{sug.impact} → {mapAiImpact(Number(sug.impact))}x</span>
                                  </div>
                                  <p className="mt-1 text-muted-foreground">{sug.justificativas?.impact}</p>
                                </div>
                                <div className="rounded-md border border-border bg-muted/30 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Confiança</span>
                                    <span className="font-mono font-bold">{sug.confidence}% → {Math.round(mapAiConfidence(Number(sug.confidence)) * 100)}%</span>
                                  </div>
                                  <p className="mt-1 text-muted-foreground">{sug.justificativas?.confidence}</p>
                                </div>
                                <div className="rounded-md border border-border bg-muted/30 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Esforço</span>
                                    <span className="font-mono font-bold">{sug.effort}</span>
                                  </div>
                                  <p className="mt-1 text-muted-foreground">{sug.justificativas?.effort}</p>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button variant="outline" size="sm" onClick={() => setOpenSuggestion(null)}>Fechar</Button>
                                <Button size="sm" className="gap-1" onClick={() => handleApplySuggestion(item.id)}>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Aplicar sugestão
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Gerando sugestão...
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      {(historyCounts[item.id] || 0) > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Ver histórico de sugestões IA"
                          onClick={() => setHistoryOpenFor({ id: item.id, title: item.title, type: item.type })}
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.type === 'task' ? 'Tarefa' : 'Iniciativa'}</td>
                  <td className="px-4 py-3 text-center">
                    <Input type="number" min={1} placeholder="Ex: 5" className="h-8 w-16 text-center mx-auto"
                      value={getValue(item.id, 'reach', item.r) ?? ''}
                      onChange={e => handleFieldChange(item.id, 'reach', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Select value={String(getValue(item.id, 'impact', item.i))} onValueChange={v => handleFieldChange(item.id, 'impact', Number(v))}>
                      <SelectTrigger className="h-8 w-24 mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{IMPACT_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Select value={String(getValue(item.id, 'confidence', item.c))} onValueChange={v => handleFieldChange(item.id, 'confidence', Number(v))}>
                      <SelectTrigger className="h-8 w-20 mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONFIDENCE_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input type="number" min={0.5} step={0.5} placeholder="Ex: 1" className="h-8 w-16 text-center mx-auto"
                      value={getValue(item.id, 'effort', item.e) ?? ''}
                      onChange={e => handleFieldChange(item.id, 'effort', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{item.total.toFixed(1)}</span>
                      {isAi && (
                        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                          <Sparkles className="h-2.5 w-2.5" />
                          IA
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button data-tour-feature="rice-delete" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="end">
                        <p className="text-sm font-medium mb-3">Remover do RICE?</p>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => document.body.click()}>Cancelar</Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              const snap = getScore(item.id);
                              await deleteScore(item.id);
                              if (snap && user && activeProduct) {
                                push({
                                  description: `Item removido do RICE: ${item.title ?? ''}`.trim(),
                                  undo: async () => {
                                    await (supabase.from('rice_scores') as any).insert({
                                      user_id: user.id, product_id: activeProduct.id,
                                      item_id: snap.itemId, item_type: snap.itemType,
                                      reach: snap.reach, impact: snap.impact,
                                      confidence: snap.confidence, effort: snap.effort,
                                      ai_suggested: snap.aiSuggested ?? false,
                                    });
                                    await refreshRice();
                                  },
                                });
                              }
                              sonnerToast.success('Item removido do RICE ✓', {
                                duration: 8000,
                                action: { label: '↩ Desfazer', onClick: () => undoLast() },
                              });
                              document.body.click();
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RicePage;
