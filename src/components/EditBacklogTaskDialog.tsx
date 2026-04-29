import { useState, useEffect, useCallback } from 'react';
import { BacklogTask, TaskPriority, PRIORITY_CONFIG } from '@/types/backlog';
import { SPRINT_STATUS_CONFIG } from '@/types/sprint';
import { RoadmapItem } from '@/types/roadmap';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Sparkles, Loader2, Check, X, Target } from 'lucide-react';
import AcceptanceCriteriaSection from '@/components/AcceptanceCriteriaSection';
import { useOKRStore } from '@/hooks/useOKRStore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MemberOption {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SprintOption {
  id: string;
  name: string;
  status: string;
}

interface EditBacklogTaskDialogProps {
  task: BacklogTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<BacklogTask>) => void;
  initiatives: RoadmapItem[];
}

const EditBacklogTaskDialog = ({ task, open, onOpenChange, onSave, initiatives }: EditBacklogTaskDialogProps) => {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const { addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const { refresh: refreshRoadmap } = useRoadmapStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [initiativeId, setInitiativeId] = useState<string>('none');
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [dueEndTime, setDueEndTime] = useState<string>('');
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [roadmapImpact, setRoadmapImpact] = useState<number>(0);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [sprintOptions, setSprintOptions] = useState<SprintOption[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('none');

  // OKR linkage (managed locally; persisted only on Save)
  const { objectives } = useOKRStore();
  const [objectiveId, setObjectiveId] = useState<string | undefined>(undefined);
  const [keyResultId, setKeyResultId] = useState<string | undefined>(undefined);

  // AI suggestion review state (OKR link)
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<null | {
    objective_id: string | null;
    key_result_id: string | null;
    confidence: number;
    rationale: string;
  }>(null);

  // AI suggestion review state (Roadmap impact)
  const [suggestingImpact, setSuggestingImpact] = useState(false);
  const [impactSuggestion, setImpactSuggestion] = useState<null | {
    impact: number;
    rationale: string;
    confidence: number;
  }>(null);

  const { criteria, fetchByTask, addCriterion, updateCriterion, deleteCriterion, getCriteriaForTask } = useAcceptanceCriteriaStore();

  const fetchMembers = useCallback(async () => {
    if (!activeProduct) return;
    const { data: membersData } = await (supabase.from('product_members') as any)
      .select('user_id, role')
      .eq('product_id', activeProduct.id);
    if (!membersData || membersData.length === 0) { setMemberOptions([]); return; }
    const userIds = membersData.map((m: any) => m.user_id);
    const { data: profilesData } = await (supabase.from('profiles') as any)
      .select('id, display_name, full_name, email, avatar_url')
      .in('id', userIds);
    const profilesMap: Record<string, any> = {};
    (profilesData || []).forEach((p: any) => { profilesMap[p.id] = p; });
    setMemberOptions(membersData.map((m: any) => {
      const p = profilesMap[m.user_id];
      return {
        userId: m.user_id,
        displayName: p?.display_name || p?.full_name || p?.email || 'Sem nome',
        avatarUrl: p?.avatar_url || null,
      };
    }));
  }, [activeProduct]);

  const fetchSprints = useCallback(async () => {
    if (!activeProduct) { setSprintOptions([]); return; }
    const { data } = await (supabase.from('sprints') as any)
      .select('id, name, status, start_date, end_date')
      .eq('product_id', activeProduct.id)
      .order('start_date', { ascending: false });
    const order = { active: 0, planning: 1 } as const;
    const filtered = (data || []).filter((s: any) => s.status !== 'completed');
    const sorted = filtered.sort((a: any, b: any) =>
      (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
    );
    setSprintOptions(sorted);
  }, [activeProduct]);

  const loadRoadmapItemTask = useCallback(async (taskId: string) => {
    const { data } = await (supabase as any).from('roadmap_item_tasks')
      .select('roadmap_item_id')
      .eq('task_id', taskId)
      .single();
    if (data) {
      setInitiativeId(data.roadmap_item_id);
    }
  }, []);

  const upsertRoadmapItemTask = useCallback(async (roadmapItemId: string, taskId: string) => {
    if (!roadmapItemId || roadmapItemId === 'none' || !taskId) return;
    await (supabase as any).from('roadmap_item_tasks').upsert({
      roadmap_item_id: roadmapItemId,
      task_id: taskId,
    });
  }, []);

  const deleteRoadmapItemTask = useCallback(async (roadmapItemId: string, taskId: string) => {
    if (!roadmapItemId || !taskId) return;
    await (supabase as any).from('roadmap_item_tasks')
      .delete()
      .eq('roadmap_item_id', roadmapItemId)
      .eq('task_id', taskId);
  }, []);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchSprints();
    }
  }, [open, fetchMembers, fetchSprints]);

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDescription(task.description || '');
      setPriority(task.priority);
      setInitiativeId(task.initiativeId || 'none'); setStoryPoints(task.storyPoints || 1);
      setAssigneeId(task.assigneeId || 'none');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setDueEndTime(task.dueEndTime || '');
      setCompletionPercentage(task.completionPercentage ?? 0);
      setRoadmapImpact(task.roadmapImpact ?? 0);
      setSelectedSprintId('none');
      setObjectiveId(task.objectiveId);
      setKeyResultId(task.keyResultId);
      setSuggestion(null);
      setImpactSuggestion(null);
      fetchByTask(task.id);
      loadRoadmapItemTask(task.id);
    }
  }, [task, fetchByTask, loadRoadmapItemTask]);

  const handleSuggestOKR = async () => {
    if (!title.trim()) { toast.error('Adicione um título à tarefa antes de sugerir.'); return; }
    if (!objectives || objectives.length === 0) { toast.error('Cadastre OKRs neste produto antes de usar a sugestão.'); return; }
    setSuggesting(true);
    try {
      const payload = {
        title,
        description: description || '',
        objectives: objectives.map(o => ({
          id: o.id, title: o.title, quarter: o.quarter,
          keyResults: o.keyResults.map(k => ({ id: k.id, title: k.title, unit: k.unit })),
        })),
      };
      const { data, error } = await supabase.functions.invoke('suggest-task-okr-link', { body: payload });
      if (error) throw error;
      if (!data || (!data.objective_id && !data.key_result_id)) {
        toast.info('A IA não encontrou um OKR claramente relevante para esta tarefa.');
        return;
      }
      setSuggestion(data);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao sugerir OKR');
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setObjectiveId(suggestion.objective_id || undefined);
    setKeyResultId(suggestion.key_result_id || undefined);
    toast.success('Sugestão aplicada — clique em Salvar para confirmar.');
    setSuggestion(null);
  };

  const handleSuggestImpact = async () => {
    if (!title.trim()) { toast.error('Adicione um título à tarefa antes de sugerir.'); return; }
    if (initiativeId === 'none') { toast.error('Vincule esta tarefa a uma iniciativa do roadmap antes de estimar o impacto.'); return; }
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) { toast.error('Iniciativa não encontrada.'); return; }
    setSuggestingImpact(true);
    try {
      // Fetch sibling tasks for calibration
      const { data: siblingsRows } = await (supabase as any).from('roadmap_item_tasks')
        .select('task_id')
        .eq('roadmap_item_id', initiativeId);
      const siblingIds = (siblingsRows || []).map((r: any) => r.task_id).filter((id: string) => id !== task?.id);
      let siblings: any[] = [];
      if (siblingIds.length > 0) {
        const { data: tasksData } = await (supabase.from('backlog_tasks') as any)
          .select('title, story_points, roadmap_impact')
          .in('id', siblingIds);
        siblings = tasksData || [];
      }
      const payload = {
        task: { title, description: description || '', story_points: storyPoints },
        initiative: { title: initiative.title, description: initiative.description || '' },
        siblings,
      };
      const { data, error } = await supabase.functions.invoke('suggest-task-impact', { body: payload });
      if (error) throw error;
      if (!data || typeof data.impact !== 'number') {
        toast.info('A IA não retornou uma estimativa válida.');
        return;
      }
      setImpactSuggestion(data);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao estimar impacto');
    } finally {
      setSuggestingImpact(false);
    }
  };

  const applyImpactSuggestion = () => {
    if (!impactSuggestion) return;
    setRoadmapImpact(Math.max(0, Math.min(100, impactSuggestion.impact)));
    toast.success('Impacto aplicado — clique em Salvar para confirmar.');
    setImpactSuggestion(null);
  };

  const suggestedObjective = suggestion?.objective_id ? objectives.find(o => o.id === suggestion.objective_id) : null;
  const suggestedKR = suggestedObjective?.keyResults.find(k => k.id === suggestion?.key_result_id);
  const currentObjective = objectiveId ? objectives.find(o => o.id === objectiveId) : null;
  const currentKR = currentObjective?.keyResults.find(k => k.id === keyResultId);

  const taskCriteria = task ? getCriteriaForTask(task.id) : [];

  const handleAddToSprint = async () => {
    if (!task || selectedSprintId === 'none') return;
    await (supabase.from('backlog_tasks') as any)
      .update({ sprint_id: selectedSprintId })
      .eq('id', task.id);
    toast.success('Tarefa adicionada à sprint!');
    const target = sprintOptions.find(s => s.id === selectedSprintId);
    if (target && target.status !== 'active') {
      toast('Esta sprint ainda não está ativa');
    }
    onOpenChange(false);
  };

  const handleRemoveFromSprint = async () => {
    if (!task) return;
    await (supabase.from('backlog_tasks') as any)
      .update({ sprint_id: null })
      .eq('id', task.id);
    toast.success('Tarefa removida da sprint!');
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    const initiative = initiatives.find(i => i.id === initiativeId);
    const patch: Partial<BacklogTask> = {
      title, description, priority,
      initiativeId: initiativeId !== 'none' ? initiativeId : undefined,
      objectiveId: objectiveId ?? initiative?.objectiveId,
      keyResultId: keyResultId ?? initiative?.keyResultId,
      storyPoints,
      assigneeId: assigneeId !== 'none' ? assigneeId : undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      dueEndTime: dueEndTime || undefined,
      completionPercentage: Math.max(0, Math.min(100, completionPercentage || 0)),
      roadmapImpact: Math.max(0, Math.min(100, roadmapImpact || 0)),
    };

    // Handle schedule activity
    if (dueDate) {
      if (task.scheduleActivityId) {
        await updateActivity(task.scheduleActivityId, {
          title: `[${title}]`,
          description: description || '',
          activityDate: dueDate,
          startTime: dueTime || undefined,
          endTime: dueEndTime || undefined,
        });
      } else {
        const newActivity = await addActivity({
          title: `[${title}]`,
          description: description || '',
          activityDate: dueDate,
          startTime: dueTime || undefined,
          endTime: dueEndTime || undefined,
          status: 'pending',
        });
        patch.scheduleActivityId = newActivity.id;
      }
    } else if (task.scheduleActivityId) {
      await deleteActivity(task.scheduleActivityId);
      patch.scheduleActivityId = undefined;
    }

    // Handle roadmap_item_tasks relationship
    if (initiativeId !== 'none' && task.id) {
      await upsertRoadmapItemTask(initiativeId, task.id);
    } else if (task.initiativeId && task.id) {
      await deleteRoadmapItemTask(task.initiativeId, task.id);
    }

    onSave(task.id, patch);
    // Refresh roadmap so progress trigger reflects in UI
    setTimeout(() => { refreshRoadmap(); }, 300);
    onOpenChange(false);
  };

  const currentSprintName = task?.sprintId
    ? sprintOptions.find(s => s.id === task.sprintId)?.name
    : null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] h-[95vh] sm:h-auto flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/50"><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4 px-6 overflow-y-auto flex-1 min-h-0 pb-4">
          <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Prioridade</Label><Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Iniciativa (Roadmap)</Label><Select value={initiativeId} onValueChange={setInitiativeId}><SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{initiatives.map(i => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-24 space-y-2"><Label>Pontos</Label><Input type="number" min={1} max={21} placeholder="Ex: 3" value={storyPoints === 0 ? '' : storyPoints} onChange={e => setStoryPoints(e.target.value === '' ? 0 : Number(e.target.value))} /></div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {memberOptions.map(m => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{m.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {m.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* OKR Linkage with AI suggestion */}
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Vínculo com OKR
              </Label>
              <div className="flex items-center gap-1">
                {(objectiveId || keyResultId) && (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setObjectiveId(undefined); setKeyResultId(undefined); }}>
                    Remover
                  </Button>
                )}
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleSuggestOKR}
                  disabled={suggesting}
                  title="Sugerir Objetivo e KR mais relevantes via IA"
                >
                  {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {suggesting ? 'Analisando...' : 'Sugerir com IA'}
                </Button>
              </div>
            </div>
            {currentObjective ? (
              <div className="space-y-1 text-xs">
                <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{currentObjective.title}</span></div>
                {currentKR && <div><span className="text-muted-foreground">KR:</span> <span className="font-medium">{currentKR.title}</span></div>}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum OKR vinculado. Use "Sugerir com IA" para vincular automaticamente.</p>
            )}
          </div>

          {/* Sprint Section */}
          <div className="space-y-2">
            <Label>Sprint</Label>
            {task?.sprintId ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentSprintName || 'Sprint vinculada'}</Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRemoveFromSprint}>Remover da Sprint</Button>
              </div>
            ) : sprintOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sprint cadastrada para este produto</p>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione uma sprint" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {sprintOptions.map(s => {
                      const sCfg = SPRINT_STATUS_CONFIG[s.status as keyof typeof SPRINT_STATUS_CONFIG];
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span>{s.name}</span>
                            {sCfg && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 h-4"
                                style={{ backgroundColor: `hsl(${sCfg.color} / 0.15)`, color: `hsl(${sCfg.color})` }}
                              >
                                {sCfg.label}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="shrink-0 h-9" disabled={selectedSprintId === 'none'} onClick={handleAddToSprint}>Adicionar à Sprint</Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de entrega</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          {dueDate && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-2"><Label>Hora início</Label><Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} /></div>
              <div className="flex-1 space-y-2"><Label>Hora fim</Label><Input type="time" value={dueEndTime} onChange={e => setDueEndTime(e.target.value)} /></div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label>% Conclusão</Label>
              <div className="relative">
                <Input
                  type="number" min={0} max={100} placeholder="Ex: 50"
                  value={completionPercentage === 0 ? '' : completionPercentage}
                  onChange={e => setCompletionPercentage(e.target.value === '' ? 0 : Math.max(0, Math.min(100, Number(e.target.value))))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Impacto na Iniciativa</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>% que essa tarefa representa no progresso da iniciativa vinculada no Roadmap</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="h-6 gap-1 text-xs px-1.5"
                  onClick={handleSuggestImpact}
                  disabled={suggestingImpact || initiativeId === 'none'}
                  title={initiativeId === 'none' ? 'Vincule a uma iniciativa primeiro' : 'Estimar impacto via IA'}
                >
                  {suggestingImpact ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  IA
                </Button>
              </div>
              <div className="relative">
                <Input
                  type="number" min={0} max={100} placeholder="Ex: 33"
                  value={roadmapImpact === 0 ? '' : roadmapImpact}
                  onChange={e => setRoadmapImpact(e.target.value === '' ? 0 : Math.max(0, Math.min(100, Number(e.target.value))))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Acceptance Criteria Section */}
          {task && (
            <AcceptanceCriteriaSection
              taskId={task.id}
              criteria={taskCriteria}
              addCriterion={addCriterion}
              updateCriterion={updateCriterion}
              deleteCriterion={deleteCriterion}
              taskTitle={title}
              taskDescription={description}
            />
          )}

        </div>
        <div className="shrink-0 border-t border-border/50 px-6 py-4 flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!suggestion} onOpenChange={(o) => { if (!o) setSuggestion(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Sugestão de vínculo com OKR
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-sm">
              {suggestedObjective ? (
                <div className="rounded-md border border-border p-3 space-y-1">
                  <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium text-foreground">{suggestedObjective.title}</span></div>
                  {suggestedKR && <div><span className="text-muted-foreground">Key Result:</span> <span className="font-medium text-foreground">{suggestedKR.title}</span></div>}
                </div>
              ) : (
                <div className="text-muted-foreground">A IA não encontrou um objetivo claramente relevante.</div>
              )}
              {suggestion?.rationale && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Justificativa</div>
                  <div className="text-foreground">{suggestion.rationale}</div>
                </div>
              )}
              {typeof suggestion?.confidence === 'number' && (
                <div className="text-xs text-muted-foreground">
                  Confiança: <span className="font-medium text-foreground">{Math.round((suggestion.confidence || 0) * 100)}%</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                Nada será persistido até você clicar em <span className="font-medium text-foreground">Salvar</span> na tarefa.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="gap-1.5"><X className="h-3.5 w-3.5" /> Rejeitar</AlertDialogCancel>
          <AlertDialogAction onClick={applySuggestion} disabled={!suggestion?.objective_id} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Aplicar sugestão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!impactSuggestion} onOpenChange={(o) => { if (!o) setImpactSuggestion(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Sugestão de impacto na iniciativa
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-sm">
              <div className="rounded-md border border-border p-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{impactSuggestion?.impact ?? 0}%</span>
                <span className="text-xs text-muted-foreground">de impacto estimado na conclusão da iniciativa</span>
              </div>
              {impactSuggestion?.rationale && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Justificativa</div>
                  <div className="text-foreground">{impactSuggestion.rationale}</div>
                </div>
              )}
              {typeof impactSuggestion?.confidence === 'number' && (
                <div className="text-xs text-muted-foreground">
                  Confiança: <span className="font-medium text-foreground">{Math.round((impactSuggestion.confidence || 0) * 100)}%</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                Nada será persistido até você clicar em <span className="font-medium text-foreground">Salvar</span> na tarefa.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="gap-1.5"><X className="h-3.5 w-3.5" /> Rejeitar</AlertDialogCancel>
          <AlertDialogAction onClick={applyImpactSuggestion} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Aplicar sugestão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default EditBacklogTaskDialog;
