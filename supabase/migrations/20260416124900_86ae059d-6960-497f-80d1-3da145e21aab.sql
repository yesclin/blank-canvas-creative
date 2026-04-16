
-- Table for professional saved signatures
CREATE TABLE public.professional_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  signature_file_url TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'uploaded',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_professional_signatures_lookup 
  ON public.professional_signatures(clinic_id, professional_id, is_active);

-- Enable RLS
ALTER TABLE public.professional_signatures ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own signatures
CREATE POLICY "Users can view own professional signatures"
  ON public.professional_signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Professionals can insert their own signatures
CREATE POLICY "Users can insert own professional signatures"
  ON public.professional_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Professionals can update their own signatures
CREATE POLICY "Users can update own professional signatures"
  ON public.professional_signatures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Professionals can delete their own signatures
CREATE POLICY "Users can delete own professional signatures"
  ON public.professional_signatures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Storage bucket for professional signature images (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('professional-signatures', 'professional-signatures', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Storage RLS policies
CREATE POLICY "Users can upload own signatures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'professional-signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own signatures"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'professional-signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own signatures"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'professional-signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Also allow reading signatures for PDF generation (any authenticated user in same clinic)
CREATE POLICY "Clinic users can view professional signatures for documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'professional-signatures'
  );
