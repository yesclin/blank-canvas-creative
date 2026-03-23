-- =====================================================
-- ETAPA 5: CADASTRO E REGRAS DO PROFISSIONAL DE SAÚDE
-- =====================================================

-- 1. Create professional schedules table (agenda_ativa)
CREATE TABLE IF NOT EXISTS public.professional_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  UNIQUE(professional_id, day_of_week)
);

-- 2. Create authorized procedures table
CREATE TABLE IF NOT EXISTS public.professional_authorized_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, procedure_id)
);

-- 3. Create authorized templates table
CREATE TABLE IF NOT EXISTS public.professional_authorized_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  template_id uuid NOT NULL, -- References prontuario templates
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, template_id)
);

-- 4. Create authorized rooms table
CREATE TABLE IF NOT EXISTS public.professional_authorized_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, room_id)
);

-- 5. Create authorized care flows table
CREATE TABLE IF NOT EXISTS public.professional_authorized_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  flow_id uuid NOT NULL, -- References care flow definitions
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, flow_id)
);

-- 6. Enable RLS on all new tables
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_flows ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for professional_schedules
CREATE POLICY "Users can view schedules from their clinic"
ON public.professional_schedules FOR SELECT
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Admins can manage schedules"
ON public.professional_schedules FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_admin_or_owner(auth.uid())
);

-- 8. Create RLS policies for authorized procedures
CREATE POLICY "Users can view authorized procedures from their clinic"
ON public.professional_authorized_procedures FOR SELECT
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Admins can manage authorized procedures"
ON public.professional_authorized_procedures FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_admin_or_owner(auth.uid())
);

-- 9. Create RLS policies for authorized templates
CREATE POLICY "Users can view authorized templates from their clinic"
ON public.professional_authorized_templates FOR SELECT
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Admins can manage authorized templates"
ON public.professional_authorized_templates FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_admin_or_owner(auth.uid())
);

-- 10. Create RLS policies for authorized rooms
CREATE POLICY "Users can view authorized rooms from their clinic"
ON public.professional_authorized_rooms FOR SELECT
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Admins can manage authorized rooms"
ON public.professional_authorized_rooms FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_admin_or_owner(auth.uid())
);

-- 11. Create RLS policies for authorized flows
CREATE POLICY "Users can view authorized flows from their clinic"
ON public.professional_authorized_flows FOR SELECT
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Admins can manage authorized flows"
ON public.professional_authorized_flows FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_admin_or_owner(auth.uid())
);

-- =====================================================
-- VALIDATION FUNCTIONS
-- =====================================================

-- 12. Function to validate primary specialty is enabled in clinic
CREATE OR REPLACE FUNCTION public.validate_professional_specialty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id uuid;
  v_is_enabled boolean;
BEGIN
  -- Get clinic_id from the professional
  SELECT clinic_id INTO v_clinic_id FROM public.professionals WHERE id = NEW.professional_id;
  
  -- Check if specialty is enabled for this clinic
  SELECT is_active INTO v_is_enabled
  FROM public.specialties
  WHERE id = NEW.specialty_id
    AND (clinic_id = v_clinic_id OR clinic_id IS NULL) -- Global or clinic specialty
    AND is_active = true;
  
  IF NOT FOUND OR NOT v_is_enabled THEN
    RAISE EXCEPTION 'A especialidade selecionada não está habilitada para esta clínica';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for specialty validation
DROP TRIGGER IF EXISTS validate_professional_specialty_trigger ON public.professional_specialties;
CREATE TRIGGER validate_professional_specialty_trigger
  BEFORE INSERT OR UPDATE ON public.professional_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_professional_specialty();

-- 13. Function to validate procedure is within professional's specialties
CREATE OR REPLACE FUNCTION public.validate_procedure_authorization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_procedure_specialty_id uuid;
  v_has_specialty boolean;
BEGIN
  -- Get the procedure's specialty
  SELECT specialty_id INTO v_procedure_specialty_id
  FROM public.procedures
  WHERE id = NEW.procedure_id;
  
  -- Check if professional has this specialty
  SELECT EXISTS (
    SELECT 1 FROM public.professional_specialties
    WHERE professional_id = NEW.professional_id
      AND specialty_id = v_procedure_specialty_id
  ) INTO v_has_specialty;
  
  IF NOT v_has_specialty THEN
    RAISE EXCEPTION 'O profissional não pode ser autorizado para procedimentos fora de suas especialidades';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for procedure authorization validation
DROP TRIGGER IF EXISTS validate_procedure_authorization_trigger ON public.professional_authorized_procedures;
CREATE TRIGGER validate_procedure_authorization_trigger
  BEFORE INSERT OR UPDATE ON public.professional_authorized_procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_procedure_authorization();

-- 14. Function to get professional's specialties
CREATE OR REPLACE FUNCTION public.get_professional_specialties(_professional_id uuid)
RETURNS TABLE(specialty_id uuid, specialty_name text, is_primary boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ps.specialty_id,
    s.name as specialty_name,
    ps.is_primary
  FROM public.professional_specialties ps
  JOIN public.specialties s ON ps.specialty_id = s.id
  WHERE ps.professional_id = _professional_id
  ORDER BY ps.is_primary DESC, s.name;
$$;

-- 15. Function to get professional's primary specialty
CREATE OR REPLACE FUNCTION public.get_professional_primary_specialty(_professional_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT specialty_id
  FROM public.professional_specialties
  WHERE professional_id = _professional_id
    AND is_primary = true
  LIMIT 1;
$$;

-- 16. Function to check if professional can access a template (by specialty)
CREATE OR REPLACE FUNCTION public.can_professional_access_template(_professional_id uuid, _template_specialty_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_specialties
    WHERE professional_id = _professional_id
      AND specialty_id = _template_specialty_id
  );
$$;

-- 17. Function to check if professional can perform a procedure
CREATE OR REPLACE FUNCTION public.can_professional_perform_procedure(_professional_id uuid, _procedure_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_authorized_procedures
    WHERE professional_id = _professional_id
      AND procedure_id = _procedure_id
  );
$$;

-- 18. Function to check if professional can use a room
CREATE OR REPLACE FUNCTION public.can_professional_use_room(_professional_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If no rooms are explicitly authorized, allow all rooms
  -- Otherwise, check if room is in authorized list
  SELECT 
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.professional_authorized_rooms WHERE professional_id = _professional_id
      ) THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.professional_authorized_rooms
        WHERE professional_id = _professional_id AND room_id = _room_id
      )
    END;
$$;

-- 19. Function to validate appointment matches professional's authorization
CREATE OR REPLACE FUNCTION public.validate_appointment_professional_authorization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate procedure authorization if procedure is specified
  IF NEW.procedure_id IS NOT NULL THEN
    IF NOT public.can_professional_perform_procedure(NEW.professional_id, NEW.procedure_id) THEN
      RAISE EXCEPTION 'O profissional não está autorizado a realizar este procedimento';
    END IF;
  END IF;
  
  -- Validate room authorization if room is specified
  IF NEW.room_id IS NOT NULL THEN
    IF NOT public.can_professional_use_room(NEW.professional_id, NEW.room_id) THEN
      RAISE EXCEPTION 'O profissional não está autorizado a usar esta sala';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments for authorization validation
DROP TRIGGER IF EXISTS validate_appointment_authorization_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_authorization_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_professional_authorization();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional ON public.professional_schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_authorized_procedures_professional ON public.professional_authorized_procedures(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_authorized_templates_professional ON public.professional_authorized_templates(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_authorized_rooms_professional ON public.professional_authorized_rooms(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_authorized_flows_professional ON public.professional_authorized_flows(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_specialties_professional ON public.professional_specialties(professional_id);

-- Add comments
COMMENT ON TABLE public.professional_schedules IS 'Agenda ativa do profissional com dias e horários de atendimento';
COMMENT ON TABLE public.professional_authorized_procedures IS 'Procedimentos autorizados para cada profissional';
COMMENT ON TABLE public.professional_authorized_templates IS 'Modelos de prontuário autorizados para cada profissional';
COMMENT ON TABLE public.professional_authorized_rooms IS 'Salas autorizadas para cada profissional (opcional)';
COMMENT ON TABLE public.professional_authorized_flows IS 'Fluxos de atendimento autorizados para cada profissional';
COMMENT ON FUNCTION public.validate_professional_specialty IS 'Valida que a especialidade está habilitada na clínica';
COMMENT ON FUNCTION public.validate_procedure_authorization IS 'Valida que o procedimento é da especialidade do profissional';
COMMENT ON FUNCTION public.can_professional_perform_procedure IS 'Verifica se profissional pode realizar um procedimento';