-- =====================================================
-- ETAPA 6: REGRAS DA RECEPCIONISTA
-- =====================================================

-- 1. Function to check if user is a receptionist
CREATE OR REPLACE FUNCTION public.is_recepcionista(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'recepcionista'
  )
$$;

-- 2. Function to check if user can access clinical content
-- Receptionists CANNOT access clinical content
CREATE OR REPLACE FUNCTION public.can_access_clinical_content(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin', 'profissional')
  )
$$;

-- 3. Function to check if user can access patient clinical data
-- Returns true only for professionals and admins
CREATE OR REPLACE FUNCTION public.can_access_patient_clinical_data(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins/owners can access clinical data
    public.is_admin_or_owner(_user_id)
    OR 
    -- Professionals can access clinical data of their patients
    (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'profissional'
      )
    )
$$;

-- 4. Function to check if user can access system configurations
CREATE OR REPLACE FUNCTION public.can_access_configurations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_or_owner(_user_id)
$$;

-- =====================================================
-- RLS POLICIES FOR CLINICAL CONTENT - BLOCK RECEPTIONIST
-- =====================================================

-- 5. Clinical Evolutions - Block receptionists
DROP POLICY IF EXISTS "Users can view evolutions from their clinic" ON public.clinical_evolutions;
CREATE POLICY "Clinical staff can view evolutions from their clinic"
ON public.clinical_evolutions FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can insert evolutions" ON public.clinical_evolutions;
CREATE POLICY "Professionals can insert evolutions"
ON public.clinical_evolutions FOR INSERT
WITH CHECK (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can update own evolutions" ON public.clinical_evolutions;
CREATE POLICY "Professionals can update own evolutions"
ON public.clinical_evolutions FOR UPDATE
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 6. Clinical Alerts - Block receptionists
DROP POLICY IF EXISTS "Users can view alerts from their clinic" ON public.clinical_alerts;
CREATE POLICY "Clinical staff can view alerts from their clinic"
ON public.clinical_alerts FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can manage alerts" ON public.clinical_alerts;
CREATE POLICY "Professionals can manage alerts"
ON public.clinical_alerts FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 7. Clinical Media (images, files) - Block receptionists
DROP POLICY IF EXISTS "Users can view media from their clinic" ON public.clinical_media;
CREATE POLICY "Clinical staff can view media from their clinic"
ON public.clinical_media FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can insert media" ON public.clinical_media;
CREATE POLICY "Professionals can insert media"
ON public.clinical_media FOR INSERT
WITH CHECK (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can update media" ON public.clinical_media;
CREATE POLICY "Professionals can update media"
ON public.clinical_media FOR UPDATE
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 8. Body Measurements - Block receptionists
DROP POLICY IF EXISTS "Users can view measurements from their clinic" ON public.body_measurements;
CREATE POLICY "Clinical staff can view measurements from their clinic"
ON public.body_measurements FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can manage measurements" ON public.body_measurements;
CREATE POLICY "Professionals can manage measurements"
ON public.body_measurements FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 9. Before/After Records - Block receptionists
DROP POLICY IF EXISTS "Users can view before_after from their clinic" ON public.before_after_records;
CREATE POLICY "Clinical staff can view before_after from their clinic"
ON public.before_after_records FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can manage before_after" ON public.before_after_records;
CREATE POLICY "Professionals can manage before_after"
ON public.before_after_records FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 10. Custom Field Values (clinical data) - Block receptionists
DROP POLICY IF EXISTS "Users can view custom fields from their clinic" ON public.custom_field_values;
CREATE POLICY "Clinical staff can view custom fields from their clinic"
ON public.custom_field_values FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can manage custom fields" ON public.custom_field_values;
CREATE POLICY "Professionals can manage custom fields"
ON public.custom_field_values FOR ALL
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- 11. Custom Prontuario Fields (template definitions) - Block receptionists from viewing
DROP POLICY IF EXISTS "Users can view prontuario fields from their clinic" ON public.custom_prontuario_fields;
CREATE POLICY "Clinical staff can view prontuario fields from their clinic"
ON public.custom_prontuario_fields FOR SELECT
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.can_access_clinical_content(auth.uid())
);

-- =====================================================
-- RECEPTIONIST ACCESS POLICIES
-- =====================================================

-- 12. Patients - Receptionist can view registration data (already has RLS)
-- No changes needed - patients table already has appropriate policies

-- 13. Appointments - Receptionist can manage (already has RLS)
-- No changes needed - appointments table already has appropriate policies

-- 14. Insurances - Receptionist can view (already has RLS)
-- No changes needed - insurances table already has appropriate policies

-- =====================================================
-- HELPER FUNCTIONS FOR FRONTEND
-- =====================================================

-- 15. Function to get receptionist allowed modules
CREATE OR REPLACE FUNCTION public.get_receptionist_allowed_modules()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY['agenda', 'pacientes', 'atendimento', 'convenios']::text[]
$$;

-- 16. Function to get receptionist blocked modules
CREATE OR REPLACE FUNCTION public.get_receptionist_blocked_modules()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY['prontuario', 'configuracoes', 'relatorios', 'financeiro', 'estoque', 'comunicacao']::text[]
$$;

-- 17. Function to check if user can view patient clinical history
CREATE OR REPLACE FUNCTION public.can_view_patient_clinical_history(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_access_clinical_content(_user_id)
$$;

-- Add comments
COMMENT ON FUNCTION public.is_recepcionista IS 'Verifica se o usuário é recepcionista';
COMMENT ON FUNCTION public.can_access_clinical_content IS 'Verifica se o usuário pode acessar conteúdo clínico (profissionais e admins apenas)';
COMMENT ON FUNCTION public.can_access_configurations IS 'Verifica se o usuário pode acessar configurações do sistema';
COMMENT ON FUNCTION public.get_receptionist_allowed_modules IS 'Retorna lista de módulos permitidos para recepcionista';
COMMENT ON FUNCTION public.get_receptionist_blocked_modules IS 'Retorna lista de módulos bloqueados para recepcionista';