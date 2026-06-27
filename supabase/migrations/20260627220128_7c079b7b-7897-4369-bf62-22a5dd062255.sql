-- Public RPC to list specialties available for online booking, with alias for "other_specialty"
CREATE OR REPLACE FUNCTION public.get_public_specialties(_clinic_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  description text,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    COALESCE(
      CASE
        WHEN s.slug = 'other_specialty' OR s.name ILIKE 'Outra Especialidade%' OR s.name ILIKE 'Outras Especialidades%'
          THEN NULLIF(TRIM(a.display_name), '')
        ELSE NULL
      END,
      s.name
    ) AS name,
    s.color,
    s.description,
    s.slug
  FROM public.specialties s
  LEFT JOIN public.clinic_specialty_aliases a
    ON a.clinic_id = s.clinic_id
   AND a.base_specialty_key = 'other_specialty'
  WHERE s.clinic_id = _clinic_id
    AND s.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.clinics c
      WHERE c.id = s.clinic_id AND c.public_booking_enabled = true
    )
  ORDER BY name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_specialties(uuid) TO anon, authenticated;