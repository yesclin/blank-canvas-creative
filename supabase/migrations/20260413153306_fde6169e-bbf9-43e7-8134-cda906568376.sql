
-- =============================================
-- 1. CHECK CONSTRAINTS on existing tables
-- =============================================

-- inventory_items: item_type check
DO $$ BEGIN
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_items_item_type
    CHECK (item_type IN ('clinical_supply','medication','injectable','vaccine','retail_product','equipment','other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- inventory_items: non-negative prices/stocks
DO $$ BEGIN
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_items_cost_price CHECK (default_cost_price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_items_sale_price CHECK (default_sale_price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_items_min_stock CHECK (minimum_stock >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_items_ideal_stock CHECK (ideal_stock >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- inventory_batches: status check
DO $$ BEGIN
  ALTER TABLE public.inventory_batches
    ADD CONSTRAINT chk_inventory_batches_status
    CHECK (status IN ('active','expired','blocked','depleted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_batches
    ADD CONSTRAINT chk_inventory_batches_qty_received CHECK (quantity_received >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_batches
    ADD CONSTRAINT chk_inventory_batches_qty_available CHECK (quantity_available >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_batches
    ADD CONSTRAINT chk_inventory_batches_unit_cost CHECK (unit_cost >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- inventory_movements: movement_type check
DO $$ BEGIN
  ALTER TABLE public.inventory_movements
    ADD CONSTRAINT chk_inventory_movements_type
    CHECK (movement_type IN ('purchase_entry','manual_entry','procedure_consumption','sale','adjustment','loss','return','transfer'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- inventory_kits: kit_type check
DO $$ BEGIN
  ALTER TABLE public.inventory_kits
    ADD CONSTRAINT chk_inventory_kits_type
    CHECK (kit_type IN ('clinical','retail'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- inventory_kit_items: positive quantity
DO $$ BEGIN
  ALTER TABLE public.inventory_kit_items
    ADD CONSTRAINT chk_inventory_kit_items_qty CHECK (quantity > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. ADD MISSING COLUMNS
-- =============================================

-- inventory_items: add category_id if missing (coexists with text category)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS category_id uuid NULL;

-- inventory_movements: ensure reason has a default for NOT NULL compatibility
-- (existing data may have NULLs, so we set default first, then backfill)
ALTER TABLE public.inventory_movements ALTER COLUMN reason SET DEFAULT 'Não informado';
UPDATE public.inventory_movements SET reason = 'Não informado' WHERE reason IS NULL;

-- sales: add sale_origin and appointment_id
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_origin text NOT NULL DEFAULT 'counter';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS appointment_id uuid NULL;

DO $$ BEGIN
  ALTER TABLE public.sales
    ADD CONSTRAINT chk_sales_origin
    CHECK (sale_origin IN ('counter','appointment','crm','package'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.sales
    ADD CONSTRAINT fk_sales_appointment
    FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- sale_items: add item_id, batch_id, cost_price_snapshot, margin_amount
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS item_id uuid NULL;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS batch_id uuid NULL;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cost_price_snapshot numeric(14,2) NOT NULL DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS margin_amount numeric(14,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.sale_items
    ADD CONSTRAINT fk_sale_items_inventory_item
    FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.sale_items
    ADD CONSTRAINT fk_sale_items_batch
    FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 3. CREATE procedure_consumption_kits
-- =============================================

CREATE TABLE IF NOT EXISTS public.procedure_consumption_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  kit_id uuid NOT NULL REFERENCES public.inventory_kits(id) ON DELETE CASCADE,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 4. UNIQUE CONSTRAINTS
-- =============================================

-- inventory_items: unique internal_code per clinic (partial)
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_clinic_internal_code
  ON public.inventory_items (clinic_id, internal_code)
  WHERE internal_code IS NOT NULL AND internal_code <> '';

-- inventory_items: unique sku per clinic (partial)
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_clinic_sku
  ON public.inventory_items (clinic_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- inventory_kit_items: unique item per kit
DO $$ BEGIN
  ALTER TABLE public.inventory_kit_items
    ADD CONSTRAINT uq_kit_item UNIQUE (kit_id, item_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- procedure_consumption_templates: unique item per procedure
DO $$ BEGIN
  ALTER TABLE public.procedure_consumption_templates
    ADD CONSTRAINT uq_procedure_item UNIQUE (procedure_id, item_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- procedure_consumption_kits: unique kit per procedure
DO $$ BEGIN
  ALTER TABLE public.procedure_consumption_kits
    ADD CONSTRAINT uq_procedure_kit UNIQUE (procedure_id, kit_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 5. INDEXES for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic ON public.inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON public.inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON public.inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sellable ON public.inventory_items(is_sellable) WHERE is_sellable = true;

CREATE INDEX IF NOT EXISTS idx_inventory_batches_clinic ON public.inventory_batches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON public.inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_status ON public.inventory_batches(status);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON public.inventory_batches(expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_clinic ON public.inventory_movements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch ON public.inventory_movements(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON public.inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_patient ON public.inventory_movements(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_appointment ON public.inventory_movements(appointment_id) WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_kits_clinic ON public.inventory_kits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_items_kit ON public.inventory_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_items_item ON public.inventory_kit_items(item_id);

CREATE INDEX IF NOT EXISTS idx_pct_clinic ON public.procedure_consumption_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pct_procedure ON public.procedure_consumption_templates(procedure_id);
CREATE INDEX IF NOT EXISTS idx_pct_item ON public.procedure_consumption_templates(item_id);

CREATE INDEX IF NOT EXISTS idx_pck_clinic ON public.procedure_consumption_kits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pck_procedure ON public.procedure_consumption_kits(procedure_id);
CREATE INDEX IF NOT EXISTS idx_pck_kit ON public.procedure_consumption_kits(kit_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_item ON public.sale_items(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON public.sale_items(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_appointment ON public.sales(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_origin ON public.sales(sale_origin);

-- =============================================
-- 6. UPDATED_AT TRIGGER FUNCTION (idempotent)
-- =============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to tables with updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_inventory_batches_updated_at
    BEFORE UPDATE ON public.inventory_batches
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_inventory_kits_updated_at
    BEFORE UPDATE ON public.inventory_kits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_procedure_consumption_templates_updated_at
    BEFORE UPDATE ON public.procedure_consumption_templates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 7. RLS POLICIES
-- =============================================

-- Helper: get clinic_id for current user (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- === inventory_items ===
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_items_select" ON public.inventory_items;
CREATE POLICY "inventory_items_select" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_items_insert" ON public.inventory_items;
CREATE POLICY "inventory_items_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_items_update" ON public.inventory_items;
CREATE POLICY "inventory_items_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_items_delete" ON public.inventory_items;
CREATE POLICY "inventory_items_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

-- === inventory_batches ===
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_batches_select" ON public.inventory_batches;
CREATE POLICY "inventory_batches_select" ON public.inventory_batches
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_batches_insert" ON public.inventory_batches;
CREATE POLICY "inventory_batches_insert" ON public.inventory_batches
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_batches_update" ON public.inventory_batches;
CREATE POLICY "inventory_batches_update" ON public.inventory_batches
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_batches_delete" ON public.inventory_batches;
CREATE POLICY "inventory_batches_delete" ON public.inventory_batches
  FOR DELETE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

-- === inventory_movements ===
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_movements_update" ON public.inventory_movements;
CREATE POLICY "inventory_movements_update" ON public.inventory_movements
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

-- === inventory_kits ===
ALTER TABLE public.inventory_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_kits_select" ON public.inventory_kits;
CREATE POLICY "inventory_kits_select" ON public.inventory_kits
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_kits_insert" ON public.inventory_kits;
CREATE POLICY "inventory_kits_insert" ON public.inventory_kits
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_kits_update" ON public.inventory_kits;
CREATE POLICY "inventory_kits_update" ON public.inventory_kits
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "inventory_kits_delete" ON public.inventory_kits;
CREATE POLICY "inventory_kits_delete" ON public.inventory_kits
  FOR DELETE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

-- === inventory_kit_items (via kit's clinic_id) ===
ALTER TABLE public.inventory_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_kit_items_select" ON public.inventory_kit_items;
CREATE POLICY "inventory_kit_items_select" ON public.inventory_kit_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_kits k
    WHERE k.id = kit_id AND k.clinic_id = public.get_my_clinic_id()
  ));

DROP POLICY IF EXISTS "inventory_kit_items_insert" ON public.inventory_kit_items;
CREATE POLICY "inventory_kit_items_insert" ON public.inventory_kit_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory_kits k
    WHERE k.id = kit_id AND k.clinic_id = public.get_my_clinic_id()
  ));

DROP POLICY IF EXISTS "inventory_kit_items_update" ON public.inventory_kit_items;
CREATE POLICY "inventory_kit_items_update" ON public.inventory_kit_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_kits k
    WHERE k.id = kit_id AND k.clinic_id = public.get_my_clinic_id()
  ));

DROP POLICY IF EXISTS "inventory_kit_items_delete" ON public.inventory_kit_items;
CREATE POLICY "inventory_kit_items_delete" ON public.inventory_kit_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_kits k
    WHERE k.id = kit_id AND k.clinic_id = public.get_my_clinic_id()
  ));

-- === procedure_consumption_templates ===
ALTER TABLE public.procedure_consumption_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pct_select" ON public.procedure_consumption_templates;
CREATE POLICY "pct_select" ON public.procedure_consumption_templates
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pct_insert" ON public.procedure_consumption_templates;
CREATE POLICY "pct_insert" ON public.procedure_consumption_templates
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pct_update" ON public.procedure_consumption_templates;
CREATE POLICY "pct_update" ON public.procedure_consumption_templates
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pct_delete" ON public.procedure_consumption_templates;
CREATE POLICY "pct_delete" ON public.procedure_consumption_templates
  FOR DELETE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

-- === procedure_consumption_kits ===
ALTER TABLE public.procedure_consumption_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pck_select" ON public.procedure_consumption_kits;
CREATE POLICY "pck_select" ON public.procedure_consumption_kits
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pck_insert" ON public.procedure_consumption_kits;
CREATE POLICY "pck_insert" ON public.procedure_consumption_kits
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pck_update" ON public.procedure_consumption_kits;
CREATE POLICY "pck_update" ON public.procedure_consumption_kits
  FOR UPDATE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "pck_delete" ON public.procedure_consumption_kits;
CREATE POLICY "pck_delete" ON public.procedure_consumption_kits
  FOR DELETE TO authenticated
  USING (clinic_id = public.get_my_clinic_id());
