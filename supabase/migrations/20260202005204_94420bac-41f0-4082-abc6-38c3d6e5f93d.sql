-- Stock prediction settings table
CREATE TABLE public.stock_prediction_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  prediction_days INTEGER NOT NULL DEFAULT 15,
  alert_level TEXT NOT NULL DEFAULT 'warning' CHECK (alert_level IN ('info', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT stock_prediction_settings_clinic_unique UNIQUE (clinic_id)
);

-- Enable RLS
ALTER TABLE public.stock_prediction_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own clinic stock prediction settings"
ON public.stock_prediction_settings FOR SELECT
USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own clinic stock prediction settings"
ON public.stock_prediction_settings FOR INSERT
WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own clinic stock prediction settings"
ON public.stock_prediction_settings FOR UPDATE
USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Index
CREATE INDEX idx_stock_prediction_settings_clinic ON public.stock_prediction_settings(clinic_id);

-- Trigger for updated_at
CREATE TRIGGER update_stock_prediction_settings_updated_at
BEFORE UPDATE ON public.stock_prediction_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC function to calculate predicted consumption based on future appointments
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH future_appointments AS (
    -- Get all future appointments with procedures in the next N days
    SELECT 
      a.id AS appointment_id,
      a.scheduled_date,
      a.procedure_id,
      p.name AS procedure_name
    FROM appointments a
    JOIN procedures p ON p.id = a.procedure_id
    WHERE a.clinic_id = p_clinic_id
      AND a.procedure_id IS NOT NULL
      AND a.scheduled_date >= CURRENT_DATE
      AND a.scheduled_date <= CURRENT_DATE + p_days_ahead
      AND a.status NOT IN ('cancelado', 'faltou')
  ),
  -- Calculate product consumption from procedure_products
  procedure_product_consumption AS (
    SELECT 
      pp.product_id,
      fa.scheduled_date,
      fa.procedure_id,
      fa.procedure_name,
      pp.quantity AS qty_per_procedure
    FROM future_appointments fa
    JOIN procedure_products pp ON pp.procedure_id = fa.procedure_id
  ),
  -- Calculate kit consumption from procedure_product_kits -> product_kit_items
  kit_consumption AS (
    SELECT 
      pki.product_id,
      fa.scheduled_date,
      fa.procedure_id,
      fa.procedure_name,
      (pki.quantity * ppk.quantity) AS qty_per_procedure
    FROM future_appointments fa
    JOIN procedure_product_kits ppk ON ppk.procedure_id = fa.procedure_id
    JOIN product_kit_items pki ON pki.kit_id = ppk.kit_id
  ),
  -- Combine both consumption sources
  all_consumption AS (
    SELECT * FROM procedure_product_consumption
    UNION ALL
    SELECT * FROM kit_consumption
  ),
  -- Aggregate consumption per product
  product_consumption AS (
    SELECT 
      ac.product_id,
      SUM(ac.qty_per_procedure) AS total_predicted,
      MIN(ac.scheduled_date) AS first_use_date,
      jsonb_agg(DISTINCT jsonb_build_object(
        'procedure_id', ac.procedure_id,
        'procedure_name', ac.procedure_name,
        'quantity', ac.qty_per_procedure
      )) AS impacting_procs
    FROM all_consumption ac
    GROUP BY ac.product_id
  ),
  -- Calculate running shortage date
  consumption_by_date AS (
    SELECT 
      ac.product_id,
      ac.scheduled_date,
      SUM(ac.qty_per_procedure) AS daily_consumption
    FROM all_consumption ac
    GROUP BY ac.product_id, ac.scheduled_date
    ORDER BY ac.product_id, ac.scheduled_date
  ),
  shortage_calc AS (
    SELECT 
      cbd.product_id,
      cbd.scheduled_date,
      SUM(cbd.daily_consumption) OVER (
        PARTITION BY cbd.product_id 
        ORDER BY cbd.scheduled_date
      ) AS cumulative_consumption
    FROM consumption_by_date cbd
  ),
  first_shortage AS (
    SELECT 
      sc.product_id,
      MIN(sc.scheduled_date) AS shortage_date
    FROM shortage_calc sc
    JOIN products prod ON prod.id = sc.product_id
    WHERE sc.cumulative_consumption > prod.stock_quantity
    GROUP BY sc.product_id
  )
  SELECT 
    prod.id AS product_id,
    prod.name::TEXT AS product_name,
    prod.unit::TEXT AS product_unit,
    prod.stock_quantity AS current_stock,
    prod.min_stock_quantity AS min_stock,
    COALESCE(pc.total_predicted, 0) AS predicted_consumption,
    (prod.stock_quantity - COALESCE(pc.total_predicted, 0)) AS projected_stock,
    fs.shortage_date AS first_shortage_date,
    COALESCE(pc.impacting_procs, '[]'::jsonb) AS impacting_procedures
  FROM products prod
  LEFT JOIN product_consumption pc ON pc.product_id = prod.id
  LEFT JOIN first_shortage fs ON fs.product_id = prod.id
  WHERE prod.clinic_id = p_clinic_id
    AND prod.is_active = true
    AND (
      pc.total_predicted > 0 
      OR prod.stock_quantity <= prod.min_stock_quantity
    )
  ORDER BY 
    CASE WHEN fs.shortage_date IS NOT NULL THEN 0 ELSE 1 END,
    fs.shortage_date NULLS LAST,
    (prod.stock_quantity - COALESCE(pc.total_predicted, 0)) ASC;
END;
$$;