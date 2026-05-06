import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, Target, CheckSquare, TrendingUp, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Metrics {
  totalProducts: number;
  totalObjectives: number;
  totalOpenTasks: number;
}

interface UpcomingActivity {
  id: string;
  title: string;
  activity_date: string;
  start_time: string | null;
  status: string;
  parentTaskTitle?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
};

type Urgency = { label: string; className: string } | null;

const getUrgency = (dateStr: string): Urgency => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: 'Atrasada', className: 'bg-destructive text-destructive-foreground border-transparent' };
  if (diff === 0) return { label: 'Hoje', className: 'bg-yellow-500 text-white border-transparent' };
  if (diff === 1) return { label: 'Amanhã', className: 'bg-blue-500 text-white border-transparent' };
  return null;
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, initial, avatarColor } = useProfile();

  const [metrics, setMetrics] = useState<Metrics>({ totalProducts: 0, totalObjectives: 0, totalOpenTasks: 0 });
  const [okrProgress, setOkrProgress] = useState(0);
  const [upcoming, setUpcoming] = useState<UpcomingActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      const [productsRes, objectivesRes, tasksCountRes, krsRes, upcomingRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('objectives').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('backlog_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open'),
        supabase.from('key_results').select('current_value, target_value').eq('user_id', user.id),
        supabase
          .from('schedule_activities')
          .select('id, title, activity_date, start_time, status')
          .eq('user_id', user.id)
          .gte('activity_date', today)
          .neq('status', 'done')
          .order('activity_date', { ascending: true })
          .order('start_time', { ascending: true, nullsFirst: false })
          .limit(5),
      ]);

      setMetrics({
        totalProducts: productsRes.count ?? 0,
        totalObjectives: objectivesRes.count ?? 0,
        totalOpenTasks: tasksCountRes.count ?? 0,
      });

      if (krsRes.data && krsRes.data.length > 0) {
        const avg = krsRes.data.reduce((sum, kr) => {
          const target = Number(kr.target_value) || 1;
          return sum + (Number(kr.current_value) / target) * 100;
        }, 0) / krsRes.data.length;
        setOkrProgress(Math.min(Math.round(avg), 100));
      } else {
        setOkrProgress(0);
      }

      // Resolve parent task titles for activities created from acceptance criteria
      const activityIds = (upcomingRes.data ?? []).map(a => a.id);
      const parentMap: Record<string, string> = {};
      if (activityIds.length > 0) {
        const { data: criteria } = await supabase
          .from('acceptance_criteria')
          .select('schedule_activity_id, task_id')
          .in('schedule_activity_id', activityIds);
        const taskIds = Array.from(new Set((criteria ?? []).map(c => c.task_id).filter(Boolean)));
        if (taskIds.length > 0) {
          const { data: parentTasks } = await supabase
            .from('backlog_tasks')
            .select('id, title')
            .in('id', taskIds);
          const titleById = Object.fromEntries((parentTasks ?? []).map(t => [t.id, t.title]));
          for (const c of criteria ?? []) {
            if (c.schedule_activity_id && c.task_id && titleById[c.task_id]) {
              parentMap[c.schedule_activity_id] = titleById[c.task_id];
            }
          }
        }
      }

      setUpcoming(((upcomingRes.data ?? []) as UpcomingActivity[]).map(a => ({
        ...a,
        parentTaskTitle: parentMap[a.id] ?? null,
      })));
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const metricCards = [
    { label: 'Produtos', value: metrics.totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Objetivos ativos', value: metrics.totalObjectives, icon: Target, color: 'text-primary' },
    { label: 'Tarefas abertas', value: metrics.totalOpenTasks, icon: CheckSquare, color: 'text-primary' },
  ];

  const progressColor = okrProgress >= 70 ? 'bg-green-500' : okrProgress >= 40 ? 'bg-yellow-500' : 'bg-destructive';

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  };

  return (
    <div className="space-y-3 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Avatar className="h-10 w-10 sm:h-16 sm:w-16 text-sm sm:text-xl font-bold">
          {profile?.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt="Avatar" />
          ) : null}
          <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">
            Olá, {profile?.displayName || profile?.fullName || 'Usuário'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Bem-vindo ao Prodify</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="overflow-hidden">
              <CardContent className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-6">
                <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${m.color}`} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {loading ? '—' : m.value}
                  </p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* OKR Progress */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Progresso geral dos OKRs</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-foreground">
              {loading ? '—' : `${okrProgress}%`}
            </span>
          </div>
          <div className="relative h-2.5 sm:h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${okrProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming tasks from agenda */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Próximas tarefas</span>
            </div>
            <button
              onClick={() => navigate('/agenda')}
              className="text-xs text-primary hover:underline"
            >
              Ver agenda
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa próxima na agenda.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {upcoming.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('/agenda')}
                  className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors text-left gap-2"
                >
                  <span className="text-sm font-medium text-foreground truncate w-full sm:w-auto">
                    {a.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(a.activity_date)}{a.start_time ? ` · ${a.start_time.slice(0, 5)}` : ''}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {statusLabels[a.status] || a.status}
              </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
