import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';

export type DiscoveryCounts = {
  interviews: number;
  personas: number;
  competition: number;
  swot: number;
  opportunities: number;
  hypotheses: number;
  usabilityTests: number;
  csd: number;
};

const ZERO: DiscoveryCounts = {
  interviews: 0,
  personas: 0,
  competition: 0,
  swot: 0,
  opportunities: 0,
  hypotheses: 0,
  usabilityTests: 0,
  csd: 0,
};

export function useDiscoveryCounts() {
  const { activeProduct } = useProduct();
  const productId = activeProduct?.id;

  return useQuery<DiscoveryCounts>({
    queryKey: ['discovery-counts', productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return ZERO;
      const count = (table: string) =>
        (supabase as any)
          .from(table)
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId)
          .then((r: any) => r.count ?? 0);

      const [interviews, personas, competition, swot, opportunities, hypotheses, usabilityTests, csd] =
        await Promise.all([
          count('user_interviews'),
          count('personas'),
          count('competitive_analysis'),
          count('swot_analyses'),
          count('opportunity_nodes'),
          count('hypotheses'),
          count('usability_tests'),
          count('csd_matrix'),
        ]);

      return { interviews, personas, competition, swot, opportunities, hypotheses, usabilityTests, csd };
    },
  });
}
