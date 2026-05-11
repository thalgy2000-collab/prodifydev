import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, ListTodo, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
}

interface Breakdown {
  okr: number;
  roadmap: number;
  tasks: number;
  total: number;
}

const ProductHealthScore = ({ productId }: Props) => {
  const [data, setData] = useState<Breakdown | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [krRes, roadmapRes, tasksRes] = await Promise.all([
        supabase.from('key_results').select('current_value, target_value').eq('product_id', productId),
        supabase.from('roadmap_items').select('status, progress, end_date').eq('product_id', productId),
        supabase.from('backlog_tasks').select('status, due_date').eq('product_id', productId),
      ]);

      // OKR score: average KR progress (0-100)
      const krs = krRes.data || [];
      const okrScore = krs.length === 0 ? 50 : Math.min(100, Math.round(
        krs.reduce((sum, kr) => sum + (Number(kr.target_value) > 0 ? (Number(kr.current_value) / Number(kr.target_value)) * 100 : 0), 0) / krs.length
      ));

      // Roadmap score: avg progress minus penalty for overdue items
      const items = roadmapRes.data || [];
      let roadmapScore = 60;
      if (items.length > 0) {
        const avgProgress = items.reduce((s, i) => s + (Number(i.progress) || 0), 0) / items.length;
        const overdue = items.filter(i => i.status !== 'completed' && i.end_date && i.end_date < today).length;
        const overdueRate = (overdue / items.length) * 100;
        roadmapScore = Math.round(Math.max(0, Math.min(100, avgProgress - overdueRate * 0.4)));
      }

      // Task score: % done minus overdue penalty
      const tasks = tasksRes.data || [];
      let taskScore = 70;
      if (tasks.length > 0) {
        const done = tasks.filter(t => t.status === 'done').length;
        const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length;
        const pctDone = (done / tasks.length) * 100;
        const overdueRate = (overdue / tasks.length) * 100;
        taskScore = Math.round(Math.max(0, Math.min(100, pctDone * 0.7 + 30 - overdueRate * 0.5)));
      }

      const total = Math.round(okrScore * 0.4 + roadmapScore * 0.3 + taskScore * 0.3);
      setData({ okr: okrScore, roadmap: roadmapScore, tasks: taskScore, total });
    };

    fetchScore();
  }, [productId]);

  if (!data) return null;

  const getStatus = (score: number) => {
    if (score >= 70) return { label: 'Saudável', color: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'stroke-emerald-500' };
    if (score >= 40) return { label: 'Atenção', color: 'text-amber-500', bg: 'bg-amber-500', ring: 'stroke-amber-500' };
    return { label: 'Crítico', color: 'text-red-500', bg: 'bg-red-500', ring: 'stroke-red-500' };
  };

  const status = getStatus(data.total);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (data.total / 100) * circumference;

  const items = [
    { label: 'OKRs', value: data.okr, icon: TrendingUp },
    { label: 'Sprints', value: data.sprint, icon: Zap },
    { label: 'Tarefas', value: data.tasks, icon: ListTodo },
  ];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" strokeWidth="8" className="stroke-muted fill-none" />
              <circle
                cx="50" cy="50" r="42" strokeWidth="8" fill="none" strokeLinecap="round"
                className={cn('transition-all duration-700', status.ring)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold', status.color)}>{data.total}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Activity className={cn('h-4 w-4', status.color)} />
              <h3 className="text-sm font-semibold">Health Score do Produto</h3>
              <span className={cn('text-xs px-2 py-0.5 rounded-full text-white', status.bg)}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Indicador combinado de OKRs (40%), Sprints (30%) e Tarefas (30%).
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {items.map(it => {
              const s = getStatus(it.value);
              return (
                <div key={it.label} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 min-w-[110px]">
                  <it.icon className={cn('h-4 w-4', s.color)} />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{it.label}</div>
                    <div className={cn('text-sm font-semibold', s.color)}>{it.value}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductHealthScore;
