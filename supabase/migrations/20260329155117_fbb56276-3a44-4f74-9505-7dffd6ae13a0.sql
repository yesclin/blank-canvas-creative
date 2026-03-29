
CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id uuid, _specialty_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _specialty_id UUID;
  _specialty_name TEXT;
  _result JSONB := '{}';
  _tabs_created INTEGER := 0;
  _templates_created INTEGER := 0;
  _template_id UUID;
  _version_id UUID;
  _anamnese_name TEXT;
  _anamnese_icon TEXT;
  _anamnese_structure JSONB;
BEGIN
  -- Resolve specialty name from slug
  SELECT name INTO _specialty_name FROM (VALUES
    ('geral', 'Clínica Geral'),
    ('psicologia', 'Psicologia'),
    ('nutricao', 'Nutrição'),
    ('fisioterapia', 'Fisioterapia'),
    ('pilates', 'Pilates'),
    ('estetica', 'Estética / Harmonização Facial'),
    ('odontologia', 'Odontologia'),
    ('dermatologia', 'Dermatologia'),
    ('pediatria', 'Pediatria')
  ) AS t(slug, name) WHERE t.slug = _specialty_slug;

  IF _specialty_name IS NULL THEN
    RAISE EXCEPTION 'Especialidade não reconhecida: %', _specialty_slug;
  END IF;

  -- Upsert specialty
  INSERT INTO public.specialties (clinic_id, name, slug, is_active, specialty_type)
  VALUES (_clinic_id, _specialty_name, _specialty_slug, true, 'padrao')
  ON CONFLICT (clinic_id, slug) WHERE clinic_id IS NOT NULL
  DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO _specialty_id;

  IF _specialty_id IS NULL THEN
    SELECT id INTO _specialty_id
    FROM public.specialties
    WHERE clinic_id = _clinic_id AND slug = _specialty_slug
    LIMIT 1;
  END IF;

  -- ══════════════════════════════════════════════════════
  -- TABS: Provision standard tabs per specialty
  -- ══════════════════════════════════════════════════════
  IF _specialty_slug = 'geral' THEN
    WITH required_tabs AS (
      SELECT * FROM (VALUES
        ('Visão Geral', 'resumo', 'resumo', 'LayoutDashboard', 1),
        ('Anamnese', 'anamnese', 'anamnese', 'FileText', 2),
        ('Evoluções', 'evolucao', 'evolucao', 'Activity', 3),
        ('Exame Físico', 'exame_fisico', 'exame_fisico', 'Heart', 4),
        ('Hipóteses Diagnósticas', 'diagnostico', 'diagnostico', 'Stethoscope', 5),
        ('Plano / Conduta', 'conduta', 'conduta', 'Target', 6),
        ('Documentos Clínicos', 'documentos_clinicos', 'documentos_clinicos', 'ScrollText', 7),
        ('Prescrições', 'prescricoes', 'prescricoes', 'Pill', 8),
        ('Exames / Documentos', 'exames', 'exames', 'Paperclip', 9),
        ('Alertas', 'alertas', 'alertas', 'AlertTriangle', 10),
        ('Linha do Tempo', 'timeline', 'timeline', 'GitBranch', 11)
      ) AS t(name, slug, key, icon, display_order)
    )
    INSERT INTO public.medical_record_tabs (
      clinic_id, specialty_id, name, slug, key, icon, sort_order, display_order, is_active, is_system, scope
    )
    SELECT _clinic_id, _specialty_id, rt.name, rt.slug, rt.key, rt.icon, rt.display_order, rt.display_order, true, true, 'specialty'
    FROM required_tabs rt
    WHERE NOT EXISTS (
      SELECT 1 FROM public.medical_record_tabs mrt
      WHERE mrt.clinic_id = _clinic_id AND mrt.specialty_id = _specialty_id
        AND (mrt.key = rt.key OR mrt.slug = rt.slug)
    );
    GET DIAGNOSTICS _tabs_created = ROW_COUNT;
  ELSE
    -- Generic tabs for all other specialties
    WITH required_tabs AS (
      SELECT * FROM (VALUES
        ('Visão Geral', 'resumo', 'resumo', 'LayoutDashboard', 1),
        ('Anamnese', 'anamnese', 'anamnese', 'FileText', 2),
        ('Evoluções', 'evolucao', 'evolucao', 'Activity', 3),
        ('Documentos Clínicos', 'documentos_clinicos', 'documentos_clinicos', 'ScrollText', 4),
        ('Alertas', 'alertas', 'alertas', 'AlertTriangle', 5),
        ('Linha do Tempo', 'timeline', 'timeline', 'GitBranch', 6)
      ) AS t(name, slug, key, icon, display_order)
    )
    INSERT INTO public.medical_record_tabs (
      clinic_id, specialty_id, name, slug, key, icon, sort_order, display_order, is_active, is_system, scope
    )
    SELECT _clinic_id, _specialty_id, rt.name, rt.slug, rt.key, rt.icon, rt.display_order, rt.display_order, true, true, 'specialty'
    FROM required_tabs rt
    WHERE NOT EXISTS (
      SELECT 1 FROM public.medical_record_tabs mrt
      WHERE mrt.clinic_id = _clinic_id AND mrt.specialty_id = _specialty_id
        AND (mrt.key = rt.key OR mrt.slug = rt.slug)
    );
    GET DIAGNOSTICS _tabs_created = ROW_COUNT;
  END IF;

  -- ══════════════════════════════════════════════════════
  -- ANAMNESIS TEMPLATE + VERSION: Provision for ALL specialties
  -- ══════════════════════════════════════════════════════
  _anamnese_name := 'Anamnese Padrão - ' || _specialty_name || ' (YesClin)';
  
  SELECT icon INTO _anamnese_icon FROM (VALUES
    ('geral', 'Stethoscope'),
    ('psicologia', 'Brain'),
    ('nutricao', 'Apple'),
    ('fisioterapia', 'Activity'),
    ('pilates', 'Dumbbell'),
    ('estetica', 'Sparkles'),
    ('odontologia', 'SmilePlus'),
    ('dermatologia', 'Scan'),
    ('pediatria', 'Baby')
  ) AS t(slug, icon) WHERE t.slug = _specialty_slug;

  _anamnese_icon := COALESCE(_anamnese_icon, 'ClipboardList');

  -- Default minimal structure
  _anamnese_structure := jsonb_build_array(
    jsonb_build_object(
      'id', 'section_queixa',
      'type', 'section',
      'title', 'Queixa Principal',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'id', 'f_queixa_principal',
          'type', 'textarea',
          'label', 'Queixa principal',
          'required', true
        )
      )
    )
  );

  -- Check if template already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.anamnesis_templates
    WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = _anamnese_name
  ) THEN
    -- Create the template
    INSERT INTO public.anamnesis_templates (
      clinic_id, specialty_id, name, description, version, fields, campos,
      is_active, is_system, is_default, archived, icon, usage_count, 
      template_type, specialty
    ) VALUES (
      _clinic_id, _specialty_id, _anamnese_name,
      'Modelo oficial de ' || _specialty_name || ' provisionado automaticamente.',
      1, _anamnese_structure, _anamnese_structure,
      true, true, true, false, _anamnese_icon, 0, 
      'anamnese_personalizada', _specialty_slug
    )
    RETURNING id INTO _template_id;

    -- Create version 1
    IF _template_id IS NOT NULL THEN
      INSERT INTO public.anamnesis_template_versions (
        template_id, version, version_number, structure, fields, created_by
      ) VALUES (
        _template_id, 1, 1, _anamnese_structure, _anamnese_structure, NULL
      )
      RETURNING id INTO _version_id;

      -- Link current_version_id
      IF _version_id IS NOT NULL THEN
        UPDATE public.anamnesis_templates
        SET current_version_id = _version_id
        WHERE id = _template_id;
      END IF;
    END IF;

    _templates_created := 1;
  ELSE
    -- Template exists: ensure it has at least one version
    SELECT id INTO _template_id FROM public.anamnesis_templates
    WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = _anamnese_name
    LIMIT 1;

    IF _template_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.anamnesis_template_versions WHERE template_id = _template_id
    ) THEN
      INSERT INTO public.anamnesis_template_versions (
        template_id, version, version_number, structure, fields, created_by
      ) VALUES (
        _template_id, 1, 1, _anamnese_structure, _anamnese_structure, NULL
      )
      RETURNING id INTO _version_id;

      IF _version_id IS NOT NULL THEN
        UPDATE public.anamnesis_templates
        SET current_version_id = _version_id
        WHERE id = _template_id;
      END IF;
    END IF;

    _templates_created := 0;
  END IF;

  -- Also create medical_record_templates entry
  INSERT INTO public.medical_record_templates (
    clinic_id, specialty_id, name, description, type, scope, is_default, is_active, is_system, config
  )
  SELECT _clinic_id, _specialty_id, 'Prontuário Padrão - ' || _specialty_name,
         'Estrutura padrão de ' || _specialty_name || ' com módulos e layout oficial.',
         'custom_form', 'specialty', true, true, true,
         jsonb_build_object(
           'specialty_slug', _specialty_slug,
           'layout', _specialty_slug || '_default'
         )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.medical_record_templates t
    WHERE t.clinic_id = _clinic_id AND t.specialty_id = _specialty_id 
      AND t.name = 'Prontuário Padrão - ' || _specialty_name
  );

  _result := jsonb_build_object(
    'specialty_id', _specialty_id,
    'specialty_name', _specialty_name,
    'tabs_created', _tabs_created,
    'templates_created', _templates_created,
    'success', true
  );

  RETURN _result;
END;
$function$;
