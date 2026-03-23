
-- =============================================================
-- ETAPA 7: Backend validation triggers for specialty consistency
-- =============================================================

-- 1. Helper: check if a specialty is in the official whitelist AND active for the clinic
CREATE OR REPLACE FUNCTION public.validate_specialty_for_clinic(
  _specialty_id uuid,
  _clinic_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.specialties s
    WHERE s.id = _specialty_id
      AND s.is_active = true
      AND (s.clinic_id IS NULL OR s.clinic_id = _clinic_id)
      AND s.name IN (
        'Clínica Geral',
        'Psicologia',
        'Nutrição',
        'Fisioterapia',
        'Pilates',
        'Estética / Harmonização Facial',
        'Odontologia',
        'Dermatologia',
        'Pediatria'
      )
  );
$$;

-- 2. Trigger function for appointments
CREATE OR REPLACE FUNCTION public.trg_validate_appointment_specialty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.specialty_id IS NOT NULL THEN
    IF NOT public.validate_specialty_for_clinic(NEW.specialty_id, NEW.clinic_id) THEN
      RAISE EXCEPTION 'Especialidade inválida ou não habilitada para esta clínica (appointment).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_appointment_specialty ON public.appointments;
CREATE TRIGGER validate_appointment_specialty
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_appointment_specialty();

-- 3. Trigger function for procedures
CREATE OR REPLACE FUNCTION public.trg_validate_procedure_specialty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.specialty_id IS NOT NULL THEN
    IF NOT public.validate_specialty_for_clinic(NEW.specialty_id, NEW.clinic_id) THEN
      RAISE EXCEPTION 'Especialidade inválida ou não habilitada para esta clínica (procedure).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_procedure_specialty ON public.procedures;
CREATE TRIGGER validate_procedure_specialty
  BEFORE INSERT OR UPDATE ON public.procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_procedure_specialty();

-- 4. Trigger function for anamnesis_templates
CREATE OR REPLACE FUNCTION public.trg_validate_template_specialty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.specialty_id IS NOT NULL AND NEW.clinic_id IS NOT NULL THEN
    IF NOT public.validate_specialty_for_clinic(NEW.specialty_id, NEW.clinic_id) THEN
      RAISE EXCEPTION 'Especialidade inválida ou não habilitada para esta clínica (template).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_template_specialty ON public.anamnesis_templates;
CREATE TRIGGER validate_template_specialty
  BEFORE INSERT OR UPDATE ON public.anamnesis_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_template_specialty();
