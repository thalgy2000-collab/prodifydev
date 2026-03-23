
-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📦',
  color text NOT NULL DEFAULT '#6366f1',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create product_members table
CREATE TABLE public.product_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.product_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is member of a product
CREATE OR REPLACE FUNCTION public.is_product_member(_user_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.product_members
    WHERE user_id = _user_id AND product_id = _product_id
  )
$$;

-- Helper function: check if user has specific role in product
CREATE OR REPLACE FUNCTION public.has_product_role(_user_id uuid, _product_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.product_members
    WHERE user_id = _user_id AND product_id = _product_id AND role = _role
  )
$$;

-- RLS for products: members can see, owner can modify
CREATE POLICY "Members can view products" ON public.products
  FOR SELECT TO authenticated
  USING (public.is_product_member(auth.uid(), id));

CREATE POLICY "Owner can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_product_role(auth.uid(), id, 'owner'));

CREATE POLICY "Owner can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_product_role(auth.uid(), id, 'owner'));

-- RLS for product_members
CREATE POLICY "Members can view product members" ON public.product_members
  FOR SELECT TO authenticated
  USING (public.is_product_member(auth.uid(), product_id));

CREATE POLICY "Owner can manage members" ON public.product_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_product_role(auth.uid(), product_id, 'owner'));

CREATE POLICY "Owner can update members" ON public.product_members
  FOR UPDATE TO authenticated
  USING (public.has_product_role(auth.uid(), product_id, 'owner'));

CREATE POLICY "Owner can delete members" ON public.product_members
  FOR DELETE TO authenticated
  USING (public.has_product_role(auth.uid(), product_id, 'owner'));

-- Add product_id to all existing tables
ALTER TABLE public.objectives ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.key_results ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.sprints ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.backlog_tasks ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.roadmap_items ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.opportunity_nodes ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.rice_scores ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.schedule_activities ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.swot_analyses ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

-- Drop old RLS policies and create new ones based on product membership
DROP POLICY IF EXISTS "Users manage own objectives" ON public.objectives;
CREATE POLICY "Members manage product objectives" ON public.objectives
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own key_results" ON public.key_results;
CREATE POLICY "Members manage product key_results" ON public.key_results
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own sprints" ON public.sprints;
CREATE POLICY "Members manage product sprints" ON public.sprints
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own backlog_tasks" ON public.backlog_tasks;
CREATE POLICY "Members manage product backlog_tasks" ON public.backlog_tasks
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own roadmap_items" ON public.roadmap_items;
CREATE POLICY "Members manage product roadmap_items" ON public.roadmap_items
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own opportunity_nodes" ON public.opportunity_nodes;
CREATE POLICY "Members manage product opportunity_nodes" ON public.opportunity_nodes
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own rice_scores" ON public.rice_scores;
CREATE POLICY "Members manage product rice_scores" ON public.rice_scores
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own schedule_activities" ON public.schedule_activities;
CREATE POLICY "Members manage product schedule_activities" ON public.schedule_activities
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

DROP POLICY IF EXISTS "Users manage own swot_analyses" ON public.swot_analyses;
CREATE POLICY "Members manage product swot_analyses" ON public.swot_analyses
  FOR ALL TO authenticated
  USING (public.is_product_member(auth.uid(), product_id))
  WITH CHECK (public.is_product_member(auth.uid(), product_id));

-- Function to invite member by email
CREATE OR REPLACE FUNCTION public.invite_product_member(_product_id uuid, _email text, _role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user_id uuid;
  _result json;
BEGIN
  -- Check caller is owner
  IF NOT public.has_product_role(auth.uid(), _product_id, 'owner') THEN
    RETURN json_build_object('error', 'Only owner can invite members');
  END IF;
  
  -- Find user by email
  SELECT id INTO _target_user_id FROM auth.users WHERE email = _email;
  IF _target_user_id IS NULL THEN
    RETURN json_build_object('error', 'Usuário não encontrado com este email');
  END IF;
  
  -- Check not already member
  IF public.is_product_member(_target_user_id, _product_id) THEN
    RETURN json_build_object('error', 'Usuário já é membro deste produto');
  END IF;
  
  INSERT INTO public.product_members (product_id, user_id, role)
  VALUES (_product_id, _target_user_id, _role);
  
  RETURN json_build_object('success', true);
END;
$$;
