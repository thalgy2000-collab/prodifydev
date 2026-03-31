import { useState, useEffect } from 'react';
import { BacklogTask, TaskPriority, TaskStatus, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/types/backlog';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Pencil, Check, X, ClipboardCheck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EditSprintTaskDialogProps {
  task: BacklogTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<BacklogTask>) => void;
  onDelete: (id: string) => void;
  members: { id: string; displayName: string }[];
}

const EditSprintTaskDialog = ({ task, open, onOpenChange, onSave, onDelete, members }: EditSprintTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('none');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [newCriterionTitle, setNewCriterionTitle] = useState('');
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingCriterionTitle, setEditingCriterionTitle] = useState('');

  const { fetchByTask, addCriterion, updateCriterion, deleteCriterion, getCriteriaForTask } = useAcceptanceCriteriaStore();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate || '');
      setAssigneeId(task.assigneeId || 'none');
      fetchByTask(task.id);
    }
  }, [task, fetchByTask]);

  const taskCriteria = task ? getCriteriaForTask(task.id) : [];
  const progress = taskCriteria.length > 0
    ? { done: taskCriteria.filter(c => c.completed).length, total: taskCriteria.length }
    : null;

  const handleSave = () => {
    if (!task || !title.trim()) return;
    onSave(task.id, {
      title, description, priority, status,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId !== 'none' ? assigneeId : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    setConfirmDeleteOpen(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item da Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>

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

            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label>Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label>Data de Entrega</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 pt-2">
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{task?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditSprintTaskDialog;
