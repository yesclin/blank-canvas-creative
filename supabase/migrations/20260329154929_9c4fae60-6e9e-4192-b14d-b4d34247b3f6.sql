
-- 1. Add DEFAULT 1 to the version column so inserts without explicit version get 1
ALTER TABLE public.anamnesis_template_versions
  ALTER COLUMN version SET DEFAULT 1;

-- 2. Fix any existing null versions (shouldn't exist due to NOT NULL, but safety)
UPDATE public.anamnesis_template_versions
  SET version = COALESCE(version_number, 1)
  WHERE version IS NULL;
