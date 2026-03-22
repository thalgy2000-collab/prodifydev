
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Objectives
CREATE TABLE public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  quarter text NOT NULL,
  category text NOT NULL DEFAULT 'professional',
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own objectives" ON public.objectives FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Key Results
CREATE TABLE public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  current_value numeric DEFAULT 0 NOT NULL,
  target_value numeric DEFAULT 100 NOT NULL,
  unit text DEFAULT '%' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own key_results" ON public.key_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sprints
CREATE TABLE public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  goal text DEFAULT '' NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  status text DEFAULT 'planning' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sprints" ON public.sprints FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Backlog Tasks
CREATE TABLE public.backlog_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  priority text DEFAULT 'medium' NOT NULL,
  status text DEFAULT 'open' NOT NULL,
  category text DEFAULT 'professional' NOT NULL,
  initiative_id uuid,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  key_result_id uuid REFERENCES public.key_results(id) ON DELETE SET NULL,
  story_points integer,
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  returned_from_sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.backlog_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own backlog_tasks" ON public.backlog_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Roadmap Items
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  quarter text NOT NULL,
  status text DEFAULT 'planned' NOT NULL,
  category text DEFAULT 'professional' NOT NULL,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  key_result_id uuid REFERENCES public.key_results(id) ON DELETE SET NULL,
  kr_contribution numeric,
  start_month integer DEFAULT 0 NOT NULL,
  end_month integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own roadmap_items" ON public.roadmap_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Opportunity Nodes
CREATE TABLE public.opportunity_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.opportunity_nodes(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'outcome',
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.opportunity_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own opportunity_nodes" ON public.opportunity_nodes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RICE Scores
CREATE TABLE public.rice_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL DEFAULT 'task',
  reach numeric DEFAULT 5 NOT NULL,
  impact numeric DEFAULT 1 NOT NULL,
  confidence numeric DEFAULT 0.8 NOT NULL,
  effort numeric DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.rice_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rice_scores" ON public.rice_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Schedule Activities
CREATE TABLE public.schedule_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  activity_date text NOT NULL,
  start_time text,
  end_time text,
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedule_activities" ON public.schedule_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
