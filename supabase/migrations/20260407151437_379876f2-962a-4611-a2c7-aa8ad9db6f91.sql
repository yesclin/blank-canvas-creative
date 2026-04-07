
-- ============================================================
-- FIX 1: Remove overly permissive anon SELECT on clinical_documents
-- and replace with a secure RPC function
-- ============================================================

DROP POLICY IF EXISTS "Public can validate documents" ON public.clinical_documents;

CREATE OR REPLACE FUNCTION public.validate_clinical_document(p_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', cd.id,
    'document_type', cd.document_type,
    'title', cd.title,
    'status', cd.status,
    'signed_at', cd.signed_at,
    'created_at', cd.created_at,
    'is_revoked', cd.is_revoked,
    'document_reference', cd.document_reference,
    'clinic_name', c.name
  )
  FROM public.clinical_documents cd
  LEFT JOIN public.clinics c ON c.id = cd.clinic_id
  WHERE cd.validation_code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_clinical_document(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_clinical_document(text) TO authenticated;

-- ============================================================
-- FIX 2: Fix saved_segments RLS policies (p.id -> p.user_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own clinic segments" ON public.saved_segments;
DROP POLICY IF EXISTS "Users can create segments for own clinic" ON public.saved_segments;
DROP POLICY IF EXISTS "Users can update own clinic segments" ON public.saved_segments;
DROP POLICY IF EXISTS "Users can delete own clinic segments" ON public.saved_segments;

CREATE POLICY "Users can view own clinic segments"
  ON public.saved_segments FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can create segments for own clinic"
  ON public.saved_segments FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can update own clinic segments"
  ON public.saved_segments FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can delete own clinic segments"
  ON public.saved_segments FOR DELETE TO authenticated
  USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()));
