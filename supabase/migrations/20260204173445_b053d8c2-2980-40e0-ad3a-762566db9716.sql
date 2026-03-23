-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.update_clinical_module_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;