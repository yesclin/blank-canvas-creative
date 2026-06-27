CREATE OR REPLACE FUNCTION public.get_appointment_medical_record_context(_appointment_id uuid)
RETURNS TABLE (
  appointment_id uuid,
  professional_id uuid,
  professional_name text,
  patient_id uuid,
  procedure_id uuid,
  procedure_name text,
  specialty_id uuid,
  specialty_name text,
  specialty_key text,
  is_specialty_enabled boolean,
  can_professional_access boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH appointment_context AS (
    SELECT
      a.id,
      a.clinic_id,
      a.professional_id,
      a.patient_id,
      a.procedure_id,
      a.specialty_id AS appointment_specialty_id,
      p.name AS procedure_name,
      p.specialty_id AS procedure_specialty_id,
      pro.full_name AS professional_name,
      pro.specialty_id AS professional_specialty_id,
      ps_primary.specialty_id AS linked_specialty_id
    FROM public.appointments a
    LEFT JOIN public.procedures p ON a.procedure_id = p.id
    LEFT JOIN public.professionals pro ON a.professional_id = pro.id
    LEFT JOIN LATERAL (
      SELECT ps.specialty_id
      FROM public.professional_specialties ps
      WHERE ps.professional_id = a.professional_id
      ORDER BY ps.is_primary DESC, ps.created_at ASC
      LIMIT 1
    ) ps_primary ON true
    WHERE a.id = _appointment_id
  )
  SELECT
    ac.id AS appointment_id,
    ac.professional_id,
    ac.professional_name,
    ac.patient_id,
    ac.procedure_id,
    ac.procedure_name,
    s.id AS specialty_id,
    CASE
      WHEN s.slug = 'other_specialty' THEN COALESCE(NULLIF(btrim(alias.display_name), ''), s.name)
      ELSE s.name
    END AS specialty_name,
    CASE
      WHEN s.slug IS NOT NULL AND btrim(s.slug) <> '' THEN s.slug
      ELSE lower(regexp_replace(
        translate(s.name, 'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'),
        '[^a-zA-Z0-9]+', '_', 'g'
      ))
    END AS specialty_key,
    COALESCE(s.is_active, false) AS is_specialty_enabled,
    (
      ac.professional_specialty_id = s.id
      OR EXISTS (
        SELECT 1
        FROM public.professional_specialties ps
        WHERE ps.professional_id = ac.professional_id
          AND ps.specialty_id = s.id
      )
    ) AS can_professional_access
  FROM appointment_context ac
  LEFT JOIN public.specialties s
    ON s.id = COALESCE(
      ac.appointment_specialty_id,
      ac.procedure_specialty_id,
      ac.professional_specialty_id,
      ac.linked_specialty_id
    )
  LEFT JOIN public.clinic_specialty_aliases alias
    ON alias.clinic_id = ac.clinic_id
   AND alias.base_specialty_key = 'other_specialty';
$$;

COMMENT ON FUNCTION public.get_appointment_medical_record_context IS 'Retorna o contexto completo do prontuário para um agendamento, respeitando slug oficial e alias da especialidade other_specialty';