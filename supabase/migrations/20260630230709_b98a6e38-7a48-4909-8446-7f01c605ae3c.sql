CREATE OR REPLACE FUNCTION public.get_prontuario_resource_catalog(p_clinic_id uuid)
 RETURNS TABLE(resource_key text, resource_type text, specialty_slug text, title text, description text, source_table text, source_id uuid, preview_payload jsonb, enabled boolean, has_override boolean, override_reason text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.resource_key, c.resource_type, c.specialty_slug, c.title, c.description,
         c.source_table, c.source_id, c.preview_payload,
         COALESCE(o.enabled, false) AS enabled,
         (o.id IS NOT NULL) AS has_override,
         o.reason AS override_reason
  FROM public.prontuario_resource_catalog c
  LEFT JOIN public.clinic_template_overrides o
    ON o.clinic_id = p_clinic_id AND o.resource_key = c.resource_key
   AND (o.expires_at IS NULL OR o.expires_at > now())
  WHERE c.is_active = true
  ORDER BY c.specialty_slug NULLS FIRST, c.resource_type, c.title;
$function$;