
DROP POLICY IF EXISTS "Users can view their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can insert their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can update their clinic integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Users can delete their clinic integrations" ON public.clinic_channel_integrations;

CREATE POLICY "Users can view their clinic integrations"
ON public.clinic_channel_integrations
FOR SELECT TO authenticated
USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Users can insert their clinic integrations"
ON public.clinic_channel_integrations
FOR INSERT TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Users can update their clinic integrations"
ON public.clinic_channel_integrations
FOR UPDATE TO authenticated
USING (clinic_id = public.get_user_clinic(auth.uid()))
WITH CHECK (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Users can delete their clinic integrations"
ON public.clinic_channel_integrations
FOR DELETE TO authenticated
USING (clinic_id = public.get_user_clinic(auth.uid()));
