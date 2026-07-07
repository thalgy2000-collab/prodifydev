import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';

export interface ProblemStatement {
  id: string;
  product_id: string;
  user_id: string;
  problem: string;
  objective: string;
  target_audience: string | null;
  is_current: boolean;
  version: number;
  created_at: string;
}

export interface ProblemStatementInput {
  problem: string;
  objective: string;
  target_audience?: string | null;
}

export function useProblemStatement() {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [current, setCurrent] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProduct) {
      setCurrent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('product_problem_statements')
      .select('*')
      .eq('product_id', activeProduct.id)
      .eq('is_current', true)
      .maybeSingle();
    setCurrent((data as ProblemStatement) ?? null);
    setLoading(false);
  }, [activeProduct]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNewVersion = useCallback(
    async (input: ProblemStatementInput) => {
      if (!activeProduct || !user) throw new Error('Sem produto ativo');

      await supabase
        .from('product_problem_statements')
        .update({ is_current: false })
        .eq('product_id', activeProduct.id)
        .eq('is_current', true);

      const { data: last } = await supabase
        .from('product_problem_statements')
        .select('version')
        .eq('product_id', activeProduct.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersion = ((last?.version as number | undefined) ?? 0) + 1;

      const { data: created, error } = await supabase
        .from('product_problem_statements')
        .insert({
          product_id: activeProduct.id,
          user_id: user.id,
          problem: input.problem,
          objective: input.objective,
          target_audience: input.target_audience || null,
          is_current: true,
          version: newVersion,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('products')
        .update({ current_problem_statement_id: created!.id })
        .eq('id', activeProduct.id);

      setCurrent(created as ProblemStatement);
      return created as ProblemStatement;
    },
    [activeProduct, user]
  );

  const listHistory = useCallback(async (): Promise<ProblemStatement[]> => {
    if (!activeProduct) return [];
    const { data } = await supabase
      .from('product_problem_statements')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('version', { ascending: false });
    return (data as ProblemStatement[]) ?? [];
  }, [activeProduct]);

  return { current, loading, reload: load, saveNewVersion, listHistory };
}
