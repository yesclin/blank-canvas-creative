
-- Add edit-lock columns to anamnesis_records
ALTER TABLE public.anamnesis_records
  ADD COLUMN IF NOT EXISTS saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS edit_window_until timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- Temporarily disable just the edit window trigger for backfill
ALTER TABLE public.anamnesis_records DISABLE TRIGGER trg_check_anamnesis_edit_window;

-- Backfill existing records
UPDATE public.anamnesis_records
SET
  saved_at = created_at,
  edit_window_until = created_at + interval '1 hour'
WHERE saved_at IS NULL;

-- For already-signed records, set locked_at = signed_at
UPDATE public.anamnesis_records
SET locked_at = signed_at
WHERE signed_at IS NOT NULL AND locked_at IS NULL;

-- Re-enable the trigger
ALTER TABLE public.anamnesis_records ENABLE TRIGGER trg_check_anamnesis_edit_window;
