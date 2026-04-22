ALTER TABLE public.backlog_tasks ADD COLUMN IF NOT EXISTS sort_order integer;
CREATE INDEX IF NOT EXISTS idx_backlog_tasks_sort_order ON public.backlog_tasks(sort_order);