import { useState, useCallback, useEffect } from 'react';
import { RoadmapItem } from '@/types/roadmap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRoadmapStore = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await (supabase.from('roadmap_items') as any).select('*').eq('user_id', user.id);
    if (data) {
      setItems(data.map(d => ({
        id: d.id, title: d.title, description: d.description, quarter: d.quarter,
        status: d.status as RoadmapItem['status'], category: d.category as RoadmapItem['category'],
        objectiveId: d.objective_id ?? undefined, keyResultId: d.key_result_id ?? undefined,
        krContribution: d.kr_contribution ? Number(d.kr_contribution) : undefined,
        startMonth: d.start_month, endMonth: d.end_month, createdAt: d.created_at,
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addItem = useCallback(async (data: Omit<RoadmapItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    await (supabase.from('roadmap_items') as any).insert({
      user_id: user.id, title: data.title, description: data.description, quarter: data.quarter,
      status: data.status, category: data.category, objective_id: data.objectiveId || null,
      key_result_id: data.keyResultId || null, kr_contribution: data.krContribution ?? null,
      start_month: data.startMonth, end_month: data.endMonth,
    });
    await fetchAll();
  }, [user, fetchAll]);

  const updateStatus = useCallback(async (id: string, status: RoadmapItem['status']) => {
    await (supabase.from('roadmap_items') as any).update({ status }).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const updateItem = useCallback(async (updated: RoadmapItem) => {
    await supabase.from('roadmap_items').update({
      title: updated.title, description: updated.description, quarter: updated.quarter,
      status: updated.status, category: updated.category, objective_id: updated.objectiveId || null,
      key_result_id: updated.keyResultId || null, kr_contribution: updated.krContribution ?? null,
      start_month: updated.startMonth, end_month: updated.endMonth,
    }).eq('id', updated.id);
    await fetchAll();
  }, [fetchAll]);

  const deleteItem = useCallback(async (id: string) => {
    await supabase.from('roadmap_items').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getByQuarter = useCallback((q: string) => items.filter(i => i.quarter === q), [items]);

  return { items, addItem, updateStatus, updateItem, deleteItem, getByQuarter };
};