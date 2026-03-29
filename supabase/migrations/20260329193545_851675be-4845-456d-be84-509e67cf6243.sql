
-- =====================================================
-- SESSOES_PSICOLOGIA: Add all missing clinical columns
-- =====================================================
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT DEFAULT 'sessao_terapeutica',
  ADD COLUMN IF NOT EXISTS modalidade TEXT DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS demanda_principal TEXT,
  ADD COLUMN IF NOT EXISTS objetivo_sessao TEXT,
  ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS abordagem_terapeutica TEXT,
  ADD COLUMN IF NOT EXISTS relato_paciente TEXT,
  ADD COLUMN IF NOT EXISTS intervencoes_realizadas TEXT,
  ADD COLUMN IF NOT EXISTS intervencoes_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS observacoes_terapeuta TEXT,
  ADD COLUMN IF NOT EXISTS resposta_paciente TEXT,
  ADD COLUMN IF NOT EXISTS risco_alerta_clinico TEXT DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS risco_interno TEXT,
  ADD COLUMN IF NOT EXISTS risco_atual TEXT DEFAULT 'ausente',
  ADD COLUMN IF NOT EXISTS encaminhamentos_tarefas TEXT,
  ADD COLUMN IF NOT EXISTS encaminhamentos_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emocoes_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plano_proxima_sessao TEXT,
  ADD COLUMN IF NOT EXISTS tarefa_casa TEXT,
  ADD COLUMN IF NOT EXISTS proximo_foco TEXT,
  ADD COLUMN IF NOT EXISTS phq9_respostas JSONB,
  ADD COLUMN IF NOT EXISTS phq9_total INTEGER,
  ADD COLUMN IF NOT EXISTS gad7_respostas JSONB,
  ADD COLUMN IF NOT EXISTS gad7_total INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS assinada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profissional_nome TEXT;

-- Rename existing 'observacoes' to 'observacoes_gerais' to avoid conflict
-- (observacoes_terapeuta is the new richer field)
-- Keep 'observacoes' for backward compat, just add the new columns

-- =====================================================
-- INSTRUMENTOS_PSICOLOGICOS: Add richer clinical columns
-- =====================================================
ALTER TABLE public.instrumentos_psicologicos
  ADD COLUMN IF NOT EXISTS nome_instrumento TEXT,
  ADD COLUMN IF NOT EXISTS categoria_instrumento TEXT DEFAULT 'projetivo',
  ADD COLUMN IF NOT EXISTS objetivo_aplicacao TEXT,
  ADD COLUMN IF NOT EXISTS contexto_aplicacao TEXT,
  ADD COLUMN IF NOT EXISTS finalidade TEXT,
  ADD COLUMN IF NOT EXISTS resultado_resumido TEXT,
  ADD COLUMN IF NOT EXISTS interpretacao_inicial TEXT,
  ADD COLUMN IF NOT EXISTS status_instrumento TEXT DEFAULT 'aplicado',
  ADD COLUMN IF NOT EXISTS documento_url TEXT,
  ADD COLUMN IF NOT EXISTS documento_nome TEXT,
  ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES public.professionals(id),
  ADD COLUMN IF NOT EXISTS profissional_nome TEXT;

-- Backfill nome_instrumento from nome where null
UPDATE public.instrumentos_psicologicos 
SET nome_instrumento = nome 
WHERE nome_instrumento IS NULL AND nome IS NOT NULL;

-- Backfill profissional_id from professional_id where null
UPDATE public.instrumentos_psicologicos 
SET profissional_id = professional_id 
WHERE profissional_id IS NULL AND professional_id IS NOT NULL;
