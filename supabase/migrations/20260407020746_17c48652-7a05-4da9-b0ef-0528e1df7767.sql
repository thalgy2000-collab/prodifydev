CREATE POLICY "Members can view fellow member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_members pm1
    JOIN public.product_members pm2 ON pm1.product_id = pm2.product_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  )
);