-- Add RLS policies for procedures to allow clinic users to manage procedures
-- (complementing existing admin-only policy)

-- Policy for users to insert procedures in their clinic
CREATE POLICY "Users can insert procedures in their clinic"
ON public.procedures
FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- Policy for users to update procedures in their clinic
CREATE POLICY "Users can update procedures in their clinic"
ON public.procedures
FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- Policy for users to delete procedures in their clinic (soft delete via is_active)
CREATE POLICY "Users can delete procedures in their clinic"
ON public.procedures
FOR DELETE
USING (clinic_id = user_clinic_id(auth.uid()));