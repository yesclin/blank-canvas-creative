-- =====================================================
-- ETAPA 8: PRONTUÁRIO INTELIGENTE POR ESPECIALIDADE
-- =====================================================

-- 1. Function to validate if a procedure's specialty is enabled in the clinic
CREATE OR REPLACE FUNCTION public.is_procedure_specialty_enabled(_procedure_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.procedures p
    JOIN public.specialties s ON p.specialty_id = s.id
    WHERE p.id = _procedure_id
      AND p.clinic_id = _clinic_id
      AND s.is_active = true
      AND (s.clinic_id = _clinic_id OR s.clinic_id IS NULL) -- Clinic or global specialty
  )
$$;

-- 2. Function to get the specialty for an appointment (resolved from procedure or direct)
CREATE OR REPLACE FUNCTION public.get_appointment_specialty(_appointment_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(a.specialty_id, p.specialty_id)
  FROM public.appointments a
  LEFT JOIN public.procedures p ON a.procedure_id = p.id
  WHERE a.id = _appointment_id
$$;

-- 3. Function to check if professional can access a specialty's templates
CREATE OR REPLACE FUNCTION public.can_professional_access_specialty(_professional_id uuid, _specialty_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_specialties
    WHERE professional_id = _professional_id
      AND specialty_id = _specialty_id
  )
$$;

-- 4. Function to validate medical record access based on appointment context
-- Returns detailed context for the appointment
CREATE OR REPLACE FUNCTION public.get_appointment_medical_record_context(_appointment_id uuid)
RETURNS TABLE (
  appointment_id uuid,
  professional_id uuid,
  professional_name text,
  patient_id uuid,
  procedure_id uuid,
  procedure_name text,
  specialty_id uuid,
  specialty_name text,
  specialty_key text,
  is_specialty_enabled boolean,
  can_professional_access boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id as appointment_id,
    a.professional_id,
    pro.full_name as professional_name,
    a.patient_id,
    a.procedure_id,
    p.name as procedure_name,
    COALESCE(a.specialty_id, p.specialty_id) as specialty_id,
    s.name as specialty_name,
    LOWER(REPLACE(REPLACE(s.name, 'í', 'i'), 'ç', 'c')) as specialty_key,
    s.is_active as is_specialty_enabled,
    EXISTS (
      SELECT 1 FROM public.professional_specialties ps
      WHERE ps.professional_id = a.professional_id
        AND ps.specialty_id = COALESCE(a.specialty_id, p.specialty_id)
    ) as can_professional_access
  FROM public.appointments a
  LEFT JOIN public.procedures p ON a.procedure_id = p.id
  LEFT JOIN public.specialties s ON COALESCE(a.specialty_id, p.specialty_id) = s.id
  LEFT JOIN public.professionals pro ON a.professional_id = pro.id
  WHERE a.id = _appointment_id
$$;

-- 5. Function to validate that professional can start an appointment
-- Returns error message if validation fails, null if OK
CREATE OR REPLACE FUNCTION public.validate_appointment_start(_appointment_id uuid, _user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_context record;
  v_professional_id uuid;
BEGIN
  -- Get the professional_id for the current user
  SELECT id INTO v_professional_id
  FROM public.professionals
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
  
  IF v_professional_id IS NULL THEN
    RETURN 'Usuário não está vinculado a um profissional ativo';
  END IF;
  
  -- Get appointment context
  SELECT * INTO v_context
  FROM public.get_appointment_medical_record_context(_appointment_id);
  
  IF v_context IS NULL THEN
    RETURN 'Agendamento não encontrado';
  END IF;
  
  -- Validate professional is the one assigned to the appointment
  IF v_context.professional_id != v_professional_id THEN
    RETURN 'Este agendamento pertence a outro profissional';
  END IF;
  
  -- Validate specialty is enabled
  IF NOT v_context.is_specialty_enabled THEN
    RETURN 'A especialidade do procedimento não está habilitada na clínica';
  END IF;
  
  -- Validate professional has access to the specialty
  IF NOT v_context.can_professional_access THEN
    RETURN 'Profissional não está autorizado para esta especialidade';
  END IF;
  
  RETURN NULL; -- All validations passed
END;
$$;

-- 6. Function to get enabled modules for an appointment's specialty
CREATE OR REPLACE FUNCTION public.get_appointment_enabled_modules(_appointment_id uuid)
RETURNS TABLE (
  module_key text,
  module_name text,
  module_category text,
  is_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cm.key as module_key,
    cm.name as module_name,
    cm.category::text as module_category,
    COALESCE(csm.is_enabled, false) as is_enabled
  FROM public.clinical_modules cm
  LEFT JOIN public.appointments a ON a.id = _appointment_id
  LEFT JOIN public.procedures p ON a.procedure_id = p.id
  LEFT JOIN public.clinic_specialty_modules csm ON 
    cm.id = csm.module_id 
    AND csm.specialty_id = COALESCE(a.specialty_id, p.specialty_id)
    AND csm.clinic_id = a.clinic_id
  WHERE a.id = _appointment_id
  ORDER BY cm.display_order
$$;

-- 7. Trigger to validate appointment start transitions
CREATE OR REPLACE FUNCTION public.validate_appointment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation_error text;
  v_user_id uuid;
BEGIN
  -- Only validate when transitioning TO an active status
  IF NEW.status IN ('em_atendimento', 'in_progress', 'atendendo', 'attending') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('em_atendimento', 'in_progress', 'atendendo', 'attending')) THEN
    
    -- Get the current user from auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NOT NULL THEN
      -- Validate the appointment start
      SELECT public.validate_appointment_start(NEW.id, v_user_id) INTO v_validation_error;
      
      IF v_validation_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_validation_error;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointment status validation
DROP TRIGGER IF EXISTS validate_appointment_start_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_start_trigger
  BEFORE UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_status_transition();

-- Add comments
COMMENT ON FUNCTION public.is_procedure_specialty_enabled IS 'Verifica se a especialidade do procedimento está habilitada na clínica';
COMMENT ON FUNCTION public.get_appointment_specialty IS 'Retorna a especialidade do agendamento (direta ou do procedimento)';
COMMENT ON FUNCTION public.can_professional_access_specialty IS 'Verifica se o profissional pode acessar modelos de uma especialidade';
COMMENT ON FUNCTION public.get_appointment_medical_record_context IS 'Retorna o contexto completo do prontuário para um agendamento';
COMMENT ON FUNCTION public.validate_appointment_start IS 'Valida se o profissional pode iniciar um atendimento';
COMMENT ON FUNCTION public.get_appointment_enabled_modules IS 'Retorna os módulos habilitados para a especialidade do agendamento';