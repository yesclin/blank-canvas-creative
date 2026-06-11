DROP POLICY IF EXISTS "Users can view invitations of their clinic" ON public.user_invitations;

CREATE POLICY "Admins can view invitations of their clinic"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (public.is_clinic_admin(auth.uid(), clinic_id));