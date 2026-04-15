
-- 1. Clinic signature settings per document type
CREATE TABLE IF NOT EXISTS public.clinic_signature_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'default',
  signature_level text NOT NULL DEFAULT 'advanced' CHECK (signature_level IN ('simple','reinforced','advanced')),
  require_selfie boolean NOT NULL DEFAULT true,
  require_otp boolean NOT NULL DEFAULT false,
  allow_camera_fallback boolean NOT NULL DEFAULT true,
  allow_geolocation boolean NOT NULL DEFAULT false,
  allow_typed_name boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, document_type)
);

ALTER TABLE public.clinic_signature_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated clinic members can read signature settings"
  ON public.clinic_signature_settings FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owner/admin can manage signature settings"
  ON public.clinic_signature_settings FOR ALL TO authenticated
  USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id WHERE p.id = auth.uid() AND ur.role IN ('admin')))
  WITH CHECK (clinic_id IN (SELECT p.clinic_id FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id WHERE p.id = auth.uid() AND ur.role IN ('admin')));

-- 2. Add advanced columns to medical_record_signatures
ALTER TABLE public.medical_record_signatures
  ADD COLUMN IF NOT EXISTS signature_level text DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS handwritten_path text,
  ADD COLUMN IF NOT EXISTS geolocation jsonb,
  ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS evidence_snapshot jsonb;

-- 3. Signature evidence table
CREATE TABLE IF NOT EXISTS public.signature_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  signature_id uuid NOT NULL REFERENCES public.medical_record_signatures(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK (evidence_type IN ('selfie','handwritten','typed_name','geolocation','otp_verification','reauth','document_read')),
  evidence_data jsonb DEFAULT '{}',
  file_path text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signature_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signatary can insert own evidence"
  ON public.signature_evidence FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_record_signatures mrs
      WHERE mrs.id = signature_id AND mrs.signed_by = auth.uid()
    )
  );

CREATE POLICY "Signatary and admins can read evidence"
  ON public.signature_evidence FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_record_signatures mrs
      WHERE mrs.id = signature_id AND mrs.signed_by = auth.uid()
    )
    OR
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid() AND ur.role IN ('admin')
    )
  );

-- 4. Create private storage bucket for signature evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('signature-evidence', 'signature-evidence', false, 5242880)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own signature evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signature-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own signature evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signature-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Ensure medical_signature_events table exists with needed columns
CREATE TABLE IF NOT EXISTS public.medical_signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  signature_id uuid NOT NULL REFERENCES public.medical_record_signatures(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_signature_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_signature_events' AND policyname = 'Authenticated users can insert signature events') THEN
    CREATE POLICY "Authenticated users can insert signature events"
      ON public.medical_signature_events FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_signature_events' AND policyname = 'Clinic members can read signature events') THEN
    CREATE POLICY "Clinic members can read signature events"
      ON public.medical_signature_events FOR SELECT TO authenticated
      USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_signature_evidence_signature_id ON public.signature_evidence(signature_id);
CREATE INDEX IF NOT EXISTS idx_clinic_signature_settings_clinic ON public.clinic_signature_settings(clinic_id);
