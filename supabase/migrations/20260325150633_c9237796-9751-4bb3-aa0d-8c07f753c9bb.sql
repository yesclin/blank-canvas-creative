
-- ============================================================
-- MIGRATION 3: patient_consents revocation (column + trigger + policy)
-- ============================================================

-- 1. Add revoked_by column for full traceability
ALTER TABLE public.patient_consents
  ADD COLUMN IF NOT EXISTS revoked_by uuid;

-- 2. Trigger function: auto-fill revocation metadata
CREATE OR REPLACE FUNCTION public.handle_consent_revocation()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Only act on transition granted -> revoked
  IF NEW.status = 'revoked' AND OLD.status = 'granted' THEN
    NEW.revoked_at := COALESCE(NEW.revoked_at, now());
    NEW.revoked_by := COALESCE(NEW.revoked_by, auth.uid());
  END IF;

  -- Block any other status transitions via UPDATE
  -- Allowed: granted -> revoked (only valid transition)
  IF OLD.status != 'granted' OR NEW.status != 'revoked' THEN
    RAISE EXCEPTION 'Apenas consentimentos concedidos podem ser revogados. Transição % -> % não permitida.', OLD.status, NEW.status;
  END IF;

  -- Protect historical fields from modification during revocation
  IF NEW.patient_id    IS DISTINCT FROM OLD.patient_id OR
     NEW.term_id       IS DISTINCT FROM OLD.term_id OR
     NEW.granted_at    IS DISTINCT FROM OLD.granted_at OR
     NEW.granted_by    IS DISTINCT FROM OLD.granted_by OR
     NEW.signature_data IS DISTINCT FROM OLD.signature_data OR
     NEW.ip_address    IS DISTINCT FROM OLD.ip_address OR
     NEW.term_version  IS DISTINCT FROM OLD.term_version OR
     NEW.clinic_id     IS DISTINCT FROM OLD.clinic_id THEN
    RAISE EXCEPTION 'Campos históricos do consentimento não podem ser alterados durante revogação.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger on patient_consents
CREATE TRIGGER trg_consent_revocation
  BEFORE UPDATE ON public.patient_consents
  FOR EACH ROW
  EXECUTE FUNCTION handle_consent_revocation();

-- 4. RLS policy: only owner/admin can revoke, scoped to clinic
CREATE POLICY "Admins can revoke patient consents"
  ON public.patient_consents
  FOR UPDATE
  TO authenticated
  USING (
    is_clinic_admin(auth.uid(), clinic_id)
    AND status = 'granted'
  )
  WITH CHECK (
    status = 'revoked'
  );
