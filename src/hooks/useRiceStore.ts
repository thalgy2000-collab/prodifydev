import { useState, useCallback, useEffect } from 'react';
import { RiceScore } from '@/types/rice';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';

export const useRiceStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [scores, setScores] = useState<RiceScore[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setScores([]); return; }
    const { data } = await (supabase.from('rice_scores') as any).select('*').eq('product_id', activeProduct.id);
    if (data) {
      setScores(data.map((d: any) => ({
        id: d.id, itemId: d.item_id, itemType: d.item_type as RiceScore['itemType'],
        reach: Number(d.reach), impact: Number(d.impact),
        confidence: Number(d.confidence), effort: Number(d.effort),
        aiSuggested: !!d.ai_suggested,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setScore = useCallback(async (
    itemId: string,
    itemType: 'task' | 'initiative',
    patch: Partial<Pick<RiceScore, 'reach' | 'impact' | 'confidence' | 'effort' | 'aiSuggested'>>
  ) => {
    if (!user || !activeProduct) return;
    const dbPatch: any = { ...patch };
    if ('aiSuggested' in dbPatch) {
      dbPatch.ai_suggested = dbPatch.aiSuggested;
      delete dbPatch.aiSuggested;
    }
    const existing = scores.find(s => s.itemId === itemId);
    if (existing) {
      await (supabase.from('rice_scores') as any).update(dbPatch).eq('id', existing.id);
    } else {
      await (supabase.from('rice_scores') as any).insert({
        user_id: user.id, product_id: activeProduct.id, item_id: itemId, item_type: itemType,
        reach: dbPatch.reach ?? 5, impact: dbPatch.impact ?? 1,
        confidence: dbPatch.confidence ?? 0.8, effort: dbPatch.effort ?? 1,
        ai_suggested: dbPatch.ai_suggested ?? false,
      });
    }
    await fetchAll();
  }, [user, activeProduct, scores, fetchAll]);

  const getScore = useCallback((itemId: string) => scores.find(s => s.itemId === itemId), [scores]);

  const deleteScore = useCallback(async (itemId: string) => {
    const existing = scores.find(s => s.itemId === itemId);
    if (existing) {
      await (supabase.from('rice_scores') as any).delete().eq('id', existing.id);
      await fetchAll();
    }
  }, [scores, fetchAll]);

  return { scores, setScore, getScore, deleteScore, refresh: fetchAll };
};
