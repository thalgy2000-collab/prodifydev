-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. Security-definer function to check admin (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = _user_id), false);
$$;

-- 3. Function for client to update its own last_seen_at
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid();
$$;

-- 4. Admin RLS policies
-- profiles: admins can view & update everyone
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_app_admin(auth.uid()))
WITH CHECK (public.is_app_admin(auth.uid()));

-- products: admins manage all
DROP POLICY IF EXISTS "Admins manage all products" ON public.products;
CREATE POLICY "Admins manage all products" ON public.products
FOR ALL TO authenticated
USING (public.is_app_admin(auth.uid()))
WITH CHECK (public.is_app_admin(auth.uid()));

-- product_invites: admins manage all
DROP POLICY IF EXISTS "Admins manage all invites" ON public.product_invites;
CREATE POLICY "Admins manage all invites" ON public.product_invites
FOR ALL TO authenticated
USING (public.is_app_admin(auth.uid()))
WITH CHECK (public.is_app_admin(auth.uid()));

-- product_members: admins can view all
DROP POLICY IF EXISTS "Admins view all members" ON public.product_members;
CREATE POLICY "Admins view all members" ON public.product_members
FOR SELECT TO authenticated
USING (public.is_app_admin(auth.uid()));

-- events: admins can view all
DROP POLICY IF EXISTS "Admins view all events" ON public.events;
CREATE POLICY "Admins view all events" ON public.events
FOR SELECT TO authenticated
USING (public.is_app_admin(auth.uid()));

-- backlog_tasks: admins view all (for product detail counts)
DROP POLICY IF EXISTS "Admins view all backlog_tasks" ON public.backlog_tasks;
CREATE POLICY "Admins view all backlog_tasks" ON public.backlog_tasks
FOR SELECT TO authenticated
USING (public.is_app_admin(auth.uid()));