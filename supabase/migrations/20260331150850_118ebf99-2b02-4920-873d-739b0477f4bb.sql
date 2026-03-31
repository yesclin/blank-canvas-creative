
CREATE TABLE public.psychology_diagnostic_hypotheses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  professional_name TEXT,
  hipotese_principal TEXT NOT NULL,
  hipoteses_secundarias TEXT,
  descricao_clinica TEXT,
  sintomas_observados TEXT,
  comportamentos_observados TEXT,
  fatores_desencadeantes TEXT,
  gravidade_impacto TEXT,
  status TEXT NOT NULL DEFAULT 'provisoria' CHECK (status IN ('provisoria', 'fechada')),
  observacoes TEXT,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psychology_diagnostic_hypotheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hypotheses for their clinic"
  ON public.psychology_diagnostic_hypotheses FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hypotheses for their clinic"
  ON public.psychology_diagnostic_hypotheses FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update hypotheses for their clinic"
  ON public.psychology_diagnostic_hypotheses FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete hypotheses for their clinic"
  ON public.psychology_diagnostic_hypotheses FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    )
  );
