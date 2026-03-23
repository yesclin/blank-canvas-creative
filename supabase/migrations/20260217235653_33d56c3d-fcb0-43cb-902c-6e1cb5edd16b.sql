
-- Fix broken RLS policies on anamnesis_templates that use profiles.id instead of profiles.user_id

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view anamnesis templates from their clinic" ON public.anamnesis_templates;
DROP POLICY IF EXISTS "Users can update anamnesis templates from their clinic" ON public.anamnesis_templates;
DROP POLICY IF EXISTS "Users can delete anamnesis templates from their clinic" ON public.anamnesis_templates;

-- Recreate with correct user_id reference
CREATE POLICY "Users can view anamnesis templates from their clinic"
ON public.anamnesis_templates FOR SELECT
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can update anamnesis templates from their clinic"
ON public.anamnesis_templates FOR UPDATE
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can delete anamnesis templates from their clinic"
ON public.anamnesis_templates FOR DELETE
USING (clinic_id = get_user_clinic_id() AND usage_count = 0);
