import { useState, useCallback, useEffect } from 'react';
import { BacklogTask } from '@/types/backlog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBacklogStore = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BacklogTask[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setTasks([]); return; }
    const { data } = await (supabase.from('backlog_tasks') as any).select('*').eq('user_id', user.id);
    if (data) {
      setTasks(data.map(d => ({
        id: d.id, title: d.title, description: d.description,
        priority: d.priority as BacklogTask['priority'], status: d.status as BacklogTask['status'],
        category: d.category as BacklogTask['category'],
        initiativeId: d.initiative_id ?? undefined, objectiveId: d.objective_id ?? undefined,
        keyResultId: d.key_result_id ?? undefined, storyPoints: d.story_points ?? undefined,
        sprintId: d.sprint_id ?? undefined, returnedFromSprintId: d.returned_from_sprint_id ?? undefined,
        createdAt: d.created_at,
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTask = useCallback(async (data: Omit<BacklogTask, 'id' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('backlog_tasks').insert({
      user_id: user.id, title: data.title, description: data.description,
      priority: data.priority, status: data.status, category: data.category,
      initiative_id: data.initiativeId || null, objective_id: data.objectiveId || null,
      key_result_id: data.keyResultId || null, story_points: data.storyPoints ?? null,
      sprint_id: data.sprintId || null,
    });
    await fetchAll();
  }, [user, fetchAll]);

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
    await supabase.from('backlog_tasks').update(dbPatch).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('backlog_tasks').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const assignToSprint = useCallback(async (taskId: string, sprintId: string | undefined) => {
    await supabase.from('backlog_tasks').update({ sprint_id: sprintId || null }).eq('id', taskId);
    await fetchAll();
  }, [fetchAll]);

  const getByInitiative = useCallback((initiativeId: string) => tasks.filter(t => t.initiativeId === initiativeId), [tasks]);
  const getBySprint = useCallback((sprintId: string) => tasks.filter(t => t.sprintId === sprintId), [tasks]);
  const getUnassigned = useCallback(() => tasks.filter(t => !t.sprintId), [tasks]);

  return { tasks, addTask, updateTask, deleteTask, assignToSprint, getByInitiative, getBySprint, getUnassigned };
};