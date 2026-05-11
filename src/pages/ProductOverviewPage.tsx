import { useState, useEffect } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, ListTodo, Map } from 'lucide-react';
import ProductHealthScore from '@/components/ProductHealthScore';

const ProductOverviewPage = () => {
  const { activeProduct } = useProduct();
  const [metrics, setMetrics] = useState({ okrs: 0, avgKr: 0, openTasks: 0, roadmapItems: 0 });
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!activeProduct) return;
    const pid = activeProduct.id;
    const today = new Date().toISOString().slice(0, 10);

    const fetchMetrics = async () => {
      const [objRes, krRes, tasksRes, roadmapRes, upcomingRes] = await Promise.all([
        supabase.from('objectives').select('id', { count: 'exact', head: true }).eq('product_id', pid),
        supabase.from('key_results').select('current_value, target_value').eq('product_id', pid),
        supabase.from('backlog_tasks').select('id', { count: 'exact', head: true }).eq('product_id', pid).eq('status', 'open'),
        supabase.from('roadmap_items').select('id', { count: 'exact', head: true }).eq('product_id', pid),
        supabase
          .from('schedule_activities')
          .select('title, activity_date, start_time, status')
          .eq('product_id', pid)
          .neq('status', 'done')
          .gte('activity_date', today)
          .order('activity_date', { ascending: true })
          .order('start_time', { ascending: true, nullsFirst: true })
          .limit(5),
      ]);

      const krs = krRes.data || [];
      const avgKr = krs.length > 0
        ? krs.reduce((sum, kr) => sum + (Number(kr.target_value) > 0 ? (Number(kr.current_value) / Number(kr.target_value)) * 100 : 0), 0) / krs.length
        : 0;

      setMetrics({
        okrs: objRes.count ?? 0,
        avgKr: Math.round(avgKr),
        openTasks: tasksRes.count ?? 0,
        roadmapItems: roadmapRes.count ?? 0,
      });
      setUpcomingActivities(upcomingRes.data || []);
    };

    fetchMetrics();
  }, [activeProduct]);

  if (!activeProduct) return null;

  const cards = [
    { title: 'Total de OKRs', value: metrics.okrs, icon: Target, color: 'text-primary' },
    { title: 'Progresso médio KRs', value: `${metrics.avgKr}%`, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Tarefas abertas', value: metrics.openTasks, icon: ListTodo, color: 'text-amber-500' },
    { title: 'Itens no Roadmap', value: metrics.roadmapItems, icon: Map, color: 'text-violet-500' },
  ];

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-3xl">{activeProduct.emoji}</span>
          {activeProduct.name}
        </h1>
        {activeProduct.description && (
          <p className="text-sm text-muted-foreground mt-1">{activeProduct.description}</p>
        )}
      </div>

      <ProductHealthScore productId={activeProduct.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa agendada.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingActivities.map((a, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{a.title}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="text-xs">{formatDate(a.activity_date)}</Badge>
                    {a.start_time && (
                      <Badge variant="secondary" className="text-xs">{a.start_time.slice(0, 5)}</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductOverviewPage;
