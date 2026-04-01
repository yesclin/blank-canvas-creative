-- Add missing UPDATE and DELETE policies for facial_map_applications
-- Non-admin clinical users currently can only SELECT and INSERT, but cannot update or delete their own points

CREATE POLICY "Update map apps"
ON public.facial_map_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM facial_maps fm
    WHERE fm.id = facial_map_id
    AND fm.clinic_id = user_clinic_id(auth.uid())
  )
);

CREATE POLICY "Delete map apps"
ON public.facial_map_applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM facial_maps fm
    WHERE fm.id = facial_map_id
    AND fm.clinic_id = user_clinic_id(auth.uid())
  )
);

-- Also add missing DELETE policy for facial_maps (non-admin clinical users)
CREATE POLICY "Delete facial maps"
ON public.facial_maps
FOR DELETE
TO authenticated
USING (
  clinic_id = user_clinic_id(auth.uid())
  AND can_access_clinical_content(auth.uid())
);