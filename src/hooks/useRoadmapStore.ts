import { useState, useCallback, useEffect } from 'react';
import { RoadmapItem, RoadmapItemKR } from '@/types/roadmap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';

export const useRoadmapStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [items, setItems] = useState<RoadmapItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setItems([]); return; }

    const { data: roadmapData } = await (supabase.from('roadmap_items') as any)
      .select('*')
      .eq('product_id', activeProduct.id);

    if (!roadmapData) { setItems([]); return; }

    // Fetch all linked KRs for this product's roadmap items
    const itemIds = roadmapData.map((d: any) => d.id);
    const { data: linkedKRsData } = await (supabase.from('roadmap_item_key_results') as any)
      .select('*')
      .in('roadmap_item_id', itemIds.length > 0 ? itemIds : ['__none__']);

    const krsByItemId: Record<string, RoadmapItemKR[]> = {};
    if (linkedKRsData) {
      for (const lk of linkedKRsData) {
        if (!krsByItemId[lk.roadmap_item_id]) krsByItemId[lk.roadmap_item_id] = [];
        krsByItemId[lk.roadmap_item_id].push({
          keyResultId: lk.key_result_id,
          krContribution: Number(lk.kr_contribution) || 0,
        });
      }
    }

    setItems(roadmapData.map((d: any) => ({
      id: d.id, title: d.title, description: d.description, quarter: d.quarter,
      status: d.status as RoadmapItem['status'], category: d.category as RoadmapItem['category'],
      objectiveId: d.objective_id ?? undefined,
      keyResultId: d.key_result_id ?? undefined,
      krContribution: d.kr_contribution ? Number(d.kr_contribution) : undefined,
      linkedKRs: krsByItemId[d.id] || [],
      startMonth: d.start_month, endMonth: d.end_month, color: d.color || '#6366f1',
      createdAt: d.created_at,
    })));
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveLinkedKRs = useCallback(async (roadmapItemId: string, linkedKRs: RoadmapItemKR[]) => {
    // Delete existing
    await (supabase.from('roadmap_item_key_results') as any)
      .delete()
      .eq('roadmap_item_id', roadmapItemId);
    // Insert new
    if (linkedKRs.length > 0) {
      await (supabase.from('roadmap_item_key_results') as any).insert(
        linkedKRs.map(lk => ({
          roadmap_item_id: roadmapItemId,
          key_result_id: lk.keyResultId,
          kr_contribution: lk.krContribution,
        }))
      );
    }
  }, []);

  const addItem = useCallback(async (data: Omit<RoadmapItem, 'id' | 'createdAt'>) => {
    if (!user || !activeProduct) return;
    const { data: inserted } = await (supabase.from('roadmap_items') as any).insert({
      user_id: user.id, product_id: activeProduct.id, title: data.title, description: data.description, quarter: data.quarter,
      status: data.status, category: data.category, objective_id: data.objectiveId || null,
      key_result_id: null, kr_contribution: null,
      start_month: data.startMonth, end_month: data.endMonth, color: data.color || '#6366f1',
    }).select('id').single();

    if (inserted && data.linkedKRs.length > 0) {
      await saveLinkedKRs(inserted.id, data.linkedKRs);
    }
    await fetchAll();
  }, [user, activeProduct, fetchAll, saveLinkedKRs]);

  const updateStatus = useCallback(async (id: string, status: RoadmapItem['status']) => {
    const item = items.find(i => i.id === id);
    await (supabase.from('roadmap_items') as any).update({ status }).eq('id', id);

    // Update linked KRs progress
    if (item && item.linkedKRs.length > 0) {
      for (const lk of item.linkedKRs) {
        if (!lk.krContribution) continue;
        const { data: kr } = await (supabase.from('key_results') as any)
          .select('current_value')
          .eq('id', lk.keyResultId)
          .single();
        if (kr) {
          const currentVal = Number(kr.current_value);
          const delta = status === 'done' ? lk.krContribution : -lk.krContribution;
          const newVal = Math.max(0, currentVal + delta);
          await (supabase.from('key_results') as any)
            .update({ current_value: newVal })
            .eq('id', lk.keyResultId);
        }
      }
    }

    await fetchAll();
  }, [fetchAll, items]);

  const updateItem = useCallback(async (updated: RoadmapItem) => {
    await (supabase.from('roadmap_items') as any).update({
      title: updated.title, description: updated.description, quarter: updated.quarter,
      status: updated.status, category: updated.category, objective_id: updated.objectiveId || null,
      key_result_id: null, kr_contribution: null,
      start_month: updated.startMonth, end_month: updated.endMonth, color: updated.color || '#6366f1',
    }).eq('id', updated.id);

    await saveLinkedKRs(updated.id, updated.linkedKRs);
    await fetchAll();
  }, [fetchAll, saveLinkedKRs]);

  const deleteItem = useCallback(async (id: string) => {
    await (supabase.from('roadmap_item_key_results') as any).delete().eq('roadmap_item_id', id);
    await (supabase.from('roadmap_items') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getByQuarter = useCallback((q: string) => items.filter(i => i.quarter === q), [items]);

  return { items, addItem, updateStatus, updateItem, deleteItem, getByQuarter };
};
