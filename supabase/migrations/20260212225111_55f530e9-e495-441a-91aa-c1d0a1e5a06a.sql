-- Create a validation trigger to prevent activating non-official specialties
CREATE OR REPLACE FUNCTION public.validate_official_specialty()
RETURNS TRIGGER AS $$
DECLARE
  official_names TEXT[] := ARRAY[
    'Clínica Geral',
    'Psicologia',
    'Nutrição',
    'Fisioterapia',
    'Pilates',
    'Estética / Harmonização Facial',
    'Odontologia',
    'Dermatologia',
    'Pediatria'
  ];
BEGIN
  -- Only validate when activating a specialty (is_active being set to true)
  IF NEW.is_active = true AND NEW.specialty_type = 'padrao' THEN
    IF NOT (NEW.name = ANY(official_names)) THEN
      RAISE EXCEPTION 'Especialidade "%" não é uma especialidade oficial do Yesclin. Apenas especialidades oficiais podem ser ativadas.', NEW.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_official_specialty_trigger ON public.specialties;
CREATE TRIGGER validate_official_specialty_trigger
  BEFORE INSERT OR UPDATE ON public.specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_official_specialty();
