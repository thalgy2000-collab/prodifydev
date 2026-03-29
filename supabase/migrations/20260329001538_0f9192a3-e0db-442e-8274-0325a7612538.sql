
CREATE TABLE public.releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  planned_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage product releases"
  ON public.releases FOR ALL TO authenticated
  USING (is_product_member(auth.uid(), product_id))
  WITH CHECK (is_product_member(auth.uid(), product_id));

CREATE TABLE public.release_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_id UUID REFERENCES public.releases(id) ON DELETE CASCADE NOT NULL,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (release_id, roadmap_item_id)
);

ALTER TABLE public.release_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage release_items via release"
  ON public.release_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.releases r WHERE r.id = release_id AND is_product_member(auth.uid(), r.product_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.releases r WHERE r.id = release_id AND is_product_member(auth.uid(), r.product_id)));
