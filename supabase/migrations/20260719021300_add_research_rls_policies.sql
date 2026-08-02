-- Add RLS policies for research tables (desk_research, qualitative_research, data_analysis)
-- These tables were created but are missing the standard product-member RLS policies
-- that allow authenticated members to manage data within their products.
-- The quantitative_research table already has the correct policies (hence it works).

-- ============================================================
-- desk_research
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'desk_research'
      AND policyname = 'Members manage product desk_research'
  ) THEN
    EXECUTE 'CREATE POLICY "Members manage product desk_research" ON public.desk_research
      FOR ALL TO authenticated
      USING (public.is_product_member(auth.uid(), product_id))
      WITH CHECK (public.is_product_member(auth.uid(), product_id))';
  END IF;
END $$;

-- ============================================================
-- qualitative_research
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'qualitative_research'
      AND policyname = 'Members manage product qualitative_research'
  ) THEN
    EXECUTE 'CREATE POLICY "Members manage product qualitative_research" ON public.qualitative_research
      FOR ALL TO authenticated
      USING (public.is_product_member(auth.uid(), product_id))
      WITH CHECK (public.is_product_member(auth.uid(), product_id))';
  END IF;
END $$;

-- ============================================================
-- data_analysis
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'data_analysis'
      AND policyname = 'Members manage product data_analysis'
  ) THEN
    EXECUTE 'CREATE POLICY "Members manage product data_analysis" ON public.data_analysis
      FOR ALL TO authenticated
      USING (public.is_product_member(auth.uid(), product_id))
      WITH CHECK (public.is_product_member(auth.uid(), product_id))';
  END IF;
END $$;
