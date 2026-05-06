import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns a map { scheduleActivityId -> parentTaskTitle } for activities
 * that originated from acceptance criteria (subtasks). Lets the UI render
 * the parent task as a prefix so users know what the subtask belongs to.
 */
export const useParentTaskTitles = (activityIds: string[]) => {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = activityIds.slice().sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!activityIds.length) { setMap({}); return; }
      const { data: criteria } = await (supabase.from('acceptance_criteria') as any)
        .select('schedule_activity_id, task_id')
        .in('schedule_activity_id', activityIds);
      const taskIds = Array.from(new Set((criteria ?? []).map((c: any) => c.task_id).filter(Boolean)));
      let titleById: Record<string, string> = {};
      if (taskIds.length) {
        const { data: tasks } = await (supabase.from('backlog_tasks') as any)
          .select('id, title')
          .in('id', taskIds);
        titleById = Object.fromEntries((tasks ?? []).map((t: any) => [t.id, t.title]));
      }
      const result: Record<string, string> = {};
      for (const c of (criteria ?? []) as any[]) {
        if (c.schedule_activity_id && c.task_id && titleById[c.task_id]) {
          result[c.schedule_activity_id] = titleById[c.task_id];
        }
      }
      if (!cancelled) setMap(result);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
};
