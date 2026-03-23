
-- Add RG and marital_status columns to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS marital_status TEXT;
