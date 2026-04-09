
-- Step 1: Activate all system templates that have valid versions with structure
UPDATE public.anamnesis_templates t
SET is_active = true, archived = false
FROM public.anamnesis_template_versions v
WHERE v.id = t.current_version_id
  AND t.is_system = true
  AND v.structure IS NOT NULL
  AND v.structure::text NOT IN ('[]', 'null', '{}')
  AND (t.is_active = false OR t.archived = true);

-- Step 2: Ensure system_locked on all system templates
UPDATE public.anamnesis_templates
SET system_locked = true
WHERE is_system = true AND system_locked = false;

-- Step 3: Create integrity check function
CREATE OR REPLACE FUNCTION public.ensure_system_templates_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{"restored": 0, "invalid": 0, "details": []}'::jsonb;
  restored_count int := 0;
  invalid_count int := 0;
  details jsonb := '[]'::jsonb;
  rec record;
BEGIN
  -- Restore system templates that have valid versions but are inactive/archived
  FOR rec IN
    SELECT t.id, t.name, s.slug as specialty_slug
    FROM anamnesis_templates t
    JOIN specialties s ON s.id = t.specialty_id
    JOIN anamnesis_template_versions v ON v.id = t.current_version_id
    WHERE t.is_system = true
      AND (t.is_active = false OR t.archived = true)
      AND v.structure IS NOT NULL
      AND v.structure::text NOT IN ('[]', 'null', '{}')
  LOOP
    UPDATE anamnesis_templates
    SET is_active = true, archived = false
    WHERE id = rec.id;
    
    restored_count := restored_count + 1;
    details := details || jsonb_build_object(
      'action', 'restored',
      'template_id', rec.id,
      'name', rec.name,
      'specialty', rec.specialty_slug
    );
    
    RAISE LOG 'Template integrity: Restored system template "%" (%) for specialty %', rec.name, rec.id, rec.specialty_slug;
  END LOOP;

  -- Log system templates that are invalid (no version or no structure)
  FOR rec IN
    SELECT t.id, t.name, s.slug as specialty_slug,
      CASE 
        WHEN t.current_version_id IS NULL THEN 'no_version_id'
        WHEN v.id IS NULL THEN 'version_not_found'
        WHEN v.structure IS NULL OR v.structure::text IN ('[]', 'null', '{}') THEN 'empty_structure'
        ELSE 'unknown'
      END as reason
    FROM anamnesis_templates t
    JOIN specialties s ON s.id = t.specialty_id
    LEFT JOIN anamnesis_template_versions v ON v.id = t.current_version_id
    WHERE t.is_system = true
      AND (
        t.current_version_id IS NULL
        OR v.id IS NULL
        OR v.structure IS NULL
        OR v.structure::text IN ('[]', 'null', '{}')
      )
  LOOP
    invalid_count := invalid_count + 1;
    details := details || jsonb_build_object(
      'action', 'invalid',
      'template_id', rec.id,
      'name', rec.name,
      'specialty', rec.specialty_slug,
      'reason', rec.reason
    );
    
    RAISE LOG 'Template integrity: Invalid system template "%" (%) for specialty % - reason: %', rec.name, rec.id, rec.specialty_slug, rec.reason;
  END LOOP;

  -- Ensure system_locked on all system templates
  UPDATE anamnesis_templates
  SET system_locked = true
  WHERE is_system = true AND system_locked = false;

  result := jsonb_build_object(
    'restored', restored_count,
    'invalid', invalid_count,
    'details', details
  );
  
  RETURN result;
END;
$$;
