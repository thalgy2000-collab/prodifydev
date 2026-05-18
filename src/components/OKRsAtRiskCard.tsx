import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, ArrowRight, TrendingDown, CalendarX, Map } from 'lucide-react';
import { cn, getQuarterDates } from '@/lib/utils';

interface Props {
  productId: string;
  selectedQuarter?: string;
}

type RiskLevel = 'critical' | 'warning' | 'ok';

interface ObjectiveRisk {
  id: string;
  title: string;
  progress: number;
  expectedProgress: number;
  overdueTasks: number;
  overdueRoadmap: number;
  overdueAgenda: number;
  score: number;
  level: RiskLevel;
  reasons: string[];
}

const getQuarterRatio = (quarter?: string): number => {
  if (!quarter || quarter === 'all') {
    // Quarter atual baseado em hoje
    const now = new Date();
    const month = now.getMonth();
    const qStart = new Date(now.getFullYear(), Math.floor(month / 3) * 3, 1);
    const qEnd = new Date(now.getFullYear(), Math.floor(month / 3) * 3 + 3, 0);
    const total = qEnd.getTime() - qStart.getTime();
    const elapsed = now.getTime() - qStart.getTime();
    return Math.max(0, Math.min(1, elapsed / total));
  }
  const dates = getQuarterDates(quarter);
  if (!dates) return 0;
  const start = new Date(dates.start).getTime();
  const end = new Date(dates.end).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
};

const OKRsAtRiskCard = ({ productId, selectedQuarter }: Props) => {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<ObjectiveRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      // 1. Objectives
      let objQuery = supabase.from('objectives').select('id, title, quarter').eq('product_id', productId);
      if (selectedQuarter && selectedQuarter !== 'all') {
        objQuery = objQuery.eq('quarter', selectedQuarter);
      }
      const { data: objectives } = await objQuery;
      if (!objectives || objectives.length === 0) {
        setRisks([]); setLoading(false); return;
      }
      const objIds = objectives.map(o => o.id);

      // 2. KRs
      const { data: krs } = await supabase
        .from('key_results')
        .select('id, objective_id, current_value, target_value')
        .in('objective_id', objIds);

      // 3. Roadmap items linked to those KRs (via roadmap_item_key_results)
      const krIds = (krs || []).map(k => k.id);
      let linkedRoadmapIds: string[] = [];
      const krToRoadmap: Record<string, string[]> = {}; // kr_id -> [roadmap_item_id]
      if (krIds.length > 0) {
        const { data: links } = await supabase
          .from('roadmap_item_key_results')
          .select('roadmap_item_id, key_result_id')
          .in('key_result_id', krIds);
        (links || []).forEach(l => {
          krToRoadmap[l.key_result_id] = krToRoadmap[l.key_result_id] || [];
          krToRoadmap[l.key_result_id].push(l.roadmap_item_id);
          linkedRoadmapIds.push(l.roadmap_item_id);
        });
        linkedRoadmapIds = Array.from(new Set(linkedRoadmapIds));
      }

      // 4. Roadmap items details
      const { data: roadmapItems } = linkedRoadmapIds.length > 0
        ? await supabase
            .from('roadmap_items')
            .select('id, title, status, end_date, progress')
            .in('id', linkedRoadmapIds)
        : { data: [] as any[] };

      const roadmapById: Record<string, any> = {};
      (roadmapItems || []).forEach(r => { roadmapById[r.id] = r; });

      // 5. Backlog tasks linked to those roadmap items
      const roadmapToTasks: Record<string, string[]> = {};
      let allTaskIds: string[] = [];
      if (linkedRoadmapIds.length > 0) {
        const { data: rtLinks } = await supabase
          .from('roadmap_item_tasks')
          .select('roadmap_item_id, task_id')
          .in('roadmap_item_id', linkedRoadmapIds);
        (rtLinks || []).forEach(l => {
          roadmapToTasks[l.roadmap_item_id] = roadmapToTasks[l.roadmap_item_id] || [];
          roadmapToTasks[l.roadmap_item_id].push(l.task_id);
          allTaskIds.push(l.task_id);
        });
        allTaskIds = Array.from(new Set(allTaskIds));
      }

      const { data: tasks } = allTaskIds.length > 0
        ? await supabase
            .from('backlog_tasks')
            .select('id, status, due_date')
            .in('id', allTaskIds)
        : { data: [] as any[] };

      const taskById: Record<string, any> = {};
      (tasks || []).forEach(t => { taskById[t.id] = t; });

      // 6. Schedule activities (agenda) linked via acceptance_criteria of those tasks
      let agendaOverdueByTask: Record<string, number> = {};
      if (allTaskIds.length > 0) {
        const { data: criteria } = await supabase
          .from('acceptance_criteria')
          .select('task_id, schedule_activity_id, completed')
          .in('task_id', allTaskIds)
          .not('schedule_activity_id', 'is', null);
        const actIds = Array.from(new Set((criteria || []).map(c => c.schedule_activity_id).filter(Boolean) as string[]));
        if (actIds.length > 0) {
          const { data: acts } = await supabase
            .from('schedule_activities')
            .select('id, activity_date, status')
            .in('id', actIds);
          const overdueActs = new Set(
            (acts || [])
              .filter(a => a.status !== 'done' && a.activity_date && a.activity_date < today)
              .map(a => a.id)
          );
          (criteria || []).forEach(c => {
            if (c.schedule_activity_id && overdueActs.has(c.schedule_activity_id)) {
              agendaOverdueByTask[c.task_id] = (agendaOverdueByTask[c.task_id] || 0) + 1;
            }
          });
        }
      }

      // 7. Compute risk per objective
      const ratio = getQuarterRatio(selectedQuarter);
      const expectedProgress = Math.round(ratio * 100);

      const result: ObjectiveRisk[] = objectives.map(obj => {
        const objKrs = (krs || []).filter(k => k.objective_id === obj.id);
        const progress = objKrs.length === 0 ? 0 : Math.round(
          objKrs.reduce((s, k) => s + (Number(k.target_value) > 0 ? (Number(k.current_value) / Number(k.target_value)) * 100 : 0), 0) / objKrs.length
        );

        // Roadmap items linked to objective's KRs
        const linkedRoadmaps = new Set<string>();
        objKrs.forEach(k => (krToRoadmap[k.id] || []).forEach(rid => linkedRoadmaps.add(rid)));

        let overdueRoadmap = 0;
        let overdueTasks = 0;
        let overdueAgenda = 0;
        linkedRoadmaps.forEach(rid => {
          const r = roadmapById[rid];
          if (r && r.status !== 'completed' && r.end_date && r.end_date < today) overdueRoadmap++;
          (roadmapToTasks[rid] || []).forEach(tid => {
            const t = taskById[tid];
            if (t && t.status !== 'done' && t.due_date && t.due_date < today) overdueTasks++;
            overdueAgenda += agendaOverdueByTask[tid] || 0;
          });
        });

        const gap = Math.max(0, expectedProgress - progress);
        // Score: combination of gap + overdue items
        const score = gap + overdueTasks * 6 + overdueRoadmap * 12 + overdueAgenda * 3;

        let level: RiskLevel = 'ok';
        if (score >= 50 || overdueRoadmap >= 2) level = 'critical';
        else if (score >= 20 || overdueRoadmap >= 1 || overdueTasks >= 2) level = 'warning';

        const reasons: string[] = [];
        if (gap >= 15) reasons.push(`${gap}pp abaixo do esperado (${progress}% vs ${expectedProgress}%)`);
        if (overdueRoadmap > 0) reasons.push(`${overdueRoadmap} iniciativa(s) do roadmap atrasada(s)`);
        if (overdueTasks > 0) reasons.push(`${overdueTasks} tarefa(s) vinculada(s) em atraso`);
        if (overdueAgenda > 0) reasons.push(`${overdueAgenda} item(ns) da agenda em atraso`);
        if (reasons.length === 0 && objKrs.length === 0) reasons.push('Sem KRs cadastrados');

        return {
          id: obj.id,
          title: obj.title,
          progress,
          expectedProgress,
          overdueTasks,
          overdueRoadmap,
          overdueAgenda,
          score,
          level,
          reasons,
        };
      });

      // Only objectives at risk, sorted
      const atRisk = result
        .filter(r => r.level !== 'ok')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRisks(atRisk);
      setLoading(false);
    };
    run();
  }, [productId, selectedQuarter]);

  if (loading) return null;

  const allOk = risks.length === 0;
  const hasCritical = risks.some(r => r.level === 'critical');

  return (
    <Card className={cn(
      'transition-colors',
      hasCritical && 'border-red-500/50',
      !hasCritical && !allOk && 'border-amber-500/50'
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {allOk ? (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertTriangle className={cn('h-4 w-4', hasCritical ? 'text-red-500' : 'text-amber-500')} />
          )}
          OKRs em risco
        </CardTitle>
        <button
          onClick={() => navigate('/okrs')}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver OKRs <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        {allOk ? (
          <p className="text-sm text-muted-foreground">
            Nenhum OKR em risco. Tarefas, roadmap e agenda alinhados ao esperado.
          </p>
        ) : (
          <div className="space-y-3">
            {risks.map(r => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border p-3',
                  r.level === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-[10px]',
                      r.level === 'critical' ? 'border-red-500/40 text-red-500' : 'border-amber-500/40 text-amber-500'
                    )}
                  >
                    {r.level === 'critical' ? 'Crítico' : 'Atenção'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {r.progress}% / esperado {r.expectedProgress}%
                  </span>
                  {r.overdueRoadmap > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Map className="h-3 w-3" />
                      {r.overdueRoadmap} iniciativa(s) atrasada(s)
                    </span>
                  )}
                  {(r.overdueTasks > 0 || r.overdueAgenda > 0) && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarX className="h-3 w-3" />
                      {r.overdueTasks + r.overdueAgenda} item(ns) atrasado(s)
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-0.5">
                  {r.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                      <span className="text-muted-foreground">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OKRsAtRiskCard;
