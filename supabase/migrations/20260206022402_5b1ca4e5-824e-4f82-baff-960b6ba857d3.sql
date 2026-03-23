-- Create patient_anamneses table for storing versioned anamnese records
CREATE TABLE public.patient_anamneses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  queixa_principal TEXT,
  historia_doenca_atual TEXT,
  antecedentes_pessoais TEXT,
  antecedentes_familiares TEXT,
  habitos_vida TEXT,
  medicamentos_uso_continuo TEXT,
  alergias TEXT,
  comorbidades TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique versions per patient per clinic
  CONSTRAINT unique_patient_anamnese_version UNIQUE (clinic_id, patient_id, version)
);

-- Enable Row Level Security
ALTER TABLE public.patient_anamneses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using profiles table which has clinic_id)
CREATE POLICY "Users can view anamneses from their clinic"
  ON public.patient_anamneses
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create anamneses in their clinic"
  ON public.patient_anamneses
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update anamneses in their clinic"
  ON public.patient_anamneses
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_patient_anamneses_patient_id ON public.patient_anamneses(patient_id);
CREATE INDEX idx_patient_anamneses_clinic_id ON public.patient_anamneses(clinic_id);
CREATE INDEX idx_patient_anamneses_is_current ON public.patient_anamneses(patient_id, is_current) WHERE is_current = true;

-- Add comment for documentation
COMMENT ON TABLE public.patient_anamneses IS 'Stores versioned anamnese records for patients. Each update creates a new version, preserving history.';