
-- Table for structured aesthetic/clinical performed procedures
CREATE TABLE public.clinical_performed_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  specialty_id UUID REFERENCES public.specialties(id),
  procedure_id UUID REFERENCES public.procedures(id),
  evolution_id UUID REFERENCES public.clinical_evolutions(id),
  facial_map_id UUID REFERENCES public.facial_maps(id),

  -- Structured fields
  procedure_name TEXT NOT NULL,
  region TEXT,
  technique TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'realizado',
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Indexes
CREATE INDEX idx_cpp_clinic ON public.clinical_performed_procedures(clinic_id);
CREATE INDEX idx_cpp_patient ON public.clinical_performed_procedures(patient_id);
CREATE INDEX idx_cpp_appointment ON public.clinical_performed_procedures(appointment_id);
CREATE INDEX idx_cpp_specialty ON public.clinical_performed_procedures(specialty_id);

-- RLS
ALTER TABLE public.clinical_performed_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view performed procedures for their clinic"
  ON public.clinical_performed_procedures FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert performed procedures for their clinic"
  ON public.clinical_performed_procedures FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update performed procedures for their clinic"
  ON public.clinical_performed_procedures FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete performed procedures for their clinic"
  ON public.clinical_performed_procedures FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_clinical_performed_procedures_updated_at
  BEFORE UPDATE ON public.clinical_performed_procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
