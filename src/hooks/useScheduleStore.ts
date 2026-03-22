import { useState, useCallback, useEffect } from 'react';
import { ScheduleActivity } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useScheduleStore = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setActivities([]); return; }
    const { data } = await supabase.from('schedule_activities' as any).select('*').eq('user_id', user.id);
    if (data) {
      setActivities((data as any[]).map((d: any) => ({
        id: d.id, title: d.title, description: d.description,
        activityDate: d.activity_date, startTime: d.start_time ?? undefined,
        endTime: d.end_time ?? undefined, sprintId: d.sprint_id ?? undefined,
        status: d.status as ScheduleActivity['status'], createdAt: d.created_at,
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addActivity = useCallback(async (data: Omit<ScheduleActivity, 'id' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('schedule_activities' as any).insert({
      user_id: user.id, title: data.title, description: data.description,
      activity_date: data.activityDate, start_time: data.startTime || null,
      end_time: data.endTime || null, sprint_id: data.sprintId || null, status: data.status,
    } as any);
    await fetchAll();
  }, [user, fetchAll]);

  const updateActivity = useCallback(async (id: string, patch: Partial<ScheduleActivity>) => {
    const dbPatch: any = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.activityDate !== undefined) dbPatch.activity_date = patch.activityDate;
    if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime || null;
    if (patch.endTime !== undefined) dbPatch.end_time = patch.endTime || null;
    if (patch.sprintId !== undefined) dbPatch.sprint_id = patch.sprintId || null;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    await (supabase.from('schedule_activities' as any) as any).update(dbPatch).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteActivity = useCallback(async (id: string) => {
    await (supabase.from('schedule_activities' as any) as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getByDate = useCallback((date: string) => activities.filter(a => a.activityDate === date), [activities]);

  return { activities, addActivity, updateActivity, deleteActivity, getByDate };
};