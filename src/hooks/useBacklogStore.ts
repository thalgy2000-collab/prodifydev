import { useState, useCallback, useEffect } from 'react';
import { BacklogTask } from '@/types/backlog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { trackEvent } from '@/hooks/useAnalytics';

export const useBacklogStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [tasks, setTasks] = useState<BacklogTask[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setTasks([]); return; }
    const { data } = await (supabase.from('backlog_tasks') as any).select('*').eq('product_id', activeProduct.id);
    if (data) {
      setTasks(data.map(d => ({
        id: d.id, title: d.title, description: d.description,
        priority: d.priority as BacklogTask['priority'], status: d.status as BacklogTask['status'],
        category: d.category as BacklogTask['category'],
        initiativeId: d.initiative_id ?? undefined, objectiveId: d.objective_id ?? undefined,
        keyResultId: d.key_result_id ?? undefined, storyPoints: d.story_points ?? undefined,
        sprintId: d.sprint_id ?? undefined, returnedFromSprintId: d.returned_from_sprint_id ?? undefined,
        dueDate: d.due_date ?? undefined, dueTime: d.due_time ?? undefined, dueEndTime: d.due_end_time ?? undefined,
        scheduleActivityId: d.schedule_activity_id ?? undefined, assigneeId: d.assignee_id ?? undefined,
        completionPercentage: d.completion_percentage ?? 0,
        roadmapImpact: d.roadmap_impact ?? 0,
        createdAt: d.created_at,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTask = useCallback(async (data: Omit<BacklogTask, 'id' | 'createdAt'>) => {
    if (!user || !activeProduct) return;
    await (supabase.from('backlog_tasks') as any).insert({
      user_id: user.id, product_id: activeProduct.id, title: data.title, description: data.description,
      priority: data.priority, status: data.status, category: data.category,
      initiative_id: data.initiativeId || null, objective_id: data.objectiveId || null,
      key_result_id: data.keyResultId || null, story_points: data.storyPoints ?? null,
      sprint_id: data.sprintId || null, assignee_id: data.assigneeId || null,
    });
    trackEvent('task_created', user.id, { page: '/backlog', properties: { title: data.title, priority: data.priority } });
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

  const updateTask = useCallback(async (id: string, patch: Partial<BacklogTask>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.initiativeId !== undefined) dbPatch.initiative_id = patch.initiativeId || null;
    if (patch.objectiveId !== undefined) dbPatch.objective_id = patch.objectiveId || null;
    if (patch.keyResultId !== undefined) dbPatch.key_result_id = patch.keyResultId || null;
    if (patch.storyPoints !== undefined) dbPatch.story_points = patch.storyPoints ?? null;
    if (patch.sprintId !== undefined) dbPatch.sprint_id = patch.sprintId || null;
    if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate || null;
    if (patch.dueTime !== undefined) dbPatch.due_time = patch.dueTime || null;
    if (patch.dueEndTime !== undefined) dbPatch.due_end_time = patch.dueEndTime || null;
    if (patch.scheduleActivityId !== undefined) dbPatch.schedule_activity_id = patch.scheduleActivityId || null;
    if (patch.assigneeId !== undefined) dbPatch.assignee_id = patch.assigneeId || null;
    await (supabase.from('backlog_tasks') as any).update(dbPatch).eq('id', id);
    trackEvent('task_updated', user?.id, { page: '/backlog', properties: { taskId: id, fields: Object.keys(dbPatch) } });
    await fetchAll();
  }, [fetchAll]);

  const deleteTask = useCallback(async (id: string) => {
    await (supabase.from('backlog_tasks') as any).delete().eq('id', id);
    trackEvent('task_deleted', user?.id, { page: '/backlog', properties: { taskId: id } });
    await fetchAll();
  }, [fetchAll]);

  const assignToSprint = useCallback(async (taskId: string, sprintId: string | undefined) => {
    await (supabase.from('backlog_tasks') as any).update({ sprint_id: sprintId || null }).eq('id', taskId);
    await fetchAll();
  }, [fetchAll]);

  const getByInitiative = useCallback((initiativeId: string) => tasks.filter(t => t.initiativeId === initiativeId), [tasks]);
  const getBySprint = useCallback((sprintId: string) => tasks.filter(t => t.sprintId === sprintId), [tasks]);
  const getUnassigned = useCallback(() => tasks.filter(t => !t.sprintId), [tasks]);

  return { tasks, addTask, updateTask, deleteTask, assignToSprint, getByInitiative, getBySprint, getUnassigned };
};
