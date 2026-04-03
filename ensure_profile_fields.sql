-- Execute this in your Supabase SQL Editor to ensure profiles table has all required fields

-- Add missing fields to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS email_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sprint_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR';

-- Update existing profiles with default values if null
UPDATE public.profiles 
SET 
  email_updates = COALESCE(email_updates, true),
  sprint_reminders = COALESCE(sprint_reminders, true),
  weekly_summary = COALESCE(weekly_summary, true),
  theme = COALESCE(theme, 'dark'),
  language = COALESCE(language, 'pt-BR')
WHERE 
  email_updates IS NULL OR 
  sprint_reminders IS NULL OR 
  weekly_summary IS NULL OR 
  theme IS NULL OR 
  language IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
