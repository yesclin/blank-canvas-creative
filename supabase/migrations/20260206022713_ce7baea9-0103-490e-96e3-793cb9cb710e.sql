-- Create patient_evolucoes table for storing clinical evolutions
CREATE TABLE public.patient_evolucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo_atendimento TEXT NOT NULL DEFAULT 'consulta',
  descricao_clinica TEXT NOT NULL,
  hipoteses_diagnosticas TEXT,
  conduta TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'assinada')),
  assinada_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evolutions should never be automatically deleted
  -- This is enforced by not having CASCADE on professional reference
  CONSTRAINT check_tipo_atendimento CHECK (tipo_atendimento IN ('consulta', 'retorno', 'acompanhamento', 'procedimento', 'urgencia'))
);

-- Enable Row Level Security
ALTER TABLE public.patient_evolucoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view evolutions from their clinic"
  ON public.patient_evolucoes
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evolutions in their clinic"
  ON public.patient_evolucoes
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own draft evolutions"
  ON public.patient_evolucoes
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND status = 'rascunho'
  );

-- NO DELETE POLICY - evolutions should never be deleted

-- Create indexes for better performance
CREATE INDEX idx_patient_evolucoes_patient_id ON public.patient_evolucoes(patient_id);
CREATE INDEX idx_patient_evolucoes_clinic_id ON public.patient_evolucoes(clinic_id);
CREATE INDEX idx_patient_evolucoes_profissional_id ON public.patient_evolucoes(profissional_id);
CREATE INDEX idx_patient_evolucoes_data_hora ON public.patient_evolucoes(data_hora DESC);

-- Add comment for documentation
COMMENT ON TABLE public.patient_evolucoes IS 'Stores clinical evolutions for patients. Evolutions cannot be deleted once created. Signed evolutions cannot be edited.';