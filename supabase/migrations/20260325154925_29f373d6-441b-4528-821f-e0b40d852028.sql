-- Allow clinic users to delete their own patient_insurances (needed for update-via-delete-then-insert)
CREATE POLICY "Users can delete patient insurances in their clinic"
ON public.patient_insurances
FOR DELETE
TO authenticated
USING (clinic_id = user_clinic_id(auth.uid()));

-- Allow clinic users to delete their own patient_guardians
CREATE POLICY "Users can delete patient guardians in their clinic"
ON public.patient_guardians
FOR DELETE
TO authenticated
USING (clinic_id = user_clinic_id(auth.uid()));

-- Allow clinical users to delete patient_clinical_data (respecting clinical access)
CREATE POLICY "Clinical users can delete patient clinical data"
ON public.patient_clinical_data
FOR DELETE
TO authenticated
USING (
  (clinic_id = user_clinic_id(auth.uid()))
  AND can_access_clinical_content(auth.uid())
);