CREATE POLICY "Platform admins can view all clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));