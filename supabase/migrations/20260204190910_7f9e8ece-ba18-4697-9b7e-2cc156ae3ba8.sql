-- =====================================================
-- ETAPA 9: SEGURANÇA, LGPD E ISOLAMENTO DE DADOS - CLEANUP
-- Drop all conflicting function versions
-- =====================================================

-- Drop ALL existing versions of these functions with their specific signatures
DROP FUNCTION IF EXISTS public.can_access_patient_clinical_data(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_patient_clinical_data(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_recepcionista() CASCADE;
DROP FUNCTION IF EXISTS public.is_recepcionista(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_clinical_content() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_clinical_content(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_attended_patient(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_clinic_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_clinical_access(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_evolution_access_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.is_own_patient_data(uuid) CASCADE;

-- Now create all functions fresh

-- 1. is_recepcionista - check if current user is receptionist
CREATE FUNCTION public.is_recepcionista()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'recepcionista'
  )
$$;

-- 2. can_access_clinical_content - check if user can access clinical data
CREATE FUNCTION public.can_access_clinical_content()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT public.is_recepcionista()
$$;

-- 3. get_user_role - get user's role in a clinic
CREATE FUNCTION public.get_user_role(_user_id uuid, _clinic_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = _user_id AND clinic_id = _clinic_id
  LIMIT 1
$$;

-- 4. get_user_clinic_id - get current user's clinic
CREATE FUNCTION public.get_user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 5. has_attended_patient - check if professional attended a patient
CREATE FUNCTION public.has_attended_patient(_professional_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = _professional_id
      AND patient_id = _patient_id
      AND status IN ('completed', 'em_atendimento', 'in_progress', 'atendido', 'concluido', 'finalizado')
  )
$$;

-- 6. can_access_patient_clinical_data - comprehensive check for patient data access
CREATE FUNCTION public.can_access_patient_clinical_data(_user_id uuid, _patient_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_professional_id uuid;
BEGIN
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = _user_id AND clinic_id = _clinic_id;
  
  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  IF v_role = 'recepcionista' THEN
    RETURN false;
  END IF;
  
  IF v_role = 'profissional' THEN
    SELECT id INTO v_professional_id 
    FROM public.professionals 
    WHERE user_id = _user_id AND clinic_id = _clinic_id AND is_active = true;
    
    IF v_professional_id IS NULL THEN
      RETURN false;
    END IF;
    
    RETURN public.has_attended_patient(v_professional_id, _patient_id);
  END IF;
  
  RETURN false;
END;
$$;

-- 7. log_clinical_access - log access to clinical data
CREATE FUNCTION public.log_clinical_access(
  _patient_id uuid,
  _action text,
  _resource text DEFAULT NULL
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
    _action,
    COALESCE(_resource, 'patient:' || _patient_id::text),
    now()
  );
END;
$$;

-- 8. log_evolution_access_trigger - trigger function for evolution logging
CREATE FUNCTION public.log_evolution_access_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_clinical_access(
    NEW.patient_id,
    CASE TG_OP
      WHEN 'INSERT' THEN 'EVOLUTION_CREATED'
      WHEN 'UPDATE' THEN 'EVOLUTION_UPDATED'
      ELSE 'EVOLUTION_ACCESSED'
    END,
    'evolution:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

-- 9. is_own_patient_data - check if current user's professional has attended patient
CREATE FUNCTION public.is_own_patient_data(_patient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_id uuid;
  v_clinic_id uuid;
BEGIN
  SELECT clinic_id INTO v_clinic_id FROM public.profiles WHERE user_id = auth.uid();
  SELECT id INTO v_professional_id FROM public.professionals WHERE user_id = auth.uid() AND clinic_id = v_clinic_id;
  
  IF v_professional_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN public.has_attended_patient(v_professional_id, _patient_id);
END;
$$;

-- Comments
COMMENT ON FUNCTION public.is_recepcionista() IS 'Verifica se usuário atual é recepcionista';
COMMENT ON FUNCTION public.can_access_clinical_content() IS 'Verifica se usuário pode acessar conteúdo clínico';
COMMENT ON FUNCTION public.get_user_role IS 'Retorna o papel do usuário em uma clínica';
COMMENT ON FUNCTION public.has_attended_patient IS 'Verifica se profissional atendeu paciente';
COMMENT ON FUNCTION public.can_access_patient_clinical_data IS 'Verifica acesso a dados clínicos de paciente';
COMMENT ON FUNCTION public.log_clinical_access IS 'Registra log de acesso a dados clínicos';