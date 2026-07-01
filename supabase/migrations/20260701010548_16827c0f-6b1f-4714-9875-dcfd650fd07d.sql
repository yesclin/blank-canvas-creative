CREATE OR REPLACE FUNCTION public.get_prontuario_resource_catalog(p_clinic_id uuid)
RETURNS TABLE(
  resource_key text, resource_type text, specialty_slug text,
  title text, description text, source_table text, source_id uuid,
  preview_payload jsonb, enabled boolean, has_override boolean, override_reason text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.resource_key, c.resource_type, c.specialty_slug, c.title, c.description,
         c.source_table, c.source_id, c.preview_payload,
         COALESCE(r.enabled, false) AS enabled,
         (r.id IS NOT NULL) AS has_override,
         r.reason AS override_reason
  FROM public.prontuario_resource_catalog c
  LEFT JOIN public.clinic_resources r
    ON r.clinic_id = p_clinic_id AND r.resource_key = c.resource_key
  WHERE c.is_active = true
  ORDER BY c.specialty_slug NULLS FIRST, c.resource_type, c.title;
$$;
