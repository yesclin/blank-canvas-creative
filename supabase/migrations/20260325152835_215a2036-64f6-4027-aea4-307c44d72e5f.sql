
-- ============================================================
-- Restore receptionist blocking for clinical tables
-- ============================================================

-- 1. Recreate is_recepcionista function
CREATE OR REPLACE FUNCTION public.is_recepcionista(_user_id uuid DEFAULT auth.uid())
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'recepcionista'
  )
$$;

-- 2. Recreate can_access_clinical_content function
CREATE OR REPLACE FUNCTION public.can_access_clinical_content(_user_id uuid DEFAULT auth.uid())
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT NOT public.is_recepcionista(_user_id)
$$;

-- ============================================================
-- Fix SELECT policies on clinical tables to block receptionist
-- ============================================================

-- anamnesis_records
DROP POLICY IF EXISTS "Clinic users can view anamnesis records" ON public.anamnesis_records;
CREATE POLICY "Clinic users can view anamnesis records"
  ON public.anamnesis_records FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

-- clinical_evolutions
DROP POLICY IF EXISTS "Clinic users can view evolutions" ON public.clinical_evolutions;
CREATE POLICY "Clinic users can view evolutions"
  ON public.clinical_evolutions FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

-- clinical_alerts
DROP POLICY IF EXISTS "Users can view clinical alerts" ON public.clinical_alerts;
CREATE POLICY "Users can view clinical alerts"
  ON public.clinical_alerts FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

DROP POLICY IF EXISTS "Users can insert clinical alerts" ON public.clinical_alerts;
CREATE POLICY "Users can insert clinical alerts"
  ON public.clinical_alerts FOR INSERT TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

DROP POLICY IF EXISTS "Users can update clinical alerts" ON public.clinical_alerts;
CREATE POLICY "Users can update clinical alerts"
  ON public.clinical_alerts FOR UPDATE TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

-- clinical_media
DROP POLICY IF EXISTS "Clinic users can view clinical media" ON public.clinical_media;
CREATE POLICY "Clinic users can view clinical media"
  ON public.clinical_media FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

DROP POLICY IF EXISTS "Users can insert clinical media" ON public.clinical_media;
CREATE POLICY "Users can insert clinical media"
  ON public.clinical_media FOR INSERT TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

-- patient_clinical_data
DROP POLICY IF EXISTS "Clinic users can view patient clinical data" ON public.patient_clinical_data;
CREATE POLICY "Clinic users can view patient clinical data"
  ON public.patient_clinical_data FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

DROP POLICY IF EXISTS "Users can insert patient clinical data" ON public.patient_clinical_data;
CREATE POLICY "Users can insert patient clinical data"
  ON public.patient_clinical_data FOR INSERT TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

DROP POLICY IF EXISTS "Users can update patient clinical data" ON public.patient_clinical_data;
CREATE POLICY "Users can update patient clinical data"
  ON public.patient_clinical_data FOR UPDATE TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));

-- clinical_documents
DROP POLICY IF EXISTS "Clinic users can view clinical docs" ON public.clinical_documents;
CREATE POLICY "Clinic users can view clinical docs"
  ON public.clinical_documents FOR SELECT TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
