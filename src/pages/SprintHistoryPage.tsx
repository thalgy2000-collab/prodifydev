import { useSprintStore } from '@/hooks/useSprintStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { SPRINT_STATUS_CONFIG } from '@/types/sprint';
import { TASK_STATUS_CONFIG } from '@/types/backlog';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { historyTourSteps } from '@/lib/featureTours';

const SprintHistoryPage = () => {
  const { sprints } = useSprintStore();
  const { tasks } = useBacklogStore();

  const completed = sprints.filter(s => s.status === 'completed');

  const { TourElement } = useFeatureTour('historico', historyTourSteps);

  return (
    <div data-tour-feature="history-list" className="space-y-6">
      {TourElement}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de Sprints</h1>
        <p className="text-sm text-muted-foreground">Revisão das sprints concluídas</p>
      </div>

      {completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <History className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhuma sprint concluída</p>
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprintId === sprint.id || t.returnedFromSprintId === sprint.id);
            const done = sprintTasks.filter(t => t.status === 'done').length;
            const total = sprintTasks.length;
            return (
              <div key={sprint.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{sprint.name}</h2>
                    {sprint.goal && <p className="mt-1 text-sm text-muted-foreground">{sprint.goal}</p>}
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{sprint.startDate} → {sprint.endDate}</p>
                  </div>
                  <Badge variant="secondary">{done}/{total} concluídas</Badge>
                </div>
                {sprintTasks.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {sprintTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                        <span className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                        <Badge variant="outline" className="text-xs">{TASK_STATUS_CONFIG[task.status]?.label}</Badge>
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

export default SprintHistoryPage;
