-- =====================================================
-- ANAMNESE PSICOLÓGICA - Tabela com versionamento
-- =====================================================

CREATE TABLE public.patient_anamnese_psicologia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Versionamento
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Campos da anamnese psicológica
  queixa_principal TEXT,
  historico_emocional_comportamental TEXT,
  contexto_familiar TEXT,
  contexto_social TEXT,
  historico_tratamentos TEXT,
  expectativas_terapia TEXT,
  fatores_risco TEXT,
  fatores_protecao TEXT,
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT positive_version CHECK (version > 0)
);

-- Índices para performance
CREATE INDEX idx_anamnese_psico_patient ON public.patient_anamnese_psicologia(patient_id);
CREATE INDEX idx_anamnese_psico_clinic ON public.patient_anamnese_psicologia(clinic_id);
CREATE INDEX idx_anamnese_psico_current ON public.patient_anamnese_psicologia(patient_id, is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.patient_anamnese_psicologia ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários da clínica podem visualizar
CREATE POLICY "Users can view anamnese psicologia from their clinic"
ON public.patient_anamnese_psicologia
FOR SELECT
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Policy: Usuários da clínica podem inserir
CREATE POLICY "Users can create anamnese psicologia in their clinic"
ON public.patient_anamnese_psicologia
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Policy: Usuários da clínica podem atualizar
CREATE POLICY "Users can update anamnese psicologia in their clinic"
ON public.patient_anamnese_psicologia
FOR UPDATE
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Comentários para documentação
COMMENT ON TABLE public.patient_anamnese_psicologia IS 'Anamnese psicológica com versionamento';
COMMENT ON COLUMN public.patient_anamnese_psicologia.queixa_principal IS 'Relato do paciente sobre o motivo da busca por terapia';
COMMENT ON COLUMN public.patient_anamnese_psicologia.historico_emocional_comportamental IS 'Histórico emocional e padrões comportamentais';
COMMENT ON COLUMN public.patient_anamnese_psicologia.contexto_familiar IS 'Dinâmica familiar e relacionamentos significativos';
COMMENT ON COLUMN public.patient_anamnese_psicologia.contexto_social IS 'Trabalho, estudos, vida social e rede de apoio';
COMMENT ON COLUMN public.patient_anamnese_psicologia.historico_tratamentos IS 'Tratamentos psicológicos/psiquiátricos anteriores';
COMMENT ON COLUMN public.patient_anamnese_psicologia.expectativas_terapia IS 'Expectativas e objetivos em relação à terapia';
COMMENT ON COLUMN public.patient_anamnese_psicologia.fatores_risco IS 'Fatores de risco identificados';
COMMENT ON COLUMN public.patient_anamnese_psicologia.fatores_protecao IS 'Fatores de proteção e recursos do paciente';