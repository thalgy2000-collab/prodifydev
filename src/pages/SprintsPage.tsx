import { useState } from 'react';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { Sprint, SPRINT_STATUS_CONFIG, SprintStatus } from '@/types/sprint';
import { TASK_STATUS_CONFIG, TaskStatus } from '@/types/backlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Zap, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SprintsPage = () => {
  const { sprints, addSprint, updateSprint, deleteSprint } = useSprintStore();
  const { tasks, updateTask } = useBacklogStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeSprints = sprints.filter(s => s.status !== 'completed');

  const handleCreate = () => {
    if (!name.trim() || !startDate || !endDate) return;
    addSprint({ name, goal, startDate, endDate, status: 'planning' });
    setName(''); setGoal(''); setStartDate(''); setEndDate(''); setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprints</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus ciclos de trabalho</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nova Sprint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Sprint</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input placeholder="Sprint 1" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Meta</Label><Input placeholder="Objetivo da sprint..." value={goal} onChange={e => setGoal(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2"><Label>Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div className="flex-1 space-y-2"><Label>Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Sprint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeSprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Zap className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhuma sprint ativa</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
            const sCfg = SPRINT_STATUS_CONFIG[sprint.status];
            return (
              <div key={sprint.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{sprint.name}</h2>
                      <Badge variant="secondary" style={{ backgroundColor: `hsl(${sCfg.color} / 0.15)`, color: `hsl(${sCfg.color})` }}>{sCfg.label}</Badge>
                    </div>
                    {sprint.goal && <p className="mt-1 text-sm text-muted-foreground">{sprint.goal}</p>}
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{sprint.startDate} → {sprint.endDate}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select value={sprint.status} onValueChange={v => updateSprint(sprint.id, { status: v as SprintStatus })}>
                      <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(SPRINT_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSprint(sprint.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {sprintTasks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {sprintTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                        <span className="text-sm">{task.title}</span>
                        <Select value={task.status} onValueChange={v => updateTask(task.id, { status: v as TaskStatus })}>
                          <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintsPage;
