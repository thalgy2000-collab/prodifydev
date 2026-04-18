import { useState, useRef, useEffect, DragEvent } from 'react';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { Sprint, SPRINT_STATUS_CONFIG, SprintStatus } from '@/types/sprint';
import { BacklogTask, PRIORITY_CONFIG, TaskStatus } from '@/types/backlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Zap, Trash2, AlertTriangle, ArrowUp, ArrowDown, Minus, CircleAlert, User, ClipboardCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProduct } from '@/contexts/ProductContext';
import EditSprintTaskDialog from '@/components/EditSprintTaskDialog';

interface KanbanColumn {
  id: string;
  title: string;
  statusMap: TaskStatus[];
  isCustom?: boolean;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'pending', title: 'Itens Pendentes', statusMap: ['open', 'ready'] },
  { id: 'in_progress', title: 'Em Andamento', statusMap: ['in_progress'] },
  { id: 'done', title: 'Itens Concluídos', statusMap: ['done'] },
];

const STATUS_FOR_COLUMN: Record<string, TaskStatus> = {
  pending: 'open',
  in_progress: 'in_progress',
  done: 'done',
};

const PRIORITY_ICONS: Record<string, { icon: typeof ArrowUp; color: string }> = {
  critical: { icon: CircleAlert, color: 'hsl(0 72% 50%)' },
  high: { icon: ArrowUp, color: 'hsl(25 95% 53%)' },
  medium: { icon: Minus, color: 'hsl(45 100% 51%)' },
  low: { icon: ArrowDown, color: 'hsl(210 40% 60%)' },
};

const SprintsPage = () => {
  const { sprints, addSprint, updateSprint, deleteSprint, getActiveSprint } = useSprintStore();
  const { tasks, updateTask, addTask, deleteTask } = useBacklogStore();
  const { fetchByTasks, getProgress, allCompleted } = useAcceptanceCriteriaStore();
  const { activeProduct } = useProduct();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [columns, setColumns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const dragTaskId = useRef<string | null>(null);

  // Done confirmation dialog
  const [confirmDoneOpen, setConfirmDoneOpen] = useState(false);
  const [pendingDoneTaskId, setPendingDoneTaskId] = useState<string | null>(null);
  const [pendingDoneProgress, setPendingDoneProgress] = useState<{ done: number; total: number } | null>(null);

  // Close sprint confirmation
  const [confirmCloseSprintOpen, setConfirmCloseSprintOpen] = useState(false);

  // Edit task dialog
  const [editTask, setEditTask] = useState<BacklogTask | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [members, setMembers] = useState<{ id: string; displayName: string }[]>([]);

  const activeSprint = getActiveSprint();
  const activeSprints = sprints.filter(s => s.status !== 'completed');
  const selectedSprint = activeSprint || activeSprints[0];

  const sprintTasks = selectedSprint ? tasks.filter(t => t.sprintId === selectedSprint.id) : [];

  // Fetch criteria for sprint tasks
  useEffect(() => {
    if (sprintTasks.length > 0) {
      fetchByTasks(sprintTasks.map(t => t.id));
    }
  }, [sprintTasks.length, fetchByTasks]);

  // Fetch product members for assignee dropdown
  useEffect(() => {
    if (!activeProduct) return;
    const fetchMembers = async () => {
      const { data: pmData } = await (supabase.from('product_members') as any)
        .select('user_id')
        .eq('product_id', activeProduct.id);
      if (!pmData || pmData.length === 0) return;
      const userIds = pmData.map((pm: any) => pm.user_id);
      const { data: profiles } = await (supabase.from('profiles') as any)
        .select('id, display_name, email')
        .in('id', userIds);
      if (profiles) {
        setMembers(profiles.map((p: any) => ({
          id: p.id,
          displayName: p.display_name || p.email || 'Sem nome',
        })));
      }
    };
    fetchMembers();
  }, [activeProduct]);

  const handleCreate = () => {
    if (!name.trim() || !startDate || !endDate) return;
    addSprint({ name, goal, startDate, endDate, status: 'planning' });
    setName(''); setGoal(''); setStartDate(''); setEndDate(''); setCreateOpen(false);
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    const id = `custom_${Date.now()}`;
    setColumns(prev => [...prev, { id, title: newColumnTitle, statusMap: ['open'], isCustom: true }]);
    setNewColumnTitle(''); setAddColumnOpen(false);
  };

  const handleDeleteColumn = (colId: string) => {
    setColumns(prev => prev.filter(c => c.id !== colId));
  };

  const getTasksForColumn = (col: KanbanColumn) => {
    return sprintTasks.filter(t => col.statusMap.includes(t.status));
  };

  const isOverdue = (sprint: Sprint) => {
    if (!sprint.endDate) return false;
    return new Date(sprint.endDate) < new Date();
  };

  const onDragStart = (e: DragEvent, taskId: string) => {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const tryMoveToDone = async (taskId: string) => {
    const isComplete = allCompleted(taskId);
    if (!isComplete) {
      const progress = getProgress(taskId);
      setPendingDoneTaskId(taskId);
      setPendingDoneProgress(progress);
      setConfirmDoneOpen(true);
    } else {
      updateTask(taskId, { status: 'done' });
      const { error } = await (supabase.from('rice_scores') as any).delete().eq('item_id', taskId).eq('item_type', 'backlog_task');
      if (!error) toast('Tarefa removida do RICE Score');
    }
  };

  const confirmMoveToDone = async () => {
    if (pendingDoneTaskId) {
      updateTask(pendingDoneTaskId, { status: 'done' });
      const { error } = await (supabase.from('rice_scores') as any).delete().eq('item_id', pendingDoneTaskId).eq('item_type', 'backlog_task');
      if (!error) toast('Tarefa removida do RICE Score');
    }
    setPendingDoneTaskId(null);
    setPendingDoneProgress(null);
    setConfirmDoneOpen(false);
  };

  const onDrop = (e: DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    if (!dragTaskId.current) return;
    const targetStatus = STATUS_FOR_COLUMN[colId] || 'open';
    if (targetStatus === 'done') {
      tryMoveToDone(dragTaskId.current);
    } else {
      updateTask(dragTaskId.current, { status: targetStatus });
    }
    dragTaskId.current = null;
  };

  const handleQuickAdd = (colId: string) => {
    if (!quickAddTitle.trim() || !selectedSprint) return;
    const targetStatus = STATUS_FOR_COLUMN[colId] || 'open';
    addTask({
      title: quickAddTitle,
      description: '',
      priority: 'medium',
      status: targetStatus,
      category: 'professional',
      sprintId: selectedSprint.id,
    });
    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  const handleOpenEditTask = (task: BacklogTask) => {
    setEditTask(task);
    setEditOpen(true);
  };

  const handleEditSave = (id: string, patch: Partial<BacklogTask>) => {
    updateTask(id, patch);
  };

  const handleEditDelete = (id: string) => {
    deleteTask(id);
  };

  const TaskCard = ({ task }: { task: BacklogTask }) => {
    const pCfg = PRIORITY_CONFIG[task.priority];
    const pIcon = PRIORITY_ICONS[task.priority];
    const PriorityIcon = pIcon?.icon || Minus;
    const sprintOverdue = selectedSprint && isOverdue(selectedSprint) && task.status !== 'done';
    const progress = getProgress(task.id);
    const assignee = task.assigneeId ? members.find(m => m.id === task.assigneeId) : null;
    const taskOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

    return (
      <div
        draggable
        onDragStart={e => onDragStart(e, task.id)}
        onClick={() => handleOpenEditTask(task)}
        className="rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight flex-1">{task.title}</p>
        </div>

        {/* Criteria progress */}
        {progress && (
          <div className="mt-2 flex items-center gap-2">
            <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{progress.done}/{progress.total}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate ? (
              <div className={`flex items-center gap-1 text-xs ${taskOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                {taskOverdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
            ) : selectedSprint ? (
              <div className={`flex items-center gap-1 text-xs ${sprintOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                {sprintOverdue && <AlertTriangle className="h-3 w-3" />}
                <span>{selectedSprint.endDate}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1" title={pCfg.label}>
              <PriorityIcon className="h-3.5 w-3.5" style={{ color: pIcon?.color }} />
            </div>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
              {assignee ? assignee.displayName.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprints</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus ciclos de trabalho</p>
        </div>
        <div className="flex items-center gap-2">
          {activeSprints.length > 1 && (
            <Select value={selectedSprint?.id || ''} onValueChange={() => {}}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeSprints.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Nova Sprint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Sprint</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Sprint 1" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Meta</Label><Input placeholder="Objetivo da sprint..." value={goal} onChange={e => setGoal(e.target.value)} /></div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2"><Label>Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div className="flex-1 space-y-2"><Label>Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Sprint</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sprint info bar */}
      {selectedSprint && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shrink-0">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold">{selectedSprint.name}</span>
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `hsl(${SPRINT_STATUS_CONFIG[selectedSprint.status].color} / 0.15)`,
              color: `hsl(${SPRINT_STATUS_CONFIG[selectedSprint.status].color})`,
            }}
          >
            {SPRINT_STATUS_CONFIG[selectedSprint.status].label}
          </Badge>
          {selectedSprint.goal && <span className="text-sm text-muted-foreground">— {selectedSprint.goal}</span>}
          <span className="ml-auto font-mono text-xs text-muted-foreground">{selectedSprint.startDate} → {selectedSprint.endDate}</span>
          <Select value={selectedSprint.status} onValueChange={v => updateSprint(selectedSprint.id, { status: v as SprintStatus })}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SPRINT_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
          {selectedSprint.status !== 'completed' && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setConfirmCloseSprintOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Encerrar
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSprint(selectedSprint.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Close sprint confirmation */}
      <AlertDialog open={confirmCloseSprintOpen} onOpenChange={setConfirmCloseSprintOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const notDone = sprintTasks.filter(t => t.status !== 'done').length;
                const done = sprintTasks.filter(t => t.status === 'done').length;
                return notDone > 0
                  ? `${done} tarefa(s) concluída(s) e ${notDone} tarefa(s) não concluída(s) serão devolvidas ao backlog. Deseja encerrar a sprint?`
                  : 'Todas as tarefas foram concluídas. Deseja encerrar a sprint?';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedSprint) {
                updateSprint(selectedSprint.id, { status: 'completed' });
              }
              setConfirmCloseSprintOpen(false);
            }}>
              Encerrar Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kanban board */}
      {!selectedSprint ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Zap className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhuma sprint ativa</p>
          <p className="text-sm text-muted-foreground mt-1">Crie uma sprint para começar</p>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-2">
          {columns.map(col => {
            const colTasks = getTasksForColumn(col);
            const isDragOver = dragOverColumnId === col.id;
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-xl border-2 transition-colors min-w-[280px] w-[300px] shrink-0 ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOverColumnId(col.id); }}
                onDragLeave={() => setDragOverColumnId(null)}
                onDrop={e => onDrop(e, col.id)}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{col.title}</h3>
                    <span className="flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium h-5 w-5">
                      {colTasks.length}
                    </span>
                  </div>
                  {col.isCustom && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteColumn(col.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {colTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Arraste tarefas aqui
                    </div>
                  )}
                </div>

                <div className="px-3 pb-3">
                  {quickAddColumn === col.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Título da tarefa..."
                        value={quickAddTitle}
                        onChange={e => setQuickAddTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQuickAdd(col.id)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleQuickAdd(col.id)}>Criar</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setQuickAddColumn(null); setQuickAddTitle(''); }}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setQuickAddColumn(col.id)}
                    >
                      <Plus className="h-4 w-4" /> Criar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="shrink-0">
            <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-dashed">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Nova Coluna</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Nome da coluna</Label>
                    <Input placeholder="Ex: Em Revisão" value={newColumnTitle} onChange={e => setNewColumnTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddColumn()} />
                  </div>
                  <Button onClick={handleAddColumn} className="w-full">Adicionar Coluna</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Alert dialog for incomplete criteria */}
      <AlertDialog open={confirmDoneOpen} onOpenChange={setConfirmDoneOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Critérios de aceite incompletos
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDoneProgress
                ? `Esta tarefa tem apenas ${pendingDoneProgress.done} de ${pendingDoneProgress.total} critérios de aceite concluídos.`
                : 'Esta tarefa possui critérios de aceite pendentes.'}
              {' '}Deseja mover para "Concluído" mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingDoneTaskId(null); setPendingDoneProgress(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmMoveToDone}>
              Mover mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit sprint task dialog */}
      <EditSprintTaskDialog
        task={editTask}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        members={members}
      />
    </div>
  );
};

export default SprintsPage;
