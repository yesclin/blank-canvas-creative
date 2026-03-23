
-- =============================================
-- EXPAND patient_anamnese_psicologia TABLE
-- New fields for the complete "Avaliação Inicial" structure
-- =============================================

-- Histórico Psicológico/Psiquiátrico
ALTER TABLE public.patient_anamnese_psicologia 
  ADD COLUMN IF NOT EXISTS ja_fez_terapia boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ja_fez_terapia_obs text,
  ADD COLUMN IF NOT EXISTS uso_medicacao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uso_medicacao_qual text,
  ADD COLUMN IF NOT EXISTS diagnostico_previo text,
  ADD COLUMN IF NOT EXISTS internacoes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS internacoes_obs text;

-- Contexto Atual (structured fields)
ALTER TABLE public.patient_anamnese_psicologia
  ADD COLUMN IF NOT EXISTS contexto_trabalho text,
  ADD COLUMN IF NOT EXISTS contexto_relacionamentos text,
  ADD COLUMN IF NOT EXISTS contexto_vida_social text,
  ADD COLUMN IF NOT EXISTS contexto_rotina text,
  ADD COLUMN IF NOT EXISTS contexto_sono text,
  ADD COLUMN IF NOT EXISTS contexto_alimentacao text;

-- Avaliação Técnica do Profissional
ALTER TABLE public.patient_anamnese_psicologia
  ADD COLUMN IF NOT EXISTS impressoes_clinicas text,
  ADD COLUMN IF NOT EXISTS formulacao_inicial text,
  ADD COLUMN IF NOT EXISTS hipoteses text,
  ADD COLUMN IF NOT EXISTS ocultar_avaliacao_relatorio boolean DEFAULT false;

-- Objetivos Terapêuticos (embedded in initial evaluation)
ALTER TABLE public.patient_anamnese_psicologia
  ADD COLUMN IF NOT EXISTS objetivo_1 text,
  ADD COLUMN IF NOT EXISTS objetivo_2 text,
  ADD COLUMN IF NOT EXISTS objetivo_3 text;

-- Modalidade
ALTER TABLE public.patient_anamnese_psicologia
  ADD COLUMN IF NOT EXISTS modalidade text DEFAULT 'presencial';

-- =============================================
-- EXPAND sessoes_psicologia TABLE
-- New fields for the complete "Evolução Psicológica" structure
-- =============================================

-- Tema central da sessão
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS tema_central text;

-- Intervenções como tags (array de texto)
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS intervencoes_tags text[] DEFAULT '{}';

-- Encaminhamentos estruturados (array de texto)
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS encaminhamentos_tags text[] DEFAULT '{}';

-- Número da sessão (auto-incrementado por paciente)
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS numero_sessao integer;

-- Campo interno de risco (opcional)
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS risco_interno text;

-- Humor do paciente (opcional, 1-10)
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS humor_paciente integer;
