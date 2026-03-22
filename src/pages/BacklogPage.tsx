import { useState } from 'react';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import EditBacklogTaskDialog from '@/components/EditBacklogTaskDialog';
import { BacklogTask, PRIORITY_CONFIG, TASK_STATUS_CONFIG, TaskPriority, TaskStatus } from '@/types/backlog';
import { OKR_CATEGORIES, OKRCategory } from '@/types/okr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, ListTodo, ArrowUpDown } from 'lucide-react';

const BacklogPage = () => {
  const { tasks, addTask, updateTask, deleteTask, assignToSprint } = useBacklogStore();
  const { items: initiatives } = useRoadmapStore();
  const { sprints, getActiveSprint } = useSprintStore();
  const activeSprint = getActiveSprint();

  const [editTask, setEditTask] = useState<BacklogTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<OKRCategory>('professional');
  const [newInitiativeId, setNewInitiativeId] = useState('none');
  const [newStoryPoints, setNewStoryPoints] = useState(1);

  const filtered = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const init = initiatives.find(i => i.id === newInitiativeId);
    addTask({
      title: newTitle, description: newDesc, priority: newPriority, status: 'open',
      category: newCategory, initiativeId: newInitiativeId !== 'none' ? newInitiativeId : undefined,
      objectiveId: init?.objectiveId, keyResultId: init?.keyResultId, storyPoints: newStoryPoints,
    });
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewCategory('professional');
    setNewInitiativeId('none'); setNewStoryPoints(1); setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas tarefas e prioridades</p>
        </div>
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
                <div className="flex-1 space-y-2"><Label>Categoria</Label><Select value={newCategory} onValueChange={v => setNewCategory(v as OKRCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OKR_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex-1 space-y-2"><Label>Prioridade</Label><Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2"><Label>Iniciativa</Label><Select value={newInitiativeId} onValueChange={setNewInitiativeId}><SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{initiatives.map(i => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}</SelectContent></Select></div>
                <div className="w-24 space-y-2"><Label>Pontos</Label><Input type="number" min={1} max={21} value={newStoryPoints} onChange={e => setNewStoryPoints(Number(e.target.value))} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
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
          <p className="font-medium text-muted-foreground">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const pCfg = PRIORITY_CONFIG[task.priority];
            const sCfg = TASK_STATUS_CONFIG[task.status];
            return (
              <div key={task.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant="secondary" style={{ backgroundColor: `hsl(${pCfg.color} / 0.15)`, color: `hsl(${pCfg.color})` }}>{pCfg.label}</Badge>
                    <Badge variant="outline">{sCfg.label}</Badge>
                    {task.storyPoints && <span className="font-mono text-xs text-muted-foreground">{task.storyPoints} pts</span>}
                  </div>
                  {task.description && <p className="mt-1 text-sm text-muted-foreground truncate">{task.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {activeSprint && !task.sprintId && task.status !== 'done' && (
                    <Button variant="outline" size="sm" onClick={() => assignToSprint(task.id, activeSprint.id)}>
                      → Sprint
                    </Button>
                  )}
                  <Select value={task.status} onValueChange={v => updateTask(task.id, { status: v as TaskStatus })}>
                    <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTask(task)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditBacklogTaskDialog task={editTask} open={!!editTask} onOpenChange={o => !o && setEditTask(null)} onSave={updateTask} initiatives={initiatives} />
    </div>
  );
};

export default BacklogPage;
