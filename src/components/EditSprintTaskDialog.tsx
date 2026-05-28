import { useState, useEffect } from 'react';
import { BacklogTask, TaskPriority, TaskStatus, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/types/backlog';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CountedInput, CountedTextarea } from '@/components/ui/counted-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AcceptanceCriteriaSection from '@/components/AcceptanceCriteriaSection';

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg h-[90vh] sm:h-[85vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/50">
            <DialogTitle>Editar Item da Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 px-6 overflow-y-auto flex-1 min-h-0 pb-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
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
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 px-6 py-3 shrink-0 border-t border-border/50">
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
