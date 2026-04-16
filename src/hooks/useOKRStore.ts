import { useState, useCallback, useEffect } from 'react';
import { Objective, KeyResult, OKRCategory } from '@/types/okr';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { trackEvent } from '@/hooks/useAnalytics';
import { useProduct } from '@/contexts/ProductContext';

export const useOKRStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setObjectives([]); setLoading(false); return; }
    const { data: objs } = await (supabase.from('objectives') as any).select('*').eq('product_id', activeProduct.id);
    const { data: krs } = await (supabase.from('key_results') as any).select('*').eq('product_id', activeProduct.id);
    if (objs) {
      const mapped: Objective[] = objs.map(o => ({
        id: o.id, title: o.title, quarter: o.quarter,
        category: o.category as OKRCategory, createdAt: o.created_at,
        keyResults: (krs || []).filter(k => k.objective_id === o.id).map(k => ({
          id: k.id, title: k.title, currentValue: Number(k.current_value),
          targetValue: Number(k.target_value), unit: k.unit,
        })),
      }));
      setObjectives(mapped);
    }
    setLoading(false);
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addObjective = useCallback(async (title: string, quarter: string, category: OKRCategory, keyResults: Omit<KeyResult, 'id'>[]) => {
    if (!user || !activeProduct) return;
    const { data: obj } = await (supabase.from('objectives') as any).insert({ title, quarter, category, user_id: user.id, product_id: activeProduct.id }).select().single();
    if (obj && keyResults.length > 0) {
      await (supabase.from('key_results') as any).insert(keyResults.map(kr => ({
        title: kr.title, unit: kr.unit, objective_id: obj.id, user_id: user.id, product_id: activeProduct.id,
        current_value: kr.currentValue, target_value: kr.targetValue,
      })));
    }
    trackEvent('okr_created', user.id, { page: '/okrs', properties: { title, quarter } });
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

  const updateKeyResult = useCallback(async (objectiveId: string, krId: string, currentValue: number) => {
    await (supabase.from('key_results') as any).update({ current_value: currentValue }).eq('id', krId);
    trackEvent('kr_updated', user?.id, { page: '/okrs', properties: { krId, currentValue } });
    await fetchAll();
  }, [fetchAll]);

  const updateObjective = useCallback(async (id: string, updates: { title?: string; category?: OKRCategory; keyResults?: Omit<KeyResult, 'id'>[] }) => {
    if (!user || !activeProduct) return;
    if (updates.title || updates.category) {
      await (supabase.from('objectives') as any).update({
        ...(updates.title && { title: updates.title }),
        ...(updates.category && { category: updates.category }),
      }).eq('id', id);
    }
    if (updates.keyResults) {
      await (supabase.from('key_results') as any).delete().eq('objective_id', id);
      await (supabase.from('key_results') as any).insert(updates.keyResults.map(kr => ({
        title: kr.title, unit: kr.unit, objective_id: id, user_id: user.id, product_id: activeProduct.id,
        current_value: kr.currentValue, target_value: kr.targetValue,
      })));
    }
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

  const deleteObjective = useCallback(async (id: string) => {
    await (supabase.from('objectives') as any).delete().eq('id', id);
    trackEvent('okr_deleted', user?.id, { page: '/okrs', properties: { objectiveId: id } });
    await fetchAll();
  }, [fetchAll]);

  const getObjectivesByQuarter = useCallback((quarter: string) => objectives.filter(o => o.quarter === quarter), [objectives]);

  const getObjectiveProgress = useCallback((obj: Objective): number => {
    if (obj.keyResults.length === 0) return 0;
    const total = obj.keyResults.reduce((acc, kr) => acc + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0);
    return Math.round(total / obj.keyResults.length);
  }, []);

  return { objectives, loading, addObjective, updateObjective, updateKeyResult, deleteObjective, getObjectivesByQuarter, getObjectiveProgress, refetch: fetchAll };
};
