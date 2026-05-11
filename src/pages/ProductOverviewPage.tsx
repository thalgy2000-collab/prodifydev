import { useState, useEffect } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, ListTodo, Map, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn, getQuarterDates } from '@/lib/utils';
import ProductHealthScore from '@/components/ProductHealthScore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MetricSummary {
  level: 'critical' | 'warning' | 'ok';
  text: string;
}

interface Metrics {
  okrs: number;
  avgKr: number;
  openTasks: number;
  roadmapItems: number;
  okrSummary: MetricSummary;
  krSummary: MetricSummary;
  taskSummary: MetricSummary;
  roadmapSummary: MetricSummary;
}

const ProductOverviewPage = () => {
  const { activeProduct } = useProduct();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [availableQuarters, setAvailableQuarters] = useState<string[]>([]);

  useEffect(() => {
    if (!activeProduct) return;
    const fetchQuarters = async () => {
      const [objRes, rmRes] = await Promise.all([
        supabase.from('objectives').select('quarter').eq('product_id', activeProduct.id),
        supabase.from('roadmap_items').select('quarter').eq('product_id', activeProduct.id),
      ]);
      const qs = new Set<string>();
      objRes.data?.forEach(o => o.quarter && qs.add(o.quarter));
      rmRes.data?.forEach(r => r.quarter && qs.add(r.quarter));
      
      const sorted = Array.from(qs).sort((a, b) => {
        const partsA = a.split(' ');
        const partsB = b.split(' ');
        const qa = partsA[0] || '';
        const ya = partsA[1] || '';
        const qb = partsB[0] || '';
        const yb = partsB[1] || '';

        if (ya && yb && ya !== yb) return yb.localeCompare(ya);
        return qb.localeCompare(qa);
      });
      setAvailableQuarters(sorted);
    };
    fetchQuarters();
  }, [activeProduct]);

  useEffect(() => {
    if (!activeProduct) return;
    const pid = activeProduct.id;
    const today = new Date().toISOString().slice(0, 10);

    const fetchMetrics = async () => {
      let objQuery = supabase.from('objectives').select('id, quarter').eq('product_id', pid);
      let rmQuery = supabase.from('roadmap_items').select('id, status, end_date, progress').eq('product_id', pid);
      let tasksQuery = supabase.from('backlog_tasks').select('id, status, due_date').eq('product_id', pid);
      let scheduleQuery = supabase
        .from('schedule_activities')
        .select('title, activity_date, start_time, status')
        .eq('product_id', pid)
        .neq('status', 'done')
        .gte('activity_date', today)
        .order('activity_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: true })
        .limit(5);

      if (selectedQuarter && selectedQuarter !== 'all') {
        objQuery = objQuery.eq('quarter', selectedQuarter);
        rmQuery = rmQuery.eq('quarter', selectedQuarter);
        
        const dates = getQuarterDates(selectedQuarter);
        if (dates) {
          tasksQuery = tasksQuery.gte('due_date', dates.start).lte('due_date', dates.end);
          scheduleQuery = supabase
            .from('schedule_activities')
            .select('title, activity_date, start_time, status')
            .eq('product_id', pid)
            .neq('status', 'done')
            .gte('activity_date', dates.start)
            .lte('activity_date', dates.end)
            .order('activity_date', { ascending: true })
            .order('start_time', { ascending: true, nullsFirst: true })
            .limit(5);
        }
      }

      const [objsRes, rmRes, tasksRes, scheduleRes] = await Promise.all([
        objQuery,
        rmQuery,
        tasksQuery,
        scheduleQuery,
      ]);

      const objectives = objsRes.data || [];
      const objIds = objectives.map(o => o.id);

      let krQuery = supabase.from('key_results').select('current_value, target_value, objective_id').eq('product_id', pid);
      if (selectedQuarter && selectedQuarter !== 'all') {
        if (objIds.length > 0) {
          krQuery = krQuery.in('objective_id', objIds);
        } else {
          krQuery = krQuery.eq('objective_id', 'none'); // força resultado vazio
        }
      }
      
      const krRes = await krQuery;

      const krs = krRes.data || [];
      const tasks = tasksRes.data || [];
      const roadmap = rmRes.data || [];

      const avgKr = krs.length > 0
        ? krs.reduce((sum, kr) => sum + (Number(kr.target_value) > 0 ? (Number(kr.current_value) / Number(kr.target_value)) * 100 : 0), 0) / krs.length
        : 0;

      const openTasksCount = tasks.filter(t => t.status === 'open').length;
      const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length;
      const objsWithoutKr = objectives.filter(o => !krs.some(k => k.objective_id === o.id)).length;
      const stagnantKrs = krs.filter(k => Number(k.current_value) === 0).length;
      const overdueRoadmap = roadmap.filter(r => r.status !== 'completed' && r.end_date && r.end_date < today).length;

      const okrSummary: MetricSummary = objsWithoutKr > 0
        ? { level: 'warning', text: `${objsWithoutKr} sem KRs` }
        : objectives.length === 0
          ? { level: 'warning', text: 'Nenhum objetivo definido' }
          : { level: 'ok', text: 'Todos com KRs' };

      const krSummary: MetricSummary = krs.length === 0
        ? { level: 'warning', text: 'Sem KRs cadastrados' }
        : stagnantKrs > 0
          ? { level: avgKr < 30 ? 'critical' : 'warning', text: `${stagnantKrs} sem progresso` }
          : { level: 'ok', text: 'Em evolução' };

      const taskSummary: MetricSummary = overdueTasks > 0
        ? { level: overdueTasks > 5 ? 'critical' : 'warning', text: `${overdueTasks} em atraso` }
        : openTasksCount === 0
          ? { level: 'ok', text: 'Backlog limpo' }
          : { level: 'ok', text: 'Sem atrasos' };

      const roadmapSummary: MetricSummary = overdueRoadmap > 0
        ? { level: overdueRoadmap > 2 ? 'critical' : 'warning', text: `${overdueRoadmap} item(s) atrasado(s)` }
        : roadmap.length === 0
          ? { level: 'warning', text: 'Roadmap vazio' }
          : { level: 'ok', text: 'No prazo' };

      setMetrics({
        okrs: objectives.length,
        avgKr: Math.round(avgKr),
        openTasks: openTasksCount,
        roadmapItems: roadmap.length,
        okrSummary, krSummary, taskSummary, roadmapSummary,
      });
      setUpcomingActivities(scheduleRes.data || []);
    };

    fetchMetrics();
  }, [activeProduct, selectedQuarter]);

  if (!activeProduct) return null;

  const m = metrics ?? {
    okrs: 0, avgKr: 0, openTasks: 0, roadmapItems: 0,
    okrSummary: { level: 'ok' as const, text: '—' },
    krSummary: { level: 'ok' as const, text: '—' },
    taskSummary: { level: 'ok' as const, text: '—' },
    roadmapSummary: { level: 'ok' as const, text: '—' },
  };

  const cards = [
    { title: 'Total de OKRs', value: m.okrs, icon: Target, color: 'text-primary', summary: m.okrSummary },
    { title: 'Progresso médio KRs', value: `${m.avgKr}%`, icon: TrendingUp, color: 'text-emerald-500', summary: m.krSummary },
    { title: 'Tarefas abertas', value: m.openTasks, icon: ListTodo, color: 'text-amber-500', summary: m.taskSummary },
    { title: 'Itens no Roadmap', value: m.roadmapItems, icon: Map, color: 'text-violet-500', summary: m.roadmapSummary },
  ];

  const summaryStyle = (level: MetricSummary['level']) => {
    if (level === 'critical') return 'text-red-500';
    if (level === 'warning') return 'text-amber-500';
    return 'text-emerald-500';
  };

  const formatDate = (d: string) => {
    const [y, mo, day] = d.split('-');
    return `${day}/${mo}/${y.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-3xl">{activeProduct.emoji}</span>
            {activeProduct.name}
          </h1>
          {activeProduct.description && (
            <p className="text-sm text-muted-foreground mt-1">{activeProduct.description}</p>
          )}
        </div>
        
        <div className="w-[200px]">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visão Geral</SelectItem>
              {availableQuarters.map(q => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductHealthScore productId={activeProduct.id} selectedQuarter={selectedQuarter} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.summary.level === 'ok' ? CheckCircle2 : AlertTriangle;
          return (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{c.value}</p>
                <div className={cn('mt-2 flex items-center gap-1.5 text-xs', summaryStyle(c.summary.level))}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.summary.text}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
