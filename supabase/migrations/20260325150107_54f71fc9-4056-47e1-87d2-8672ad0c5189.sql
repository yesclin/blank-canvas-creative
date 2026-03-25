
-- ============================================================
-- MIGRATION 2: Anamnesis signing metadata + validation_code
-- ============================================================

-- 1. Add validation_code column (nullable, no backfill needed)
ALTER TABLE public.anamnesis_records
  ADD COLUMN IF NOT EXISTS validation_code text;

-- 2. Unique partial index for public validation lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_records_validation_code
  ON public.anamnesis_records (validation_code)
  WHERE validation_code IS NOT NULL;

-- 3. Function: auto-fill signing metadata on status change to 'assinado'
CREATE OR REPLACE FUNCTION public.generate_anamnesis_sign_metadata()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status transitions TO 'assinado'
  IF NEW.status = 'assinado' AND (OLD.status IS DISTINCT FROM 'assinado') THEN
    NEW.signed_at  := COALESCE(NEW.signed_at, now());
    NEW.signed_by  := COALESCE(NEW.signed_by, auth.uid());
    IF NEW.validation_code IS NULL THEN
      NEW.validation_code := encode(gen_random_bytes(16), 'hex');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger: fires BEFORE UPDATE, before protect_signed_anamnesis
--    (protect_signed fires on any UPDATE of already-signed records;
--     this trigger fires on the UPDATE that SIGNS the record)
CREATE TRIGGER trg_anamnesis_sign
  BEFORE UPDATE ON public.anamnesis_records
  FOR EACH ROW
  EXECUTE FUNCTION generate_anamnesis_sign_metadata();
