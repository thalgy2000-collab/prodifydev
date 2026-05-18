import { useState, useMemo } from 'react';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useParentTaskTitles } from '@/hooks/useParentTaskTitles';
import { ScheduleActivity } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Circle,
  Clock, CalendarDays, Pencil,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

const EVENT_HUES = [217, 262, 160, 25, 340, 190, 45, 280];

function getEventHue(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return EVENT_HUES[Math.abs(hash) % EVENT_HUES.length];
}

function getEventStyle(id: string, isDark = false): React.CSSProperties {
  const h = getEventHue(id);
  const bgAlpha = isDark ? 0.22 : 0.12;
  const fgLightness = isDark ? 78 : 55;
  return {
    backgroundColor: `hsla(${h}, 80%, 55%, ${bgAlpha})`,
    borderLeft: `4px solid hsl(${h}, 80%, 55%)`,
    borderRadius: '4px',
    color: `hsl(${h}, 80%, ${fgLightness}%)`,
  };
}

const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const ProductAgendaPage = () => {
  const { activities, addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const { sprints } = useSprintStore();
  const activityIds = useMemo(() => activities.map(a => a.id), [activities]);
  const parentTitles = useParentTaskTitles(activityIds);
  const getDisplayTitle = (act: ScheduleActivity) =>
    parentTitles[act.id] ? `${parentTitles[act.id]} › ${act.title}` : act.title;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sprintId, setSprintId] = useState('none');

  const resetForm = () => {
    setTitle(''); setDesc('');
    setDate(format(selectedDate, 'yyyy-MM-dd'));
    setStartTime(''); setEndTime('');
    setSprintId('none'); setEditingActivity(null);
  };

  const openCreate = (dateStr?: string) => {
    resetForm();
    if (dateStr) setDate(dateStr);
    setCreateOpen(true);
  };

  const openEdit = (act: ScheduleActivity) => {
    setEditingActivity(act);
    setTitle(act.title); setDesc(act.description);
    setDate(act.activityDate);
    setStartTime(act.startTime || ''); setEndTime(act.endTime || '');
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

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getActivitiesForDate = (d: Date) =>
    activities.filter(a => a.activityDate === format(d, 'yyyy-MM-dd'));

  const selectedDateActivities = getActivitiesForDate(selectedDate);

  const navigateMonth = (dir: number) => {
    setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
          <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Agenda do Produto</h1>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">Hoje</Button>
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
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden md:inline-flex gap-1.5" onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="md:max-w-lg max-w-full w-full md:rounded-lg rounded-t-2xl md:bottom-auto md:top-[50%] md:translate-y-[-50%] bottom-0 top-auto translate-y-0 md:max-h-[85vh] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
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
                {editingActivity ? 'Salvar alterações' : 'Criar evento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Mini calendar + day detail (full width on mobile) */}
        <aside className="flex flex-col w-full lg:w-64 lg:border-r border-border bg-card shrink-0 overflow-y-auto">
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
                    onClick={() => { setSelectedDate(day); setCurrentDate(day); }}
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
          <div className="flex-1 border-t border-border p-3">
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
              <div className="space-y-2">
                {selectedDateActivities.map(act => (
                  <div
                    key={act.id}
                    style={getEventStyle(act.id)}
                    className={cn('p-2.5 cursor-pointer transition-opacity text-foreground', act.status === 'done' && 'opacity-50')}
                    onClick={() => openEdit(act)}
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleStatus(act); }} className="mt-0.5 shrink-0">
                        {act.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-semibold', act.status === 'done' && 'line-through')}>{getDisplayTitle(act)}</p>
                        {act.startTime && (
                          <p className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {act.startTime}{act.endTime && ` – ${act.endTime}`}
                          </p>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteActivity(act.id); }} className="shrink-0 opacity-60 hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main month grid - hidden on mobile */}
        <div className="hidden lg:block flex-1 overflow-auto">
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {WEEK_DAYS_SHORT.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {monthDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayActs = activities.filter(a => a.activityDate === dayStr);
                const inMonth = isSameMonth(day, currentDate);
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openCreate(dayStr)}
                    className={cn(
                      'border-b border-r border-border p-1 cursor-pointer transition-colors min-h-[80px]',
                      !inMonth && 'bg-muted/20',
                      selected && 'bg-primary/5',
                      'hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                        today && 'bg-primary text-primary-foreground',
                        !today && !inMonth && 'text-muted-foreground/40',
                        !today && inMonth && 'text-foreground'
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayActs.slice(0, 3).map(act => (
                        <button
                          key={act.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(act); }}
                          style={getEventStyle(act.id)}
                          className={cn(
                            'w-full text-left px-1.5 py-0.5 text-[10px] font-medium truncate block text-foreground',
                            act.status === 'done' && 'opacity-50 line-through'
                          )}
                        >
                          {act.startTime && <span className="mr-1">{act.startTime}</span>}
                          {getDisplayTitle(act)}
                        </button>
                      ))}
                      {dayActs.length > 3 && (
                        <p className="text-[10px] text-muted-foreground px-1.5">+{dayActs.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => openCreate()}
        aria-label="Novo evento"
        className="lg:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ProductAgendaPage;
