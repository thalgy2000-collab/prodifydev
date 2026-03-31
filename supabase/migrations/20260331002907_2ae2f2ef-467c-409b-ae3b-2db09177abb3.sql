ALTER TABLE public.backlog_tasks ADD COLUMN due_date TEXT NULL;
ALTER TABLE public.backlog_tasks ADD COLUMN assignee_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;