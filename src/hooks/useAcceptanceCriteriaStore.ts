import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AcceptanceCriterion {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  dueDate: string | null;
  dueTime: string | null;
  scheduleActivityId: string | null;
  createdAt: string;
}

const mapRow = (d: any): AcceptanceCriterion => ({
  id: d.id,
  taskId: d.task_id,
  title: d.title,
  completed: d.completed,
  sortOrder: d.sort_order,
  dueDate: d.due_date ?? null,
  dueTime: d.due_time ?? null,
  scheduleActivityId: d.schedule_activity_id ?? null,
  createdAt: d.created_at,
});

export const useAcceptanceCriteriaStore = () => {
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchByTask = useCallback(async (taskId: string) => {
    setLoading(true);
    const { data } = await (supabase.from('acceptance_criteria') as any)
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true });
    if (data) setCriteria(data.map(mapRow));
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

  const updateCriterion = useCallback(async (id: string, patch: { title?: string; completed?: boolean; due_date?: string | null; due_time?: string | null; schedule_activity_id?: string | null }, taskId: string) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.completed !== undefined) dbPatch.completed = patch.completed;
    if (patch.due_date !== undefined) dbPatch.due_date = patch.due_date;
    if (patch.due_time !== undefined) dbPatch.due_time = patch.due_time;
    if (patch.schedule_activity_id !== undefined) dbPatch.schedule_activity_id = patch.schedule_activity_id;
    await (supabase.from('acceptance_criteria') as any).update(dbPatch).eq('id', id);
    await fetchByTask(taskId);
  }, [fetchByTask]);

  const deleteCriterion = useCallback(async (id: string, taskId: string) => {
    await (supabase.from('acceptance_criteria') as any).delete().eq('id', id);
    await fetchByTask(taskId);
  }, [fetchByTask]);

  const reorderCriteria = useCallback(async (taskId: string, orderedIds: string[]) => {
    // Optimistic update
    setCriteria(prev => {
      const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
      return prev.map(c =>
        c.taskId === taskId && orderMap.has(c.id)
          ? { ...c, sortOrder: orderMap.get(c.id)! }
          : c
      );
    });
    await Promise.all(
      orderedIds.map((id, idx) =>
        (supabase.from('acceptance_criteria') as any).update({ sort_order: idx }).eq('id', id)
      )
    );
  }, []);

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

  const fetchByTasks = useCallback(async (taskIds: string[]) => {
    if (taskIds.length === 0) { setCriteria([]); return; }
    const { data } = await (supabase.from('acceptance_criteria') as any)
      .select('*')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true });
    if (data) setCriteria(data.map(mapRow));
  }, []);

  return { criteria, loading, fetchByTask, fetchByTasks, addCriterion, updateCriterion, deleteCriterion, reorderCriteria, getCriteriaForTask, allCompleted, getProgress };
};
