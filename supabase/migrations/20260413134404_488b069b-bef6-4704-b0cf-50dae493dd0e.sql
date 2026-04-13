
-- Create inventory_batches table
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  supplier_id UUID,
  invoice_number TEXT,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_sale_price NUMERIC(12,2),
  quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_available NUMERIC(12,2) NOT NULL DEFAULT 0,
  storage_location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'depleted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_batches_clinic ON public.inventory_batches(clinic_id);
CREATE INDEX idx_inventory_batches_item ON public.inventory_batches(item_id);
CREATE INDEX idx_inventory_batches_expiry ON public.inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON public.inventory_batches(status);

ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batches of their clinic"
  ON public.inventory_batches FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create batches for their clinic"
  ON public.inventory_batches FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update batches of their clinic"
  ON public.inventory_batches FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create inventory_movements table
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.inventory_batches(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase_entry', 'manual_entry', 'procedure_consumption', 'sale',
    'adjustment', 'loss', 'return', 'transfer'
  )),
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  unit_sale_price NUMERIC(12,2),
  reason TEXT,
  source_module TEXT,
  source_id UUID,
  patient_id UUID,
  professional_id UUID,
  appointment_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_clinic ON public.inventory_movements(clinic_id);
CREATE INDEX idx_inventory_movements_item ON public.inventory_movements(item_id);
CREATE INDEX idx_inventory_movements_batch ON public.inventory_movements(batch_id);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created ON public.inventory_movements(created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements of their clinic"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create movements for their clinic"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Validation trigger: no zero/negative quantity for non-adjustment movements
CREATE OR REPLACE FUNCTION public.validate_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type != 'adjustment' AND NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive for non-adjustment movements';
  END IF;
  NEW.total_cost := COALESCE(NEW.unit_cost, 0) * ABS(NEW.quantity);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_inventory_movement
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_movement();

-- Updated_at trigger for batches
CREATE TRIGGER update_inventory_batches_updated_at
  BEFORE UPDATE ON public.inventory_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
