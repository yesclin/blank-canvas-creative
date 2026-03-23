-- =====================================================
-- SESSÕES PSICOLÓGICAS - Registro de sessões de terapia
-- =====================================================

CREATE TABLE public.sessoes_psicologia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Dados da sessão
  data_sessao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duracao_minutos INTEGER NOT NULL DEFAULT 50,
  
  -- Conteúdo clínico
  abordagem_terapeutica TEXT, -- Abordagem utilizada na sessão
  relato_paciente TEXT, -- O que o paciente trouxe na sessão
  intervencoes_realizadas TEXT, -- Técnicas e intervenções aplicadas
  observacoes_terapeuta TEXT, -- Observações clínicas do terapeuta
  encaminhamentos_tarefas TEXT, -- Tarefas de casa ou encaminhamentos
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'assinada')),
  assinada_em TIMESTAMP WITH TIME ZONE,
  
  -- Auditoria
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_sessoes_psico_patient ON public.sessoes_psicologia(patient_id);
CREATE INDEX idx_sessoes_psico_clinic ON public.sessoes_psicologia(clinic_id);
CREATE INDEX idx_sessoes_psico_data ON public.sessoes_psicologia(data_sessao DESC);
CREATE INDEX idx_sessoes_psico_prof ON public.sessoes_psicologia(profissional_id);

-- Enable RLS
ALTER TABLE public.sessoes_psicologia ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários da clínica podem visualizar
CREATE POLICY "Users can view sessoes from their clinic"
ON public.sessoes_psicologia
FOR SELECT
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Policy: Usuários da clínica podem inserir
CREATE POLICY "Users can create sessoes in their clinic"
ON public.sessoes_psicologia
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Policy: Apenas rascunhos podem ser atualizados
CREATE POLICY "Users can update draft sessoes in their clinic"
ON public.sessoes_psicologia
FOR UPDATE
USING (
  status = 'rascunho' AND
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_sessoes_psicologia_updated_at
BEFORE UPDATE ON public.sessoes_psicologia
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.sessoes_psicologia IS 'Registro de sessões de psicoterapia';
COMMENT ON COLUMN public.sessoes_psicologia.abordagem_terapeutica IS 'Abordagem ou técnica terapêutica utilizada';
COMMENT ON COLUMN public.sessoes_psicologia.relato_paciente IS 'Conteúdo trazido pelo paciente na sessão';
COMMENT ON COLUMN public.sessoes_psicologia.intervencoes_realizadas IS 'Técnicas e intervenções aplicadas pelo terapeuta';
COMMENT ON COLUMN public.sessoes_psicologia.observacoes_terapeuta IS 'Observações clínicas e impressões do terapeuta';
COMMENT ON COLUMN public.sessoes_psicologia.encaminhamentos_tarefas IS 'Tarefas de casa ou encaminhamentos para próxima sessão';