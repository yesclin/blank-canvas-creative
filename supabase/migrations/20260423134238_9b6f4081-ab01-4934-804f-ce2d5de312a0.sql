-- Remove anonymous SELECT exposure on professionals table (PII leak: emails, phones, cpf)
DROP POLICY IF EXISTS "Anon can view professionals of public clinics" ON public.professionals;

-- Provide a safe public RPC that returns only non-sensitive fields needed for public booking
CREATE OR REPLACE FUNCTION public.get_public_professionals(
  _clinic_id uuid,
  _specialty_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  registration_number text,
  color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.registration_number, p.color
  FROM public.professionals p
  WHERE p.clinic_id = _clinic_id
    AND p.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.clinics c
      WHERE c.id = p.clinic_id AND c.public_booking_enabled = true
    )
    AND (
      _specialty_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.professional_specialties ps
        WHERE ps.professional_id = p.id AND ps.specialty_id = _specialty_id
      )
    )
  ORDER BY p.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_professionals(uuid, uuid) TO anon, authenticated;