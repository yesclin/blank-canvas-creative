-- Create table for patient diagnoses (ICD-10)
CREATE TABLE public.patient_diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  
  -- Diagnosis data
  codigo_cid10 VARCHAR(10),
  descricao_cid10 TEXT,
  descricao_personalizada TEXT,
  observacoes TEXT,
  
  -- Classification
  tipo_diagnostico VARCHAR(20) NOT NULL DEFAULT 'diferencial' CHECK (tipo_diagnostico IN ('principal', 'diferencial', 'descartado')),
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'descartado')),
  data_diagnostico TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_resolucao TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_diagnosticos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clinic members can view diagnoses"
ON public.patient_diagnosticos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.clinic_id = patient_diagnosticos.clinic_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert diagnoses"
ON public.patient_diagnosticos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = patient_diagnosticos.profissional_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update own diagnoses"
ON public.patient_diagnosticos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = patient_diagnosticos.profissional_id
    AND p.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_patient_diagnosticos_patient ON public.patient_diagnosticos(patient_id);
CREATE INDEX idx_patient_diagnosticos_clinic ON public.patient_diagnosticos(clinic_id);
CREATE INDEX idx_patient_diagnosticos_cid ON public.patient_diagnosticos(codigo_cid10);

-- Trigger for updated_at
CREATE TRIGGER update_patient_diagnosticos_updated_at
BEFORE UPDATE ON public.patient_diagnosticos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();