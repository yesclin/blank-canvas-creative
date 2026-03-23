
-- Add new fields for advanced psychology features
ALTER TABLE public.sessoes_psicologia
  ADD COLUMN IF NOT EXISTS modalidade text DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS evolucao_caso text,
  ADD COLUMN IF NOT EXISTS adesao_terapeutica text,
  ADD COLUMN IF NOT EXISTS risco_atual text DEFAULT 'ausente',
  ADD COLUMN IF NOT EXISTS emocoes_predominantes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phq9_respostas integer[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phq9_total integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gad7_respostas integer[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gad7_total integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tarefa_casa text,
  ADD COLUMN IF NOT EXISTS proximo_foco text;
