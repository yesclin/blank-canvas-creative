
-- Add fiscal identification columns to clinics table
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS fiscal_type text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS inscricao_municipal text;
