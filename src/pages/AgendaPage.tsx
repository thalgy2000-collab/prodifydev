import { useState, useMemo } from 'react';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useProduct } from '@/contexts/ProductContext';
import { useGoogleCalendar, isGoogleEventId } from '@/hooks/useGoogleCalendar';
import { ScheduleActivity, ACTIVITY_STATUS_CONFIG } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Circle,
  Clock, CalendarDays, LayoutGrid, List, Pencil, Link2, Unlink, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';
type EventCategory = 'meeting' | 'task' | 'sprint' | 'release';
type FilterKey = 'all' | EventCategory;

// Category palette — saturated HSL color used at 12% bg + as left border
const CATEGORY_COLORS: Record<EventCategory, { hsl: string; label: string }> = {
  meeting: { hsl: '217 91% 60%', label: 'Reuniões' },   // blue
  task:    { hsl: '262 83% 62%', label: 'Tarefas' },    // purple
  sprint:  { hsl: '160 65% 45%', label: 'Sprints' },    // green
  release: { hsl: '25 95% 55%',  label: 'Releases' },   // orange
};

function getCategory(act: ScheduleActivity, isTask: boolean): EventCategory {
  const title = act.title.toLowerCase();
  if (title.includes('release')) return 'release';
  if (isTask) return 'task';
  if (act.sprintId) return 'sprint';
  return 'meeting';
}

function getEventStyle(category: EventCategory): React.CSSProperties {
  const { hsl } = CATEGORY_COLORS[category];
  return {
    backgroundColor: `hsla(${hsl}, 0.12)`,
    borderLeft: `4px solid hsl(${hsl})`,
    borderRadius: '4px',
    color: `hsl(${hsl})`,
  };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// Convert "HH:MM" to minutes since midnight. Defaults: start=08:00, end=start+60.
function getEventInterval(a: ScheduleActivity): { start: number; end: number } {
  const start = a.startTime
    ? parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1])
    : 480;
  const end = a.endTime
    ? parseInt(a.endTime.split(':')[0]) * 60 + parseInt(a.endTime.split(':')[1])
    : start + 60;
  return { start, end: Math.max(end, start + 1) };
}

// For each activity id, count how many other activities (same date) overlap its
// time interval (inclusive of itself). Two events overlap when start < other.end
// AND end > other.start.
function buildOverlapCounts(activities: ScheduleActivity[]): Record<string, number> {
  const byDay: Record<string, ScheduleActivity[]> = {};
  for (const a of activities) {
    (byDay[a.activityDate] ||= []).push(a);
  }
  const counts: Record<string, number> = {};
  for (const list of Object.values(byDay)) {
    const intervals = list.map(a => ({ id: a.id, ...getEventInterval(a) }));
    for (const ev of intervals) {
      let n = 0;
      for (const other of intervals) {
        if (ev.start < other.end && ev.end > other.start) n++;
      }
      counts[ev.id] = n;
    }
  }
  return counts;
}

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'meeting', label: 'Reuniões' },
  { key: 'task', label: 'Tarefas' },
  { key: 'sprint', label: 'Sprints' },
  { key: 'release', label: 'Releases' },
];

/* ─── Tooltip wrapper for events ─── */
interface EventTooltipProps {
  act: ScheduleActivity;
  category: EventCategory;
  productLabel?: string | null;
  isTask: boolean;
  children: React.ReactNode;
}
const EventTooltip = ({ act, category, productLabel, isTask, children }: EventTooltipProps) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: `hsl(${CATEGORY_COLORS[category].hsl})` }}
          />
          <p className="font-semibold text-xs">{act.title}</p>
        </div>
        <p className="text-[10px] text-muted-foreground capitalize">
          {CATEGORY_COLORS[category].label.replace(/s$/, '')}
          {isTask && ' • Tarefa'}
          {productLabel && ` • ${productLabel}`}
        </p>
        {act.startTime && (
          <p className="text-[10px] flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {act.startTime}{act.endTime && ` – ${act.endTime}`}
          </p>
        )}
        {act.description && (
          <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{act.description}</p>
        )}
        {act.status === 'done' && (
          <p className="text-[10px] text-green-500">✓ Concluído</p>
        )}
      </div>
    </TooltipContent>
  </Tooltip>
);

const AgendaPage = () => {
  const { activities: localActivities, addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const { sprints } = useSprintStore();
  const { tasks } = useBacklogStore();
  const { products } = useProduct();
  const gcal = useGoogleCalendar();

  const allActivities = useMemo(
    () => [...localActivities, ...gcal.events],
    [localActivities, gcal.events]
  );

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
  const [filter, setFilter] = useState<FilterKey>('all');

  // Apply category filter
  const activities = useMemo(() => {
    if (filter === 'all') return allActivities;
    return allActivities.filter(a => getCategory(a, isTaskActivity(a.title)) === filter);
  }, [allActivities, filter, taskTitles]);

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
    if (isGoogleEventId(act.id)) {
      toast.info('Eventos do Google Calendar são somente leitura.');
      return;
    }
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
    if (isGoogleEventId(act.id)) return;
    updateActivity(act.id, { status: act.status === 'pending' ? 'done' : 'pending' });
  };

  const handleDelete = (id: string) => {
    if (isGoogleEventId(id)) {
      toast.info('Eventos do Google Calendar não podem ser removidos daqui.');
      return;
    }
    deleteActivity(id);
  };

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

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

  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
          <h1 className="text-base sm:text-xl font-bold text-foreground">Agenda</h1>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-sm sm:text-lg font-semibold text-foreground capitalize truncate">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
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
              <Button size="sm" className="hidden md:inline-flex gap-1.5" onClick={() => openCreate()}>
                <Plus className="h-4 w-4" />
                Criar
              </Button>
            </DialogTrigger>
            {!gcal.connected ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:inline-flex gap-1.5"
                onClick={gcal.connect}
                disabled={gcal.loading}
              >
                <Link2 className="h-4 w-4" />
                Conectar Google
              </Button>
            ) : (
              <div className="hidden md:inline-flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] gap-1" title={gcal.email || ''}>
                  <CalendarDays className="h-3 w-3" /> Google: {gcal.email || 'conectado'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={gcal.refresh} title="Atualizar eventos">
                  <RefreshCw className={cn("h-4 w-4", gcal.loading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={gcal.disconnect} title="Desconectar">
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            )}
            <DialogContent className="md:max-w-lg max-w-full w-full md:rounded-lg rounded-t-2xl md:bottom-auto md:top-[50%] md:translate-y-[-50%] bottom-0 top-auto translate-y-0 md:max-h-[85vh] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 pb-4">
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

      {/* Quick filters */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-border bg-card shrink-0 overflow-x-auto">
        {FILTER_OPTIONS.map(opt => {
          const active = filter === opt.key;
          const color = opt.key !== 'all' ? CATEGORY_COLORS[opt.key].hsl : null;
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors shrink-0',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {color && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: `hsl(${color})` }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex flex-col w-full lg:w-64 lg:border-r border-border bg-card shrink-0 overflow-hidden h-full">
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
                      'relative h-10 w-10 lg:h-7 lg:w-7 mx-auto rounded-full text-sm lg:text-xs flex items-center justify-center transition-colors',
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
              <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
                {selectedDateActivities.map(act => {
                  const cat = getCategory(act, isTaskActivity(act.title));
                  const prod = getProductInfo(act.productId);
                  return (
                    <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)}>
                      <div
                        className={cn('p-2 cursor-pointer transition-opacity', act.status === 'done' && 'opacity-50')}
                        style={getEventStyle(cat)}
                        onClick={() => openEdit(act)}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStatus(act); }}
                            className="mt-0.5 shrink-0 text-foreground/70"
                          >
                            {act.status === 'done'
                              ? <CheckCircle2 className="h-3.5 w-3.5" />
                              : <Circle className="h-3.5 w-3.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-semibold text-foreground truncate', act.status === 'done' && 'line-through')}>
                              {act.title}
                            </p>
                            {act.startTime && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {act.startTime}{act.endTime && ` – ${act.endTime}`}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(act.id); }}
                            className="shrink-0 opacity-60 hover:opacity-100 text-foreground/70"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </EventTooltip>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main calendar area */}
        <div className="hidden lg:flex flex-1 min-w-0 min-h-0 overflow-hidden flex-col">
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
              getProductInfo={getProductInfo}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              date={selectedDate}
              activities={selectedDateActivities}
              onCreateEvent={() => openCreate(format(selectedDate, 'yyyy-MM-dd'))}
              onEditEvent={openEdit}
              onToggleStatus={toggleStatus}
              onDeleteEvent={handleDelete}
              getProductInfo={getProductInfo}
              isTaskActivity={isTaskActivity}
            />
          )}
        </div>
      </div>

      <button
        onClick={() => openCreate()}
        aria-label="Nova atividade"
        className="lg:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
    </TooltipProvider>
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

const MonthView = ({ days, currentDate, selectedDate, activities, onSelectDate, onCreateEvent, onEditEvent, isTaskActivity, getProductInfo }: MonthViewProps) => (
  <div className="h-full flex flex-col">
    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
      {WEEK_DAYS_SHORT.map(d => (
        <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
          {d}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
      {days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayActs = activities.filter(a => a.activityDate === dayStr);
        const inMonth = isSameMonth(day, currentDate);
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        // Compact font when more than 3 events same day (proxy for "same time slot")
        const dense = dayActs.length > 3;

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
              {dayActs.slice(0, 3).map(act => {
                const cat = getCategory(act, isTaskActivity(act.title));
                const prod = getProductInfo?.(act.productId);
                return (
                  <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditEvent(act); }}
                      style={getEventStyle(cat)}
                      className={cn(
                        'w-full text-left px-1.5 py-0.5 font-medium truncate block text-foreground',
                        dense ? 'text-[9px]' : 'text-xs',
                        act.status === 'done' && 'opacity-50 line-through'
                      )}
                    >
                      {act.startTime && <span className="mr-1 opacity-70">{act.startTime}</span>}
                      {act.title}
                    </button>
                  </EventTooltip>
                );
              })}
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
  getProductInfo?: (productId?: string) => { emoji: string; name: string; color: string } | null;
}

const WeekView = ({ days, activities, selectedDate, onSelectDate, onCreateEvent, onEditEvent, isTaskActivity, getProductInfo }: WeekViewProps) => {
  // Build per-day overlap counts by hour bucket
  const overlapByDay = useMemo(() => {
    const map: Record<string, Record<number, number>> = {};
    for (const a of activities) {
      const day = a.activityDate;
      const h = a.startTime ? parseInt(a.startTime.split(':')[0]) : 8;
      map[day] = map[day] || {};
      map[day][h] = (map[day][h] || 0) + 1;
    }
    return map;
  }, [activities]);

  return (
  <div className="h-full flex flex-col">
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
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[1440px]">
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="h-[60px] border-b border-border flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayActs = activities.filter(a => a.activityDate === dayStr);
          return (
            <div key={dayStr} className="relative border-l border-border" onDoubleClick={() => onCreateEvent(day)}>
              {HOURS.map(h => (
                <div key={h} className="h-[60px] border-b border-border" />
              ))}
              {dayActs.map(act => {
                const startMin = act.startTime ? parseInt(act.startTime.split(':')[0]) * 60 + parseInt(act.startTime.split(':')[1]) : 480;
                const endMin = act.endTime ? parseInt(act.endTime.split(':')[0]) * 60 + parseInt(act.endTime.split(':')[1]) : startMin + 60;
                const top = startMin;
                const height = Math.max(endMin - startMin, 25);
                const cat = getCategory(act, isTaskActivity(act.title));
                const hourBucket = Math.floor(startMin / 60);
                const overlapCount = overlapByDay[dayStr]?.[hourBucket] || 1;
                const dense = overlapCount > 3;
                const prod = getProductInfo?.(act.productId);
                return (
                  <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)}>
                    <button
                      onClick={() => onEditEvent(act)}
                      style={{ top: `${top}px`, height: `${height}px`, ...getEventStyle(cat) }}
                      className={cn(
                        'absolute left-0.5 right-0.5 px-1.5 py-0.5 font-medium overflow-hidden cursor-pointer text-foreground text-left',
                        dense ? 'text-[9px]' : 'text-xs',
                        act.status === 'done' && 'opacity-50'
                      )}
                    >
                      <p className="truncate font-semibold">{act.title}</p>
                      {height > 30 && act.startTime && !dense && (
                        <p className="truncate opacity-70 text-[9px]">
                          {act.startTime}{act.endTime && ` – ${act.endTime}`}
                        </p>
                      )}
                    </button>
                  </EventTooltip>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
};

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

const DayView = ({ date, activities, onCreateEvent, onEditEvent, onToggleStatus, onDeleteEvent, getProductInfo, isTaskActivity }: DayViewProps) => {
  // Compute overlapping events per hour bucket
  const overlapByHour = useMemo(() => {
    const m: Record<number, number> = {};
    for (const a of activities) {
      const h = a.startTime ? parseInt(a.startTime.split(':')[0]) : 8;
      m[h] = (m[h] || 0) + 1;
    }
    return m;
  }, [activities]);

  return (
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
        <div className="p-4 space-y-2">
          {activities
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            .map(act => {
              const cat = getCategory(act, isTaskActivity(act.title));
              const h = act.startTime ? parseInt(act.startTime.split(':')[0]) : 8;
              const dense = (overlapByHour[h] || 1) > 3;
              const prod = getProductInfo?.(act.productId);
              return (
                <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)}>
                  <div
                    className={cn(
                      'p-3 cursor-pointer transition-all hover:shadow-md',
                      act.status === 'done' && 'opacity-60'
                    )}
                    style={getEventStyle(cat)}
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
                        <p className={cn(
                          'font-semibold text-foreground',
                          dense ? 'text-xs' : 'text-sm',
                          act.status === 'done' && 'line-through text-muted-foreground'
                        )}>
                          {act.title}
                        </p>
                        {act.startTime && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {act.startTime}{act.endTime && ` – ${act.endTime}`}
                          </p>
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
                  </div>
                </EventTooltip>
              );
            })}
        </div>
      )}
    </div>
  </div>
  );
};

export default AgendaPage;
