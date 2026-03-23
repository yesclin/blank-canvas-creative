-- Restrict clinic_channel_integrations to admins only (protects access_token)
DROP POLICY IF EXISTS "Users can view their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can insert their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can update their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can delete their clinic integrations" ON public.clinic_channel_integrations;

CREATE POLICY "Admins can view clinic integrations"
ON public.clinic_channel_integrations FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can insert clinic integrations"
ON public.clinic_channel_integrations FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can update clinic integrations"
ON public.clinic_channel_integrations FOR UPDATE
TO authenticated
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
)
WITH CHECK (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can delete clinic integrations"
ON public.clinic_channel_integrations FOR DELETE
TO authenticated
USING (
  clinic_id = public.get_user_clinic(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
);