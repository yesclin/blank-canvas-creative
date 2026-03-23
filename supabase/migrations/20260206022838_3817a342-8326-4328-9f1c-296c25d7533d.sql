-- Create patient_exames_fisicos table for storing physical exam records
CREATE TABLE public.patient_exames_fisicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  evolucao_id UUID REFERENCES public.patient_evolucoes(id),
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Vital signs
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  frequencia_respiratoria INTEGER,
  temperatura DECIMAL(4,1),
  
  -- Body measurements
  peso DECIMAL(5,2),
  altura DECIMAL(4,2),
  imc DECIMAL(4,2),
  
  -- General observations
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_exames_fisicos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view exames_fisicos from their clinic"
  ON public.patient_exames_fisicos
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exames_fisicos in their clinic"
  ON public.patient_exames_fisicos
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exames_fisicos in their clinic"
  ON public.patient_exames_fisicos
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_patient_exames_fisicos_patient_id ON public.patient_exames_fisicos(patient_id);
CREATE INDEX idx_patient_exames_fisicos_clinic_id ON public.patient_exames_fisicos(clinic_id);
CREATE INDEX idx_patient_exames_fisicos_evolucao_id ON public.patient_exames_fisicos(evolucao_id);
CREATE INDEX idx_patient_exames_fisicos_data_hora ON public.patient_exames_fisicos(data_hora DESC);

-- Add comment for documentation
COMMENT ON TABLE public.patient_exames_fisicos IS 'Stores physical exam records (vital signs, measurements) for patients. Can be linked to clinical evolutions.';