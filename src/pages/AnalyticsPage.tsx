import { useOKRStore } from '@/hooks/useOKRStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useSprintStore } from '@/hooks/useSprintStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { getCurrentQuarter } from '@/types/okr';
import { TASK_STATUS_CONFIG } from '@/types/backlog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Target, ListTodo, Zap, Map } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { analyticsTourSteps } from '@/lib/featureTours';

const AnalyticsPage = () => {
  const { objectives, getObjectiveProgress } = useOKRStore();
  const { tasks } = useBacklogStore();
  const { sprints } = useSprintStore();
  const { items: initiatives } = useRoadmapStore();

  const currentQ = getCurrentQuarter();
  const qObjectives = objectives.filter(o => o.quarter === currentQ);
  const avgProgress = qObjectives.length > 0
    ? Math.round(qObjectives.reduce((acc, o) => acc + getObjectiveProgress(o), 0) / qObjectives.length)
    : 0;

  const tasksByStatus = Object.entries(TASK_STATUS_CONFIG).map(([status, cfg]) => ({
    status, label: cfg.label, count: tasks.filter(t => t.status === status).length,
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;


  const { TourElement } = useFeatureTour('analises', analyticsTourSteps);

  return (
    <div className="space-y-6">
      {TourElement}
      <div data-tour-feature="analytics-period">
        <h1 className="text-2xl font-bold tracking-tight">Análises</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu progresso — {currentQ}</p>
      </div>

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
            <div className="text-2xl font-bold">{sprints.length}</div>
            <p className="text-xs text-muted-foreground">{sprints.filter(s => s.status === 'completed').length} concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iniciativas</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initiatives.length}</div>
            <p className="text-xs text-muted-foreground">{initiatives.filter(i => i.status === 'done').length} concluídas</p>
          </CardContent>
        </Card>
      </div>

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
