-- Permite rollback de assinatura órfã (quando o update do documento de origem
-- falha) apenas pelo próprio assinante e dentro de 5 minutos.
DROP POLICY IF EXISTS "Signer can rollback own recent signature" ON public.medical_record_signatures;
CREATE POLICY "Signer can rollback own recent signature"
ON public.medical_record_signatures
FOR DELETE
USING (
  clinic_id = user_clinic_id(auth.uid())
  AND signed_by = auth.uid()
  AND is_revoked = false
  AND signed_at > (now() - interval '5 minutes')
);

GRANT DELETE ON public.medical_record_signatures TO authenticated;