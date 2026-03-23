-- =====================================================
-- ETAPA 10: VALIDAÇÕES TÉCNICAS FINAIS - LIMPEZA
-- =====================================================

-- Drop conflicting functions first
DROP FUNCTION IF EXISTS public.validate_clinic_specialty(uuid, uuid);
DROP FUNCTION IF EXISTS public.validate_professional_specialty(uuid, uuid);
DROP FUNCTION IF EXISTS public.validate_specialty_alignment(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.validate_appointment_specialty_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.log_button_action(text, text, jsonb);

-- 1. Function to validate if a specialty is enabled in the clinic
CREATE FUNCTION public.validate_clinic_specialty(_specialty_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.specialties
    WHERE id = _specialty_id
      AND is_active = true
      AND (clinic_id IS NULL OR clinic_id = _clinic_id)
  )
$$;

-- 2. Function to validate if a professional has a specific specialty
CREATE FUNCTION public.validate_professional_specialty(_professional_id uuid, _specialty_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_specialties ps
    INNER JOIN public.professionals p ON p.id = ps.professional_id
    WHERE ps.professional_id = _professional_id
      AND ps.specialty_id = _specialty_id
      AND p.is_active = true
  )
$$;

-- 3. Comprehensive validation: Clinic specialty + Professional specialty alignment
CREATE FUNCTION public.validate_specialty_alignment(_professional_id uuid, _specialty_id uuid, _clinic_id uuid)
RETURNS TABLE (
  is_valid boolean,
  error_code text,
  error_message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if specialty is enabled in clinic
  IF NOT public.validate_clinic_specialty(_specialty_id, _clinic_id) THEN
    RETURN QUERY SELECT 
      false, 
      'SPECIALTY_NOT_ENABLED', 
      'Especialidade não habilitada para esta clínica'::text;
    RETURN;
  END IF;
  
  -- Check if professional has this specialty
  IF NOT public.validate_professional_specialty(_professional_id, _specialty_id) THEN
    RETURN QUERY SELECT 
      false, 
      'PROFESSIONAL_NOT_AUTHORIZED', 
      'Profissional não autorizado para esta especialidade'::text;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, NULL::text, NULL::text;
END;
$$;

-- 4. Trigger to validate specialty alignment when creating appointments
CREATE FUNCTION public.validate_appointment_specialty_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_specialty_id uuid;
  v_is_valid boolean;
  v_error_message text;
BEGIN
  -- Get specialty from procedure if not directly set
  v_specialty_id := COALESCE(
    NEW.specialty_id,
    (SELECT specialty_id FROM public.procedures WHERE id = NEW.procedure_id)
  );
  
  -- If no specialty defined, allow (legacy data)
  IF v_specialty_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Validate alignment
  SELECT is_valid, error_message INTO v_is_valid, v_error_message
  FROM public.validate_specialty_alignment(NEW.professional_id, v_specialty_id, NEW.clinic_id);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION '%', v_error_message;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments (only for insert/update)
DROP TRIGGER IF EXISTS validate_appointment_specialty ON public.appointments;
CREATE TRIGGER validate_appointment_specialty
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_specialty_trigger();

-- 5. Function to log button actions for audit
CREATE FUNCTION public.log_button_action(
  _action_type text,
  _action_target text,
  _action_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id uuid;
BEGIN
  SELECT clinic_id INTO v_clinic_id FROM public.profiles WHERE user_id = auth.uid();
  
  IF v_clinic_id IS NULL THEN
    RETURN;
  END IF;
  
  INSERT INTO public.access_logs (
    clinic_id,
    user_id,
    action,
    resource,
    created_at
  ) VALUES (
    v_clinic_id,
    auth.uid(),
    'BUTTON_ACTION:' || _action_type,
    COALESCE(_action_target, 'unknown'),
    now()
  );
END;
$$;

-- Comments
COMMENT ON FUNCTION public.validate_clinic_specialty IS 'Valida se especialidade está habilitada na clínica';
COMMENT ON FUNCTION public.validate_professional_specialty(uuid, uuid) IS 'Valida se profissional possui especialidade';
COMMENT ON FUNCTION public.validate_specialty_alignment IS 'Validação completa de alinhamento especialidade/profissional/clínica';
COMMENT ON FUNCTION public.validate_appointment_specialty_trigger IS 'Trigger para validar especialidade ao criar/editar agendamentos';
COMMENT ON FUNCTION public.log_button_action IS 'Registra log de ação de botão para auditoria';