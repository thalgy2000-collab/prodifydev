
CREATE TABLE public.epics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage product epics"
ON public.epics FOR ALL TO authenticated
USING (public.is_product_member(auth.uid(), product_id))
WITH CHECK (public.is_product_member(auth.uid(), product_id));

ALTER TABLE public.backlog_tasks ADD COLUMN epic_id uuid;
CREATE INDEX idx_backlog_tasks_epic_id ON public.backlog_tasks(epic_id);
CREATE INDEX idx_epics_product_id ON public.epics(product_id);
