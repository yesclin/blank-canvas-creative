-- Create patient_condutas table for storing clinical plans/conducts
CREATE TABLE public.patient_condutas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  evolucao_id UUID REFERENCES public.patient_evolucoes(id),
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Clinical plan fields
  solicitacao_exames TEXT,
  prescricoes TEXT,
  orientacoes TEXT,
  encaminhamentos TEXT,
  retorno_agendado DATE,
  retorno_observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_condutas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view condutas from their clinic"
  ON public.patient_condutas
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create condutas in their clinic"
  ON public.patient_condutas
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update condutas in their clinic"
  ON public.patient_condutas
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_patient_condutas_patient_id ON public.patient_condutas(patient_id);
CREATE INDEX idx_patient_condutas_clinic_id ON public.patient_condutas(clinic_id);
CREATE INDEX idx_patient_condutas_evolucao_id ON public.patient_condutas(evolucao_id);
CREATE INDEX idx_patient_condutas_data_hora ON public.patient_condutas(data_hora DESC);

-- Add comment for documentation
COMMENT ON TABLE public.patient_condutas IS 'Stores clinical plans/conducts including exam requests, prescriptions, orientations, referrals, and scheduled returns.';