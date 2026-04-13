
-- 1. procedure_consumption_templates
CREATE TABLE public.procedure_consumption_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  default_quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  batch_required BOOLEAN NOT NULL DEFAULT false,
  allow_quantity_edit_on_finish BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(procedure_id, item_id)
);

CREATE INDEX idx_pct_clinic ON public.procedure_consumption_templates(clinic_id);
CREATE INDEX idx_pct_procedure ON public.procedure_consumption_templates(procedure_id);
CREATE INDEX idx_pct_item ON public.procedure_consumption_templates(item_id);

ALTER TABLE public.procedure_consumption_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consumption templates of their clinic"
  ON public.procedure_consumption_templates FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create consumption templates for their clinic"
  ON public.procedure_consumption_templates FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update consumption templates of their clinic"
  ON public.procedure_consumption_templates FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete consumption templates of their clinic"
  ON public.procedure_consumption_templates FOR DELETE TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TRIGGER update_pct_updated_at
  BEFORE UPDATE ON public.procedure_consumption_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. inventory_kits
CREATE TABLE public.inventory_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  kit_type TEXT NOT NULL DEFAULT 'clinical' CHECK (kit_type IN ('clinical', 'retail')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_kits_clinic ON public.inventory_kits(clinic_id);

ALTER TABLE public.inventory_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view kits of their clinic"
  ON public.inventory_kits FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create kits for their clinic"
  ON public.inventory_kits FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update kits of their clinic"
  ON public.inventory_kits FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete kits of their clinic"
  ON public.inventory_kits FOR DELETE TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TRIGGER update_inventory_kits_updated_at
  BEFORE UPDATE ON public.inventory_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. inventory_kit_items
CREATE TABLE public.inventory_kit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id UUID NOT NULL REFERENCES public.inventory_kits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kit_id, item_id)
);

CREATE INDEX idx_kit_items_kit ON public.inventory_kit_items(kit_id);
CREATE INDEX idx_kit_items_item ON public.inventory_kit_items(item_id);

ALTER TABLE public.inventory_kit_items ENABLE ROW LEVEL SECURITY;

-- RLS via kit's clinic_id
CREATE POLICY "Users can view kit items of their clinic"
  ON public.inventory_kit_items FOR SELECT TO authenticated
  USING (kit_id IN (
    SELECT id FROM public.inventory_kits
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can create kit items for their clinic"
  ON public.inventory_kit_items FOR INSERT TO authenticated
  WITH CHECK (kit_id IN (
    SELECT id FROM public.inventory_kits
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can update kit items of their clinic"
  ON public.inventory_kit_items FOR UPDATE TO authenticated
  USING (kit_id IN (
    SELECT id FROM public.inventory_kits
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can delete kit items of their clinic"
  ON public.inventory_kit_items FOR DELETE TO authenticated
  USING (kit_id IN (
    SELECT id FROM public.inventory_kits
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  ));
