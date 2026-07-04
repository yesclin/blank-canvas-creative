CREATE OR REPLACE FUNCTION public.get_prontuario_resource_catalog(p_clinic_id uuid)
RETURNS TABLE(
  resource_key text,
  resource_type text,
  specialty_slug text,
  title text,
  description text,
  source_table text,
  source_id uuid,
  preview_payload jsonb,
  enabled boolean,
  has_override boolean,
  override_reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked_resources AS (
    SELECT
      r.*,
      row_number() OVER (
        PARTITION BY r.clinic_id, r.resource_key
        ORDER BY
          CASE WHEN r.resource_type = 'anamnesis_model' THEN 0 ELSE 1 END,
          r.updated_at DESC
      ) AS rn
    FROM public.clinic_resources r
    WHERE r.clinic_id = p_clinic_id
  )
  SELECT
    c.resource_key,
    c.resource_type,
    c.specialty_slug,
    c.title,
    c.description,
    c.source_table,
    c.source_id,
    c.preview_payload,
    COALESCE(r.enabled, false) AS enabled,
    (r.id IS NOT NULL) AS has_override,
    r.reason AS override_reason
  FROM public.prontuario_resource_catalog c
  LEFT JOIN ranked_resources r
    ON r.rn = 1
   AND r.resource_key = c.resource_key
   AND CASE
     WHEN c.resource_type = 'anamnese' THEN r.resource_type IN ('anamnesis_model', 'anamnese')
     ELSE r.resource_type = c.resource_type
   END
  WHERE c.is_active = true
  ORDER BY c.specialty_slug NULLS FIRST, c.resource_type, c.title;
$$;

GRANT EXECUTE ON FUNCTION public.get_prontuario_resource_catalog(uuid) TO authenticated;