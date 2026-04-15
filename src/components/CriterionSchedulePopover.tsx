import { useState } from 'react';
import { AcceptanceCriterion } from '@/hooks/useAcceptanceCriteriaStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, CalendarCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CriterionSchedulePopoverProps {
  criterion: AcceptanceCriterion;
  onSaveSchedule: (id: string, dueDate: string, dueTime: string) => Promise<void>;
  onAddToAgenda: (criterion: AcceptanceCriterion, dueDate: string, dueTime: string) => Promise<void>;
}

const CriterionSchedulePopover = ({ criterion, onSaveSchedule, onAddToAgenda }: CriterionSchedulePopoverProps) => {
  const [date, setDate] = useState(criterion.dueDate || '');
  const [time, setTime] = useState(criterion.dueTime || '');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const hasSchedule = !!criterion.scheduleActivityId;
  const isOverdue = criterion.dueDate && !criterion.completed && new Date(criterion.dueDate + 'T23:59:59') < new Date();

  const handleSave = async () => {
    if (!date) return;
    setLoading(true);
    await onSaveSchedule(criterion.id, date, time);
    setLoading(false);
  };

  const handleAddToAgenda = async () => {
    if (!date) return;
    setLoading(true);
    await onAddToAgenda(criterion, date, time);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0',
            hasSchedule && 'text-green-500',
            isOverdue && !hasSchedule && 'text-destructive',
          )}
        >
          {hasSchedule ? (
            <CalendarCheck className="h-3.5 w-3.5" />
          ) : (
            <CalendarIcon className={cn('h-3.5 w-3.5', criterion.dueDate ? (isOverdue ? 'text-destructive' : 'text-muted-foreground') : 'opacity-50')} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="end" side="top">
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hora</Label>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs w-full" disabled={!date || loading} onClick={handleSave}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Salvar data/hora
          </Button>
          <Button size="sm" className="h-7 text-xs w-full gap-1" disabled={!date || loading || hasSchedule} onClick={handleAddToAgenda}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarCheck className="h-3 w-3" />}
            {hasSchedule ? 'Já na Agenda' : 'Adicionar à Agenda'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CriterionSchedulePopover;
