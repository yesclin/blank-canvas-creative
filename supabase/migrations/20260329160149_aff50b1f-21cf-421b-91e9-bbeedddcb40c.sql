ALTER TABLE public.anamnesis_template_versions
  ALTER COLUMN version SET DEFAULT 1,
  ALTER COLUMN version SET NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_anamnesis_template_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.version := COALESCE(NEW.version, NEW.version_number, 1);
  NEW.version_number := COALESCE(NEW.version_number, NEW.version, 1);

  IF NEW.version < 1 OR NEW.version_number < 1 THEN
    RAISE EXCEPTION 'Versão inicial inválida para anamnesis_template_versions: version=%, version_number=%', NEW.version, NEW.version_number;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_anamnesis_template_version ON public.anamnesis_template_versions;

CREATE TRIGGER trg_normalize_anamnesis_template_version
BEFORE INSERT OR UPDATE ON public.anamnesis_template_versions
FOR EACH ROW
EXECUTE FUNCTION public.normalize_anamnesis_template_version();

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
  _existing_current_version_id UUID;
  _anamnese_name TEXT;
  _anamnese_icon TEXT;
  _anamnese_structure JSONB;
BEGIN
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

  SELECT id, current_version_id
  INTO _template_id, _existing_current_version_id
  FROM public.anamnesis_templates
  WHERE clinic_id = _clinic_id
    AND specialty_id = _specialty_id
    AND name = _anamnese_name
  ORDER BY created_at ASC
  LIMIT 1;

  IF _template_id IS NULL THEN
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
    RETURNING id, current_version_id INTO _template_id, _existing_current_version_id;

    _templates_created := 1;
  ELSE
    UPDATE public.anamnesis_templates
    SET description = COALESCE(description, 'Modelo oficial de ' || _specialty_name || ' provisionado automaticamente.'),
        version = COALESCE(version, 1),
        fields = CASE
          WHEN fields IS NULL OR fields = '[]'::jsonb THEN _anamnese_structure
          ELSE fields
        END,
        campos = CASE
          WHEN campos IS NULL OR campos = '[]'::jsonb THEN _anamnese_structure
          ELSE campos
        END,
        is_active = true,
        is_system = true,
        is_default = true,
        archived = false,
        icon = COALESCE(icon, _anamnese_icon),
        template_type = COALESCE(template_type, 'anamnese_personalizada'),
        specialty = COALESCE(specialty, _specialty_slug),
        updated_at = now()
    WHERE id = _template_id;
  END IF;

  SELECT id
  INTO _version_id
  FROM public.anamnesis_template_versions
  WHERE template_id = _template_id
  ORDER BY COALESCE(version_number, version, 1) ASC, created_at ASC
  LIMIT 1;

  IF _version_id IS NULL THEN
    INSERT INTO public.anamnesis_template_versions (
      template_id, version, version_number, structure, fields, created_by
    ) VALUES (
      _template_id, 1, 1, _anamnese_structure, _anamnese_structure, NULL
    )
    RETURNING id INTO _version_id;
  END IF;

  IF _existing_current_version_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.anamnesis_template_versions v
    WHERE v.id = _existing_current_version_id
      AND v.template_id = _template_id
  ) THEN
    UPDATE public.anamnesis_templates
    SET current_version_id = _version_id,
        updated_at = now()
    WHERE id = _template_id;
  END IF;

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