import { useEffect, useMemo, useState, useCallback } from 'react';
import { useOKRStore } from '@/hooks/useOKRStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { getCurrentQuarter, getQuarters } from '@/types/okr';
import { TASK_STATUS_CONFIG } from '@/types/backlog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Target, ListTodo, Zap, Map, X } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { analyticsTourSteps } from '@/lib/featureTours';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import { BurndownChart } from '@/components/BurndownChart';

const QUARTER_OPTIONS = (() => {
  const year = new Date().getFullYear();
  return [...getQuarters(year - 1), ...getQuarters(year), ...getQuarters(year + 1)];
})();

const AnalyticsPage = () => {
  const { activeProduct } = useProduct();
  const { objectives, getObjectiveProgress } = useOKRStore();
  const { tasks } = useBacklogStore();
  const { sprints } = useSprintStore();
  const { items: initiatives } = useRoadmapStore();

  const [quarter, setQuarter] = usePersistedState('analytics_quarter', getCurrentQuarter());
  const [sprintFilter, setSprintFilter] = usePersistedState<string>('analytics_sprint', 'all');
  const [assigneeFilter, setAssigneeFilter] = usePersistedState<string>('analytics_assignee', 'all');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('analytics_status', 'all');
  const [burndownSprintId, setBurndownSprintId] = usePersistedState<string>('analytics_burndown_sprint', 'auto');

  const [members, setMembers] = useState<{ userId: string; displayName: string }[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!activeProduct) { setMembers([]); return; }
    const { data: membersData } = await (supabase.from('product_members') as any)
      .select('user_id').eq('product_id', activeProduct.id);
    if (!membersData?.length) { setMembers([]); return; }
    const ids = membersData.map((m: any) => m.user_id);
    const { data: profiles } = await (supabase.from('profiles') as any)
      .select('id, display_name, full_name, email').in('id', ids);
    const map: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { map[p.id] = p; });
    setMembers(membersData.map((m: any) => ({
      userId: m.user_id,
      displayName: map[m.user_id]?.display_name || map[m.user_id]?.full_name || map[m.user_id]?.email || 'Sem nome',
    })));
  }, [activeProduct]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Filtragem
  const qObjectives = useMemo(() => objectives.filter(o => o.quarter === quarter), [objectives, quarter]);

  const qSprints = useMemo(() => {
    let list = sprints;
    if (sprintFilter !== 'all') list = list.filter(s => s.id === sprintFilter);
    return list;
  }, [sprints, sprintFilter]);

  const qInitiatives = useMemo(() => initiatives.filter(i => i.quarter === quarter), [initiatives, quarter]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (sprintFilter !== 'all' && t.sprintId !== sprintFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && t.assigneeId) return false;
        if (assigneeFilter !== 'unassigned' && t.assigneeId !== assigneeFilter) return false;
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, sprintFilter, assigneeFilter, statusFilter]);

  const avgProgress = qObjectives.length > 0
    ? Math.round(qObjectives.reduce((acc, o) => acc + getObjectiveProgress(o), 0) / qObjectives.length)
    : 0;

  const tasksByStatus = Object.entries(TASK_STATUS_CONFIG).map(([status, cfg]) => ({
    status, label: cfg.label, count: filteredTasks.filter(t => t.status === status).length,
  }));

  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const hasActiveFilters = sprintFilter !== 'all' || assigneeFilter !== 'all' || statusFilter !== 'all' || quarter !== getCurrentQuarter();

  const clearFilters = () => {
    setQuarter(getCurrentQuarter());
    setSprintFilter('all');
    setAssigneeFilter('all');
    setStatusFilter('all');
  };

  const { TourElement } = useFeatureTour('analises', analyticsTourSteps);

  return (
    <div className="space-y-6">
      {TourElement}
      <div data-tour-feature="analytics-period">
        <h1 className="text-2xl font-bold tracking-tight">Análises</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu progresso — {quarter}</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Trimestre</label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Sprint</label>
              <Select value={sprintFilter} onValueChange={setSprintFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Status da tarefa</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div data-tour-feature="analytics-summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qObjectives.length}</div>
            <p className="text-xs text-muted-foreground">progresso médio: {avgProgress}%</p>
            <Progress value={avgProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">{doneTasks} concluídas ({completionRate}%)</p>
            <Progress value={completionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sprints</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qSprints.length}</div>
            <p className="text-xs text-muted-foreground">{qSprints.filter(s => s.status === 'completed').length} concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iniciativas</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qInitiatives.length}</div>
            <p className="text-xs text-muted-foreground">{qInitiatives.filter(i => i.status === 'done').length} concluídas</p>
          </CardContent>
        </Card>
      </div>

      <BurndownChart
        sprints={sprints}
        tasks={tasks}
        selectedSprintId={burndownSprintId}
        onSelectSprint={setBurndownSprintId}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Tarefas por Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tasksByStatus.map(ts => (
            <div key={ts.status} className="flex items-center justify-between">
              <span className="text-sm">{ts.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalTasks > 0 ? (ts.count / totalTasks) * 100 : 0}%` }} />
                </div>
                <span className="font-mono text-xs text-muted-foreground w-6 text-right">{ts.count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
