-- Garante extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função que atualiza os estados das sprints em lote
CREATE OR REPLACE FUNCTION public.auto_update_sprint_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  -- Ativação em lote: planning -> active quando start_date <= hoje e end_date >= hoje
  UPDATE public.sprints
  SET status = 'active'
  WHERE status = 'planning'
    AND start_date <= _today
    AND end_date >= _today;

  -- Encerramento em lote: active -> completed quando end_date < hoje
  UPDATE public.sprints
  SET status = 'completed'
  WHERE status = 'active'
    AND end_date < _today;
EXCEPTION WHEN OTHERS THEN
  -- Resiliência: registra erro mas não derruba o cron job
  RAISE WARNING 'auto_update_sprint_status failed: %', SQLERRM;
END;
$$;

-- Remove agendamento anterior se existir (idempotente)
SELECT cron.unschedule('auto-update-sprint-status-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-update-sprint-status-daily');

-- Agenda execução diária às 00:00 UTC
SELECT cron.schedule(
  'auto-update-sprint-status-daily',
  '0 0 * * *',
  $$ SELECT public.auto_update_sprint_status(); $$
);