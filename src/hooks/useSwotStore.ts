import { useState, useCallback, useEffect } from 'react';
import { SwotItem, SwotCategory } from '@/types/swot';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';

export const useSwotStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [items, setItems] = useState<SwotItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setItems([]); return; }
    const { data } = await (supabase.from('swot_analyses') as any).select('*').eq('product_id', activeProduct.id);
    if (data) {
      setItems(data.map((d: any) => ({
        id: d.id, objectiveId: d.objective_id ?? null,
        category: d.category as SwotCategory, content: d.content, createdAt: d.created_at,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addItem = useCallback(async (data: Omit<SwotItem, 'id' | 'createdAt'>) => {
    if (!user || !activeProduct) return;
    await (supabase.from('swot_analyses') as any).insert({
      user_id: user.id, product_id: activeProduct.id,
      objective_id: data.objectiveId || null, category: data.category, content: data.content,
    });
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

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

  return { items, addItem, updateItem, deleteItem, getByObjective, refresh: fetchAll };
};
