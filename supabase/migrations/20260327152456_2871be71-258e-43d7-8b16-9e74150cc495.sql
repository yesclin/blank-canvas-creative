-- Align medical-record and anamnesis schema with the current frontend loaders
ALTER TABLE public.medical_record_templates
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'custom_form',
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'specialty',
ADD COLUMN IF NOT EXISTS professional_id uuid,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

ALTER TABLE public.medical_record_fields
ADD COLUMN IF NOT EXISTS placeholder text;

ALTER TABLE public.anamnesis_templates
ADD COLUMN IF NOT EXISTS procedure_id uuid,
ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS current_version_id uuid,
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS campos jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'anamnese_personalizada',
ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'custom';

ALTER TABLE public.anamnesis_template_versions
ADD COLUMN IF NOT EXISTS structure jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS version_number integer;

UPDATE public.medical_record_templates
SET description = COALESCE(description, config->>'description'),
    type = COALESCE(NULLIF(type, ''), COALESCE(config->>'type', 'custom_form')),
    scope = COALESCE(NULLIF(scope, ''), CASE WHEN specialty_id IS NOT NULL THEN 'specialty' ELSE 'system' END),
    is_active = COALESCE(is_active, true),
    is_system = COALESCE(is_system, false)
WHERE true;

UPDATE public.anamnesis_templates
SET campos = CASE
      WHEN campos IS NULL OR campos = '[]'::jsonb THEN COALESCE(fields, '[]'::jsonb)
      ELSE campos
    END,
    template_type = COALESCE(NULLIF(template_type, ''), 'anamnese_personalizada'),
    specialty = COALESCE(NULLIF(specialty, ''), 'custom'),
    usage_count = COALESCE(usage_count, 0),
    archived = COALESCE(archived, false),
    is_default = COALESCE(is_default, false)
WHERE true;

UPDATE public.anamnesis_template_versions
SET structure = CASE
      WHEN structure IS NULL OR structure = '[]'::jsonb THEN COALESCE(fields, '[]'::jsonb)
      ELSE structure
    END,
    version_number = COALESCE(version_number, version)
WHERE true;

UPDATE public.anamnesis_templates t
SET current_version_id = v.id
FROM (
  SELECT DISTINCT ON (template_id) id, template_id
  FROM public.anamnesis_template_versions
  ORDER BY template_id, COALESCE(version_number, version) DESC, created_at DESC
) v
WHERE t.id = v.template_id
  AND t.current_version_id IS NULL;

-- Ensure every clinic has the official Clínica Geral specialty provisioned
INSERT INTO public.specialties (clinic_id, name, slug, specialty_type, is_active)
SELECT c.id, 'Clínica Geral', 'geral', 'padrao', true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.specialties s
  WHERE s.clinic_id = c.id
    AND s.slug = 'geral'
);

-- Provision full medical-record tabs for Clínica Geral
WITH geral_specialties AS (
  SELECT s.id AS specialty_id, s.clinic_id
  FROM public.specialties s
  WHERE s.slug = 'geral'
), required_tabs AS (
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
SELECT gs.clinic_id, gs.specialty_id, rt.name, rt.slug, rt.key, rt.icon, rt.display_order, rt.display_order, true, true, 'specialty'
FROM geral_specialties gs
CROSS JOIN required_tabs rt
WHERE NOT EXISTS (
  SELECT 1
  FROM public.medical_record_tabs mrt
  WHERE mrt.clinic_id = gs.clinic_id
    AND mrt.specialty_id = gs.specialty_id
    AND (mrt.key = rt.key OR mrt.slug = rt.slug)
);

-- Provision default medical-record template for Clínica Geral
INSERT INTO public.medical_record_templates (
  clinic_id, specialty_id, name, description, type, scope, is_default, is_active, is_system, config
)
SELECT s.clinic_id,
       s.id,
       'Prontuário Padrão - Clínica Geral',
       'Estrutura padrão da Clínica Geral com módulos, tabs e layout oficial do prontuário.',
       'custom_form',
       'specialty',
       true,
       true,
       true,
       jsonb_build_object(
         'specialty_slug', 'geral',
         'enabled_blocks', jsonb_build_array('resumo','anamnese','evolucao','exame_fisico','diagnostico','conduta','documentos_clinicos','prescricoes','exames','alertas','timeline'),
         'layout', 'general_clinic_default'
       )
FROM public.specialties s
WHERE s.slug = 'geral'
  AND NOT EXISTS (
    SELECT 1
    FROM public.medical_record_templates t
    WHERE t.clinic_id = s.clinic_id
      AND t.specialty_id = s.id
      AND t.name = 'Prontuário Padrão - Clínica Geral'
  );

-- Seed specialty-linked fields for the default medical-record template
WITH target_template AS (
  SELECT t.id AS template_id, t.clinic_id
  FROM public.medical_record_templates t
  JOIN public.specialties s ON s.id = t.specialty_id
  WHERE s.slug = 'geral'
    AND t.name = 'Prontuário Padrão - Clínica Geral'
), required_fields AS (
  SELECT * FROM (VALUES
    ('anamnese', 'queixa_principal', 'Queixa Principal', 'textarea', 1, true, NULL::jsonb, NULL::jsonb),
    ('anamnese', 'historia_doenca_atual', 'História da Doença Atual', 'textarea', 2, false, NULL::jsonb, NULL::jsonb),
    ('exame_fisico', 'sinais_vitais', 'Sinais Vitais', 'textarea', 1, false, NULL::jsonb, NULL::jsonb),
    ('diagnostico', 'hipoteses_diagnosticas', 'Hipóteses Diagnósticas', 'textarea', 1, false, NULL::jsonb, NULL::jsonb),
    ('conduta', 'plano_conduta', 'Plano / Conduta', 'textarea', 1, false, NULL::jsonb, NULL::jsonb),
    ('documentos_clinicos', 'tipo_documento', 'Tipo de Documento Clínico', 'select', 1, false, jsonb_build_array('Receituário','Atestado','Relatório'), NULL::jsonb),
    ('prescricoes', 'prescricao', 'Prescrição', 'textarea', 1, false, NULL::jsonb, NULL::jsonb),
    ('exames', 'exame_solicitado', 'Exame / Documento', 'textarea', 1, false, NULL::jsonb, NULL::jsonb),
    ('alertas', 'alerta_clinico', 'Alerta Clínico', 'textarea', 1, false, NULL::jsonb, NULL::jsonb)
  ) AS f(tab_key, field_key, label, field_type, field_order, is_required, options, config)
)
INSERT INTO public.medical_record_fields (
  clinic_id, template_id, tab_key, field_key, label, field_type, field_order, is_required, options, config, placeholder
)
SELECT tt.clinic_id, tt.template_id, rf.tab_key, rf.field_key, rf.label, rf.field_type, rf.field_order, rf.is_required, rf.options, rf.config,
       CASE rf.field_key
         WHEN 'queixa_principal' THEN 'Descreva a queixa principal do paciente'
         WHEN 'hipoteses_diagnosticas' THEN 'Registre as hipóteses diagnósticas'
         WHEN 'plano_conduta' THEN 'Descreva a conduta adotada'
         ELSE NULL
       END
FROM target_template tt
CROSS JOIN required_fields rf
WHERE NOT EXISTS (
  SELECT 1
  FROM public.medical_record_fields mf
  WHERE mf.template_id = tt.template_id
    AND mf.tab_key = rf.tab_key
    AND mf.field_key = rf.field_key
);

-- Provision the minimum anamnesis templates for Clínica Geral
WITH geral_specialties AS (
  SELECT id AS specialty_id, clinic_id
  FROM public.specialties
  WHERE slug = 'geral'
), desired_templates AS (
  SELECT * FROM (VALUES
    ('Anamnese Padrão - Clínica Geral (YesClin)', true,
      jsonb_build_array(
        jsonb_build_object('id','section_queixa','title','Queixa Principal','fields',jsonb_build_array(jsonb_build_object('id','f_queixa_principal','type','textarea','label','Queixa principal','required',true))),
        jsonb_build_object('id','section_hda','title','História Clínica','fields',jsonb_build_array(jsonb_build_object('id','f_historia_atual','type','textarea','label','História da doença atual'))),
        jsonb_build_object('id','section_antecedentes','title','Antecedentes','fields',jsonb_build_array(jsonb_build_object('id','f_alergias','type','textarea','label','Alergias'),jsonb_build_object('id','f_medicacoes','type','textarea','label','Medicações em uso')))
      )
    ),
    ('Anamnese Geral Padrão', false,
      jsonb_build_array(
        jsonb_build_object('id','section_identificacao_clinica','title','Resumo Clínico','fields',jsonb_build_array(jsonb_build_object('id','f_queixa','type','textarea','label','Queixa principal'))),
        jsonb_build_object('id','section_habitos','title','Hábitos de Vida','fields',jsonb_build_array(jsonb_build_object('id','f_habitos_vida','type','textarea','label','Hábitos de vida')))
      )
    )
  ) AS t(name, is_default, structure)
), inserted_templates AS (
  INSERT INTO public.anamnesis_templates (
    clinic_id, specialty_id, name, description, version, fields, campos, is_active, is_system, is_default, archived, icon, usage_count, template_type, specialty
  )
  SELECT gs.clinic_id,
         gs.specialty_id,
         dt.name,
         'Modelo oficial da Clínica Geral provisionado automaticamente.',
         1,
         dt.structure,
         dt.structure,
         true,
         true,
         dt.is_default,
         false,
         'Stethoscope',
         0,
         'anamnese_personalizada',
         'geral'
  FROM geral_specialties gs
  CROSS JOIN desired_templates dt
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.anamnesis_templates at
    WHERE at.clinic_id = gs.clinic_id
      AND at.specialty_id = gs.specialty_id
      AND at.name = dt.name
  )
  RETURNING id, name, clinic_id, specialty_id, fields
), all_target_templates AS (
  SELECT at.id, at.name, at.fields
  FROM public.anamnesis_templates at
  JOIN public.specialties s ON s.id = at.specialty_id
  WHERE s.slug = 'geral'
    AND at.name IN ('Anamnese Padrão - Clínica Geral (YesClin)', 'Anamnese Geral Padrão')
), inserted_versions AS (
  INSERT INTO public.anamnesis_template_versions (template_id, version, version_number, fields, structure)
  SELECT att.id, 1, 1, att.fields, att.fields
  FROM all_target_templates att
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.anamnesis_template_versions v
    WHERE v.template_id = att.id
      AND COALESCE(v.version_number, v.version) = 1
  )
  RETURNING id, template_id
)
UPDATE public.anamnesis_templates at
SET current_version_id = v.id,
    is_default = CASE WHEN at.name = 'Anamnese Padrão - Clínica Geral (YesClin)' THEN true ELSE at.is_default END,
    archived = false,
    is_active = true
FROM (
  SELECT DISTINCT ON (template_id) id, template_id
  FROM public.anamnesis_template_versions
  WHERE template_id IN (
    SELECT at2.id
    FROM public.anamnesis_templates at2
    JOIN public.specialties s2 ON s2.id = at2.specialty_id
    WHERE s2.slug = 'geral'
      AND at2.name IN ('Anamnese Padrão - Clínica Geral (YesClin)', 'Anamnese Geral Padrão')
  )
  ORDER BY template_id, COALESCE(version_number, version) DESC, created_at DESC
) v
WHERE at.id = v.template_id;

-- Fix provisioning origin for Clínica Geral going forward
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
      SELECT 1
      FROM public.medical_record_tabs mrt
      WHERE mrt.clinic_id = _clinic_id
        AND mrt.specialty_id = _specialty_id
        AND (mrt.key = rt.key OR mrt.slug = rt.slug)
    );
    GET DIAGNOSTICS _tabs_created = ROW_COUNT;

    INSERT INTO public.medical_record_templates (
      clinic_id, specialty_id, name, description, type, scope, is_default, is_active, is_system, config
    )
    SELECT _clinic_id, _specialty_id, 'Prontuário Padrão - Clínica Geral',
           'Estrutura padrão da Clínica Geral com módulos e layout oficial.',
           'custom_form', 'specialty', true, true, true,
           jsonb_build_object(
             'specialty_slug', 'geral',
             'enabled_blocks', jsonb_build_array('resumo','anamnese','evolucao','exame_fisico','diagnostico','conduta','documentos_clinicos','prescricoes','exames','alertas','timeline'),
             'layout', 'general_clinic_default'
           )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.medical_record_templates t
      WHERE t.clinic_id = _clinic_id AND t.specialty_id = _specialty_id AND t.name = 'Prontuário Padrão - Clínica Geral'
    );

    IF EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = 'Anamnese Padrão - Clínica Geral (YesClin)'
    ) THEN
      _templates_created := 0;
    ELSE
      INSERT INTO public.anamnesis_templates (
        clinic_id, specialty_id, name, description, version, fields, campos, is_active, is_system, is_default, archived, icon, usage_count, template_type, specialty
      ) VALUES (
        _clinic_id, _specialty_id, 'Anamnese Padrão - Clínica Geral (YesClin)',
        'Modelo oficial da Clínica Geral provisionado automaticamente.',
        1,
        jsonb_build_array(jsonb_build_object('id','section_queixa','title','Queixa Principal','fields',jsonb_build_array(jsonb_build_object('id','f_queixa_principal','type','textarea','label','Queixa principal','required',true)))),
        jsonb_build_array(jsonb_build_object('id','section_queixa','title','Queixa Principal','fields',jsonb_build_array(jsonb_build_object('id','f_queixa_principal','type','textarea','label','Queixa principal','required',true)))),
        true, true, true, false, 'Stethoscope', 0, 'anamnese_personalizada', 'geral'
      );
      _templates_created := 1;
    END IF;
  END IF;

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