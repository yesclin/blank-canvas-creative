
-- Auto-generate unique slug on clinic creation + backfill

CREATE OR REPLACE FUNCTION public.generate_clinic_slug(_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := lower(coalesce(_name, 'clinica'));
  base := translate(base,
    'áàâãäåāçéèêëēíìîïīñóòôõöøōúùûüūýÿ',
    'aaaaaaaceeeeeiiiiinoooooooouuuuuyy');
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF base IS NULL OR length(base) = 0 THEN
    base := 'clinica';
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.clinics WHERE slug = candidate) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_clinic_autoslug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.generate_clinic_slug(NEW.name);
  END IF;
  IF NEW.public_booking_enabled IS NULL THEN
    NEW.public_booking_enabled := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clinic_autoslug ON public.clinics;
CREATE TRIGGER clinic_autoslug
  BEFORE INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.tg_clinic_autoslug();

-- Default for new rows
ALTER TABLE public.clinics ALTER COLUMN public_booking_enabled SET DEFAULT true;

-- Backfill existing clinics missing slug
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, name FROM public.clinics WHERE slug IS NULL OR length(trim(slug)) = 0 LOOP
    UPDATE public.clinics SET slug = public.generate_clinic_slug(r.name) WHERE id = r.id;
  END LOOP;
END $$;

-- Ensure existing NULL booking flags become TRUE
UPDATE public.clinics SET public_booking_enabled = true WHERE public_booking_enabled IS NULL;
