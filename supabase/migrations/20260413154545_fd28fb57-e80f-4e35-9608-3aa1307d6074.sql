
-- Add legacy tracking column
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS legacy_product_id uuid NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_legacy_product_id
ON public.inventory_items (legacy_product_id);

-- Migrate products -> inventory_items
INSERT INTO public.inventory_items (
  clinic_id, name, description, sku, category, unit_of_measure, item_type,
  is_sellable, is_consumable_in_procedures, is_active, controls_stock,
  controls_batch, controls_expiry, requires_traceability, requires_cold_chain,
  minimum_stock, ideal_stock, default_cost_price, default_sale_price,
  alert_days_before_expiry, legacy_product_id
)
SELECT
  p.clinic_id, p.name, p.description, p.sku, p.category,
  CASE p.unit
    WHEN 'unidade' THEN 'un'
    WHEN 'caixa' THEN 'cx'
    WHEN 'pacote' THEN 'pct'
    ELSE COALESCE(p.unit, 'un')
  END,
  CASE p.product_type::text
    WHEN 'material_clinico' THEN 'clinical_supply'
    WHEN 'insumo' THEN 'clinical_supply'
    WHEN 'medicamento' THEN 'medication'
    WHEN 'item_venda' THEN 'retail_product'
    ELSE 'clinical_supply'
  END,
  CASE WHEN p.sale_price > 0 THEN true ELSE false END,
  CASE WHEN p.product_type::text IN ('material_clinico','insumo','medicamento') THEN true ELSE false END,
  p.is_active, true, false, false, false, false,
  COALESCE(p.min_stock, 0), COALESCE(p.max_stock, 0),
  COALESCE(p.cost_price, 0), COALESCE(p.sale_price, 0),
  30, p.id
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_items ii WHERE ii.legacy_product_id = p.id
);
