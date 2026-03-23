-- Add state and municipal registration fields to clinics table
ALTER TABLE public.clinics
ADD COLUMN inscricao_estadual TEXT,
ADD COLUMN inscricao_municipal TEXT;