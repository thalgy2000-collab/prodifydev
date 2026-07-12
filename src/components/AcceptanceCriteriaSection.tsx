import { useState } from 'react';
import { AcceptanceCriterion, useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountedInput } from '@/components/ui/counted-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Pencil, Check, X, ClipboardCheck, Sparkles, Loader2, GripVertical } from 'lucide-react';
import CriterionSchedulePopover from '@/components/CriterionSchedulePopover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AcceptanceCriteriaSectionProps {
  taskId: string;
  criteria: AcceptanceCriterion[];
  addCriterion: (taskId: string, title: string) => Promise<void>;
  updateCriterion: (id: string, patch: any, taskId: string) => Promise<void>;
  deleteCriterion: (id: string, taskId: string) => Promise<void>;
  reorderCriteria?: (taskId: string, orderedIds: string[]) => Promise<void>;
  taskTitle?: string;
  taskDescription?: string;
}

const AcceptanceCriteriaSection = ({ taskId, criteria, addCriterion, updateCriterion, deleteCriterion, reorderCriteria, taskTitle, taskDescription }: AcceptanceCriteriaSectionProps) => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { addActivity } = useScheduleStore();

  const [newCriterionTitle, setNewCriterionTitle] = useState('');
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingCriterionTitle, setEditingCriterionTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    const title = (taskTitle || '').trim();
    if (!title) { toast.error('Adicione um título à tarefa antes de gerar.'); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-acceptance-criteria', {
        body: { title, description: taskDescription || '' },
      });
      if (error) throw error;
      const items: string[] = (data as any)?.criteria || [];
      if (!items.length) { toast.error('A IA não retornou critérios. Tente novamente.'); return; }
      for (const item of items) {
        await addCriterion(taskId, item);
      }
      toast.success(`${items.length} critérios gerados pela IA`);
    } catch (e: any) {
      const msg = e?.message || 'Erro ao gerar critérios';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const progress = criteria.length > 0
    ? { done: criteria.filter(c => c.completed).length, total: criteria.length }
    : null;

  const handleAdd = () => {
    if (!newCriterionTitle.trim()) return;
    addCriterion(taskId, newCriterionTitle.trim());
    setNewCriterionTitle('');
  };

  const handleToggle = (id: string, completed: boolean) => {
    updateCriterion(id, { completed: !completed }, taskId);
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingCriterionId(id);
    setEditingCriterionTitle(title);
  };

  const handleSaveEdit = () => {
    if (!editingCriterionId || !editingCriterionTitle.trim()) return;
    updateCriterion(editingCriterionId, { title: editingCriterionTitle.trim() }, taskId);
    setEditingCriterionId(null);
    setEditingCriterionTitle('');
  };

  const handleCancelEdit = () => {
    setEditingCriterionId(null);
    setEditingCriterionTitle('');
  };

  const handleSaveSchedule = async (id: string, dueDate: string, dueTime: string) => {
    await updateCriterion(id, { due_date: dueDate || null, due_time: dueTime || null }, taskId);
  };

  const handleAddToAgenda = async (criterion: AcceptanceCriterion, dueDate: string, dueTime: string) => {
    // Save date/time first
    await updateCriterion(criterion.id, { due_date: dueDate || null, due_time: dueTime || null }, taskId);
    // Create schedule activity
    const activity = await addActivity({
      title: criterion.title,
      description: '',
      activityDate: dueDate,
      startTime: dueTime || undefined,
      status: 'pending',
      productId: activeProduct?.id,
    });
    // Link activity to criterion
    await updateCriterion(criterion.id, { schedule_activity_id: activity.id }, taskId);
  };

  const formatDueInfo = (c: AcceptanceCriterion) => {
    if (!c.dueDate) return null;
    const isOverdue = !c.completed && new Date(c.dueDate + 'T23:59:59') < new Date();
    const dateStr = format(parseISO(c.dueDate), "dd MMM", { locale: ptBR });
    const timeStr = c.dueTime ? ` às ${c.dueTime}` : '';
    return (
      <span className={cn('text-[10px] ml-6', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
        {dateStr}{timeStr}
      </span>
    );
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4" />
          Critérios de Aceite
        </Label>
        <div className="flex items-center gap-2">
          {progress && (
            <span className="text-xs font-medium text-muted-foreground">
              {progress.done}/{progress.total} concluídos
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleGenerateAI}
            disabled={generating}
            title="Gerar critérios com IA a partir do título e descrição"
          >
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {generating ? 'Gerando...' : 'Gerar com IA'}
          </Button>
        </div>
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
        {criteria.map(criterion => (
          <div key={criterion.id}>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group">
              <Checkbox
                checked={criterion.completed}
                onCheckedChange={() => handleToggle(criterion.id, criterion.completed)}
              />
              {editingCriterionId === criterion.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <CountedInput
                    maxLength={200}
                    inline
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
                  <span className={cn('flex-1 text-sm', criterion.completed && 'line-through text-muted-foreground')}>
                    {criterion.title}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <CriterionSchedulePopover
                      criterion={criterion}
                      onSaveSchedule={handleSaveSchedule}
                      onAddToAgenda={handleAddToAgenda}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(criterion.id, criterion.title)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCriterion(criterion.id, taskId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Show calendar icon always if has schedule */}
                  {criterion.scheduleActivityId && (
                    <div className="flex group-hover:hidden items-center">
                      <CriterionSchedulePopover
                        criterion={criterion}
                        onSaveSchedule={handleSaveSchedule}
                        onAddToAgenda={handleAddToAgenda}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {formatDueInfo(criterion)}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <CountedInput
          maxLength={200}
          inline
          placeholder="Novo critério de aceite..."
          value={newCriterionTitle}
          onChange={e => setNewCriterionTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="h-8 text-sm"
        />
        <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1" onClick={handleAdd}>
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
    </div>
  );
};

export default AcceptanceCriteriaSection;
