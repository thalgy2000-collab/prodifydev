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
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
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

      setUpcoming((upcomingRes.data ?? []) as UpcomingActivity[]);
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
    <div className="space-y-8 p-6 md:p-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 text-xl font-bold">
          {profile?.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt="Avatar" />
          ) : null}
          <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Olá, {profile?.displayName || profile?.fullName || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground">Bem-vindo ao Prodify</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className={`h-6 w-6 ${m.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? '—' : m.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* OKR Progress */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Progresso geral dos OKRs</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {loading ? '—' : `${okrProgress}%`}
            </span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${okrProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming tasks from agenda */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Próximas tarefas</span>
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
            <div className="space-y-3">
              {upcoming.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('/agenda')}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-foreground truncate mr-3">
                    {a.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">
                      {formatDate(a.activity_date)}{a.start_time ? ` · ${a.start_time}` : ''}
                    </Badge>
                    <Badge variant="secondary">
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
