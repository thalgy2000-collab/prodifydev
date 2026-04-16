
-- Helper: notify all members of a product (except the actor)
CREATE OR REPLACE FUNCTION public.notify_product_members(
  _product_id uuid,
  _exclude_user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _action_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member_id uuid;
BEGIN
  FOR _member_id IN
    SELECT user_id FROM public.product_members
    WHERE product_id = _product_id AND user_id != _exclude_user_id
  LOOP
    PERFORM public.create_notification(_member_id, _title, _message, _type, _action_url);
  END LOOP;
END;
$$;

-- 1. Invite accepted/rejected
CREATE OR REPLACE FUNCTION public.notify_invite_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NEW.status = 'accepted' THEN
      PERFORM public.create_notification(
        NEW.invited_by,
        'Convite aceito por ' || NEW.email,
        NEW.email || ' aceitou o convite para o produto.',
        'success'::text,
        '/membros'::text
      );
    ELSE
      PERFORM public.create_notification(
        NEW.invited_by,
        'Convite recusado por ' || NEW.email,
        NEW.email || ' recusou o convite para o produto.',
        'warning'::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_invite_response
AFTER UPDATE ON public.product_invites
FOR EACH ROW
EXECUTE FUNCTION public.notify_invite_response();

-- 2. Task assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id)
     AND NEW.assignee_id != NEW.user_id
  THEN
    PERFORM public.create_notification(
      NEW.assignee_id,
      'Você foi atribuído à tarefa: ' || NEW.title,
      'Uma tarefa foi atribuída a você no backlog.',
      'info'::text,
      '/backlog'::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_assigned
AFTER INSERT OR UPDATE ON public.backlog_tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_assigned();

-- 3. Sprint started/completed
CREATE OR REPLACE FUNCTION public.notify_sprint_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('active', 'completed') THEN
    IF NEW.status = 'active' THEN _label := 'foi iniciada'; ELSE _label := 'foi encerrada'; END IF;
    PERFORM public.notify_product_members(
      NEW.product_id,
      auth.uid(),
      'Sprint ' || NEW.name || ' ' || _label,
      'A sprint ' || NEW.name || ' ' || _label || '.',
      CASE WHEN NEW.status = 'active' THEN 'info' ELSE 'success' END,
      '/sprints'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_sprint_status
AFTER UPDATE ON public.sprints
FOR EACH ROW
EXECUTE FUNCTION public.notify_sprint_status();

-- 4. KR updated
CREATE OR REPLACE FUNCTION public.notify_kr_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _progress numeric;
BEGIN
  IF OLD.current_value IS DISTINCT FROM NEW.current_value AND NEW.target_value > 0 THEN
    _progress := ROUND((NEW.current_value / NEW.target_value) * 100);
    PERFORM public.notify_product_members(
      NEW.product_id,
      auth.uid(),
      'KR atualizado: ' || NEW.title || ' — ' || _progress || '%',
      'O progresso do KR "' || NEW.title || '" foi atualizado para ' || _progress || '%.',
      'info'::text,
      '/okrs'::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_kr_updated
AFTER UPDATE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.notify_kr_updated();

-- 5. Release published
CREATE OR REPLACE FUNCTION public.notify_release_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    PERFORM public.notify_product_members(
      NEW.product_id,
      auth.uid(),
      'Nova release publicada: ' || NEW.name || ' ' || NEW.version,
      'A release "' || NEW.name || ' ' || NEW.version || '" foi publicada.',
      'success'::text,
      '/releases'::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_release_published
AFTER UPDATE ON public.releases
FOR EACH ROW
EXECUTE FUNCTION public.notify_release_published();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
