
-- 1. Create provision_nutricao_anamnesis_templates function
CREATE OR REPLACE FUNCTION public.provision_nutricao_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tpl RECORD;
  _template_id UUID;
  _version_id UUID;
  _count INTEGER := 0;
  _templates JSONB;
BEGIN
  _templates := '[
    {
      "name": "Anamnese Nutricional Adulto",
      "is_default": true,
      "icon": "Apple",
      "structure": [
        {"id":"objetivo_consulta_adulto","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_adulto_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"queixa_principal_adulto","type":"textarea","label":"Queixa principal","required":false}
        ]},
        {"id":"historico_saude_adulto","type":"section","title":"Histórico de Saúde","fields":[
          {"id":"historico_clinico_adulto","type":"textarea","label":"Histórico clínico","required":false},
          {"id":"comorbidades_adulto","type":"textarea","label":"Comorbidades","required":false},
          {"id":"medicacoes_adulto","type":"textarea","label":"Medicações em uso","required":false},
          {"id":"historico_familiar_adulto","type":"textarea","label":"Histórico familiar relevante","required":false}
        ]},
        {"id":"rotina_alimentar_adulto","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"numero_refeicoes_adulto","type":"text","label":"Número de refeições por dia","required":false},
          {"id":"recordatorio_alimentar_adulto","type":"textarea","label":"Recordatório alimentar","required":false},
          {"id":"preferencias_alimentares_adulto","type":"textarea","label":"Preferências alimentares","required":false},
          {"id":"restricoes_alimentares_adulto","type":"textarea","label":"Restrições alimentares","required":false}
        ]},
        {"id":"habitos_vida_adulto","type":"section","title":"Hábitos de Vida","fields":[
          {"id":"sono_adulto","type":"textarea","label":"Sono","required":false},
          {"id":"hidratacao_adulto","type":"textarea","label":"Hidratação","required":false},
          {"id":"atividade_fisica_adulto","type":"textarea","label":"Atividade física","required":false},
          {"id":"funcao_intestinal_adulto","type":"textarea","label":"Função intestinal","required":false}
        ]},
        {"id":"objetivos_conduta_adulto","type":"section","title":"Objetivos e Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_adulto","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"diagnostico_inicial_adulto","type":"textarea","label":"Impressão / diagnóstico inicial","required":false},
          {"id":"orientacoes_iniciais_adulto","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Nutricional Infantil",
      "is_default": false,
      "icon": "Baby",
      "structure": [
        {"id":"objetivo_consulta_infantil","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_infantil_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"responsavel_relato_infantil","type":"text","label":"Responsável pelo relato","required":false}
        ]},
        {"id":"historico_infantil","type":"section","title":"Histórico Infantil","fields":[
          {"id":"historico_gestacional_infantil","type":"textarea","label":"Histórico gestacional e parto","required":false},
          {"id":"amamentacao_infantil","type":"textarea","label":"Amamentação e introdução alimentar","required":false},
          {"id":"historico_clinico_infantil","type":"textarea","label":"Histórico clínico","required":false}
        ]},
        {"id":"rotina_alimentar_infantil","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"aceitacao_alimentar_infantil","type":"textarea","label":"Aceitação alimentar","required":false},
          {"id":"preferencias_infantil","type":"textarea","label":"Preferências alimentares","required":false},
          {"id":"recusa_alimentar_infantil","type":"textarea","label":"Recusa / seletividade alimentar","required":false},
          {"id":"rotina_escolar_infantil","type":"textarea","label":"Rotina alimentar escolar","required":false}
        ]},
        {"id":"habitos_sinais_infantil","type":"section","title":"Hábitos e Sinais Clínicos","fields":[
          {"id":"sono_infantil","type":"textarea","label":"Sono","required":false},
          {"id":"funcao_intestinal_infantil","type":"textarea","label":"Função intestinal","required":false},
          {"id":"hidratacao_infantil","type":"textarea","label":"Hidratação","required":false}
        ]},
        {"id":"conduta_infantil","type":"section","title":"Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_infantil","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"orientacoes_iniciais_infantil","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Nutricional Gestante",
      "is_default": false,
      "icon": "Heart",
      "structure": [
        {"id":"objetivo_consulta_gestante","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_gestante_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"idade_gestacional","type":"text","label":"Idade gestacional","required":false}
        ]},
        {"id":"historico_gestacao","type":"section","title":"Histórico da Gestação","fields":[
          {"id":"historico_gestacional","type":"textarea","label":"Histórico da gestação","required":false},
          {"id":"intercorrencias_gestacao","type":"textarea","label":"Intercorrências","required":false},
          {"id":"suplementacao_gestante","type":"textarea","label":"Suplementação em uso","required":false}
        ]},
        {"id":"rotina_alimentar_gestante","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"recordatorio_gestante","type":"textarea","label":"Recordatório alimentar","required":false},
          {"id":"preferencias_gestante","type":"textarea","label":"Preferências alimentares","required":false},
          {"id":"aversoes_gestante","type":"textarea","label":"Aversões / intolerâncias","required":false}
        ]},
        {"id":"sintomas_habitos_gestante","type":"section","title":"Sintomas e Hábitos","fields":[
          {"id":"nauseas_gestante","type":"textarea","label":"Náuseas / vômitos","required":false},
          {"id":"funcao_intestinal_gestante","type":"textarea","label":"Função intestinal","required":false},
          {"id":"hidratacao_gestante","type":"textarea","label":"Hidratação","required":false}
        ]},
        {"id":"conduta_gestante","type":"section","title":"Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_gestante","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"orientacoes_iniciais_gestante","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Nutricional Esportiva",
      "is_default": false,
      "icon": "Dumbbell",
      "structure": [
        {"id":"objetivo_consulta_esportiva","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_esportiva_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"modalidade_esportiva","type":"text","label":"Modalidade esportiva","required":false}
        ]},
        {"id":"rotina_treino_esportiva","type":"section","title":"Rotina de Treino","fields":[
          {"id":"frequencia_treino","type":"text","label":"Frequência de treino","required":false},
          {"id":"duracao_treino","type":"text","label":"Duração do treino","required":false},
          {"id":"objetivo_esportivo","type":"textarea","label":"Objetivo esportivo","required":false}
        ]},
        {"id":"rotina_alimentar_esportiva","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"recordatorio_esportivo","type":"textarea","label":"Recordatório alimentar","required":false},
          {"id":"alimentacao_pre_treino","type":"textarea","label":"Alimentação pré-treino","required":false},
          {"id":"alimentacao_pos_treino","type":"textarea","label":"Alimentação pós-treino","required":false}
        ]},
        {"id":"suplementacao_esportiva","type":"section","title":"Suplementação e Hábitos","fields":[
          {"id":"suplementacao_esportiva_texto","type":"textarea","label":"Suplementação","required":false},
          {"id":"hidratacao_esportiva","type":"textarea","label":"Hidratação","required":false},
          {"id":"sono_esportivo","type":"textarea","label":"Sono e recuperação","required":false}
        ]},
        {"id":"conduta_esportiva","type":"section","title":"Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_esportivo","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"orientacoes_iniciais_esportivo","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Nutricional para Emagrecimento",
      "is_default": false,
      "icon": "TrendingDown",
      "structure": [
        {"id":"objetivo_consulta_emagrecimento","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_emagrecimento_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"historico_emagrecimento","type":"textarea","label":"Histórico de tentativas anteriores","required":false}
        ]},
        {"id":"rotina_alimentar_emagrecimento","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"recordatorio_emagrecimento","type":"textarea","label":"Recordatório alimentar","required":false},
          {"id":"episodios_compulsao","type":"textarea","label":"Compulsão / episódios alimentares","required":false},
          {"id":"fome_saciedade","type":"textarea","label":"Percepção de fome e saciedade","required":false}
        ]},
        {"id":"habitos_emagrecimento","type":"section","title":"Hábitos e Rotina","fields":[
          {"id":"atividade_fisica_emagrecimento","type":"textarea","label":"Atividade física","required":false},
          {"id":"sono_emagrecimento","type":"textarea","label":"Sono","required":false},
          {"id":"rotina_trabalho_emagrecimento","type":"textarea","label":"Rotina de trabalho e horários","required":false}
        ]},
        {"id":"aspectos_comportamentais_emagrecimento","type":"section","title":"Aspectos Comportamentais","fields":[
          {"id":"ansiedade_alimentar","type":"textarea","label":"Ansiedade relacionada à alimentação","required":false},
          {"id":"gatilhos_alimentares","type":"textarea","label":"Gatilhos alimentares","required":false},
          {"id":"motivacao_tratamento","type":"textarea","label":"Motivação para o tratamento","required":false}
        ]},
        {"id":"conduta_emagrecimento","type":"section","title":"Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_emagrecimento","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"orientacoes_iniciais_emagrecimento","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Nutricional Clínica / Patologias",
      "is_default": false,
      "icon": "Stethoscope",
      "structure": [
        {"id":"objetivo_consulta_clinica","type":"section","title":"Objetivo da Consulta","fields":[
          {"id":"objetivo_consulta_clinica_texto","type":"textarea","label":"Objetivo da consulta","required":true},
          {"id":"patologia_principal","type":"textarea","label":"Patologia principal","required":false}
        ]},
        {"id":"historico_clinico_patologias","type":"section","title":"Histórico Clínico","fields":[
          {"id":"historico_clinico_patologias_texto","type":"textarea","label":"Histórico clínico detalhado","required":false},
          {"id":"comorbidades_patologias","type":"textarea","label":"Comorbidades","required":false},
          {"id":"medicacoes_patologias","type":"textarea","label":"Medicações em uso","required":false}
        ]},
        {"id":"rotina_alimentar_patologias","type":"section","title":"Rotina Alimentar","fields":[
          {"id":"recordatorio_patologias","type":"textarea","label":"Recordatório alimentar","required":false},
          {"id":"restricoes_patologias","type":"textarea","label":"Restrições / intolerâncias","required":false},
          {"id":"aceitacao_alimentar_patologias","type":"textarea","label":"Aceitação alimentar","required":false}
        ]},
        {"id":"sinais_sintomas_patologias","type":"section","title":"Sinais e Sintomas","fields":[
          {"id":"sintomas_digestivos_patologias","type":"textarea","label":"Sintomas digestivos","required":false},
          {"id":"funcao_intestinal_patologias","type":"textarea","label":"Função intestinal","required":false},
          {"id":"hidratacao_patologias","type":"textarea","label":"Hidratação","required":false}
        ]},
        {"id":"conduta_patologias","type":"section","title":"Conduta Inicial","fields":[
          {"id":"objetivo_nutricional_patologias","type":"textarea","label":"Objetivo nutricional","required":false},
          {"id":"diagnostico_nutricional_inicial_patologias","type":"textarea","label":"Diagnóstico nutricional inicial","required":false},
          {"id":"orientacoes_iniciais_patologias","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    }
  ]';

  FOR _tpl IN SELECT * FROM jsonb_array_elements(_templates) AS t(val)
  LOOP
    SELECT id INTO _template_id
    FROM public.anamnesis_templates
    WHERE clinic_id = _clinic_id
      AND specialty_id = _specialty_id
      AND name = _tpl.val->>'name'
    LIMIT 1;

    IF _template_id IS NULL THEN
      INSERT INTO public.anamnesis_templates (
        clinic_id, specialty_id, name, description, version,
        fields, campos, is_active, is_system, is_default, archived,
        icon, usage_count, template_type, specialty
      ) VALUES (
        _clinic_id, _specialty_id, _tpl.val->>'name',
        'Modelo oficial de Nutrição - ' || (_tpl.val->>'name'),
        1,
        _tpl.val->'structure', _tpl.val->'structure',
        true, true, (_tpl.val->>'is_default')::boolean, false,
        COALESCE(_tpl.val->>'icon', 'Apple'), 0,
        'anamnese', 'nutricao'
      )
      RETURNING id INTO _template_id;

      INSERT INTO public.anamnesis_template_versions (
        template_id, version, version_number, structure, fields, created_by
      ) VALUES (
        _template_id, 1, 1, _tpl.val->'structure', _tpl.val->'structure', NULL
      )
      RETURNING id INTO _version_id;

      UPDATE public.anamnesis_templates
      SET current_version_id = _version_id
      WHERE id = _template_id;

      _count := _count + 1;
    END IF;
  END LOOP;

  RETURN _count;
END;
$function$;

-- 2. Update provision_specialty to call nutricao provisioning
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
  _extra_templates INTEGER := 0;
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

  ELSIF _specialty_slug = 'psicologia' THEN
    WITH required_tabs AS (
      SELECT * FROM (VALUES
        ('Visão Geral', 'resumo', 'resumo', 'LayoutDashboard', 1),
        ('Anamnese', 'anamnese', 'anamnese', 'FileText', 2),
        ('Evoluções', 'evolucao', 'evolucao', 'Activity', 3),
        ('Hipóteses Diagnósticas', 'diagnostico', 'diagnostico', 'Stethoscope', 4),
        ('Plano / Conduta', 'conduta', 'conduta', 'Target', 5),
        ('Relatórios / Documentos', 'documentos_clinicos', 'documentos_clinicos', 'ScrollText', 6),
        ('Instrumentos / Testes', 'instrumentos', 'instrumentos', 'ClipboardList', 7),
        ('Linha do Tempo', 'timeline', 'timeline', 'GitBranch', 8),
        ('Histórico', 'historico', 'historico', 'History', 9),
        ('Termos / Consentimentos', 'termos_consentimentos', 'termos_consentimentos', 'FileCheck', 10),
        ('Alertas', 'alertas', 'alertas', 'AlertTriangle', 11)
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

  ELSIF _specialty_slug = 'nutricao' THEN
    WITH required_tabs AS (
      SELECT * FROM (VALUES
        ('Visão Geral', 'resumo', 'resumo', 'LayoutDashboard', 1),
        ('Anamnese', 'anamnese', 'anamnese', 'FileText', 2),
        ('Evoluções', 'evolucao', 'evolucao', 'Activity', 3),
        ('Avaliação Nutricional', 'avaliacao_nutricional', 'avaliacao_nutricional', 'Scale', 4),
        ('Plano Alimentar', 'plano_alimentar', 'plano_alimentar', 'UtensilsCrossed', 5),
        ('Documentos Clínicos', 'documentos_clinicos', 'documentos_clinicos', 'ScrollText', 6),
        ('Alertas', 'alertas', 'alertas', 'AlertTriangle', 7),
        ('Linha do Tempo', 'timeline', 'timeline', 'GitBranch', 8)
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

  -- Default anamnesis template
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
      true, true, CASE WHEN _specialty_slug NOT IN ('psicologia', 'nutricao') THEN true ELSE false END,
      false, _anamnese_icon, 0,
      'anamnese', _specialty_slug
    )
    RETURNING id, current_version_id INTO _template_id, _existing_current_version_id;

    _templates_created := 1;
  ELSE
    UPDATE public.anamnesis_templates
    SET description = COALESCE(description, 'Modelo oficial de ' || _specialty_name || ' provisionado automaticamente.'),
        version = COALESCE(version, 1),
        fields = CASE WHEN fields IS NULL OR fields = '[]'::jsonb THEN _anamnese_structure ELSE fields END,
        campos = CASE WHEN campos IS NULL OR campos = '[]'::jsonb THEN _anamnese_structure ELSE campos END,
        is_active = true, is_system = true,
        is_default = CASE WHEN _specialty_slug NOT IN ('psicologia', 'nutricao') THEN true ELSE is_default END,
        archived = false,
        icon = COALESCE(icon, _anamnese_icon),
        template_type = COALESCE(template_type, 'anamnese'),
        specialty = COALESCE(specialty, _specialty_slug),
        updated_at = now()
    WHERE id = _template_id;
  END IF;

  SELECT id INTO _version_id
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
    SELECT 1 FROM public.anamnesis_template_versions v
    WHERE v.id = _existing_current_version_id AND v.template_id = _template_id
  ) THEN
    UPDATE public.anamnesis_templates
    SET current_version_id = _version_id, updated_at = now()
    WHERE id = _template_id;
  END IF;

  -- Provision specialty-specific extra templates
  IF _specialty_slug = 'psicologia' THEN
    _extra_templates := public.provision_psicologia_anamnesis_templates(_clinic_id, _specialty_id);
    _templates_created := _templates_created + _extra_templates;
  ELSIF _specialty_slug = 'nutricao' THEN
    _extra_templates := public.provision_nutricao_anamnesis_templates(_clinic_id, _specialty_id);
    _templates_created := _templates_created + _extra_templates;
  END IF;

  INSERT INTO public.medical_record_templates (
    clinic_id, specialty_id, name, description, type, scope, is_default, is_active, is_system, config
  )
  SELECT _clinic_id, _specialty_id, 'Prontuário Padrão - ' || _specialty_name,
         'Estrutura padrão de ' || _specialty_name || ' com módulos e layout oficial.',
         'custom_form', 'specialty', true, true, true,
         jsonb_build_object('specialty_slug', _specialty_slug, 'layout', _specialty_slug || '_default')
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
