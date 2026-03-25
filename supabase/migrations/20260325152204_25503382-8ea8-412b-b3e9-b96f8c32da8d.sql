
-- ============================================================
-- Create patient_clinical_data table
-- ============================================================

CREATE TABLE public.patient_clinical_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  chronic_diseases TEXT[] NOT NULL DEFAULT '{}',
  current_medications TEXT[] NOT NULL DEFAULT '{}',
  family_history TEXT,
  clinical_restrictions TEXT,
  blood_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, patient_id)
);

-- RLS
ALTER TABLE public.patient_clinical_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage patient clinical data"
  ON public.patient_clinical_data FOR ALL
  TO authenticated
  USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic users can view patient clinical data"
  ON public.patient_clinical_data FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patient clinical data"
  ON public.patient_clinical_data FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patient clinical data"
  ON public.patient_clinical_data FOR UPDATE
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));

-- Indexes
CREATE INDEX idx_patient_clinical_data_clinic ON public.patient_clinical_data(clinic_id);
CREATE INDEX idx_patient_clinical_data_patient ON public.patient_clinical_data(patient_id);

-- updated_at trigger
CREATE TRIGGER update_patient_clinical_data_updated_at
  BEFORE UPDATE ON public.patient_clinical_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
