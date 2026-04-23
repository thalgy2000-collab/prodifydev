
-- 1. Habilita extensões de cron e http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Adiciona coluna de timestamp de atualização do progresso
ALTER TABLE public.roadmap_items
  ADD COLUMN IF NOT EXISTS progress_updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Trigger: atualiza progress_updated_at quando progress muda
CREATE OR REPLACE FUNCTION public.touch_roadmap_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.progress IS DISTINCT FROM NEW.progress THEN
    NEW.progress_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_roadmap_progress_updated_at ON public.roadmap_items;
CREATE TRIGGER trg_touch_roadmap_progress_updated_at
BEFORE INSERT OR UPDATE OF progress ON public.roadmap_items
FOR EACH ROW
EXECUTE FUNCTION public.touch_roadmap_progress_updated_at();

-- 4. Função que verifica iniciativas paradas e notifica (com dedup)
CREATE OR REPLACE FUNCTION public.check_stale_roadmap_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  _already_notified boolean;
BEGIN
  FOR r IN
    SELECT id, user_id, title, progress_updated_at
    FROM public.roadmap_items
    WHERE status NOT IN ('done', 'completed', 'cancelled')
      AND COALESCE(progress, 0) < 100
      AND progress_updated_at < (now() - interval '14 days')
  LOOP
    -- Dedup: já existe notificação para esta iniciativa após a última atualização de progresso?
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = r.user_id
        AND type = 'warning'
        AND metadata->>'roadmap_item_id' = r.id::text
        AND metadata->>'stale_since' = r.progress_updated_at::text
    ) INTO _already_notified;

    IF NOT _already_notified THEN
      PERFORM public.create_notification(
        r.user_id,
        'Iniciativa parada: ' || r.title,
        'Esta iniciativa está parada há 14 dias. Considere revisitar ou encerrar.',
        'warning'::text,
        '/roadmap'::text,
        jsonb_build_object(
          'roadmap_item_id', r.id,
          'stale_since', r.progress_updated_at
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- 5. Agenda execução diária às 09:00 UTC
SELECT cron.unschedule('check-stale-roadmap-items-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-stale-roadmap-items-daily');

SELECT cron.schedule(
  'check-stale-roadmap-items-daily',
  '0 9 * * *',
  $$ SELECT public.check_stale_roadmap_items(); $$
);
