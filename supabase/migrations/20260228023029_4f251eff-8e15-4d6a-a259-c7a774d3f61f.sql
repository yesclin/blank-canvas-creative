
-- Table to link multiple patients to a single anamnesis record (e.g., couple therapy)
CREATE TABLE public.anamnesis_record_patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.anamnesis_records(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'titular' CHECK (role IN ('titular', 'parceiro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(record_id, patient_id)
);

-- Enable RLS
ALTER TABLE public.anamnesis_record_patients ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access records from their clinic
CREATE POLICY "Users can view record patients from their clinic"
  ON public.anamnesis_record_patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_records ar
      WHERE ar.id = record_id
        AND ar.clinic_id = public.get_user_clinic(auth.uid())
    )
  );

CREATE POLICY "Users can insert record patients for their clinic"
  ON public.anamnesis_record_patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_records ar
      WHERE ar.id = record_id
        AND ar.clinic_id = public.get_user_clinic(auth.uid())
    )
  );

CREATE POLICY "Users can delete record patients from their clinic"
  ON public.anamnesis_record_patients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_records ar
      WHERE ar.id = record_id
        AND ar.clinic_id = public.get_user_clinic(auth.uid())
    )
  );

-- Index for fast lookups
CREATE INDEX idx_anamnesis_record_patients_record ON public.anamnesis_record_patients(record_id);
CREATE INDEX idx_anamnesis_record_patients_patient ON public.anamnesis_record_patients(patient_id);
