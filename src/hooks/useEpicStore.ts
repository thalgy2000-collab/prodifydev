import { useState, useCallback, useEffect } from 'react';
import { Epic } from '@/types/epic';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';

export const useEpicStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [epics, setEpics] = useState<Epic[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setEpics([]); return; }
    const { data } = await (supabase.from('epics') as any)
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: true });
    if (data) {
      setEpics(data.map((d: any) => ({
        id: d.id, productId: d.product_id, userId: d.user_id,
        name: d.name, description: d.description ?? '', color: d.color ?? '#6366f1',
        createdAt: d.created_at,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addEpic = useCallback(async (data: { name: string; description?: string; color?: string }) => {
    if (!user || !activeProduct) return;
    await (supabase.from('epics') as any).insert({
      user_id: user.id,
      product_id: activeProduct.id,
      name: data.name,
      description: data.description ?? '',
      color: data.color ?? '#6366f1',
    });
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

  const updateEpic = useCallback(async (id: string, patch: Partial<Pick<Epic, 'name' | 'description' | 'color'>>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    await (supabase.from('epics') as any).update(dbPatch).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteEpic = useCallback(async (id: string) => {
    // Unlink tasks first
    await (supabase.from('backlog_tasks') as any).update({ epic_id: null }).eq('epic_id', id);
    await (supabase.from('epics') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  return { epics, addEpic, updateEpic, deleteEpic, refresh: fetchAll };
};
