import { useState, useCallback, useEffect } from 'react';
import { RiceScore } from '@/types/rice';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRiceStore = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState<RiceScore[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setScores([]); return; }
    const { data } = await (supabase.from('rice_scores') as any).select('*').eq('user_id', user.id);
    if (data) {
      setScores(data.map(d => ({
        id: d.id, itemId: d.item_id, itemType: d.item_type as RiceScore['itemType'],
        reach: Number(d.reach), impact: Number(d.impact),
        confidence: Number(d.confidence), effort: Number(d.effort),
      })));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setScore = useCallback(async (itemId: string, itemType: 'task' | 'initiative', patch: Partial<Pick<RiceScore, 'reach' | 'impact' | 'confidence' | 'effort'>>) => {
    if (!user) return;
    const existing = scores.find(s => s.itemId === itemId);
    if (existing) {
      await supabase.from('rice_scores').update(patch).eq('id', existing.id);
    } else {
      await supabase.from('rice_scores').insert({
        user_id: user.id, item_id: itemId, item_type: itemType,
        reach: patch.reach ?? 5, impact: patch.impact ?? 1,
        confidence: patch.confidence ?? 0.8, effort: patch.effort ?? 1,
      });
    }
    await fetchAll();
  }, [user, scores, fetchAll]);

  const getScore = useCallback((itemId: string) => scores.find(s => s.itemId === itemId), [scores]);

  const deleteScore = useCallback(async (itemId: string) => {
    const existing = scores.find(s => s.itemId === itemId);
    if (existing) {
      await supabase.from('rice_scores').delete().eq('id', existing.id);
      await fetchAll();
    }
  }, [scores, fetchAll]);

  return { scores, setScore, getScore, deleteScore };
};