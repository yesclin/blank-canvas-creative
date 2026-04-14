
-- Fix: include 'extensions' in search_path so gen_random_bytes is accessible

CREATE OR REPLACE FUNCTION public.generate_anamnesis_sign_metadata()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION public.generate_validation_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NEW.validation_code IS NULL AND NEW.status = 'assinado' THEN
    NEW.validation_code := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;
