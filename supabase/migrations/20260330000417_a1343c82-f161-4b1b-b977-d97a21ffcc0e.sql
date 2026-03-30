CREATE TABLE public.acceptance_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.backlog_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.acceptance_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage acceptance_criteria via task"
  ON public.acceptance_criteria
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.backlog_tasks bt
      WHERE bt.id = acceptance_criteria.task_id
        AND is_product_member(auth.uid(), bt.product_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.backlog_tasks bt
      WHERE bt.id = acceptance_criteria.task_id
        AND is_product_member(auth.uid(), bt.product_id)
    )
  );