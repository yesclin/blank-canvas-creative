
-- Fix medical_record_tabs: add 'key' column as alias for slug and professional_id
ALTER TABLE public.medical_record_tabs
  ADD COLUMN IF NOT EXISTS key text,
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id);

-- Backfill key from slug
UPDATE public.medical_record_tabs SET key = slug WHERE key IS NULL;
