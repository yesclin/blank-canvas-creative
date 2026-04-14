
-- =============================================
-- 1. Expand medical_record_signatures
-- =============================================

ALTER TABLE public.medical_record_signatures
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id),
  ADD COLUMN IF NOT EXISTS document_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS document_pdf_url text,
  ADD COLUMN IF NOT EXISTS signed_by_professional_id uuid REFERENCES public.professionals(id),
  ADD COLUMN IF NOT EXISTS signed_by_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sign_method text NOT NULL DEFAULT 'password_reauth',
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS is_revoked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid,
  ADD COLUMN IF NOT EXISTS revoke_reason text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mrs_patient_id ON public.medical_record_signatures(patient_id);
CREATE INDEX IF NOT EXISTS idx_mrs_record ON public.medical_record_signatures(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_mrs_signed_at ON public.medical_record_signatures(signed_at);
CREATE INDEX IF NOT EXISTS idx_mrs_verification_token ON public.medical_record_signatures(verification_token);

-- =============================================
-- 2. Create medical_signature_events
-- =============================================

CREATE TABLE IF NOT EXISTS public.medical_signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id uuid NOT NULL REFERENCES public.medical_record_signatures(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mse_signature ON public.medical_signature_events(signature_id);
CREATE INDEX IF NOT EXISTS idx_mse_clinic ON public.medical_signature_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_mse_event_type ON public.medical_signature_events(event_type);

-- =============================================
-- 3. RLS for medical_signature_events
-- =============================================

ALTER TABLE public.medical_signature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can view signature events"
  ON public.medical_signature_events
  FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert signature events"
  ON public.medical_signature_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.professionals p
      WHERE p.user_id = auth.uid()
    )
  );
