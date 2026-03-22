import { useState, useCallback, useEffect } from 'react';
import { SwotItem } from '@/types/swot';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSwotStore = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<SwotItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await (supabase.from('swot_analyses') as any).select('*').eq('user_id', user.id);
    if (data) {
      setItems(data.map((d: any) => ({
        id: d.id,
        objectiveId: d.objective_id,
        category: d.category,
        content: d.content,
        createdAt: d.created_at,
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addItem = useCallback(async (data: Omit<SwotItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    await (supabase.from('swot_analyses') as any).insert({
      user_id: user.id,
      objective_id: data.objectiveId,
      category: data.category,
      content: data.content,
    });
    await fetchAll();
  }, [user, fetchAll]);

  const updateItem = useCallback(async (id: string, content: string) => {
    await (supabase.from('swot_analyses') as any).update({ content }).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteItem = useCallback(async (id: string) => {
    await (supabase.from('swot_analyses') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getByObjective = useCallback((objectiveId: string | null) =>
    items.filter(i => i.objectiveId === objectiveId), [items]);

  return { items, addItem, updateItem, deleteItem, getByObjective };
};
