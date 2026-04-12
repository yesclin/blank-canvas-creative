
-- Create aesthetic_products_used table
CREATE TABLE public.aesthetic_products_used (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  facial_map_id UUID,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  batch_number TEXT,
  expiry_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  procedure_type TEXT,
  procedure_description TEXT,
  application_area TEXT,
  notes TEXT,
  registered_by UUID REFERENCES auth.users(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aesthetic_products_used ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view products of their clinic"
ON public.aesthetic_products_used FOR SELECT TO authenticated
USING (clinic_id IN (SELECT p.clinic_id FROM professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can insert products for their clinic"
ON public.aesthetic_products_used FOR INSERT TO authenticated
WITH CHECK (clinic_id IN (SELECT p.clinic_id FROM professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can update products of their clinic"
ON public.aesthetic_products_used FOR UPDATE TO authenticated
USING (clinic_id IN (SELECT p.clinic_id FROM professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can delete products of their clinic"
ON public.aesthetic_products_used FOR DELETE TO authenticated
USING (clinic_id IN (SELECT p.clinic_id FROM professionals p WHERE p.user_id = auth.uid()));

-- Index for common queries
CREATE INDEX idx_aesthetic_products_patient ON public.aesthetic_products_used(clinic_id, patient_id);
CREATE INDEX idx_aesthetic_products_appointment ON public.aesthetic_products_used(appointment_id) WHERE appointment_id IS NOT NULL;
