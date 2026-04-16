import { useState, useCallback, useEffect } from 'react';
import { Release, ReleaseItem } from '@/types/release';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { trackEvent } from '@/hooks/useAnalytics';

export const useReleaseStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [releases, setReleases] = useState<Release[]>([]);
  const [releaseItems, setReleaseItems] = useState<ReleaseItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setReleases([]); setReleaseItems([]); return; }
    const { data: rels } = await (supabase.from('releases') as any).select('*').eq('product_id', activeProduct.id).order('planned_date', { ascending: true });
    if (rels) {
      setReleases(rels.map((r: any) => ({
        id: r.id, name: r.name, version: r.version,
        plannedDate: r.planned_date, status: r.status as Release['status'],
        createdAt: r.created_at,
      })));
    }
    const { data: items } = await (supabase.from('release_items') as any).select('*');
    if (items) {
      setReleaseItems(items.map((i: any) => ({
        id: i.id, releaseId: i.release_id,
        roadmapItemId: i.roadmap_item_id, createdAt: i.created_at,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addRelease = useCallback(async (data: { name: string; version: string; plannedDate: string; status: Release['status'] }) => {
    if (!user || !activeProduct) return;
    await (supabase.from('releases') as any).insert({
      user_id: user.id, product_id: activeProduct.id,
      name: data.name, version: data.version,
      planned_date: data.plannedDate, status: data.status,
    });
    trackEvent('release_created', user.id, { page: '/releases', properties: { name: data.name, version: data.version } });
    await fetchAll();
  }, [user, activeProduct, fetchAll]);

  const updateRelease = useCallback(async (id: string, data: Partial<{ name: string; version: string; plannedDate: string; status: Release['status'] }>) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.plannedDate !== undefined) updateData.planned_date = data.plannedDate;
    if (data.status !== undefined) updateData.status = data.status;
    await (supabase.from('releases') as any).update(updateData).eq('id', id);
    trackEvent('release_updated', user?.id, { page: '/releases', properties: { releaseId: id, ...data } });
    await fetchAll();
  }, [fetchAll]);

  const deleteRelease = useCallback(async (id: string) => {
    await (supabase.from('releases') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const addItemToRelease = useCallback(async (releaseId: string, roadmapItemId: string) => {
    await (supabase.from('release_items') as any).insert({ release_id: releaseId, roadmap_item_id: roadmapItemId });
    await fetchAll();
  }, [fetchAll]);

  const removeItemFromRelease = useCallback(async (releaseId: string, roadmapItemId: string) => {
    await (supabase.from('release_items') as any).delete().eq('release_id', releaseId).eq('roadmap_item_id', roadmapItemId);
    await fetchAll();
  }, [fetchAll]);

  const getItemsForRelease = useCallback((releaseId: string) => {
    return releaseItems.filter(i => i.releaseId === releaseId);
  }, [releaseItems]);

  return { releases, releaseItems, addRelease, updateRelease, deleteRelease, addItemToRelease, removeItemFromRelease, getItemsForRelease };
};
