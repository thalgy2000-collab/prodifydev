import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { PRD } from '@/types/prd';
import { useToast } from '@/hooks/use-toast';

const mapRow = (r: any): PRD => ({
  id: r.id,
  productId: r.product_id,
  userId: r.user_id,
  title: r.title,
  version: r.version,
  status: r.status,
  problem: r.problem,
  objective: r.objective,
  targetAudience: r.target_audience,
  functionalRequirements: r.functional_requirements ?? [],
  nonFunctionalRequirements: r.non_functional_requirements ?? [],
  outOfScope: r.out_of_scope,
  successMetrics: r.success_metrics ?? [],
  estimatedTimeline: r.estimated_timeline,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function usePrdStore() {
  const [prds, setPrds] = useState<PRD[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('prds')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('updated_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar PRDs', description: error.message, variant: 'destructive' });
    } else {
      setPrds((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [activeProduct, toast]);

  const create = useCallback(async () => {
    if (!user || !activeProduct) return null;
    const { data, error } = await supabase
      .from('prds')
      .insert({ user_id: user.id, product_id: activeProduct.id, title: 'Novo PRD' })
      .select()
      .single();
    if (error) {
      toast({ title: 'Erro ao criar PRD', description: error.message, variant: 'destructive' });
      return null;
    }
    const prd = mapRow(data);
    setPrds(prev => [prd, ...prev]);
    return prd;
  }, [user, activeProduct, toast]);

  const update = useCallback(async (id: string, changes: Partial<PRD>) => {
    const payload: any = {};
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.version !== undefined) payload.version = changes.version;
    if (changes.status !== undefined) payload.status = changes.status;
    if (changes.problem !== undefined) payload.problem = changes.problem;
    if (changes.objective !== undefined) payload.objective = changes.objective;
    if (changes.targetAudience !== undefined) payload.target_audience = changes.targetAudience;
    if (changes.functionalRequirements !== undefined) payload.functional_requirements = changes.functionalRequirements;
    if (changes.nonFunctionalRequirements !== undefined) payload.non_functional_requirements = changes.nonFunctionalRequirements;
    if (changes.outOfScope !== undefined) payload.out_of_scope = changes.outOfScope;
    if (changes.successMetrics !== undefined) payload.success_metrics = changes.successMetrics;
    if (changes.estimatedTimeline !== undefined) payload.estimated_timeline = changes.estimatedTimeline;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('prds').update(payload).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao salvar PRD', description: error.message, variant: 'destructive' });
      return;
    }
    setPrds(prev => prev.map(p => p.id === id ? { ...p, ...changes, updatedAt: payload.updated_at } : p));
  }, [toast]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('prds').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir PRD', description: error.message, variant: 'destructive' });
      return;
    }
    setPrds(prev => prev.filter(p => p.id !== id));
  }, [toast]);

  return { prds, loading, fetch, create, update, remove };
}
