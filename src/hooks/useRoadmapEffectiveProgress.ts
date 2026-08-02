import { useState, useEffect, useCallback } from 'react';
import { RoadmapItem } from '@/types/roadmap';
import { supabase } from '@/integrations/supabase/client';

export interface EffectiveProgressMap {
  /** roadmapItemId → effective progress (0-100) */
  [roadmapItemId: string]: number;
}

/**
 * Computes effective roadmap progress based on acceptance criteria completion
 * within linked tasks, instead of relying solely on task completion.
 *
 * Formula per roadmap item:
 *   effectiveProgress = Σ task.roadmapImpact × (completedCriteria / totalCriteria)
 *
 * For tasks without acceptance criteria:
 *   - status === 'done' → contributes 100% of roadmapImpact
 *   - otherwise → contributes 0%
 */
export const useRoadmapEffectiveProgress = (items: RoadmapItem[]) => {
  const [progressMap, setProgressMap] = useState<EffectiveProgressMap>({});
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (items.length === 0) {
      setProgressMap({});
      return;
    }

    setLoading(true);
    try {
      const itemIds = items.map(i => i.id);

      // 1. Fetch all roadmap_item_tasks for these items
      const { data: ritLinks } = await (supabase.from('roadmap_item_tasks') as any)
        .select('roadmap_item_id, task_id')
        .in('roadmap_item_id', itemIds);

      if (!ritLinks || ritLinks.length === 0) {
        // No tasks linked — keep original progress for all items
        const map: EffectiveProgressMap = {};
        items.forEach(i => { map[i.id] = i.progress ?? 0; });
        setProgressMap(map);
        setLoading(false);
        return;
      }

      // Build lookups
      const taskIdsByItem: Record<string, string[]> = {};
      const allTaskIds = new Set<string>();
      for (const link of ritLinks) {
        if (!taskIdsByItem[link.roadmap_item_id]) taskIdsByItem[link.roadmap_item_id] = [];
        taskIdsByItem[link.roadmap_item_id].push(link.task_id);
        allTaskIds.add(link.task_id);
      }

      const taskIdsArr = Array.from(allTaskIds);

      // 2. Fetch tasks (status + roadmap_impact)
      const { data: tasksData } = await (supabase.from('backlog_tasks') as any)
        .select('id, status, roadmap_impact')
        .in('id', taskIdsArr);

      const taskById: Record<string, { status: string; roadmapImpact: number }> = {};
      (tasksData || []).forEach((t: any) => {
        taskById[t.id] = {
          status: t.status,
          roadmapImpact: Number(t.roadmap_impact) || 0,
        };
      });

      // 3. Fetch acceptance criteria for all linked tasks
      const { data: criteriaData } = await (supabase.from('acceptance_criteria') as any)
        .select('task_id, completed')
        .in('task_id', taskIdsArr);

      // Group criteria by task_id
      const criteriaByTask: Record<string, { total: number; completed: number }> = {};
      (criteriaData || []).forEach((c: any) => {
        if (!criteriaByTask[c.task_id]) criteriaByTask[c.task_id] = { total: 0, completed: 0 };
        criteriaByTask[c.task_id].total++;
        if (c.completed) criteriaByTask[c.task_id].completed++;
      });

      // 4. Compute effective progress per roadmap item
      const map: EffectiveProgressMap = {};

      for (const item of items) {
        const linkedTaskIds = taskIdsByItem[item.id];
        if (!linkedTaskIds || linkedTaskIds.length === 0) {
          // No linked tasks — use original progress
          map[item.id] = item.progress ?? 0;
          continue;
        }

        let effectiveProgress = 0;

        for (const taskId of linkedTaskIds) {
          const task = taskById[taskId];
          if (!task) continue;

          const impact = task.roadmapImpact;
          if (impact <= 0) continue;

          const criteria = criteriaByTask[taskId];

          if (criteria && criteria.total > 0) {
            // Has acceptance criteria → proportional contribution
            effectiveProgress += impact * (criteria.completed / criteria.total);
          } else {
            // No criteria → binary: done = full impact, else = 0
            if (task.status === 'done') {
              effectiveProgress += impact;
            }
          }
        }

        map[item.id] = Math.min(100, Math.round(effectiveProgress * 100) / 100);
      }

      setProgressMap(map);
    } catch (error) {
      console.error('Failed to compute effective roadmap progress:', error);
      // Fallback to original progress
      const map: EffectiveProgressMap = {};
      items.forEach(i => { map[i.id] = i.progress ?? 0; });
      setProgressMap(map);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    compute();
  }, [compute]);

  return { progressMap, loading, recompute: compute };
};
