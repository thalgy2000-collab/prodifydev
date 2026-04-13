import { useState, useRef, useEffect, useCallback } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import EditBacklogTaskDialog from '@/components/EditBacklogTaskDialog';
import { BacklogTask, PRIORITY_CONFIG, TASK_STATUS_CONFIG, TaskPriority, TaskStatus } from '@/types/backlog';
import { SPRINT_STATUS_CONFIG, SprintStatus } from '@/types/sprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Pencil, ListTodo, Zap, GripVertical, ClipboardCheck } from 'lucide-react';
import type { DragEvent } from 'react';

const BacklogPage = () => {
  const { tasks, addTask, updateTask, deleteTask, assignToSprint, getBySprint, getUnassigned } = useBacklogStore();
  const { items: initiatives } = useRoadmapStore();
  const { sprints, addSprint, updateSprint, deleteSprint } = useSprintStore();
  const { fetchByTasks, getProgress } = useAcceptanceCriteriaStore();
  const { activeProduct } = useProduct();
  const [membersMap, setMembersMap] = useState<Record<string, { name: string; avatar: string | null }>>({});

  const fetchMembersMap = useCallback(async () => {
    if (!activeProduct) return;
    const { data: membersData } = await (supabase.from('product_members') as any)
      .select('user_id, role')
      .eq('product_id', activeProduct.id);
    if (!membersData || membersData.length === 0) { setMembersMap({}); return; }
    const userIds = membersData.map((m: any) => m.user_id);
    const { data: profilesData } = await (supabase.from('profiles') as any)
      .select('id, display_name, full_name, email, avatar_url')
      .in('id', userIds);
    const profilesById: Record<string, any> = {};
    (profilesData || []).forEach((p: any) => { profilesById[p.id] = p; });
    const map: Record<string, { name: string; avatar: string | null }> = {};
    membersData.forEach((m: any) => {
      const p = profilesById[m.user_id];
      map[m.user_id] = {
        name: p?.display_name || p?.full_name || p?.email || '?',
        avatar: p?.avatar_url || null,
      };
    });
    setMembersMap(map);
  }, [activeProduct]);

  useEffect(() => { fetchMembersMap(); }, [fetchMembersMap]);

  const [editTask, setEditTask] = useState<BacklogTask | null>(null);
  const [filterStatus, setFilterStatus] = usePersistedState<string>('backlog_filter', 'all');
  const [createOpen, setCreateOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newInitiativeId, setNewInitiativeId] = useState('none');
  const [newStoryPoints, setNewStoryPoints] = useState(1);
  const [newAssigneeId, setNewAssigneeId] = useState('none');

  const [sprintName, setSprintName] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');

  const [dragOverSprintId, setDragOverSprintId] = useState<string | null>(null);
  const [dragOverBacklog, setDragOverBacklog] = useState(false);
  const dragTaskId = useRef<string | null>(null);

  // Fetch criteria for all tasks
  useEffect(() => {
    if (tasks.length > 0) {
      fetchByTasks(tasks.map(t => t.id));
    }
  }, [tasks, fetchByTasks]);

  const activeSprints = sprints.filter(s => s.status !== 'completed');
  const unassigned = getUnassigned();
  const filtered = unassigned.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const init = initiatives.find(i => i.id === newInitiativeId);
    addTask({
      title: newTitle, description: newDesc, priority: newPriority, status: 'open',
      category: 'professional', initiativeId: newInitiativeId !== 'none' ? newInitiativeId : undefined,
      objectiveId: init?.objectiveId, keyResultId: init?.keyResultId, storyPoints: newStoryPoints,
      assigneeId: newAssigneeId !== 'none' ? newAssigneeId : undefined,
    });
    setNewTitle(''); setNewDesc(''); setNewPriority('medium');
    setNewInitiativeId('none'); setNewStoryPoints(1); setNewAssigneeId('none'); setCreateOpen(false);
  };

  const handleCreateSprint = () => {
    if (!sprintName.trim() || !sprintStart || !sprintEnd) return;
    addSprint({ name: sprintName, goal: '', startDate: sprintStart, endDate: sprintEnd, status: 'planning' });
    setSprintName(''); setSprintStart(''); setSprintEnd(''); setSprintOpen(false);
  };

  const onDragStart = (e: DragEvent, taskId: string) => {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropSprint = (e: DragEvent, sprintId: string) => {
    e.preventDefault();
    setDragOverSprintId(null);
    if (dragTaskId.current) {
      assignToSprint(dragTaskId.current, sprintId);
      dragTaskId.current = null;
    }
  };

  const onDropBacklog = (e: DragEvent) => {
    e.preventDefault();
    setDragOverBacklog(false);
    if (dragTaskId.current) {
      assignToSprint(dragTaskId.current, undefined);
      dragTaskId.current = null;
    }
  };

  const TaskRow = ({ task, showDrag = true }: { task: BacklogTask; showDrag?: boolean }) => {
    const pCfg = PRIORITY_CONFIG[task.priority];
    const sCfg = TASK_STATUS_CONFIG[task.status];
    const progress = getProgress(task.id);
    const assignee = task.assigneeId ? membersMap[task.assigneeId] : null;
    return (
      <div
        draggable
        onDragStart={e => onDragStart(e, task.id)}
        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing"
      >
        {showDrag && <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{task.title}</span>
            <Badge variant="secondary" style={{ backgroundColor: `hsl(${pCfg.color} / 0.15)`, color: `hsl(${pCfg.color})` }}>{pCfg.label}</Badge>
            <Badge variant="outline">{sCfg.label}</Badge>
            {task.storyPoints && <span className="font-mono text-xs text-muted-foreground">{task.storyPoints} pts</span>}
            {progress && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClipboardCheck className="h-3 w-3" />
                {progress.done}/{progress.total} critérios
              </span>
            )}
          </div>
          {task.description && <p className="mt-1 text-sm text-muted-foreground truncate">{task.description}</p>}
        </div>
        {assignee && (
          <Avatar className="h-7 w-7 shrink-0" title={assignee.name}>
            <AvatarImage src={assignee.avatar || undefined} />
            <AvatarFallback className="text-[10px]">{assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <Select value={task.status} onValueChange={v => updateTask(task.id, { status: v as TaskStatus })}>
            <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTask(task)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas tarefas e prioridades</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={sprintOpen} onOpenChange={setSprintOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Zap className="h-4 w-4" />Criar Sprint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Sprint</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Sprint 1" value={sprintName} onChange={e => setSprintName(e.target.value)} /></div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2"><Label>Início</Label><Input type="date" value={sprintStart} onChange={e => setSprintStart(e.target.value)} /></div>
                  <div className="flex-1 space-y-2"><Label>Fim</Label><Input type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} /></div>
                </div>
                <Button onClick={handleCreateSprint} className="w-full">Criar Sprint</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Implementar login social" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} /></div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2"><Label>Prioridade</Label><Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2"><Label>Iniciativa</Label><Select value={newInitiativeId} onValueChange={setNewInitiativeId}><SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{initiatives.map(i => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}</SelectContent></Select></div>
                  <div className="w-24 space-y-2"><Label>Pontos</Label><Input type="number" min={1} max={21} value={newStoryPoints} onChange={e => setNewStoryPoints(Number(e.target.value))} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                    <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem responsável</SelectItem>
                      {Object.entries(membersMap).map(([uid, m]) => (
                        <SelectItem key={uid} value={uid}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={m.avatar || undefined} />
                              <AvatarFallback className="text-[10px]">{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Tarefa</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Sprints */}
      {activeSprints.map(sprint => {
        const sprintTasks = getBySprint(sprint.id);
        const totalPoints = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
        const sCfg = SPRINT_STATUS_CONFIG[sprint.status];
        return (
          <div
            key={sprint.id}
            onDragOver={e => { e.preventDefault(); setDragOverSprintId(sprint.id); }}
            onDragLeave={() => setDragOverSprintId(null)}
            onDrop={e => onDropSprint(e, sprint.id)}
            className={`rounded-xl border-2 p-5 transition-colors ${
              dragOverSprintId === sprint.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">{sprint.name}</h2>
                <Badge variant="secondary" style={{ backgroundColor: `hsl(${sCfg.color} / 0.15)`, color: `hsl(${sCfg.color})` }}>{sCfg.label}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{sprint.startDate} → {sprint.endDate}</span>
                <span className="font-mono text-xs text-muted-foreground">({totalPoints} pts)</span>
              </div>
              <div className="flex items-center gap-1">
                <Select value={sprint.status} onValueChange={v => updateSprint(sprint.id, { status: v as SprintStatus })}>
                  <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SPRINT_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSprint(sprint.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {sprintTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Arraste tarefas do backlog para esta sprint
              </div>
            ) : (
              <div className="space-y-2">
                {sprintTasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            )}
          </div>
        );
      })}

      {/* Backlog section */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOverBacklog(true); }}
        onDragLeave={() => setDragOverBacklog(false)}
        onDrop={onDropBacklog}
        className={`space-y-4 rounded-xl border-2 p-5 transition-colors ${
          dragOverBacklog ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> Backlog
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <ListTodo className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Nenhuma tarefa no backlog</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        )}
      </div>

      <EditBacklogTaskDialog task={editTask} open={!!editTask} onOpenChange={o => !o && setEditTask(null)} onSave={updateTask} initiatives={initiatives} />
    </div>
  );
};

export default BacklogPage;
