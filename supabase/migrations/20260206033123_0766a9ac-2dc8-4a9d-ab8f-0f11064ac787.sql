-- =====================================================
-- PLANO TERAPÊUTICO - Com versionamento
-- =====================================================

CREATE TABLE public.plano_terapeutico_psicologia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Versionamento
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Conteúdo do plano
  objetivos_terapeuticos TEXT, -- Objetivos gerais do tratamento
  estrategias_intervencao TEXT, -- Abordagens e técnicas a serem utilizadas
  metas_curto_prazo TEXT, -- Metas para as próximas semanas
  metas_medio_prazo TEXT, -- Metas para os próximos meses
  metas_longo_prazo TEXT, -- Metas para o tratamento completo
  frequencia_recomendada TEXT, -- Frequência sugerida das sessões
  criterios_reavaliacao TEXT, -- Quando e como reavaliar o plano
  observacoes TEXT, -- Notas adicionais
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT positive_version_plano CHECK (version > 0)
);

-- Índices
CREATE INDEX idx_plano_terapeutico_patient ON public.plano_terapeutico_psicologia(patient_id);
CREATE INDEX idx_plano_terapeutico_clinic ON public.plano_terapeutico_psicologia(clinic_id);
CREATE INDEX idx_plano_terapeutico_current ON public.plano_terapeutico_psicologia(patient_id, is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.plano_terapeutico_psicologia ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view plano terapeutico from their clinic"
ON public.plano_terapeutico_psicologia
FOR SELECT
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create plano terapeutico in their clinic"
ON public.plano_terapeutico_psicologia
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update plano terapeutico in their clinic"
ON public.plano_terapeutico_psicologia
FOR UPDATE
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Comentários
COMMENT ON TABLE public.plano_terapeutico_psicologia IS 'Plano terapêutico com versionamento para acompanhamento psicológico';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.objetivos_terapeuticos IS 'Objetivos gerais do processo terapêutico';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.estrategias_intervencao IS 'Abordagens e técnicas terapêuticas planejadas';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.metas_curto_prazo IS 'Metas para as próximas 4-6 semanas';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.metas_medio_prazo IS 'Metas para os próximos 3-6 meses';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.metas_longo_prazo IS 'Metas para o tratamento completo';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.frequencia_recomendada IS 'Frequência sugerida de sessões';
COMMENT ON COLUMN public.plano_terapeutico_psicologia.criterios_reavaliacao IS 'Critérios e momentos para reavaliação do plano';