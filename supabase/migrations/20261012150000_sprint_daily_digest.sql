-- Preferências do lembrete diário da sprint (e-mail)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sprint_digest_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sprint_digest_hour integer NOT NULL DEFAULT 18
    CHECK (sprint_digest_hour BETWEEN 0 AND 23);

-- Agendamento: roda a cada hora cheia; a função só envia para quem escolheu
-- aquela hora (horário de Brasília). Requer pg_cron e pg_net.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- IMPORTANTE: troque SEU_CRON_SECRET pelo mesmo valor cadastrado como segredo
-- CRON_SECRET na Edge Function. Rode este bloco manualmente no SQL Editor.
-- SELECT cron.schedule(
--   'sprint-daily-digest',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://lyfvpwnrseavtxlmlzis.supabase.co/functions/v1/sprint-daily-digest',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', 'SEU_CRON_SECRET'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
