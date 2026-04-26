CREATE OR REPLACE FUNCTION public.seed_example_data(new_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_product_id uuid := gen_random_uuid();
  v_obj1_id uuid := gen_random_uuid();
  v_obj2_id uuid := gen_random_uuid();
  v_obj3_id uuid := gen_random_uuid();
  v_sprint1_id uuid := gen_random_uuid();
  v_task1_id uuid := gen_random_uuid();
  v_task2_id uuid := gen_random_uuid();
  v_task3_id uuid := gen_random_uuid();
  v_task4_id uuid := gen_random_uuid();
  v_task5_id uuid := gen_random_uuid();
  v_road1_id uuid := gen_random_uuid();
  v_road2_id uuid := gen_random_uuid();
  v_road3_id uuid := gen_random_uuid();
  v_release1_id uuid := gen_random_uuid();
  v_prd1_id uuid := gen_random_uuid();
  v_node1_id uuid := gen_random_uuid();
  v_node2_id uuid := gen_random_uuid();
  v_node3_id uuid := gen_random_uuid();
  v_comp1_id uuid := gen_random_uuid();
  v_comp2_id uuid := gen_random_uuid();
  v_crit1_id uuid := gen_random_uuid();
  v_crit2_id uuid := gen_random_uuid();
  v_crit3_id uuid := gen_random_uuid();
  v_current_quarter text;
BEGIN
  -- Quarter atual baseado no mês corrente
  v_current_quarter := 'Q' || ((EXTRACT(MONTH FROM CURRENT_DATE)::int - 1) / 3 + 1) || ' ' || EXTRACT(YEAR FROM CURRENT_DATE)::text;

  -- PRODUTO
  INSERT INTO public.products (id, name, description, emoji, color, owner_id)
  VALUES (v_product_id, 'Produto Exemplo', 'Produto criado para demonstração do Prodify', '🚀', '#6366f1', new_user_id);

  INSERT INTO public.product_members (product_id, user_id, role)
  VALUES (v_product_id, new_user_id, 'owner')
  ON CONFLICT (product_id, user_id) DO NOTHING;

  -- OKRs
  INSERT INTO public.objectives (id, title, quarter, category, product_id, user_id)
  VALUES
    (v_obj1_id, 'Objetivo Exemplo 1', v_current_quarter, 'professional', v_product_id, new_user_id),
    (v_obj2_id, 'Objetivo Exemplo 2', v_current_quarter, 'professional', v_product_id, new_user_id),
    (v_obj3_id, 'Objetivo Exemplo 3', v_current_quarter, 'professional', v_product_id, new_user_id);

  -- KEY RESULTS
  INSERT INTO public.key_results (id, title, current_value, target_value, unit, objective_id, product_id, user_id)
  VALUES
    (gen_random_uuid(), 'KR Exemplo 1', 0, 100, '%', v_obj1_id, v_product_id, new_user_id),
    (gen_random_uuid(), 'KR Exemplo 2', 0, 1000, 'un', v_obj1_id, v_product_id, new_user_id),
    (gen_random_uuid(), 'KR Exemplo 3', 0, 50, 'un', v_obj2_id, v_product_id, new_user_id),
    (gen_random_uuid(), 'KR Exemplo 4', 0, 10, 'un', v_obj2_id, v_product_id, new_user_id),
    (gen_random_uuid(), 'KR Exemplo 5', 0, 5000, 'R$', v_obj3_id, v_product_id, new_user_id);

  -- ROADMAP (start_month/end_month são índices 0-2 dentro do quarter)
  INSERT INTO public.roadmap_items (id, title, description, quarter, start_month, end_month, progress, status, product_id, user_id)
  VALUES
    (v_road1_id, 'Iniciativa Exemplo 1', 'Descrição da iniciativa 1', v_current_quarter, 0, 1, 0, 'planned', v_product_id, new_user_id),
    (v_road2_id, 'Iniciativa Exemplo 2', 'Descrição da iniciativa 2', v_current_quarter, 1, 2, 0, 'planned', v_product_id, new_user_id),
    (v_road3_id, 'Iniciativa Exemplo 3', 'Descrição da iniciativa 3', v_current_quarter, 2, 2, 0, 'planned', v_product_id, new_user_id);

  -- SPRINT
  INSERT INTO public.sprints (id, name, goal, status, start_date, end_date, product_id, user_id)
  VALUES (v_sprint1_id, 'Sprint Exemplo 1', 'Meta da sprint de exemplo', 'active', CURRENT_DATE, CURRENT_DATE + 14, v_product_id, new_user_id);

  -- BACKLOG TASKS
  INSERT INTO public.backlog_tasks (id, title, description, status, priority, sort_order, completion_percentage, sprint_id, product_id, user_id)
  VALUES
    (v_task1_id, 'Tarefa Exemplo 1', 'Descrição da tarefa 1', 'open', 'high', 1, 0, v_sprint1_id, v_product_id, new_user_id),
    (v_task2_id, 'Tarefa Exemplo 2', 'Descrição da tarefa 2', 'open', 'high', 2, 0, v_sprint1_id, v_product_id, new_user_id),
    (v_task3_id, 'Tarefa Exemplo 3', 'Descrição da tarefa 3', 'in_progress', 'medium', 3, 50, v_sprint1_id, v_product_id, new_user_id),
    (v_task4_id, 'Tarefa Exemplo 4', 'Descrição da tarefa 4', 'open', 'medium', 4, 0, NULL, v_product_id, new_user_id),
    (v_task5_id, 'Tarefa Exemplo 5', 'Descrição da tarefa 5', 'done', 'low', 5, 100, NULL, v_product_id, new_user_id);

  -- RICE
  INSERT INTO public.rice_scores (id, item_id, item_type, reach, impact, confidence, effort, product_id, user_id)
  VALUES
    (gen_random_uuid(), v_task1_id::text, 'task', 1000, 3, 80, 2, v_product_id, new_user_id),
    (gen_random_uuid(), v_task2_id::text, 'task', 500, 2, 70, 3, v_product_id, new_user_id),
    (gen_random_uuid(), v_task3_id::text, 'task', 200, 1, 90, 1, v_product_id, new_user_id);

  -- RELEASE
  INSERT INTO public.releases (id, name, version, status, planned_date, product_id, user_id)
  VALUES (v_release1_id, 'Release Exemplo 1', 'v1.0', 'planned', (CURRENT_DATE + 60)::text, v_product_id, new_user_id);

  INSERT INTO public.release_items (release_id, roadmap_item_id)
  VALUES (v_release1_id, v_road3_id);

  -- PRD
  INSERT INTO public.prds (id, title, status, problem, objective, target_audience, product_id, user_id)
  VALUES (v_prd1_id, 'PRD Exemplo', 'draft',
    'Problema exemplo a ser resolvido pelo produto.',
    'Objetivo exemplo do produto.',
    'Público-alvo exemplo.',
    v_product_id, new_user_id);

  -- SWOT
  INSERT INTO public.swot_analyses (id, category, content, product_id, user_id)
  VALUES
    (gen_random_uuid(), 'strength', 'Força Exemplo 1', v_product_id, new_user_id),
    (gen_random_uuid(), 'strength', 'Força Exemplo 2', v_product_id, new_user_id),
    (gen_random_uuid(), 'weakness', 'Fraqueza Exemplo 1', v_product_id, new_user_id),
    (gen_random_uuid(), 'weakness', 'Fraqueza Exemplo 2', v_product_id, new_user_id),
    (gen_random_uuid(), 'opportunity', 'Oportunidade Exemplo 1', v_product_id, new_user_id),
    (gen_random_uuid(), 'opportunity', 'Oportunidade Exemplo 2', v_product_id, new_user_id),
    (gen_random_uuid(), 'threat', 'Ameaça Exemplo 1', v_product_id, new_user_id),
    (gen_random_uuid(), 'threat', 'Ameaça Exemplo 2', v_product_id, new_user_id);

  -- OPORTUNIDADES
  INSERT INTO public.opportunity_nodes (id, title, description, type, parent_id, objective_id, product_id, user_id)
  VALUES
    (v_node1_id, 'Oportunidade Raiz Exemplo', 'Descrição do problema central', 'problema', NULL, v_obj1_id, v_product_id, new_user_id),
    (v_node2_id, 'Oportunidade Exemplo 1', 'Descrição da oportunidade 1', 'oportunidade', v_node1_id, v_obj1_id, v_product_id, new_user_id),
    (v_node3_id, 'Oportunidade Exemplo 2', 'Descrição da oportunidade 2', 'oportunidade', v_node1_id, v_obj1_id, v_product_id, new_user_id);

  -- CONCORRÊNCIA
  INSERT INTO public.competitive_analysis (id, competitor_name, competitor_type, value_proposition, threat_level, strengths, weaknesses, differentiators, product_id, user_id)
  VALUES
    (v_comp1_id, 'Concorrente Exemplo 1', 'direct', 'Proposta de valor exemplo 1', 'high',
     ARRAY['Força Exemplo 1', 'Força Exemplo 2', 'Força Exemplo 3'],
     ARRAY['Fraqueza Exemplo 1', 'Fraqueza Exemplo 2'],
     ARRAY['Diferencial Exemplo 1', 'Diferencial Exemplo 2'],
     v_product_id, new_user_id),
    (v_comp2_id, 'Concorrente Exemplo 2', 'indirect', 'Proposta de valor exemplo 2', 'medium',
     ARRAY['Força Exemplo 1', 'Força Exemplo 2'],
     ARRAY['Fraqueza Exemplo 1', 'Fraqueza Exemplo 2'],
     ARRAY['Diferencial Exemplo 1'],
     v_product_id, new_user_id);

  INSERT INTO public.competitive_criteria (id, name, weight, product_id, user_id)
  VALUES
    (v_crit1_id, 'Critério Exemplo 1', 3, v_product_id, new_user_id),
    (v_crit2_id, 'Critério Exemplo 2', 4, v_product_id, new_user_id),
    (v_crit3_id, 'Critério Exemplo 3', 5, v_product_id, new_user_id);

  INSERT INTO public.competitive_scores (competitor_id, criteria_id, score)
  VALUES
    (v_comp1_id, v_crit1_id, 4), (v_comp1_id, v_crit2_id, 6), (v_comp1_id, v_crit3_id, 9),
    (v_comp2_id, v_crit1_id, 8), (v_comp2_id, v_crit2_id, 7), (v_comp2_id, v_crit3_id, 5);

END;
$function$;