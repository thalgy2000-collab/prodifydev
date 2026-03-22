import { useState, useCallback, useEffect } from 'react';
import { Sprint } from '@/types/sprint';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSprintStore = () => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setSprints([]); return; }
    const { data } = await (supabase.from('sprints') as any).select('*').eq('user_id', user.id);
    if (data) {
      setSprints(data.map(d => ({
        id: d.id, name: d.name, goal: d.goal,
        startDate: d.start_date, endDate: d.end_date,
        status: d.status as Sprint['status'], createdAt: d.created_at,
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addSprint = useCallback(async (data: Omit<Sprint, 'id' | 'createdAt'>) => {
    if (!user) return;
    await (supabase.from('sprints') as any).insert({
      user_id: user.id, name: data.name, goal: data.goal,
      start_date: data.startDate, end_date: data.endDate, status: data.status,
    });
    await fetchAll();
  }, [user, fetchAll]);

  const updateSprint = useCallback(async (id: string, patch: Partial<Sprint>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.goal !== undefined) dbPatch.goal = patch.goal;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    await (supabase.from('sprints') as any).update(dbPatch).eq('id', id);

    if (patch.status === 'completed') {
      await (supabase.from('backlog_tasks') as any)
        .update({ sprint_id: null, returned_from_sprint_id: id })
        .eq('sprint_id', id)
        .neq('status', 'done');
    }

    await fetchAll();
  }, [fetchAll]);

  const deleteSprint = useCallback(async (id: string) => {
    await (supabase.from('sprints') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getActiveSprint = useCallback(() => sprints.find(s => s.status === 'active'), [sprints]);

  return { sprints, addSprint, updateSprint, deleteSprint, getActiveSprint };
};