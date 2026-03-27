
-- 1. Add missing columns to clinic_document_settings for the rich document configuration UI
ALTER TABLE public.clinic_document_settings
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS clinic_name text,
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS responsible_crm text,
  ADD COLUMN IF NOT EXISTS show_crm boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_footer boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_style text DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS show_digital_signature boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS signature_image_url text,
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS header_layout text DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS watermark_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS watermark_text text,
  ADD COLUMN IF NOT EXISTS use_professional_from_doc boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_type_config jsonb DEFAULT '{}'::jsonb;

-- 2. Add missing columns to clinical_documents for document control/versioning
ALTER TABLE public.clinical_documents
  ADD COLUMN IF NOT EXISTS document_reference text,
  ADD COLUMN IF NOT EXISTS document_hash text,
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS professional_name text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS replaces_document_id uuid REFERENCES public.clinical_documents(id),
  ADD COLUMN IF NOT EXISTS replaced_by_document_id uuid REFERENCES public.clinical_documents(id),
  ADD COLUMN IF NOT EXISTS is_revoked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS revoked_reason text;

-- 3. Create get_next_document_number RPC function (atomic counter)
CREATE OR REPLACE FUNCTION public.get_next_document_number(p_clinic_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  -- Upsert into clinic_document_counter: increment if exists, insert with 1 if not
  INSERT INTO public.clinic_document_counter (clinic_id, document_type, current_number)
  VALUES (p_clinic_id, 'general', 1)
  ON CONFLICT (clinic_id, document_type)
  DO UPDATE SET current_number = clinic_document_counter.current_number + 1,
               updated_at = now()
  RETURNING current_number INTO next_num;

  RETURN next_num;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid) TO authenticated;
