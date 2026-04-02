-- Add bio field to profiles table
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Add full_name field if not exists (it was referenced in the code but might not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
  END IF;
END $$;

-- Add last_login field for security section
ALTER TABLE public.profiles ADD COLUMN last_login timestamptz;

-- Add notification preferences
ALTER TABLE public.profiles ADD COLUMN email_updates boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN sprint_reminders boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN weekly_summary boolean DEFAULT true;

-- Add theme and language preferences
ALTER TABLE public.profiles ADD COLUMN theme text DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN language text DEFAULT 'pt-BR';
