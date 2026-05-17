-- Tighten RLS on teleconsultation_settings: split overly permissive ALL policy
DROP POLICY IF EXISTS "Users can manage teleconsultation settings in their clinic" ON public.teleconsultation_settings;

CREATE POLICY "Clinic members can view teleconsultation settings"
ON public.teleconsultation_settings
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Only clinic admins can insert teleconsultation settings"
ON public.teleconsultation_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Only clinic admins can update teleconsultation settings"
ON public.teleconsultation_settings
FOR UPDATE
TO authenticated
USING (public.is_clinic_admin(auth.uid(), clinic_id))
WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Only clinic admins can delete teleconsultation settings"
ON public.teleconsultation_settings
FOR DELETE
TO authenticated
USING (public.is_clinic_admin(auth.uid(), clinic_id));