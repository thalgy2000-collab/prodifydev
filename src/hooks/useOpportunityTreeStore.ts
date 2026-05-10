import { useState, useCallback, useEffect } from 'react';
import { OpportunityNode } from '@/types/opportunityTree';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';

export const useOpportunityTreeStore = () => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const [nodes, setNodes] = useState<OpportunityNode[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user || !activeProduct) { setNodes([]); return; }
    const { data } = await (supabase.from('opportunity_nodes') as any).select('*').eq('product_id', activeProduct.id);
    if (data) {
      setNodes(data.map(d => ({
        id: d.id, objectiveId: d.objective_id, parentId: d.parent_id,
        type: d.type as OpportunityNode['type'], title: d.title,
        description: d.description, createdAt: d.created_at,
      })));
    }
  }, [user, activeProduct]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addNode = useCallback(async (data: Omit<OpportunityNode, 'id' | 'createdAt'>) => {
    if (!user || !activeProduct) return { id: '', ...data, createdAt: '' } as OpportunityNode;
    const { data: inserted } = await (supabase.from('opportunity_nodes') as any).insert({
      user_id: user.id, product_id: activeProduct.id, objective_id: data.objectiveId, parent_id: data.parentId,
      type: data.type, title: data.title, description: data.description,
    }).select().single();
    await fetchAll();
    return inserted ? {
      id: inserted.id, objectiveId: inserted.objective_id, parentId: inserted.parent_id,
      type: inserted.type as OpportunityNode['type'], title: inserted.title,
      description: inserted.description, createdAt: inserted.created_at,
    } : { id: '', ...data, createdAt: '' } as OpportunityNode;
  }, [user, activeProduct, fetchAll]);

  const updateNode = useCallback(async (id: string, patch: Partial<OpportunityNode>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    // Optimistic update
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
    await (supabase.from('opportunity_nodes') as any).update(dbPatch).eq('id', id);
  }, []);

  const deleteNode = useCallback(async (id: string) => {
    await (supabase.from('opportunity_nodes') as any).delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getNodesByObjective = useCallback((objectiveId: string) => nodes.filter(n => n.objectiveId === objectiveId), [nodes]);
  const getChildren = useCallback((parentId: string) => nodes.filter(n => n.parentId === parentId), [nodes]);

  return { nodes, addNode, updateNode, deleteNode, getNodesByObjective, getChildren, refresh: fetchAll };
};
