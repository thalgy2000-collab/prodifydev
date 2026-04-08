import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, Target, List, Map, CheckSquare, TrendingUp, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Metrics {
  totalProducts: number;
  totalObjectives: number;
  totalOpenTasks: number;
}

interface RecentTask {
  id: string;
  title: string;
  priority: string;
  status: string;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  low: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  done: 'Concluída',
  cancelled: 'Cancelada',
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, initial, avatarColor } = useProfile();

  const [metrics, setMetrics] = useState<Metrics>({ totalProducts: 0, totalObjectives: 0, totalOpenTasks: 0 });
  const [okrProgress, setOkrProgress] = useState(0);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const [productsRes, objectivesRes, tasksCountRes, krsRes, recentRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('objectives').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('backlog_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open'),
        supabase.from('key_results').select('current_value, target_value').eq('user_id', user.id),
        supabase.from('backlog_tasks').select('id, title, priority, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
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

      setRecentTasks(
        (recentRes.data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
        }))
      );

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const shortcuts = [
    { title: 'Meus Produtos', description: 'Gerencie seus produtos e portfólio', icon: Package, path: '/produtos' },
    { title: 'OKRs', description: 'Acompanhe seus objetivos e resultados', icon: Target, path: '/okrs' },
    { title: 'Backlog', description: 'Organize e priorize suas tarefas', icon: List, path: '/backlog' },
    { title: 'Roadmap', description: 'Planeje e visualize seu futuro', icon: Map, path: '/roadmap' },
  ];

  const metricCards = [
    { label: 'Produtos', value: metrics.totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Objetivos ativos', value: metrics.totalObjectives, icon: Target, color: 'text-primary' },
    { label: 'Tarefas abertas', value: metrics.totalOpenTasks, icon: CheckSquare, color: 'text-primary' },
  ];

  const progressColor = okrProgress >= 70 ? 'bg-green-500' : okrProgress >= 40 ? 'bg-yellow-500' : 'bg-destructive';

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

      {/* Recent tasks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Tarefas recentes</span>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="text-sm font-medium text-foreground truncate mr-3">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority] || 'bg-muted text-muted-foreground'}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick shortcuts */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Atalhos rápidos</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.title}
                onClick={() => navigate(s.path)}
                className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/50 text-left"
              >
                <Icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
