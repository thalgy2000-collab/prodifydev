import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Sprint } from '@/types/sprint';
import { BacklogTask } from '@/types/backlog';
import { TrendingDown } from 'lucide-react';
import { formatDateBR } from '@/lib/utils';

interface BurndownChartProps {
  sprints: Sprint[];
  tasks: BacklogTask[];
  selectedSprintId: string;
  onSelectSprint: (id: string) => void;
}

const parseDate = (s: string) => {
  // YYYY-MM-DD strings are interpreted as UTC by `new Date`, which shifts the
  // day by one in negative-offset timezones (e.g. UTC-3). Force local midnight.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const formatDay = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export const BurndownChart = ({ sprints, tasks, selectedSprintId, onSelectSprint }: BurndownChartProps) => {
  const eligibleSprints = useMemo(
    () => sprints.filter(s => s.status === 'active' || s.status === 'completed'),
    [sprints]
  );

  const sprint = useMemo(() => {
    if (selectedSprintId === 'auto') {
      return eligibleSprints.find(s => s.status === 'active') || eligibleSprints[0];
    }
    return eligibleSprints.find(s => s.id === selectedSprintId);
  }, [eligibleSprints, selectedSprintId]);

  const data = useMemo(() => {
    if (!sprint) return [];
    const start = parseDate(sprint.startDate);
    const end = parseDate(sprint.endDate);
    if (!start || !end || end <= start) return [];

    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
    const totalScope = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 1), 0);
    const doneScope = sprintTasks
      .filter(t => t.status === 'done')
      .reduce((acc, t) => acc + (t.storyPoints || 1), 0);

    const totalDays = daysBetween(start, end);
    if (totalDays <= 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const elapsed = Math.max(0, Math.min(totalDays, daysBetween(start, today)));

    const points: { day: string; ideal: number; real: number | null }[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const ideal = +(totalScope - (totalScope * i) / totalDays).toFixed(1);

      let real: number | null = null;
      if (sprint.status === 'completed') {
        // linear approximation from total → remaining current
        real = +(totalScope - ((totalScope - (totalScope - doneScope)) * i) / totalDays).toFixed(1);
        real = +(totalScope - ((doneScope) * i) / totalDays).toFixed(1);
      } else if (i <= elapsed) {
        real = +(totalScope - ((doneScope) * i) / Math.max(elapsed, 1)).toFixed(1);
      }

      points.push({ day: formatDay(date), ideal, real });
    }
    return points;
  }, [sprint, tasks]);

  const totalScope = useMemo(() => {
    if (!sprint) return 0;
    return tasks
      .filter(t => t.sprintId === sprint.id)
      .reduce((acc, t) => acc + (t.storyPoints || 1), 0);
  }, [sprint, tasks]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Burndown Chart</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sprint:</span>
          <Select value={selectedSprintId} onValueChange={onSelectSprint}>
            <SelectTrigger className="h-8 w-[200px]">
              <SelectValue placeholder="Selecione uma sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Sprint ativa</SelectItem>
              {eligibleSprints.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.status === 'active' ? '· ativa' : '· concluída'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!sprint ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma sprint ativa ou concluída disponível.
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Datas da sprint inválidas.
          </div>
        ) : totalScope === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sprint sem tarefas para gerar burndown.
          </div>
        ) : (
          <ChartContainer
            config={{
              ideal: { label: 'Ideal', color: 'hsl(var(--muted-foreground))' },
              real: { label: 'Real', color: 'hsl(var(--primary))' },
            }}
            className="h-[280px] w-full"
          >
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="var(--color-ideal)"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                name="Ideal"
              />
              <Line
                type="monotone"
                dataKey="real"
                stroke="var(--color-real)"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                name="Real"
              />
            </LineChart>
          </ChartContainer>
        )}
        {sprint && totalScope > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Escopo total: {totalScope} {totalScope === 1 ? 'ponto' : 'pontos'} · {sprint.startDate} → {sprint.endDate}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
