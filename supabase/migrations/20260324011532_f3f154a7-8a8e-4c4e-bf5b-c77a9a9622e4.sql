
-- Remove recursive policies that cause infinite recursion
DROP POLICY IF EXISTS "select_memberships" ON public.product_members;
DROP POLICY IF EXISTS "delete_memberships" ON public.product_members;
DROP POLICY IF EXISTS "select_products" ON public.products;

-- Recreate select_products using SECURITY DEFINER function (no recursion)
CREATE POLICY "select_products" ON public.products
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR is_product_member(auth.uid(), id));
