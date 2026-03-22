import { useState } from 'react';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { ScheduleActivity, ACTIVITY_STATUS_CONFIG, ActivityStatus } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarDays, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AgendaPage = () => {
  const { activities, addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const { sprints } = useSprintStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sprintId, setSprintId] = useState('none');
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleCreate = () => {
    if (!title.trim() || !date) return;
    addActivity({
      title, description: desc, activityDate: date,
      startTime: startTime || undefined, endTime: endTime || undefined,
      sprintId: sprintId !== 'none' ? sprintId : undefined, status: 'pending',
    });
    setTitle(''); setDesc(''); setStartTime(''); setEndTime(''); setSprintId('none'); setCreateOpen(false);
  };

  const toggleStatus = (act: ScheduleActivity) => {
    updateActivity(act.id, { status: act.status === 'pending' ? 'done' : 'pending' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Organize suas atividades semanais</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nova Atividade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2"><Label>Início</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                <div className="flex-1 space-y-2"><Label>Fim</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
              </div>
              {sprints.length > 0 && (
                <div className="space-y-2"><Label>Sprint</Label>
                  <Select value={sprintId} onValueChange={setSprintId}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Nenhuma</SelectItem>{sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</Button>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Hoje</Button>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>Próxima →</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {weekDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayActivities = activities.filter(a => a.activityDate === dayStr);
          const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={dayStr} className={`rounded-xl border p-3 ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              <div className="mb-2 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
              </div>
              <div className="space-y-2">
                {dayActivities.map(act => {
                  const sCfg = ACTIVITY_STATUS_CONFIG[act.status];
                  return (
                    <div key={act.id} className="group rounded-lg bg-secondary/40 p-2">
                      <div className="flex items-start gap-1.5">
                        <button onClick={() => toggleStatus(act)} className="mt-0.5 shrink-0">
                          {act.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${act.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{act.title}</p>
                          {act.startTime && <p className="text-[10px] text-muted-foreground">{act.startTime}{act.endTime && ` - ${act.endTime}`}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => deleteActivity(act.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaPage;
