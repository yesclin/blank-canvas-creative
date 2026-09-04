CREATE OR REPLACE FUNCTION public.calculate_stock_predictions(
  p_clinic_id UUID,
  p_days_ahead INTEGER DEFAULT 15
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_unit TEXT,
  current_stock NUMERIC,
  min_stock NUMERIC,
  predicted_consumption NUMERIC,
  projected_stock NUMERIC,
  first_shortage_date DATE,
  impacting_procedures JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_clinic_as_staff(p_clinic_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH future_appointments AS (
    SELECT a.id AS appointment_id, a.scheduled_date, a.procedure_id, p.name AS procedure_name
    FROM appointments a
    JOIN procedures p ON p.id = a.procedure_id
    WHERE a.clinic_id = p_clinic_id
      AND a.procedure_id IS NOT NULL
      AND a.scheduled_date >= CURRENT_DATE
      AND a.scheduled_date <= CURRENT_DATE + COALESCE(p_days_ahead, 15)
      AND a.status NOT IN ('cancelado', 'faltou', 'finalizado')
  ),
  template_consumption AS (
    SELECT t.item_id, fa.scheduled_date, fa.procedure_id, fa.procedure_name,
           COALESCE(t.default_quantity, 0)::numeric AS qty
    FROM future_appointments fa
    JOIN procedure_consumption_templates t
      ON t.procedure_id = fa.procedure_id AND t.clinic_id = p_clinic_id
  ),
  kit_consumption AS (
    SELECT ki.item_id, fa.scheduled_date, fa.procedure_id, fa.procedure_name,
           (COALESCE(ki.quantity, 0) * COALESCE(pck.quantity, 1))::numeric AS qty
    FROM future_appointments fa
    JOIN procedure_consumption_kits pck
      ON pck.procedure_id = fa.procedure_id AND pck.clinic_id = p_clinic_id
    JOIN inventory_kits k ON k.id = pck.kit_id AND k.is_active
    JOIN inventory_kit_items ki ON ki.kit_id = k.id
  ),
  all_consumption AS (
    SELECT * FROM template_consumption
    UNION ALL
    SELECT * FROM kit_consumption
  ),
  agg AS (
    SELECT ac.item_id,
           SUM(ac.qty) AS total_predicted,
           jsonb_agg(DISTINCT jsonb_build_object(
             'procedure_id', ac.procedure_id,
             'procedure_name', ac.procedure_name,
             'quantity', ac.qty
           )) AS impacting_procs
    FROM all_consumption ac
    GROUP BY ac.item_id
  ),
  by_date AS (
    SELECT ac.item_id, ac.scheduled_date, SUM(ac.qty) AS daily_qty
    FROM all_consumption ac
    GROUP BY ac.item_id, ac.scheduled_date
  ),
  cumulative AS (
    SELECT bd.item_id, bd.scheduled_date,
           SUM(bd.daily_qty) OVER (PARTITION BY bd.item_id ORDER BY bd.scheduled_date) AS cum_qty
    FROM by_date bd
  ),
  stock AS (
    SELECT b.item_id, SUM(COALESCE(b.quantity_available, 0))::numeric AS available
    FROM inventory_batches b
    WHERE b.clinic_id = p_clinic_id AND b.status = 'active'
    GROUP BY b.item_id
  ),
  shortage AS (
    SELECT c.item_id, MIN(c.scheduled_date) AS shortage_date
    FROM cumulative c
    LEFT JOIN stock s ON s.item_id = c.item_id
    WHERE c.cum_qty > COALESCE(s.available, 0)
    GROUP BY c.item_id
  )
  SELECT
    i.id,
    i.name,
    COALESCE(i.unit_of_measure, 'un'),
    COALESCE(s.available, 0),
    COALESCE(i.minimum_stock, 0)::numeric,
    COALESCE(a.total_predicted, 0),
    COALESCE(s.available, 0) - COALESCE(a.total_predicted, 0),
    sh.shortage_date,
    COALESCE(a.impacting_procs, '[]'::jsonb)
  FROM inventory_items i
  LEFT JOIN agg a ON a.item_id = i.id
  LEFT JOIN stock s ON s.item_id = i.id
  LEFT JOIN shortage sh ON sh.item_id = i.id
  WHERE i.clinic_id = p_clinic_id
    AND i.is_active
    AND i.controls_stock
    AND (
      a.total_predicted IS NOT NULL
      OR COALESCE(s.available, 0) <= COALESCE(i.minimum_stock, 0)
    )
  ORDER BY sh.shortage_date NULLS LAST, i.name;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_stock_predictions(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_stock_predictions(uuid, integer) TO authenticated, service_role;