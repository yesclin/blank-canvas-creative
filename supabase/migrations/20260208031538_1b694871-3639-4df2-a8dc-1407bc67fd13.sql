-- Tabela para registro de produtos utilizados em procedimentos estéticos
-- Com rastreabilidade de lote e validade
CREATE TABLE public.aesthetic_products_used (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  facial_map_id UUID REFERENCES public.facial_maps(id) ON DELETE SET NULL,
  
  -- Dados do produto
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  batch_number TEXT,
  expiry_date DATE,
  
  -- Quantidades
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  
  -- Procedimento relacionado
  procedure_type TEXT,
  procedure_description TEXT,
  application_area TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  registered_by UUID REFERENCES auth.users(id),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aesthetic_products_used ENABLE ROW LEVEL SECURITY;

-- Políticas RLS usando profiles
CREATE POLICY "Clinic members can view products used"
  ON public.aesthetic_products_used
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can insert products used"
  ON public.aesthetic_products_used
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can update products used"
  ON public.aesthetic_products_used
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can delete products used"
  ON public.aesthetic_products_used
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Índices
CREATE INDEX idx_aesthetic_products_patient ON public.aesthetic_products_used(patient_id);
CREATE INDEX idx_aesthetic_products_appointment ON public.aesthetic_products_used(appointment_id);
CREATE INDEX idx_aesthetic_products_batch ON public.aesthetic_products_used(batch_number);
CREATE INDEX idx_aesthetic_products_expiry ON public.aesthetic_products_used(expiry_date);

-- Trigger para updated_at
CREATE TRIGGER update_aesthetic_products_used_updated_at
  BEFORE UPDATE ON public.aesthetic_products_used
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();