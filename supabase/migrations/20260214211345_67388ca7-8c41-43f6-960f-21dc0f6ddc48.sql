
-- Create document type enum
DO $$ BEGIN
  CREATE TYPE public.clinical_document_type AS ENUM ('anamnese', 'receita', 'atestado', 'evolucao', 'relatorio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sequential counter per clinic
CREATE TABLE public.clinic_document_counter (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id)
);

ALTER TABLE public.clinic_document_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can read counter"
ON public.clinic_document_counter FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

CREATE POLICY "Clinic members can upsert counter"
ON public.clinic_document_counter FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

CREATE POLICY "Clinic members can update counter"
ON public.clinic_document_counter FOR UPDATE
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

-- Clinical documents registry
CREATE TABLE public.clinical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_type public.clinical_document_type NOT NULL,
  document_reference VARCHAR NOT NULL,
  document_hash TEXT NOT NULL,
  pdf_url TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  source_record_id UUID,
  patient_name TEXT,
  professional_name TEXT
);

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- Clinic members can read their documents
CREATE POLICY "Clinic members can read clinical documents"
ON public.clinical_documents FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

-- Clinic members can insert documents
CREATE POLICY "Clinic members can insert clinical documents"
ON public.clinical_documents FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

-- Clinic members can update (for revocation)
CREATE POLICY "Clinic members can update clinical documents"
ON public.clinical_documents FOR UPDATE
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);

-- Public validation: anyone can read a specific document by ID (for QR code validation)
CREATE POLICY "Public can validate documents by id"
ON public.clinical_documents FOR SELECT
USING (true);

-- Create function to atomically increment counter and return next number
CREATE OR REPLACE FUNCTION public.get_next_document_number(p_clinic_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  INSERT INTO clinic_document_counter (clinic_id, last_number, updated_at)
  VALUES (p_clinic_id, 1, now())
  ON CONFLICT (clinic_id)
  DO UPDATE SET last_number = clinic_document_counter.last_number + 1, updated_at = now()
  RETURNING last_number INTO next_num;
  
  RETURN next_num;
END;
$$;
