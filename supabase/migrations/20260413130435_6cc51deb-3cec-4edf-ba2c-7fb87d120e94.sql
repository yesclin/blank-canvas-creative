
-- Tabela mestre de itens
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  commercial_name TEXT,
  description TEXT,
  internal_code TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  brand TEXT,
  manufacturer TEXT,
  
  -- Classificação
  item_type TEXT NOT NULL DEFAULT 'clinical_supply',
  is_sellable BOOLEAN NOT NULL DEFAULT false,
  is_consumable_in_procedures BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Controles operacionais
  controls_stock BOOLEAN NOT NULL DEFAULT true,
  controls_batch BOOLEAN NOT NULL DEFAULT false,
  controls_expiry BOOLEAN NOT NULL DEFAULT false,
  requires_traceability BOOLEAN NOT NULL DEFAULT false,
  requires_cold_chain BOOLEAN NOT NULL DEFAULT false,
  storage_notes TEXT,
  
  -- Estoque e preços
  unit_of_measure TEXT NOT NULL DEFAULT 'un',
  minimum_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  ideal_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  default_cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  default_sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  alert_days_before_expiry INTEGER NOT NULL DEFAULT 30,
  
  -- Informações técnicas
  anvisa_registration TEXT,
  composition TEXT,
  leaflet_text_or_url TEXT,
  
  -- Relacionamentos
  supplier_id UUID,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_inventory_items_clinic ON public.inventory_items(clinic_id);
CREATE INDEX idx_inventory_items_type ON public.inventory_items(item_type);
CREATE INDEX idx_inventory_items_active ON public.inventory_items(clinic_id, is_active);
CREATE INDEX idx_inventory_items_barcode ON public.inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku) WHERE sku IS NOT NULL;

-- Trigger de updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Validação de campos obrigatórios e não negativos
CREATE OR REPLACE FUNCTION public.validate_inventory_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.default_cost_price < 0 THEN
    RAISE EXCEPTION 'Custo padrão não pode ser negativo';
  END IF;
  IF NEW.default_sale_price < 0 THEN
    RAISE EXCEPTION 'Preço de venda não pode ser negativo';
  END IF;
  IF NEW.minimum_stock < 0 THEN
    RAISE EXCEPTION 'Estoque mínimo não pode ser negativo';
  END IF;
  IF NEW.ideal_stock < 0 THEN
    RAISE EXCEPTION 'Estoque ideal não pode ser negativo';
  END IF;
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Nome do item é obrigatório';
  END IF;
  IF NEW.unit_of_measure IS NULL OR trim(NEW.unit_of_measure) = '' THEN
    RAISE EXCEPTION 'Unidade de medida é obrigatória';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_inventory_item_trigger
  BEFORE INSERT OR UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inventory_item();

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory items of their clinic"
  ON public.inventory_items FOR SELECT TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inventory items for their clinic"
  ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inventory items of their clinic"
  ON public.inventory_items FOR UPDATE TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
