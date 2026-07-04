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
    COALESCE(NULLIF(initcap(replace(p_resource_specialty_slug, '_', ' ')), ''), 'Atendimento Geral'),
    COALESCE(NULLIF(p_resource_specialty_slug, ''), 'other_specialty'),
    true
  )
  RETURNING id INTO v_specialty_id;

  RETURN v_specialty_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_clinic_resource_specialty_id(uuid, text, text) TO authenticated;