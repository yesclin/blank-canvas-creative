CREATE INDEX IF NOT EXISTS idx_clinic_resources_anamnesis_lookup
  ON public.clinic_resources (clinic_id, specialty_id, resource_type, enabled)
  WHERE resource_type = 'anamnesis_model';

CREATE OR REPLACE FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(
  p_clinic_id uuid,
  p_specialty_id uuid
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  specialty_id uuid,
  procedure_id uuid,
  is_default boolean,
  is_system boolean,
  system_locked boolean,
  current_version_id uuid,
  campos jsonb,
  structure jsonb,
  version_number integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (t.id)
    t.id,
    t.name,
    t.description,
    t.specialty_id,
    t.procedure_id,
    t.is_default,
    t.is_system,
    t.system_locked,
    t.current_version_id,
    t.campos,
    COALESCE(v.structure, t.campos, '[]'::jsonb) AS structure,
    v.version_number
  FROM public.clinic_resources cr
  JOIN public.anamnesis_templates t
    ON t.id = cr.resource_id
  LEFT JOIN public.anamnesis_template_versions v
    ON v.id = t.current_version_id
  WHERE cr.clinic_id = p_clinic_id
    AND cr.specialty_id = p_specialty_id
    AND cr.resource_type = 'anamnesis_model'
    AND cr.enabled = true
    AND cr.effective_at <= now()
    AND (cr.expires_at IS NULL OR cr.expires_at > now())
    AND t.is_active = true
    AND t.archived = false
    AND (
      public.is_platform_admin(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.clinic_id = p_clinic_id
      )
    )
  ORDER BY
    t.id,
    t.is_system DESC,
    t.is_default DESC,
    t.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(uuid, uuid) TO authenticated;