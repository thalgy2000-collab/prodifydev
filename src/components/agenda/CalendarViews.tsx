import { useMemo } from 'react';
import { format, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Clock, CheckCircle2, Circle, Pencil, Trash2, CalendarDays, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { ScheduleActivity } from '@/types/schedule';

/* ─────── Shared types & helpers ─────── */
export type EventCategory = 'meeting' | 'task' | 'sprint' | 'release';

export const CATEGORY_COLORS: Record<EventCategory, { hsl: string; label: string }> = {
  meeting: { hsl: '217 91% 60%', label: 'Reuniões' },
  task:    { hsl: '262 83% 62%', label: 'Tarefas' },
  sprint:  { hsl: '160 65% 45%', label: 'Sprints' },
  release: { hsl: '25 95% 55%',  label: 'Releases' },
};

export function getCategory(act: ScheduleActivity, isTask: boolean): EventCategory {
  const title = act.title.toLowerCase();
  if (title.includes('release')) return 'release';
  if (isTask) return 'task';
  if (act.sprintId) return 'sprint';
  return 'meeting';
}

export function getEventStyle(category: EventCategory, isDark = false): React.CSSProperties {
  const { hsl } = CATEGORY_COLORS[category];
  const bgAlpha = isDark ? 0.22 : 0.12;
  const parts = hsl.split(' ');
  const hue = parts[0];
  const sat = parts[1];
  const fgLightness = isDark ? '78%' : parts[2];
  return {
    backgroundColor: `hsla(${hsl}, ${bgAlpha})`,
    borderLeft: `4px solid hsl(${hsl})`,
    borderRadius: '4px',
    color: `hsl(${hue} ${sat} ${fgLightness})`,
  };
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function getEventInterval(a: ScheduleActivity): { start: number; end: number } {
  const start = a.startTime
    ? parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1])
    : 480;
  const end = a.endTime
    ? parseInt(a.endTime.split(':')[0]) * 60 + parseInt(a.endTime.split(':')[1])
    : start + 60;
  return { start, end: Math.max(end, start + 1) };
}

export function buildOverlapCounts(activities: ScheduleActivity[]): Record<string, number> {
  const byDay: Record<string, ScheduleActivity[]> = {};
  for (const a of activities) (byDay[a.activityDate] ||= []).push(a);
  const counts: Record<string, number> = {};
  for (const list of Object.values(byDay)) {
    const intervals = list.map(a => ({ id: a.id, ...getEventInterval(a) }));
    for (const ev of intervals) {
      let n = 0;
      for (const other of intervals) if (ev.start < other.end && ev.end > other.start) n++;
      counts[ev.id] = n;
    }
  }
  return counts;
}

/* ─────── Tooltip ─────── */
interface EventTooltipProps {
  act: ScheduleActivity;
  category: EventCategory;
  productLabel?: string | null;
  isTask: boolean;
  displayTitle?: string;
  children: React.ReactNode;
}
export const EventTooltip = ({ act, category, productLabel, isTask, displayTitle, children }: EventTooltipProps) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${CATEGORY_COLORS[category].hsl})` }} />
          <p className="font-semibold text-xs">{displayTitle ?? act.title}</p>
          {act.sync_source === 'both' && <CalendarCheck className="h-3.5 w-3.5 text-green-500" title="Sincronizado com Google Calendar" />}
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
        {act.status === 'done' && <p className="text-[10px] text-success">✓ Concluído</p>}
      </div>
    </TooltipContent>
  </Tooltip>
);

/* ─────── Month View ─────── */
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
  getDisplayTitle: (act: ScheduleActivity) => string;
}

export const MonthView = ({ days, currentDate, selectedDate, activities, onSelectDate, onCreateEvent, onEditEvent, isTaskActivity, getProductInfo, getDisplayTitle }: MonthViewProps) => {
  const { isDark } = useTheme();
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEK_DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayActs = activities.filter(a => a.activityDate === dayStr);
          const inMonth = isSameMonth(day, currentDate);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
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
                {dayActs.slice(0, 3).map(act => {
                  const cat = getCategory(act, isTaskActivity(act.title));
                  const prod = getProductInfo?.(act.productId);
                  return (
                    <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)} displayTitle={getDisplayTitle(act)}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditEvent(act); }}
                        style={getEventStyle(cat, isDark)}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 font-medium truncate block text-foreground',
                          dense ? 'text-[9px]' : 'text-xs',
                          act.status === 'done' && 'opacity-50 line-through'
                        )}
                      >
                        {act.startTime && <span className="mr-1 opacity-70">{act.startTime}</span>}
                        {getDisplayTitle(act)}
                        {act.sync_source === 'both' && (
                          <CalendarCheck className="h-3 w-3 text-green-500 ml-1 inline-block shrink-0" title="Sincronizado com Google Calendar" />
                        )}
                      </button>
                    </EventTooltip>
                  );
                })}
                {dayActs.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1.5">+{dayActs.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────── Week View ─────── */
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
  getDisplayTitle: (act: ScheduleActivity) => string;
}

export const WeekView = ({ days, activities, selectedDate, onSelectDate, onCreateEvent, onEditEvent, isTaskActivity, getProductInfo, getDisplayTitle }: WeekViewProps) => {
  const { isDark } = useTheme();
  const overlapCounts = useMemo(() => buildOverlapCounts(activities), [activities]);

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30 sticky top-0 z-10">
        <div />
        {days.map(day => {
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className="py-2 text-center border-l border-border cursor-pointer" onClick={() => onSelectDate(day)}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
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
                <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayActs = activities.filter(a => a.activityDate === dayStr);
            return (
              <div key={dayStr} className="relative border-l border-border" onDoubleClick={() => onCreateEvent(day)}>
                {HOURS.map(h => <div key={h} className="h-[60px] border-b border-border" />)}
                {dayActs.map(act => {
                  const startMin = act.startTime ? parseInt(act.startTime.split(':')[0]) * 60 + parseInt(act.startTime.split(':')[1]) : 480;
                  const endMin = act.endTime ? parseInt(act.endTime.split(':')[0]) * 60 + parseInt(act.endTime.split(':')[1]) : startMin + 60;
                  const top = startMin;
                  const height = Math.max(endMin - startMin, 25);
                  const cat = getCategory(act, isTaskActivity(act.title));
                  const dense = (overlapCounts[act.id] || 1) > 3;
                  const prod = getProductInfo?.(act.productId);
                  return (
                    <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)} displayTitle={getDisplayTitle(act)}>
                      <button
                        onClick={() => onEditEvent(act)}
                        style={{ top: `${top}px`, height: `${height}px`, ...getEventStyle(cat, isDark) }}
                        className={cn(
                          'absolute left-0.5 right-0.5 px-1.5 py-0.5 font-medium overflow-hidden cursor-pointer text-foreground text-left',
                          dense ? 'text-[9px]' : 'text-xs',
                          act.status === 'done' && 'opacity-50'
                        )}
                      >
                        <div className="truncate font-semibold flex items-center gap-1">
                          <span className="truncate">{getDisplayTitle(act)}</span>
                          {act.sync_source === 'both' && <CalendarCheck className="h-3 w-3 text-green-500 shrink-0" />}
                        </div>
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

/* ─────── Day View ─────── */
interface DayViewProps {
  date: Date;
  activities: ScheduleActivity[];
  onCreateEvent: () => void;
  onEditEvent: (a: ScheduleActivity) => void;
  onToggleStatus: (a: ScheduleActivity) => void;
  onDeleteEvent: (id: string) => void;
  getProductInfo?: (productId?: string) => { emoji: string; name: string; color: string } | null;
  isTaskActivity: (title: string) => boolean;
  getDisplayTitle: (act: ScheduleActivity) => string;
}

export const DayView = ({ date, activities, onCreateEvent, onEditEvent, onToggleStatus, onDeleteEvent, getProductInfo, isTaskActivity, getDisplayTitle }: DayViewProps) => {
  const { isDark } = useTheme();
  const overlapCounts = useMemo(() => buildOverlapCounts(activities), [activities]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground capitalize">{format(date, 'EEEE', { locale: ptBR })}</p>
            <p className="text-3xl font-bold text-foreground">{format(date, 'd')}</p>
            <p className="text-sm text-muted-foreground capitalize">{format(date, 'MMMM yyyy', { locale: ptBR })}</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onCreateEvent}>
            <Plus className="h-4 w-4" /> Novo evento
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <CalendarDays className="h-12 w-12 opacity-30" />
            <p className="text-sm">Nenhum evento neste dia</p>
            <Button variant="outline" size="sm" onClick={onCreateEvent}>Criar evento</Button>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {activities
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
              .map(act => {
                const cat = getCategory(act, isTaskActivity(act.title));
                const dense = (overlapCounts[act.id] || 1) > 3;
                const prod = getProductInfo?.(act.productId);
                return (
                  <EventTooltip key={act.id} act={act} category={cat} productLabel={prod ? `${prod.emoji} ${prod.name}` : null} isTask={isTaskActivity(act.title)} displayTitle={getDisplayTitle(act)}>
                    <div
                      className={cn('p-3 cursor-pointer transition-all hover:shadow-md', act.status === 'done' && 'opacity-60')}
                      style={getEventStyle(cat, isDark)}
                      onClick={() => onEditEvent(act)}
                    >
                      <div className="flex items-start gap-3">
                        <button onClick={(e) => { e.stopPropagation(); onToggleStatus(act); }} className="mt-0.5 shrink-0">
                          {act.status === 'done'
                            ? <CheckCircle2 className="h-5 w-5 text-success" />
                            : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'font-semibold text-foreground flex items-center gap-1 flex-wrap',
                            dense ? 'text-xs' : 'text-sm',
                            act.status === 'done' && 'line-through text-muted-foreground'
                          )}>
                            <span>{getDisplayTitle(act)}</span>
                            {act.sync_source === 'both' && <CalendarCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                          </div>
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
