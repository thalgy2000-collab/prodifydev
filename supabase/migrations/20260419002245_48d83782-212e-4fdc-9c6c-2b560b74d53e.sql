-- 1. Cleanup existing orphan rice_scores for done tasks
DELETE FROM public.rice_scores
WHERE item_type = 'task'
  AND item_id IN (SELECT id::text FROM public.backlog_tasks WHERE status = 'done');

-- 2. Trigger function to auto-delete rice_score when task moves to done
CREATE OR REPLACE FUNCTION public.delete_rice_score_on_task_done()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    DELETE FROM public.rice_scores
    WHERE item_type = 'task' AND item_id = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_rice_score_on_task_done ON public.backlog_tasks;
CREATE TRIGGER trg_delete_rice_score_on_task_done
AFTER INSERT OR UPDATE OF status ON public.backlog_tasks
FOR EACH ROW
EXECUTE FUNCTION public.delete_rice_score_on_task_done();