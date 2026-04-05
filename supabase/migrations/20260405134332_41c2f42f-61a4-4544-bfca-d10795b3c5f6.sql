CREATE POLICY "Invited user can update own invite status"
ON public.product_invites
FOR UPDATE
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);