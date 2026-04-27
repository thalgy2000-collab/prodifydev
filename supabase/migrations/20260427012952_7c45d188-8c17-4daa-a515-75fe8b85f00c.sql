CREATE TABLE public.google_calendar_tokens (
  user_id uuid PRIMARY KEY,
  refresh_token text NOT NULL,
  access_token text,
  expires_at timestamptz,
  scope text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own google tokens"
ON public.google_calendar_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own google tokens"
ON public.google_calendar_tokens FOR DELETE
USING (auth.uid() = user_id);
