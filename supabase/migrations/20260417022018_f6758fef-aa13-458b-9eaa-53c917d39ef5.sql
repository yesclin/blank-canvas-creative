-- Enriquecer registro de procedimentos realizados com dados clínicos estruturados
ALTER TABLE public.clinical_performed_procedures
  ADD COLUMN IF NOT EXISTS clinical_data jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.clinical_performed_procedures.clinical_data IS
  'Dados clínicos estruturados do procedimento: lado/local, dose, unidade, objetivo, queixa, resultado_imediato, produto, lote, fabricante, validade, quantidade_consumida, intercorrencias, conduta, orientacoes, retorno_sugerido, vinculos (fotos, mapa, documento).';

-- Permitir ampliação dos status (planejado, parcial, realizado, interrompido, reagendado, cancelado)
-- Sem CHECK rígido — manter coluna flexível como já está (text com default 'realizado').

CREATE INDEX IF NOT EXISTS idx_cpp_clinical_data_gin
  ON public.clinical_performed_procedures USING gin (clinical_data);