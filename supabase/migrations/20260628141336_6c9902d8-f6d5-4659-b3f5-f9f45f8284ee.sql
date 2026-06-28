CREATE OR REPLACE FUNCTION public.get_public_procedures(
  _clinic_id uuid,
  _specialty_id uuid DEFAULT NULL,
  _professional_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  specialty_id uuid,
  name text,
  description text,
  duration_minutes integer,
  price numeric,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.clinic_id,
    p.specialty_id,
    p.name,
    p.description,
    COALESCE(NULLIF(p.duration_minutes, 0), 30) AS duration_minutes,
    p.price,
    p.is_active
  FROM public.procedures p
  WHERE p.clinic_id = _clinic_id
    AND p.is_active = true
    AND (_specialty_id IS NULL OR p.specialty_id IS NULL OR p.specialty_id = _specialty_id)
    AND EXISTS (
      SELECT 1
      FROM public.clinics c
      WHERE c.id = p.clinic_id
        AND c.public_booking_enabled = true
    )
    AND (
      _professional_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.professional_authorized_procedures pap
        WHERE pap.professional_id = _professional_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.professional_authorized_procedures pap
        WHERE pap.professional_id = _professional_id
          AND pap.procedure_id = p.id
      )
    )
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_procedures(uuid, uuid, uuid) TO anon, authenticated;