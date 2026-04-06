
-- Create a security definer function to insert notifications for any user
-- This avoids RLS issues when creating notifications for other users (e.g. product owner)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _action_url text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _action_url, _metadata);
END;
$$;
