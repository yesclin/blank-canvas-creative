
-- Fix custom_prontuario_fields: add missing columns that the hook expects
ALTER TABLE public.custom_prontuario_fields 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS placeholder text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_appointments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedures(id),
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill name from label for any existing rows
UPDATE public.custom_prontuario_fields SET name = label WHERE name IS NULL;

-- Fix medical_record_tabs: add missing scope column
ALTER TABLE public.medical_record_tabs
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'specialty';

-- Add display_order alias (map from sort_order for existing queries)  
-- The hook uses display_order but the table has sort_order
-- Add display_order as separate column
ALTER TABLE public.medical_record_tabs
  ADD COLUMN IF NOT EXISTS display_order integer;

-- Backfill display_order from sort_order
UPDATE public.medical_record_tabs SET display_order = sort_order WHERE display_order IS NULL;

-- Add key column to medical_record_tabs (the hook uses 'key' as an alias for 'slug')
-- The hook already maps this in the query, just need to make sure slug works
