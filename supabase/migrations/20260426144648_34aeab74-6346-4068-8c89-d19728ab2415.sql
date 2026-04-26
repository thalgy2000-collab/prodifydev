UPDATE public.roadmap_items
SET 
  start_month = CASE WHEN start_month > 2 THEN start_month % 3 ELSE start_month END,
  end_month = CASE WHEN end_month > 2 THEN end_month % 3 ELSE end_month END
WHERE title LIKE 'Iniciativa Exemplo%'
  AND (start_month > 2 OR end_month > 2);