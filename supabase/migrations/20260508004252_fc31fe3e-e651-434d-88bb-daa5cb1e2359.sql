
-- 1) Prevent privilege escalation via profiles.is_admin
CREATE OR REPLACE FUNCTION public.prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_app_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can modify is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_admin_escalation ON public.profiles;
CREATE TRIGGER prevent_self_admin_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_admin_escalation();

-- 2) Tighten product_members INSERT to enforce invite role match
DROP POLICY IF EXISTS "insert_member_via_invite_or_owner" ON public.product_members;
CREATE POLICY "insert_member_via_invite_or_owner"
ON public.product_members
FOR INSERT
TO authenticated
WITH CHECK (
  has_product_role(auth.uid(), product_id, 'owner')
  OR EXISTS (
    SELECT 1
    FROM public.product_invites pi
    WHERE pi.product_id = product_members.product_id
      AND pi.email = auth.email()
      AND pi.status = 'pending'
      AND pi.expires_at > now()
      AND pi.role = product_members.role
      AND product_members.user_id = auth.uid()
  )
);

-- 3) Restrict notifications INSERT (drop public-true policy; users can only insert for themselves)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4) Roadmap item linking tables: open access to all product members
DROP POLICY IF EXISTS "Users can manage own roadmap item key results" ON public.roadmap_item_key_results;
CREATE POLICY "Members can manage roadmap item key results"
ON public.roadmap_item_key_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.roadmap_items ri
    WHERE ri.id = roadmap_item_key_results.roadmap_item_id
      AND public.is_product_member(auth.uid(), ri.product_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.roadmap_items ri
    WHERE ri.id = roadmap_item_key_results.roadmap_item_id
      AND public.is_product_member(auth.uid(), ri.product_id)
  )
);

DROP POLICY IF EXISTS "Users can manage their own roadmap_item_tasks" ON public.roadmap_item_tasks;
CREATE POLICY "Members can manage roadmap item tasks"
ON public.roadmap_item_tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.roadmap_items ri
    WHERE ri.id = roadmap_item_tasks.roadmap_item_id
      AND public.is_product_member(auth.uid(), ri.product_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.roadmap_items ri
    WHERE ri.id = roadmap_item_tasks.roadmap_item_id
      AND public.is_product_member(auth.uid(), ri.product_id)
  )
);

-- 5) google_calendar_tokens: explicit INSERT/UPDATE policies scoped to owner
CREATE POLICY "Users insert own google tokens"
ON public.google_calendar_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own google tokens"
ON public.google_calendar_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6) Realtime channel authorization: restrict subscription to authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- 7) Pin search_path on remaining functions
ALTER FUNCTION public.add_owner_as_member() SET search_path = public;
ALTER FUNCTION public.create_notification(uuid, text, text, text) SET search_path = public;
