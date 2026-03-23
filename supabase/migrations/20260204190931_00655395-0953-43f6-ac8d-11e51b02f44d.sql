-- =====================================================
-- ETAPA 9: SEGURANÇA, LGPD E ISOLAMENTO DE DADOS - RLS POLICIES
-- =====================================================

-- 1. Enhanced RLS policies for clinical_evolutions with professional isolation
DROP POLICY IF EXISTS "Users can view clinical evolutions in their clinic" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Clinical evolutions restricted access" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "clinical_evolutions_read_policy" ON public.clinical_evolutions;

CREATE POLICY "clinical_evolutions_read_policy"
ON public.clinical_evolutions
FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id()
  AND public.can_access_clinical_content()
  AND (
    public.has_role(auth.uid(), 'owner') OR 
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'profissional') AND
      public.can_access_patient_clinical_data(auth.uid(), patient_id, clinic_id)
    )
  )
);

-- 2. Enhanced RLS for clinical_alerts
DROP POLICY IF EXISTS "Users can view clinical alerts" ON public.clinical_alerts;
DROP POLICY IF EXISTS "Clinical alerts restricted access" ON public.clinical_alerts;
DROP POLICY IF EXISTS "clinical_alerts_read_policy" ON public.clinical_alerts;

CREATE POLICY "clinical_alerts_read_policy"
ON public.clinical_alerts
FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id()
  AND public.can_access_clinical_content()
  AND (
    public.has_role(auth.uid(), 'owner') OR 
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'profissional') AND
      public.can_access_patient_clinical_data(auth.uid(), patient_id, clinic_id)
    )
  )
);

-- 3. Enhanced RLS for clinical_media
DROP POLICY IF EXISTS "Clinical media access" ON public.clinical_media;
DROP POLICY IF EXISTS "clinical_media_read_policy" ON public.clinical_media;

CREATE POLICY "clinical_media_read_policy"
ON public.clinical_media
FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id()
  AND public.can_access_clinical_content()
  AND (
    public.has_role(auth.uid(), 'owner') OR 
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'profissional') AND
      public.can_access_patient_clinical_data(auth.uid(), patient_id, clinic_id)
    )
  )
);

-- 4. Enhanced RLS for body_measurements
DROP POLICY IF EXISTS "Body measurements access" ON public.body_measurements;
DROP POLICY IF EXISTS "body_measurements_read_policy" ON public.body_measurements;

CREATE POLICY "body_measurements_read_policy"
ON public.body_measurements
FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id()
  AND public.can_access_clinical_content()
  AND (
    public.has_role(auth.uid(), 'owner') OR 
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'profissional') AND
      public.can_access_patient_clinical_data(auth.uid(), patient_id, clinic_id)
    )
  )
);

-- 5. Enhanced RLS for before_after_records
DROP POLICY IF EXISTS "Before after records access" ON public.before_after_records;
DROP POLICY IF EXISTS "before_after_records_read_policy" ON public.before_after_records;

CREATE POLICY "before_after_records_read_policy"
ON public.before_after_records
FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id()
  AND public.can_access_clinical_content()
  AND (
    public.has_role(auth.uid(), 'owner') OR 
    public.has_role(auth.uid(), 'admin') OR
    (
      public.has_role(auth.uid(), 'profissional') AND
      public.can_access_patient_clinical_data(auth.uid(), patient_id, clinic_id)
    )
  )
);

-- 6. Create trigger for evolution access logging
DROP TRIGGER IF EXISTS log_evolution_access_on_change ON public.clinical_evolutions;
CREATE TRIGGER log_evolution_access_on_change
  AFTER INSERT OR UPDATE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_evolution_access_trigger();