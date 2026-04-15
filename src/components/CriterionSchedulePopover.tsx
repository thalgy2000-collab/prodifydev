import { useState, useRef } from 'react';
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

const formatDateDisplay = (isoDate: string) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

const parseDateInput = (display: string): string => {
  const clean = display.replace(/\D/g, '');
  if (clean.length === 8) {
    const d = clean.slice(0, 2);
    const m = clean.slice(2, 4);
    const y = clean.slice(4, 8);
    const num = { d: parseInt(d), m: parseInt(m), y: parseInt(y) };
    if (num.d >= 1 && num.d <= 31 && num.m >= 1 && num.m <= 12 && num.y >= 2020) {
      return `${y}-${m}-${d}`;
    }
  }
  return '';
};

const formatDateAsYouType = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const formatTimeAsYouType = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const parseTimeInput = (display: string): string => {
  const clean = display.replace(/\D/g, '');
  if (clean.length >= 3) {
    const h = clean.slice(0, 2);
    const m = clean.slice(2, 4).padEnd(2, '0');
    const num = { h: parseInt(h), m: parseInt(m) };
    if (num.h >= 0 && num.h <= 23 && num.m >= 0 && num.m <= 59) {
      return `${h}:${m}`;
    }
  }
  return '';
};

const CriterionSchedulePopover = ({ criterion, onSaveSchedule, onAddToAgenda }: CriterionSchedulePopoverProps) => {
  const [dateDisplay, setDateDisplay] = useState(formatDateDisplay(criterion.dueDate || ''));
  const [timeDisplay, setTimeDisplay] = useState(criterion.dueTime || '');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const hasSchedule = !!criterion.scheduleActivityId;
  const isOverdue = criterion.dueDate && !criterion.completed && new Date(criterion.dueDate + 'T23:59:59') < new Date();

  const parsedDate = parseDateInput(dateDisplay);
  const parsedTime = parseTimeInput(timeDisplay);
  const isDateValid = !!parsedDate;

  const handleSave = async () => {
    if (!isDateValid) return;
    setLoading(true);
    await onSaveSchedule(criterion.id, parsedDate, parsedTime);
    setLoading(false);
  };

  const handleAddToAgenda = async () => {
    if (!isDateValid) return;
    setLoading(true);
    await onAddToAgenda(criterion, parsedDate, parsedTime);
    setLoading(false);
    setOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setDateDisplay(formatDateDisplay(criterion.dueDate || ''));
      setTimeDisplay(criterion.dueTime || '');
    }
    setOpen(v);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
          <Input
            placeholder="dd/mm/aaaa"
            value={dateDisplay}
            onChange={e => setDateDisplay(formatDateAsYouType(e.target.value))}
            className={cn('h-8 text-sm', dateDisplay && !isDateValid && 'border-destructive')}
            maxLength={10}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hora</Label>
          <Input
            placeholder="hh:mm"
            value={timeDisplay}
            onChange={e => setTimeDisplay(formatTimeAsYouType(e.target.value))}
            className="h-8 text-sm"
            maxLength={5}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs w-full" disabled={!isDateValid || loading} onClick={handleSave}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Salvar data/hora
          </Button>
          <Button size="sm" className="h-7 text-xs w-full gap-1" disabled={!isDateValid || loading || hasSchedule} onClick={handleAddToAgenda}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarCheck className="h-3 w-3" />}
            {hasSchedule ? 'Já na Agenda' : 'Adicionar à Agenda'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CriterionSchedulePopover;
