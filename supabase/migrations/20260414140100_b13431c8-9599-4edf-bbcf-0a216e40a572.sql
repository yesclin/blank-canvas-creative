
ALTER TABLE public.anamnesis_records
  ADD COLUMN IF NOT EXISTS discarded_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discarded_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discard_reason text DEFAULT NULL;
