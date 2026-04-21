import { useState, useMemo } from 'react';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useProduct } from '@/contexts/ProductContext';
import { ScheduleActivity, ACTIVITY_STATUS_CONFIG } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Circle,
  Clock, CalendarDays, LayoutGrid, List, Pencil,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';

const EVENT_COLORS = [
  'bg-primary/80 text-primary-foreground',
  'bg-blue-500/80 text-white',
  'bg-green-500/80 text-white',
  'bg-yellow-500/80 text-white',
  'bg-purple-500/80 text-white',
  'bg-pink-500/80 text-white',
  'bg-orange-500/80 text-white',
  'bg-teal-500/80 text-white',
];

function getEventColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const AgendaPage = () => {
  const { activities, addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const { sprints } = useSprintStore();
  const { tasks } = useBacklogStore();
  const { products } = useProduct();

  const getProductInfo = (productId?: string) => {
    if (!productId) return null;
    return products.find(p => p.id === productId) || null;
  };

  const taskTitles = useMemo(() => new Set(tasks.filter(t => t.scheduleActivityId).map(t => `[${t.title}]`)), [tasks]);
  const isTaskActivity = (activityTitle: string) => taskTitles.has(activityTitle);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sprintId, setSprintId] = useState('none');

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setDate(format(selectedDate, 'yyyy-MM-dd'));
    setStartTime('');
    setEndTime('');
    setSprintId('none');
    setEditingActivity(null);
  };

  const openCreate = (dateStr?: string) => {
    resetForm();
    if (dateStr) setDate(dateStr);
    setCreateOpen(true);
  };

  const openEdit = (act: ScheduleActivity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDesc(act.description);
    setDate(act.activityDate);
    setStartTime(act.startTime || '');
    setEndTime(act.endTime || '');
    setSprintId(act.sprintId || 'none');
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !date) return;
    if (editingActivity) {
      updateActivity(editingActivity.id, {
        title, description: desc, activityDate: date,
        startTime: startTime || undefined, endTime: endTime || undefined,
        sprintId: sprintId !== 'none' ? sprintId : undefined,
      });
    } else {
      addActivity({
        title, description: desc, activityDate: date,
        startTime: startTime || undefined, endTime: endTime || undefined,
        sprintId: sprintId !== 'none' ? sprintId : undefined, status: 'pending',
      });
    }
    setCreateOpen(false);
    resetForm();
  };

  const toggleStatus = (act: ScheduleActivity) => {
    updateActivity(act.id, { status: act.status === 'pending' ? 'done' : 'pending' });
  };

  // Calendar grid for month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const getActivitiesForDate = (d: Date) =>
    activities.filter(a => a.activityDate === format(d, 'yyyy-MM-dd'));

  const selectedDateActivities = getActivitiesForDate(selectedDate);

  const navigateMonth = (dir: number) => {
    setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Mini calendar for sidebar
  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar - Google Calendar style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Agenda</h1>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {([
              { mode: 'month' as ViewMode, icon: LayoutGrid, label: 'Mês' },
              { mode: 'week' as ViewMode, icon: List, label: 'Semana' },
              { mode: 'day' as ViewMode, icon: CalendarDays, label: 'Dia' },
            ]).map(v => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === v.mode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => openCreate()}>
                <Plus className="h-4 w-4" />
                Criar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Adicionar título" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Adicionar descrição" />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Início</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Fim</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>
                {sprints.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sprint</Label>
                    <Select value={sprintId} onValueChange={setSprintId}>
                      <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleSave} className="w-full">
                  {editingActivity ? 'Salvar alterações' : 'Criar atividade'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Mini calendar + Day detail */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 overflow-hidden h-full">
          {/* Mini calendar */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-0">
              {WEEK_DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                  {d.charAt(0).toUpperCase()}
                </div>
              ))}
              {miniCalDays.map(day => {
                const hasEvents = getActivitiesForDate(day).length > 0;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDate(day); if (viewMode === 'month') setCurrentDate(day); }}
                    className={cn(
                      'relative h-7 w-7 mx-auto rounded-full text-xs flex items-center justify-center transition-colors',
                      !isSameMonth(day, currentDate) && 'text-muted-foreground/40',
                      isSameDay(day, selectedDate) && 'bg-primary text-primary-foreground',
                      isToday(day) && !isSameDay(day, selectedDate) && 'bg-primary/20 text-primary font-bold',
                      !isSameDay(day, selectedDate) && 'hover:bg-muted'
                    )}
                  >
                    {format(day, 'd')}
                    {hasEvents && !isSameDay(day, selectedDate) && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          <div className="flex-1 min-h-0 border-t border-border p-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {format(selectedDate, 'EEEE', { locale: ptBR })}
                </p>
                <p className="text-2xl font-bold text-primary">{format(selectedDate, 'd')}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCreate(format(selectedDate, 'yyyy-MM-dd'))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {selectedDateActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum evento neste dia</p>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                {selectedDateActivities.map(act => (
                  <div
                    key={act.id}
                    className={cn('rounded-lg p-2.5 cursor-pointer transition-opacity', getEventColor(act.id), act.status === 'done' && 'opacity-50')}
                    onClick={() => openEdit(act)}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(act); }}
                        className="mt-0.5 shrink-0"
                      >
                        {act.status === 'done'
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <Circle className="h-3.5 w-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={cn('text-xs font-semibold', act.status === 'done' && 'line-through')}>
                            {act.title}
                          </p>
                          {isTaskActivity(act.title) && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                              Task
                            </Badge>
                          )}
                        </div>
                        {(() => { const prod = getProductInfo(act.productId); return prod ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-background/30 rounded px-1 mt-0.5">
                            {prod.emoji} {prod.name}
                          </span>
                        ) : null; })()}
                        {act.startTime && (
                          <p className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {act.startTime}{act.endTime && ` – ${act.endTime}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteActivity(act.id); }}
                        className="shrink-0 opacity-60 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main calendar area */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
          {viewMode === 'month' && (
            <MonthView
              days={monthDays}
              currentDate={currentDate}
              selectedDate={selectedDate}
              activities={activities}
              onSelectDate={(d) => setSelectedDate(d)}
              onCreateEvent={(d) => openCreate(format(d, 'yyyy-MM-dd'))}
              onEditEvent={openEdit}
              onToggleStatus={toggleStatus}
              getProductInfo={getProductInfo}
              isTaskActivity={isTaskActivity}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              days={weekDays}
              activities={activities}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onCreateEvent={(d) => openCreate(format(d, 'yyyy-MM-dd'))}
              onEditEvent={openEdit}
              onToggleStatus={toggleStatus}
              isTaskActivity={isTaskActivity}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              date={selectedDate}
              activities={selectedDateActivities}
              onCreateEvent={() => openCreate(format(selectedDate, 'yyyy-MM-dd'))}
              onEditEvent={openEdit}
              onToggleStatus={toggleStatus}
              onDeleteEvent={deleteActivity}
              getProductInfo={getProductInfo}
              isTaskActivity={isTaskActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Month View ─── */
interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  selectedDate: Date;
  activities: ScheduleActivity[];
  onSelectDate: (d: Date) => void;
  onCreateEvent: (d: Date) => void;
  onEditEvent: (a: ScheduleActivity) => void;
  onToggleStatus: (a: ScheduleActivity) => void;
  getProductInfo?: (productId?: string) => { emoji: string; name: string; color: string } | null;
  isTaskActivity: (title: string) => boolean;
}

const MonthView = ({ days, currentDate, selectedDate, activities, onSelectDate, onCreateEvent, onEditEvent, onToggleStatus, getProductInfo, isTaskActivity }: MonthViewProps) => (
  <div className="h-full flex flex-col">
    {/* Header row */}
    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
      {WEEK_DAYS_SHORT.map(d => (
        <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
          {d}
        </div>
      ))}
    </div>
    {/* Day cells */}
    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
      {days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayActs = activities.filter(a => a.activityDate === dayStr);
        const inMonth = isSameMonth(day, currentDate);
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);

        return (
          <div
            key={dayStr}
            onClick={() => onSelectDate(day)}
            onDoubleClick={() => onCreateEvent(day)}
            className={cn(
              'border-b border-r border-border p-1 cursor-pointer transition-colors min-h-[80px]',
              !inMonth && 'bg-muted/20',
              selected && 'bg-primary/5',
              'hover:bg-muted/40'
            )}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={cn(
                  'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground',
                  !today && !inMonth && 'text-muted-foreground/40',
                  !today && inMonth && 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
            <div className="space-y-0.5">
              {dayActs.slice(0, 3).map(act => (
                <button
                  key={act.id}
                  onClick={(e) => { e.stopPropagation(); onEditEvent(act); }}
                  className={cn(
                    'w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate block',
                    getEventColor(act.id),
                    act.status === 'done' && 'opacity-50 line-through'
                  )}
                >
                  {act.startTime && <span className="mr-1">{act.startTime}</span>}
                  {act.title}
                  {isTaskActivity(act.title) && <span className="ml-1 text-[8px] bg-background/50 px-0.5 rounded">T</span>}
                  {getProductInfo && act.productId && getProductInfo(act.productId)?.emoji}
                </button>
              ))}
              {dayActs.length > 3 && (
                <p className="text-[10px] text-muted-foreground px-1.5">
                  +{dayActs.length - 3} mais
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ─── Week View ─── */
interface WeekViewProps {
  days: Date[];
  activities: ScheduleActivity[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onCreateEvent: (d: Date) => void;
  onEditEvent: (a: ScheduleActivity) => void;
  onToggleStatus: (a: ScheduleActivity) => void;
  isTaskActivity: (title: string) => boolean;
}

const WeekView = ({ days, activities, selectedDate, onSelectDate, onCreateEvent, onEditEvent, onToggleStatus, isTaskActivity }: WeekViewProps) => (
  <div className="h-full flex flex-col">
    {/* Day headers */}
    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30 sticky top-0 z-10">
      <div />
      {days.map(day => {
        const today = isToday(day);
        return (
          <div
            key={day.toISOString()}
            className="py-2 text-center border-l border-border cursor-pointer"
            onClick={() => onSelectDate(day)}
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={cn(
              'text-lg font-bold inline-flex items-center justify-center h-8 w-8 rounded-full',
              today && 'bg-primary text-primary-foreground',
              isSameDay(day, selectedDate) && !today && 'bg-primary/20 text-primary'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        );
      })}
    </div>
    {/* Time grid */}
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[1440px]">
        {/* Hour labels */}
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="h-[60px] border-b border-border flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayActs = activities.filter(a => a.activityDate === dayStr);
          return (
            <div key={dayStr} className="relative border-l border-border" onDoubleClick={() => onCreateEvent(day)}>
              {HOURS.map(h => (
                <div key={h} className="h-[60px] border-b border-border" />
              ))}
              {/* Events positioned */}
              {dayActs.map(act => {
                const startMin = act.startTime ? parseInt(act.startTime.split(':')[0]) * 60 + parseInt(act.startTime.split(':')[1]) : 480;
                const endMin = act.endTime ? parseInt(act.endTime.split(':')[0]) * 60 + parseInt(act.endTime.split(':')[1]) : startMin + 60;
                const top = startMin;
                const height = Math.max(endMin - startMin, 25);
                return (
                  <button
                    key={act.id}
                    onClick={() => onEditEvent(act)}
                    className={cn(
                      'absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium overflow-hidden cursor-pointer',
                      getEventColor(act.id),
                      act.status === 'done' && 'opacity-50'
                    )}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="flex items-center gap-1">
                      <p className="truncate font-semibold">{act.title}</p>
                      {isTaskActivity(act.title) && <span className="text-[8px] bg-background/50 px-0.5 rounded shrink-0">T</span>}
                    </div>
                    {height > 30 && act.startTime && (
                      <p className="truncate opacity-80 text-[9px]">
                        {act.startTime}{act.endTime && ` – ${act.endTime}`}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* ─── Day View ─── */
interface DayViewProps {
  date: Date;
  activities: ScheduleActivity[];
  onCreateEvent: () => void;
  onEditEvent: (a: ScheduleActivity) => void;
  onToggleStatus: (a: ScheduleActivity) => void;
  onDeleteEvent: (id: string) => void;
  getProductInfo?: (productId?: string) => { emoji: string; name: string; color: string } | null;
  isTaskActivity: (title: string) => boolean;
}

const DayView = ({ date, activities, onCreateEvent, onEditEvent, onToggleStatus, onDeleteEvent, getProductInfo, isTaskActivity }: DayViewProps) => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground capitalize">
            {format(date, 'EEEE', { locale: ptBR })}
          </p>
          <p className="text-3xl font-bold text-foreground">{format(date, 'd')}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {format(date, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={onCreateEvent}>
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </div>
    </div>
    <div className="flex-1 overflow-auto">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
          <CalendarDays className="h-12 w-12 opacity-30" />
          <p className="text-sm">Nenhum evento neste dia</p>
          <Button variant="outline" size="sm" onClick={onCreateEvent}>
            Criar evento
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {activities
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            .map(act => (
              <Card
                key={act.id}
                className={cn(
                  'p-4 cursor-pointer border-l-4 transition-all hover:shadow-md',
                  act.status === 'done' ? 'opacity-60 border-l-muted-foreground' : 'border-l-primary'
                )}
                onClick={() => onEditEvent(act)}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(act); }}
                    className="mt-0.5 shrink-0"
                  >
                    {act.status === 'done'
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('font-semibold text-foreground', act.status === 'done' && 'line-through text-muted-foreground')}>
                        {act.title}
                      </p>
                      {isTaskActivity(act.title) && (
                        <Badge variant="secondary" className="text-xs">
                          Task
                        </Badge>
                      )}
                      {getProductInfo && act.productId && (() => { const p = getProductInfo(act.productId); return p ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                          {p.emoji} {p.name}
                        </Badge>
                      ) : null; })()}
                    </div>
                    {act.startTime && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {act.startTime}{act.endTime && ` – ${act.endTime}`}
                      </p>
                    )}
                    {act.description && (
                      <p className="text-sm text-muted-foreground mt-1">{act.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEditEvent(act); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteEvent(act.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  </div>
);

export default AgendaPage;
