ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill sort_order based on created_at within each (product_id, quarter, category) group
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY product_id, quarter, category ORDER BY created_at ASC) - 1 AS rn
  FROM public.objectives
)
UPDATE public.objectives o
SET sort_order = ordered.rn
FROM ordered
WHERE o.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_objectives_sort ON public.objectives (product_id, quarter, sort_order);