-- Adicionar campo para vincular a um procedimento específico
ALTER TABLE public.aesthetic_consent_records
ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL;

-- Adicionar campo para nome do procedimento (para histórico)
ALTER TABLE public.aesthetic_consent_records
ADD COLUMN IF NOT EXISTS procedure_name TEXT;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_aesthetic_consent_procedure 
ON public.aesthetic_consent_records(procedure_id);