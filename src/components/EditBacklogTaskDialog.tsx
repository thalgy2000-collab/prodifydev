import { useState, useEffect, useCallback } from 'react';
import { BacklogTask, TaskPriority, PRIORITY_CONFIG } from '@/types/backlog';
import { RoadmapItem } from '@/types/roadmap';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Check, X, ClipboardCheck } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [initiativeId, setInitiativeId] = useState<string>('none');
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [dueEndTime, setDueEndTime] = useState<string>('');
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [sprintOptions, setSprintOptions] = useState<SprintOption[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('none');

  const [newCriterionTitle, setNewCriterionTitle] = useState('');
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingCriterionTitle, setEditingCriterionTitle] = useState('');

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
      setSelectedSprintId('none');
      fetchByTask(task.id);
    }
  }, [task, fetchByTask]);

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

    onSave(task.id, patch);
    onOpenChange(false);
  };

  const handleAddCriterion = () => {
    if (!task || !newCriterionTitle.trim()) return;
    addCriterion(task.id, newCriterionTitle.trim());
    setNewCriterionTitle('');
  };

  const handleToggleCriterion = (id: string, completed: boolean) => {
    if (!task) return;
    updateCriterion(id, { completed: !completed }, task.id);
  };

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingCriterionId(id);
    setEditingCriterionTitle(currentTitle);
  };

  const handleSaveEdit = () => {
    if (!task || !editingCriterionId || !editingCriterionTitle.trim()) return;
    updateCriterion(editingCriterionId, { title: editingCriterionTitle.trim() }, task.id);
    setEditingCriterionId(null);
    setEditingCriterionTitle('');
  };

  const handleCancelEdit = () => {
    setEditingCriterionId(null);
    setEditingCriterionTitle('');
  };

  const progress = taskCriteria.length > 0
    ? { done: taskCriteria.filter(c => c.completed).length, total: taskCriteria.length }
    : null;

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
            <div className="w-24 space-y-2"><Label>Pontos</Label><Input type="number" min={1} max={21} value={storyPoints} onChange={e => setStoryPoints(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
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
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRemoveFromSprint}>
                  Remover da Sprint
                </Button>
              </div>
            ) : sprintOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sprint ativa encontrada</p>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {sprintOptions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-9"
                  disabled={selectedSprintId === 'none'}
                  onClick={handleAddToSprint}
                >
                  Adicionar à Sprint
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de entrega</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          {dueDate && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label>Hora início</Label>
                <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Hora fim</Label>
                <Input type="time" value={dueEndTime} onChange={e => setDueEndTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* Acceptance Criteria Section */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4" />
                Critérios de Aceite
              </Label>
              {progress && (
                <span className="text-xs font-medium text-muted-foreground">
                  {progress.done}/{progress.total} concluídos
                </span>
              )}
            </div>

            {progress && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-1">
              {taskCriteria.map(criterion => (
                <div key={criterion.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group">
                  <Checkbox
                    checked={criterion.completed}
                    onCheckedChange={() => handleToggleCriterion(criterion.id, criterion.completed)}
                  />
                  {editingCriterionId === criterion.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <Input
                        value={editingCriterionTitle}
                        onChange={e => setEditingCriterionTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleSaveEdit}><Check className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${criterion.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {criterion.title}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(criterion.id, criterion.title)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => task && deleteCriterion(criterion.id, task.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Novo critério de aceite..."
                value={newCriterionTitle}
                onChange={e => setNewCriterionTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCriterion()}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1" onClick={handleAddCriterion}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBacklogTaskDialog;
