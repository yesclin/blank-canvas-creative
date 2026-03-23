-- Drop and recreate policies to also allow access via profiles table
DROP POLICY IF EXISTS "Users can insert their clinic document settings" ON public.clinic_document_settings;
DROP POLICY IF EXISTS "Users can update their clinic document settings" ON public.clinic_document_settings;
DROP POLICY IF EXISTS "Users can view their clinic document settings" ON public.clinic_document_settings;

CREATE POLICY "Users can view their clinic document settings"
ON public.clinic_document_settings FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM professionals WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their clinic document settings"
ON public.clinic_document_settings FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM professionals WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their clinic document settings"
ON public.clinic_document_settings FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM professionals WHERE user_id = auth.uid()
  )
);