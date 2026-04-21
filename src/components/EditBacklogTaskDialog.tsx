import { useState, useEffect, useCallback } from 'react';
import { BacklogTask, TaskPriority, PRIORITY_CONFIG } from '@/types/backlog';
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
import { HelpCircle } from 'lucide-react';
import AcceptanceCriteriaSection from '@/components/AcceptanceCriteriaSection';

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
      .select('id, name, status')
      .eq('product_id', activeProduct.id)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    setSprintOptions(data || []);
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
      fetchByTask(task.id);
      loadRoadmapItemTask(task.id);
    }
  }, [task, fetchByTask, loadRoadmapItemTask]);

  const taskCriteria = task ? getCriteriaForTask(task.id) : [];

  const handleAddToSprint = async () => {
    if (!task || selectedSprintId === 'none') return;
    await (supabase.from('backlog_tasks') as any)
      .update({ sprint_id: selectedSprintId })
      .eq('id', task.id);
    toast.success('Tarefa adicionada à sprint!');
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
      objectiveId: initiative?.objectiveId, keyResultId: initiative?.keyResultId, storyPoints,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
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

          {/* Sprint Section */}
          <div className="space-y-2">
            <Label>Sprint</Label>
            {task?.sprintId ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentSprintName || 'Sprint vinculada'}</Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRemoveFromSprint}>Remover da Sprint</Button>
              </div>
            ) : sprintOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sprint ativa encontrada</p>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione uma sprint" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {sprintOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
            />
          )}

          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBacklogTaskDialog;
