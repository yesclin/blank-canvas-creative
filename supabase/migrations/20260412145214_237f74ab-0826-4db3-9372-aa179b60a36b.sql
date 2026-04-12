
-- Drop the old policy that blocks signing
DROP POLICY IF EXISTS "Professionals can update own draft evolutions" ON public.clinical_evolutions;

-- Recreate with proper WITH CHECK that allows status transition to 'assinado'
CREATE POLICY "Professionals can update own draft evolutions"
ON public.clinical_evolutions
FOR UPDATE TO authenticated
USING (
  clinic_id = user_clinic_id(auth.uid())
  AND professional_id = user_professional_id(auth.uid())
  AND status = 'rascunho'::document_status
)
WITH CHECK (
  clinic_id = user_clinic_id(auth.uid())
  AND professional_id = user_professional_id(auth.uid())
  AND status IN ('rascunho'::document_status, 'assinado'::document_status)
);
