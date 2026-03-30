import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AcceptanceCriterion {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export const useAcceptanceCriteriaStore = () => {
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchByTask = useCallback(async (taskId: string) => {
    setLoading(true);
    const { data } = await (supabase.from('acceptance_criteria') as any)
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true });
    if (data) {
      setCriteria(data.map((d: any) => ({
        id: d.id,
        taskId: d.task_id,
        title: d.title,
        completed: d.completed,
        sortOrder: d.sort_order,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, []);

  const addCriterion = useCallback(async (taskId: string, title: string) => {
    const maxOrder = criteria.filter(c => c.taskId === taskId).reduce((m, c) => Math.max(m, c.sortOrder), -1);
    await (supabase.from('acceptance_criteria') as any).insert({
      task_id: taskId,
      title,
      sort_order: maxOrder + 1,
    });
    await fetchByTask(taskId);
  }, [criteria, fetchByTask]);

  const updateCriterion = useCallback(async (id: string, patch: { title?: string; completed?: boolean }, taskId: string) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.completed !== undefined) dbPatch.completed = patch.completed;
    await (supabase.from('acceptance_criteria') as any).update(dbPatch).eq('id', id);
    await fetchByTask(taskId);
  }, [fetchByTask]);

  const deleteCriterion = useCallback(async (id: string, taskId: string) => {
    await (supabase.from('acceptance_criteria') as any).delete().eq('id', id);
    await fetchByTask(taskId);
  }, [fetchByTask]);

  const getCriteriaForTask = useCallback((taskId: string) => {
    return criteria.filter(c => c.taskId === taskId);
  }, [criteria]);

  const allCompleted = useCallback((taskId: string) => {
    const taskCriteria = criteria.filter(c => c.taskId === taskId);
    return taskCriteria.length === 0 || taskCriteria.every(c => c.completed);
  }, [criteria]);

  const getProgress = useCallback((taskId: string) => {
    const taskCriteria = criteria.filter(c => c.taskId === taskId);
    if (taskCriteria.length === 0) return null;
    const done = taskCriteria.filter(c => c.completed).length;
    return { done, total: taskCriteria.length };
  }, [criteria]);

  // Fetch criteria for multiple tasks at once
  const fetchByTasks = useCallback(async (taskIds: string[]) => {
    if (taskIds.length === 0) { setCriteria([]); return; }
    const { data } = await (supabase.from('acceptance_criteria') as any)
      .select('*')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true });
    if (data) {
      setCriteria(data.map((d: any) => ({
        id: d.id,
        taskId: d.task_id,
        title: d.title,
        completed: d.completed,
        sortOrder: d.sort_order,
        createdAt: d.created_at,
      })));
    }
  }, []);

  return { criteria, loading, fetchByTask, fetchByTasks, addCriterion, updateCriterion, deleteCriterion, getCriteriaForTask, allCompleted, getProgress };
};
