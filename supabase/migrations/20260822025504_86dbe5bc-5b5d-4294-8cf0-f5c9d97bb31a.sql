DROP POLICY IF EXISTS "Clinic admins can sign evolutions" ON public.clinical_evolutions;
CREATE POLICY "Clinic admins can sign evolutions"
ON public.clinical_evolutions
FOR UPDATE
USING (
  is_clinic_admin(auth.uid(), clinic_id)
  AND status = 'rascunho'::document_status
)
WITH CHECK (
  is_clinic_admin(auth.uid(), clinic_id)
  AND status = ANY (ARRAY['rascunho'::document_status, 'assinado'::document_status])
);