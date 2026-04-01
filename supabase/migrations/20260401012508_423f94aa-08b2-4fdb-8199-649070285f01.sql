
CREATE TABLE public.prds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT 'v1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  problem TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  functional_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  non_functional_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  out_of_scope TEXT NOT NULL DEFAULT '',
  success_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_timeline TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage product prds"
  ON public.prds
  FOR ALL
  TO authenticated
  USING (is_product_member(auth.uid(), product_id))
  WITH CHECK (is_product_member(auth.uid(), product_id));
