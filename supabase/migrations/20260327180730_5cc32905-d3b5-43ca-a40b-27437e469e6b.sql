-- Add missing columns to anamnesis_records that the V2 hook expects
ALTER TABLE public.anamnesis_records
  ADD COLUMN IF NOT EXISTS responses jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS template_version_id uuid REFERENCES public.anamnesis_template_versions(id),
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id),
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Copy existing data from 'data' column to 'responses' for any existing records
UPDATE public.anamnesis_records
SET responses = data
WHERE responses = '{}'::jsonb AND data != '{}'::jsonb;