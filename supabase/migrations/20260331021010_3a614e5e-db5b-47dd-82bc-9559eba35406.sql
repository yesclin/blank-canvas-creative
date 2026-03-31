
CREATE OR REPLACE FUNCTION public.provision_fisioterapia_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
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
      "name": "Anamnese Fisioterapêutica Geral",
      "is_default": true,
      "icon": "Activity",
      "structure": [
        {"id":"queixa_principal_geral","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_geral_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"objetivo_tratamento_geral","type":"textarea","label":"Objetivo do tratamento","required":false}
        ]},
        {"id":"historia_clinica_geral","type":"section","title":"História Clínica","fields":[
          {"id":"historia_doenca_atual_geral","type":"textarea","label":"História da doença atual","required":false},
          {"id":"inicio_sintomas_geral","type":"text","label":"Início dos sintomas","required":false},
          {"id":"tratamentos_previos_geral","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"diagnostico_medico_geral","type":"textarea","label":"Diagnóstico médico","required":false}
        ]},
        {"id":"avaliacao_funcional_geral","type":"section","title":"Avaliação Funcional Inicial","fields":[
          {"id":"limitacoes_funcionais_geral","type":"textarea","label":"Limitações funcionais","required":false},
          {"id":"regiao_tratamento_geral","type":"textarea","label":"Região em tratamento","required":false},
          {"id":"intensidade_dor_geral","type":"text","label":"Intensidade da dor","required":false},
          {"id":"fatores_piora_melhora_geral","type":"textarea","label":"Fatores de piora e melhora","required":false}
        ]},
        {"id":"habitos_contexto_geral","type":"section","title":"Hábitos e Contexto","fields":[
          {"id":"atividade_profissional_geral","type":"textarea","label":"Atividade profissional","required":false},
          {"id":"atividade_fisica_geral","type":"textarea","label":"Atividade física","required":false},
          {"id":"rotina_diaria_geral","type":"textarea","label":"Rotina diária","required":false}
        ]},
        {"id":"plano_inicial_geral","type":"section","title":"Plano Inicial","fields":[
          {"id":"diagnostico_funcional_geral","type":"textarea","label":"Diagnóstico funcional inicial","required":false},
          {"id":"plano_terapeutico_inicial_geral","type":"textarea","label":"Plano terapêutico inicial","required":false},
          {"id":"orientacoes_iniciais_geral","type":"textarea","label":"Orientações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Fisioterapêutica Ortopédica",
      "is_default": false,
      "icon": "Bone",
      "structure": [
        {"id":"queixa_principal_ortopedica","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_ortopedica_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"regiao_afetada_ortopedica","type":"text","label":"Região afetada","required":false}
        ]},
        {"id":"historia_ortopedica","type":"section","title":"História Ortopédica","fields":[
          {"id":"inicio_quadro_ortopedica","type":"text","label":"Início do quadro","required":false},
          {"id":"mecanismo_lesao_ortopedica","type":"textarea","label":"Mecanismo da lesão","required":false},
          {"id":"cirurgias_ortopedica","type":"textarea","label":"Cirurgias / procedimentos prévios","required":false},
          {"id":"exames_ortopedica","type":"textarea","label":"Exames realizados","required":false}
        ]},
        {"id":"avaliacao_dor_mobilidade_ortopedica","type":"section","title":"Avaliação de Dor e Mobilidade","fields":[
          {"id":"dor_ortopedica","type":"textarea","label":"Dor referida","required":false},
          {"id":"eva_ortopedica","type":"text","label":"Escala de dor (EVA)","required":false},
          {"id":"limitacao_movimento_ortopedica","type":"textarea","label":"Limitação de movimento","required":false},
          {"id":"incapacidade_funcional_ortopedica","type":"textarea","label":"Incapacidade funcional","required":false}
        ]},
        {"id":"plano_ortopedica","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"diagnostico_funcional_ortopedica","type":"textarea","label":"Diagnóstico funcional","required":false},
          {"id":"objetivos_terapeuticos_ortopedica","type":"textarea","label":"Objetivos terapêuticos","required":false},
          {"id":"conduta_inicial_ortopedica","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Fisioterapêutica Neurológica",
      "is_default": false,
      "icon": "Brain",
      "structure": [
        {"id":"queixa_principal_neurologica","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_neurologica_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"diagnostico_neurologico","type":"textarea","label":"Diagnóstico neurológico","required":false}
        ]},
        {"id":"historia_neurologica","type":"section","title":"História Clínica Neurológica","fields":[
          {"id":"inicio_quadro_neurologica","type":"text","label":"Início do quadro","required":false},
          {"id":"evolucao_quadro_neurologica","type":"textarea","label":"Evolução do quadro","required":false},
          {"id":"internacoes_neurologica","type":"textarea","label":"Internações / intercorrências","required":false}
        ]},
        {"id":"avaliacao_funcional_neurologica","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"marcha_neurologica","type":"textarea","label":"Marcha","required":false},
          {"id":"equilibrio_neurologica","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"forca_neurologica","type":"textarea","label":"Força muscular","required":false},
          {"id":"coordenacao_neurologica","type":"textarea","label":"Coordenação motora","required":false}
        ]},
        {"id":"atividades_vida_diaria_neurologica","type":"section","title":"Atividades de Vida Diária","fields":[
          {"id":"dependencia_funcional_neurologica","type":"textarea","label":"Dependência funcional","required":false},
          {"id":"transferencias_neurologica","type":"textarea","label":"Transferências e mobilidade","required":false},
          {"id":"rede_apoio_neurologica","type":"textarea","label":"Rede de apoio","required":false}
        ]},
        {"id":"plano_neurologica","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"diagnostico_funcional_neurologica","type":"textarea","label":"Diagnóstico funcional","required":false},
          {"id":"objetivos_terapeuticos_neurologica","type":"textarea","label":"Objetivos terapêuticos","required":false},
          {"id":"conduta_inicial_neurologica","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Fisioterapêutica Respiratória",
      "is_default": false,
      "icon": "Wind",
      "structure": [
        {"id":"queixa_principal_respiratoria","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_respiratoria_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"diagnostico_respiratorio","type":"textarea","label":"Diagnóstico respiratório","required":false}
        ]},
        {"id":"historia_respiratoria","type":"section","title":"História Respiratória","fields":[
          {"id":"inicio_quadro_respiratoria","type":"text","label":"Início do quadro","required":false},
          {"id":"historico_internacoes_respiratoria","type":"textarea","label":"Internações / crises","required":false},
          {"id":"uso_oxigenio_respiratoria","type":"textarea","label":"Uso de oxigênio / suporte ventilatório","required":false}
        ]},
        {"id":"sintomas_respiratoria","type":"section","title":"Sintomas e Capacidade Funcional","fields":[
          {"id":"dispneia_respiratoria","type":"textarea","label":"Dispneia","required":false},
          {"id":"tosse_expect_respiratoria","type":"textarea","label":"Tosse e expectoração","required":false},
          {"id":"tolerancia_esforco_respiratoria","type":"textarea","label":"Tolerância ao esforço","required":false}
        ]},
        {"id":"avaliacao_funcional_respiratoria","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"padrao_respiratorio","type":"textarea","label":"Padrão respiratório","required":false},
          {"id":"expansibilidade_toracica","type":"textarea","label":"Expansibilidade torácica","required":false},
          {"id":"observacoes_respiratoria","type":"textarea","label":"Observações clínicas","required":false}
        ]},
        {"id":"plano_respiratoria","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"diagnostico_funcional_respiratoria","type":"textarea","label":"Diagnóstico funcional","required":false},
          {"id":"objetivos_terapeuticos_respiratoria","type":"textarea","label":"Objetivos terapêuticos","required":false},
          {"id":"conduta_inicial_respiratoria","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Fisioterapêutica Geriátrica",
      "is_default": false,
      "icon": "HeartHandshake",
      "structure": [
        {"id":"queixa_principal_geriatrica","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_geriatrica_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"objetivo_tratamento_geriatrica","type":"textarea","label":"Objetivo do tratamento","required":false}
        ]},
        {"id":"historico_clinico_geriatrica","type":"section","title":"Histórico Clínico","fields":[
          {"id":"historico_clinico_geriatrica_texto","type":"textarea","label":"Histórico clínico","required":false},
          {"id":"comorbidades_geriatrica","type":"textarea","label":"Comorbidades","required":false},
          {"id":"medicacoes_geriatrica","type":"textarea","label":"Medicações em uso","required":false}
        ]},
        {"id":"avaliacao_funcional_geriatrica","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"marcha_geriatrica","type":"textarea","label":"Marcha","required":false},
          {"id":"equilibrio_geriatrica","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"risco_quedas_geriatrica","type":"textarea","label":"Risco de quedas","required":false},
          {"id":"independencia_funcional_geriatrica","type":"textarea","label":"Independência funcional","required":false}
        ]},
        {"id":"contexto_social_geriatrica","type":"section","title":"Contexto Social e Apoio","fields":[
          {"id":"apoio_familiar_geriatrica","type":"textarea","label":"Apoio familiar","required":false},
          {"id":"uso_dispositivos_geriatrica","type":"textarea","label":"Uso de dispositivos auxiliares","required":false},
          {"id":"ambiente_domiciliar_geriatrica","type":"textarea","label":"Ambiente domiciliar","required":false}
        ]},
        {"id":"plano_geriatrica","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"diagnostico_funcional_geriatrica","type":"textarea","label":"Diagnóstico funcional","required":false},
          {"id":"objetivos_terapeuticos_geriatrica","type":"textarea","label":"Objetivos terapêuticos","required":false},
          {"id":"conduta_inicial_geriatrica","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Fisioterapêutica Desportiva",
      "is_default": false,
      "icon": "Dumbbell",
      "structure": [
        {"id":"queixa_principal_desportiva","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal_desportiva_texto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"modalidade_desportiva","type":"text","label":"Modalidade esportiva","required":false}
        ]},
        {"id":"historico_lesao_desportiva","type":"section","title":"Histórico da Lesão","fields":[
          {"id":"inicio_quadro_desportiva","type":"text","label":"Início do quadro","required":false},
          {"id":"mecanismo_lesao_desportiva","type":"textarea","label":"Mecanismo da lesão","required":false},
          {"id":"historico_lesoes_previas_desportiva","type":"textarea","label":"Lesões prévias","required":false}
        ]},
        {"id":"treino_funcao_desportiva","type":"section","title":"Treino e Função","fields":[
          {"id":"frequencia_treino_desportiva","type":"text","label":"Frequência de treino","required":false},
          {"id":"limitacao_funcional_desportiva","type":"textarea","label":"Limitação funcional","required":false},
          {"id":"impacto_desempenho_desportiva","type":"textarea","label":"Impacto no desempenho","required":false}
        ]},
        {"id":"avaliacao_dor_movimento_desportiva","type":"section","title":"Avaliação de Dor e Movimento","fields":[
          {"id":"dor_desportiva","type":"textarea","label":"Dor referida","required":false},
          {"id":"eva_desportiva","type":"text","label":"Escala de dor (EVA)","required":false},
          {"id":"movimentos_limitados_desportiva","type":"textarea","label":"Movimentos limitados","required":false}
        ]},
        {"id":"plano_desportiva","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"diagnostico_funcional_desportiva","type":"textarea","label":"Diagnóstico funcional","required":false},
          {"id":"objetivos_terapeuticos_desportiva","type":"textarea","label":"Objetivos terapêuticos","required":false},
          {"id":"conduta_inicial_desportiva","type":"textarea","label":"Conduta inicial","required":false}
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
        'Modelo oficial de Fisioterapia - ' || (_tpl.val->>'name'),
        1,
        _tpl.val->'structure', _tpl.val->'structure',
        true, true, (_tpl.val->>'is_default')::boolean, false,
        COALESCE(_tpl.val->>'icon', 'Activity'), 0,
        'anamnese', 'fisioterapia'
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

-- Update provision_specialty to call fisioterapia provisioning
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

  ELSIF _specialty_slug = 'fisioterapia' THEN
    WITH required_tabs AS (
      SELECT * FROM (VALUES
        ('Visão Geral', 'resumo', 'resumo', 'LayoutDashboard', 1),
        ('Anamnese', 'anamnese', 'anamnese', 'FileText', 2),
        ('Evoluções', 'evolucao', 'evolucao', 'Activity', 3),
        ('Avaliação Funcional', 'avaliacao_funcional', 'avaliacao_funcional', 'ClipboardCheck', 4),
        ('Documentos Clínicos', 'documentos_clinicos', 'documentos_clinicos', 'ScrollText', 5),
        ('Alertas', 'alertas', 'alertas', 'AlertTriangle', 6),
        ('Linha do Tempo', 'timeline', 'timeline', 'GitBranch', 7)
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
      true, true, CASE WHEN _specialty_slug NOT IN ('psicologia', 'nutricao', 'fisioterapia') THEN true ELSE false END,
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
        is_default = CASE WHEN _specialty_slug NOT IN ('psicologia', 'nutricao', 'fisioterapia') THEN true ELSE is_default END,
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
  ELSIF _specialty_slug = 'fisioterapia' THEN
    _extra_templates := public.provision_fisioterapia_anamnesis_templates(_clinic_id, _specialty_id);
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
