import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ListTodo, Map, AlertTriangle, CheckCircle2, CalendarDays, ArrowRight, Zap } from 'lucide-react';
import { cn, getQuarterDates } from '@/lib/utils';
import ProductHealthScore from '@/components/ProductHealthScore';
import ProblemStatementCard from '@/components/discovery/ProblemStatementCard';
import OKRsAtRiskCard from '@/components/OKRsAtRiskCard';
import QuickAccess from '@/components/QuickAccess';
import ProductIcon from '@/components/ProductIcon';
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

const ProductOverviewPage = () => {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [availableQuarters, setAvailableQuarters] = useState<string[]>([]);
  const [sprintInfo, setSprintInfo] = useState<{
    sprint: { id: string; name: string; start_date: string; end_date: string } | null;
    total: number;
    done: number;
    progress: number;
    daysLeft: number | null;
    timeElapsedRatio: number;
  } | null>(null);

  useEffect(() => {
    if (!activeProduct) { setSprintInfo(null); return; }
    const fetchSprint = async () => {
      const { data: sprint } = await supabase
        .from('sprints')
        .select('id, name, start_date, end_date')
        .eq('product_id', activeProduct.id)
        .eq('status', 'active')
        .order('end_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!sprint) {
        setSprintInfo({ sprint: null, total: 0, done: 0, progress: 0, daysLeft: null, timeElapsedRatio: 0 });
        return;
      }

      const { data: tasks } = await supabase
        .from('backlog_tasks')
        .select('id, status')
        .eq('sprint_id', sprint.id);

      const total = tasks?.length ?? 0;
      const done = tasks?.filter(t => t.status === 'done').length ?? 0;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const end = new Date(sprint.end_date + 'T00:00:00'); end.setHours(0, 0, 0, 0);
      const start = new Date(sprint.start_date + 'T00:00:00'); start.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = today.getTime() - start.getTime();
      const timeElapsedRatio = totalMs > 0 ? elapsedMs / totalMs : 0;

      setSprintInfo({ sprint, total, done, progress, daysLeft, timeElapsedRatio });
    };
    fetchSprint();
  }, [activeProduct]);

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
        .select('id, title, activity_date, start_time, status')
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
            .select('id, title, activity_date, start_time, status')
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

      const upcomingData = scheduleRes.data ?? [];
      const activityIds = upcomingData.map(a => a.id);
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

      setUpcomingActivities(upcomingData.map(a => ({
        ...a,
        parentTaskTitle: parentMap[a.id] ?? null,
      })));
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

  type CtaTone = 'default' | 'warning' | 'danger' | 'success';
  interface CardCta { label: string; route: string; tone: CtaTone; }

  const okrCta: CardCta = m.avgKr < 30 && m.okrs > 0
    ? { label: 'Revisar OKRs', route: '/okrs', tone: 'danger' }
    : { label: 'Ver OKRs', route: '/okrs', tone: 'default' };

  const krCta: CardCta = m.avgKr < 20
    ? { label: 'Atualizar KRs', route: '/okrs', tone: 'warning' }
    : m.avgKr >= 70
      ? { label: 'Ver detalhes', route: '/okrs', tone: 'success' }
      : { label: 'Ver KRs', route: '/okrs', tone: 'default' };

  const taskCta: CardCta = m.openTasks > 20
    ? { label: 'Priorizar Backlog', route: '/backlog', tone: 'warning' }
    : m.openTasks === 0
      ? { label: 'Ver Backlog', route: '/backlog', tone: 'success' }
      : { label: 'Ver Backlog', route: '/backlog', tone: 'default' };

  const roadmapCta: CardCta = m.roadmapItems === 0
    ? { label: 'Criar iniciativa', route: '/roadmap', tone: 'warning' }
    : { label: 'Ver Roadmap', route: '/roadmap', tone: 'default' };

  const cards = [
    { title: 'Progresso médio KRs', value: `${m.avgKr}%`, icon: TrendingUp, color: 'text-emerald-500', summary: m.krSummary, cta: krCta },
    { title: 'Tarefas abertas', value: m.openTasks, icon: ListTodo, color: 'text-amber-500', summary: m.taskSummary, cta: taskCta },
    { title: 'Itens no Roadmap', value: m.roadmapItems, icon: Map, color: 'text-violet-500', summary: m.roadmapSummary, cta: roadmapCta },
  ];

  // Sprint Ativa — alertas
  const sprint = sprintInfo?.sprint ?? null;
  const daysLeft = sprintInfo?.daysLeft ?? null;
  const sprintProgress = sprintInfo?.progress ?? 0;
  const isEncerrandoHoje = sprint != null && daysLeft === 0;
  const isEncerrandoEmBreve = sprint != null && daysLeft != null && daysLeft > 0 && daysLeft <= 3;
  const isEmRisco = sprint != null && daysLeft != null && daysLeft > 3 && sprintProgress < 30 && (sprintInfo?.timeElapsedRatio ?? 0) > 0.5;

  let sprintBorder = 'border-border';
  let sprintAlertIcon: 'none' | 'warning' | 'danger' = 'none';
  let sprintAlertText: string | null = null;
  let sprintCtaLabel = 'Ver Sprint';
  let sprintCtaTone: CtaTone = 'default';

  if (!sprint) {
    sprintCtaLabel = 'Criar Sprint';
    sprintCtaTone = 'default';
  } else if (isEncerrandoHoje) {
    sprintBorder = 'border-red-500';
    sprintAlertIcon = 'danger';
    sprintAlertText = 'Encerra hoje!';
    sprintCtaLabel = 'Ver urgências';
    sprintCtaTone = 'danger';
  } else if (isEmRisco) {
    sprintBorder = 'border-red-500';
    sprintAlertIcon = 'danger';
    sprintAlertText = 'Sprint em risco';
    sprintCtaLabel = 'Revisar Sprint';
    sprintCtaTone = 'danger';
  } else if (isEncerrandoEmBreve) {
    sprintBorder = 'border-amber-500';
    sprintAlertIcon = 'warning';
    sprintAlertText = `Encerra em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}!`;
    sprintCtaLabel = 'Revisar Sprint';
    sprintCtaTone = 'warning';
  }

  const ctaStyle = (tone: CtaTone) => {
    if (tone === 'danger') return 'text-red-500 hover:text-red-400';
    if (tone === 'warning') return 'text-amber-500 hover:text-amber-400';
    if (tone === 'success') return 'text-emerald-500 hover:text-emerald-400';
    return 'text-muted-foreground hover:text-foreground';
  };

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
            <ProductIcon emoji={activeProduct.emoji} logoUrl={activeProduct.logoUrl} name={activeProduct.name} size={36} emojiClassName="text-3xl" />
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

      <ProblemStatementCard />

      <OKRsAtRiskCard productId={activeProduct.id} selectedQuarter={selectedQuarter} />

      <QuickAccess />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn('transition-colors', sprintBorder)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Sprint Ativa
            </CardTitle>
            {sprintAlertIcon === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {sprintAlertIcon === 'danger' && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            {!sprint ? (
              <p className="text-sm text-muted-foreground">Nenhuma sprint ativa</p>
            ) : (
              <>
                <p className="text-base font-bold truncate">{sprint.name}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isEncerrandoHoje || isEmRisco ? 'bg-red-500' : isEncerrandoEmBreve ? 'bg-amber-500' : 'bg-primary'
                    )}
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sprintInfo!.done}/{sprintInfo!.total} tarefas · {sprintProgress}%
                  {daysLeft != null && daysLeft > 0 && ` · ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                </p>
                {sprintAlertText && (
                  <div className={cn(
                    'mt-2 flex items-center gap-1.5 text-xs',
                    sprintAlertIcon === 'danger' ? 'text-red-500' : 'text-amber-500'
                  )}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sprintAlertText}</span>
                  </div>
                )}
              </>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => navigate('/sprints')}
                className={cn('inline-flex items-center gap-1 text-sm transition-colors', ctaStyle(sprintCtaTone))}
              >
                {(sprintCtaTone === 'warning' || sprintCtaTone === 'danger') && (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span>{sprintCtaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
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
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => navigate(c.cta.route)}
                    className={cn('inline-flex items-center gap-1 text-sm transition-colors', ctaStyle(c.cta.tone))}
                  >
                    {(c.cta.tone === 'warning' || c.cta.tone === 'danger') && (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {c.cta.tone === 'success' && (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>{c.cta.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base font-semibold text-foreground">Próximas tarefas</span>
            </div>
            <button
              onClick={() => navigate('/produto-agenda')}
              className="text-xs text-primary hover:underline"
            >
              Ver agenda
            </button>
          </div>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa agendada.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {upcomingActivities.map((a) => {
                const urgency = getUrgency(a.activity_date);
                return (
                  <button
                    key={a.id}
                    onClick={() => navigate('/produto-agenda')}
                    className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors text-left gap-2"
                  >
                    <span className="text-sm font-medium text-foreground truncate w-full sm:w-auto">
                      {a.parentTaskTitle && (
                        <span className="text-muted-foreground">{a.parentTaskTitle} › </span>
                      )}
                      {a.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {urgency && (
                        <Badge className={`text-xs ${urgency.className}`}>{urgency.label}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {formatDate(a.activity_date)}{a.start_time ? ` · ${a.start_time.slice(0, 5)}` : ''}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {statusLabels[a.status] || a.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductOverviewPage;
