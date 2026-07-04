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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_slug text;
  v_base_specialty_id uuid;
  v_is_member boolean := false;
BEGIN
  IF p_clinic_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.clinic_id = p_clinic_id
        AND (p.user_id = auth.uid() OR p.id = auth.uid())
    )
  INTO v_is_member;

  IF NOT COALESCE(v_is_member, false) THEN
    RETURN;
  END IF;

  SELECT s.slug
    INTO v_current_slug
  FROM public.specialties s
  WHERE s.id = p_specialty_id
    AND s.clinic_id = p_clinic_id
  LIMIT 1;

  SELECT s.id
    INTO v_base_specialty_id
  FROM public.specialties s
  WHERE s.clinic_id = p_clinic_id
    AND s.slug IN ('other_specialty', 'outras_especialidades', 'atendimento_geral', 'custom', 'geral')
  ORDER BY
    CASE
      WHEN s.id = p_specialty_id THEN 0
      WHEN s.slug = 'other_specialty' THEN 1
      WHEN s.slug = 'atendimento_geral' THEN 2
      WHEN s.slug = 'outras_especialidades' THEN 3
      WHEN s.slug = 'custom' THEN 4
      WHEN s.slug = 'geral' THEN 5
      ELSE 6
    END,
    s.is_active DESC,
    s.created_at ASC
  LIMIT 1;

  RETURN QUERY
  WITH candidate_specialties AS (
    SELECT p_specialty_id AS specialty_id
    WHERE p_specialty_id IS NOT NULL

    UNION

    SELECT v_base_specialty_id AS specialty_id
    WHERE v_base_specialty_id IS NOT NULL

    UNION

    SELECT s.id AS specialty_id
    FROM public.specialties s
    JOIN public.clinic_specialty_aliases a
      ON a.clinic_id = p_clinic_id
     AND a.base_specialty_key = s.slug
    WHERE s.clinic_id = p_clinic_id
      AND s.is_active = true
  ),
  enabled_resources AS (
    SELECT cr.*
    FROM public.clinic_resources cr
    WHERE cr.clinic_id = p_clinic_id
      AND cr.resource_type IN ('anamnesis_model', 'anamnese')
      AND cr.enabled = true
      AND cr.resource_id IS NOT NULL
      AND cr.effective_at <= now()
      AND (cr.expires_at IS NULL OR cr.expires_at > now())
      AND (
        cr.specialty_id IN (SELECT cs.specialty_id FROM candidate_specialties cs)
        OR (
          cr.specialty_id IS NULL
          AND cr.specialty_slug IN (
            v_current_slug,
            'other_specialty',
            'outras_especialidades',
            'atendimento_geral',
            'custom',
            'geral'
          )
        )
        OR (
          cr.specialty_id IS NULL
          AND cr.parent_specialty_slug IN (
            v_current_slug,
            'other_specialty',
            'outras_especialidades',
            'atendimento_geral',
            'custom',
            'geral'
          )
        )
      )
  )
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
  FROM enabled_resources cr
  JOIN public.anamnesis_templates t
    ON t.id = cr.resource_id
  LEFT JOIN public.anamnesis_template_versions v
    ON v.id = t.current_version_id
  WHERE t.is_active = true
    AND t.archived = false
  ORDER BY
    t.id,
    CASE
      WHEN cr.specialty_id = p_specialty_id THEN 0
      WHEN cr.specialty_id = v_base_specialty_id THEN 1
      WHEN cr.specialty_id IS NULL THEN 2
      ELSE 3
    END,
    cr.updated_at DESC,
    t.is_system DESC,
    t.is_default DESC,
    t.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_clinic_resource_specialty_id(
  p_clinic_id uuid,
  p_resource_specialty_slug text,
  p_resource_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_specialty_id uuid;
  v_primary_specialty_id uuid;
  v_is_anamnesis boolean := p_resource_type IN ('anamnesis_model', 'anamnese');
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can resolve clinic resource specialties';
  END IF;

  IF p_clinic_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.primary_specialty_id
    INTO v_primary_specialty_id
  FROM public.clinics c
  WHERE c.id = p_clinic_id;

  IF p_resource_specialty_slug IS NOT NULL THEN
    SELECT s.id
      INTO v_specialty_id
    FROM public.specialties s
    WHERE s.clinic_id = p_clinic_id
      AND s.slug = p_resource_specialty_slug
    ORDER BY s.is_active DESC, s.created_at ASC
    LIMIT 1;

    IF v_specialty_id IS NOT NULL THEN
      UPDATE public.specialties
         SET is_active = true,
             updated_at = now()
       WHERE id = v_specialty_id
         AND is_active = false;
      RETURN v_specialty_id;
    END IF;
  END IF;

  IF v_is_anamnesis THEN
    SELECT s.id
      INTO v_specialty_id
    FROM public.specialties s
    WHERE s.clinic_id = p_clinic_id
      AND s.slug IN ('other_specialty', 'outras_especialidades', 'atendimento_geral', 'custom', 'geral')
    ORDER BY
      CASE
        WHEN s.slug = 'other_specialty' THEN 0
        WHEN s.slug = 'atendimento_geral' THEN 1
        WHEN s.slug = 'outras_especialidades' THEN 2
        WHEN s.slug = 'custom' THEN 3
        WHEN s.slug = 'geral' THEN 4
        ELSE 5
      END,
      s.is_active DESC,
      s.created_at ASC
    LIMIT 1;

    IF v_specialty_id IS NOT NULL THEN
      UPDATE public.specialties
         SET is_active = true,
             updated_at = now()
       WHERE id = v_specialty_id
         AND is_active = false;
      RETURN v_specialty_id;
    END IF;
  END IF;

  IF v_primary_specialty_id IS NOT NULL THEN
    SELECT s.id
      INTO v_specialty_id
    FROM public.specialties s
    WHERE s.id = v_primary_specialty_id
      AND s.clinic_id = p_clinic_id
    LIMIT 1;

    IF v_specialty_id IS NOT NULL THEN
      UPDATE public.specialties
         SET is_active = true,
             updated_at = now()
       WHERE id = v_specialty_id
         AND is_active = false;
      RETURN v_specialty_id;
    END IF;
  END IF;

  SELECT s.id
    INTO v_specialty_id
  FROM public.specialties s
  WHERE s.clinic_id = p_clinic_id
  ORDER BY s.is_active DESC, s.created_at ASC
  LIMIT 1;

  IF v_specialty_id IS NOT NULL THEN
    UPDATE public.specialties
       SET is_active = true,
           updated_at = now()
     WHERE id = v_specialty_id
       AND is_active = false;
    RETURN v_specialty_id;
  END IF;

  INSERT INTO public.specialties (clinic_id, name, slug, is_active)
  VALUES (
    p_clinic_id,
    CASE
      WHEN v_is_anamnesis THEN 'Outra Especialidade / Atendimento Geral'
      ELSE COALESCE(NULLIF(initcap(replace(p_resource_specialty_slug, '_', ' ')), ''), 'Atendimento Geral')
    END,
    CASE
      WHEN v_is_anamnesis THEN 'other_specialty'
      ELSE COALESCE(NULLIF(p_resource_specialty_slug, ''), 'other_specialty')
    END,
    true
  )
  RETURNING id INTO v_specialty_id;

  RETURN v_specialty_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_clinic_resource_specialty_id(uuid, text, text) TO authenticated;