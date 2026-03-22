CREATE TABLE public.swot_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'strength',
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.swot_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own swot_analyses"
  ON public.swot_analyses
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);