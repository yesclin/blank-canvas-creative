-- Drop the old INSERT policy and recreate with the same pattern as other working policies
DROP POLICY IF EXISTS "Users can create anamnesis templates for their clinic" ON public.anamnesis_templates;

CREATE POLICY "Users can create anamnesis templates for their clinic"
ON public.anamnesis_templates
FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());