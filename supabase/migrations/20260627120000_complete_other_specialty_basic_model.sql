-- Completa a especialidade oficial coringa other_specialty como modelo básico seguro.

CREATE OR REPLACE FUNCTION public.provision_other_specialty_anamnesis_templates(
  _clinic_id uuid,
  _specialty_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _template_id uuid;
  _version_id uuid;
  _structure jsonb;
  _created integer := 0;
BEGIN
  _structure := jsonb_build_array(
    jsonb_build_object('id','identificacao_atendimento','title','Identificação do atendimento','fields',jsonb_build_array(
      jsonb_build_object('id','tipo_atendimento','type','text','label','Tipo de atendimento','required',false),
      jsonb_build_object('id','especialidade_exibida','type','text','label','Especialidade exibida','required',false),
      jsonb_build_object('id','motivo_atendimento','type','textarea','label','Queixa principal / motivo do atendimento','required',true)
    )),
    jsonb_build_object('id','anamnese_basica','title','Anamnese básica','fields',jsonb_build_array(
      jsonb_build_object('id','queixa_principal','type','textarea','label','Queixa principal','required',true),
      jsonb_build_object('id','historia_problema_atual','type','textarea','label','Histórico do problema atual','required',false),
      jsonb_build_object('id','historico_saude_relevante','type','textarea','label','Histórico de saúde relevante','required',false),
      jsonb_build_object('id','medicamentos_em_uso','type','textarea','label','Medicamentos em uso','required',false),
      jsonb_build_object('id','alergias','type','textarea','label','Alergias','required',false),
      jsonb_build_object('id','cirurgias_procedimentos_anteriores','type','textarea','label','Cirurgias/procedimentos anteriores','required',false),
      jsonb_build_object('id','habitos_relevantes','type','textarea','label','Hábitos relevantes','required',false),
      jsonb_build_object('id','observacoes_gerais','type','textarea','label','Observações gerais','required',false)
    )),
    jsonb_build_object('id','avaliacao','title','Avaliação','fields',jsonb_build_array(
      jsonb_build_object('id','avaliacao_geral','type','textarea','label','Avaliação geral do profissional','required',false),
      jsonb_build_object('id','achados_observacoes','type','textarea','label','Sinais, achados ou observações importantes','required',false),
      jsonb_build_object('id','impressao_profissional','type','textarea','label','Hipótese/Impressão profissional','required',false),
      jsonb_build_object('id','restricoes_cuidados','type','textarea','label','Restrições ou cuidados','required',false)
    )),
    jsonb_build_object('id','plano_conduta','title','Plano de atendimento / conduta','fields',jsonb_build_array(
      jsonb_build_object('id','conduta_realizada','type','textarea','label','Conduta realizada','required',false),
      jsonb_build_object('id','orientacoes_paciente','type','textarea','label','Orientações ao paciente','required',false),
      jsonb_build_object('id','plano_acompanhamento','type','textarea','label','Plano de acompanhamento','required',false),
      jsonb_build_object('id','frequencia_sugerida','type','text','label','Frequência sugerida','required',false),
      jsonb_build_object('id','retorno_recomendado','type','text','label','Retorno recomendado','required',false),
      jsonb_build_object('id','encaminhamentos','type','textarea','label','Encaminhamentos, se houver','required',false)
    )),
    jsonb_build_object('id','evolucao','title','Evolução','fields',jsonb_build_array(
      jsonb_build_object('id','evolucao_atendimento','type','textarea','label','Evolução do atendimento','required',false),
      jsonb_build_object('id','resposta_paciente','type','textarea','label','Resposta do paciente','required',false),
      jsonb_build_object('id','intercorrencias','type','textarea','label','Intercorrências','required',false),
      jsonb_build_object('id','proximos_passos','type','textarea','label','Próximos passos','required',false)
    ))
  );

  SELECT id INTO _template_id
  FROM public.anamnesis_templates
  WHERE clinic_id = _clinic_id
    AND specialty_id = _specialty_id
    AND template_key = 'other_specialty_basic'
  LIMIT 1;

  IF _template_id IS NULL THEN
    INSERT INTO public.anamnesis_templates (
      clinic_id, specialty_id, name, description, version, fields, campos,
      is_active, is_system, is_default, archived, icon, usage_count,
      template_type, specialty, template_key, system_locked
    ) VALUES (
      _clinic_id, _specialty_id, 'Anamnese Básica - Atendimento Geral',
      'Modelo básico para Outra Especialidade / Atendimento Geral.',
      1, _structure, _structure,
      true, true, true, false, 'ClipboardList', 0,
      'anamnese_basica', 'other_specialty', 'other_specialty_basic', false
    ) RETURNING id INTO _template_id;
    _created := 1;
  ELSE
    UPDATE public.anamnesis_templates
       SET is_active = true,
           is_default = true,
           archived = false,
           fields = COALESCE(NULLIF(fields, '[]'::jsonb), _structure),
           campos = COALESCE(NULLIF(campos, '[]'::jsonb), _structure)
     WHERE id = _template_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.anamnesis_template_versions WHERE template_id = _template_id) THEN
    INSERT INTO public.anamnesis_template_versions (template_id, version, version_number, structure, fields, created_by)
    VALUES (_template_id, 1, 1, _structure, _structure, NULL)
    RETURNING id INTO _version_id;

    UPDATE public.anamnesis_templates
       SET current_version_id = _version_id
     WHERE id = _template_id;
  ELSIF EXISTS (SELECT 1 FROM public.anamnesis_templates WHERE id = _template_id AND current_version_id IS NULL) THEN
    SELECT id INTO _version_id
    FROM public.anamnesis_template_versions
    WHERE template_id = _template_id
    ORDER BY version DESC, created_at DESC
    LIMIT 1;

    UPDATE public.anamnesis_templates
       SET current_version_id = _version_id
     WHERE id = _template_id;
  END IF;

  RETURN _created;
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_other_specialty_defaults(
  _clinic_id uuid,
  _specialty_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _type record;
  _procedure record;
  _module_key text;
BEGIN
  PERFORM public.provision_other_specialty_anamnesis_templates(_clinic_id, _specialty_id);

  FOR _type IN SELECT * FROM (VALUES
    ('consulta-atendimento-inicial','Consulta / Atendimento Inicial',60,'#2563eb',1),
    ('retorno','Retorno',30,'#16a34a',2),
    ('sessao','Sessão',50,'#7c3aed',3),
    ('procedimento','Procedimento',60,'#ea580c',4),
    ('avaliacao','Avaliação',60,'#0891b2',5),
    ('acompanhamento','Acompanhamento',45,'#64748b',6)
  ) AS t(slug, name, duration_minutes, color, display_order)
  LOOP
    INSERT INTO public.appointment_types (clinic_id, slug, name, duration_minutes, color, display_order, is_active)
    VALUES (_clinic_id, _type.slug, _type.name, _type.duration_minutes, _type.color, _type.display_order, true)
    ON CONFLICT (clinic_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = true,
      updated_at = now();
  END LOOP;

  FOR _procedure IN SELECT * FROM (VALUES
    ('Atendimento geral',60),
    ('Avaliação inicial',60),
    ('Sessão de acompanhamento',50),
    ('Procedimento geral',60),
    ('Retorno',30)
  ) AS p(name, duration_minutes)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.procedures
      WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND lower(btrim(name)) = lower(btrim(_procedure.name))
    ) THEN
      INSERT INTO public.procedures (clinic_id, specialty_id, specialty, name, duration_minutes, price, is_active)
      VALUES (_clinic_id, _specialty_id, 'other_specialty', _procedure.name, _procedure.duration_minutes, NULL, true);
    END IF;
  END LOOP;

  INSERT INTO public.consent_terms (clinic_id, title, content, term_type, version, is_active)
  SELECT _clinic_id,
         'Termo de Consentimento Básico',
         'Declaro que recebi informações sobre o atendimento proposto, seus objetivos, possíveis limitações, cuidados e alternativas, autorizando a realização do atendimento conforme orientação profissional.',
         'basic_consent',
         1,
         true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.consent_terms
    WHERE clinic_id = _clinic_id AND term_type = 'basic_consent' AND title = 'Termo de Consentimento Básico'
  );

  FOREACH _module_key IN ARRAY ARRAY[
    'anamnese','evolucao','conduta','procedures_module','documents','files','advanced_uploads','alertas'
  ] LOOP
    INSERT INTO public.clinic_specialty_modules (clinic_id, specialty_id, module_key, is_enabled)
    VALUES (_clinic_id, _specialty_id, _module_key, true)
    ON CONFLICT (clinic_id, specialty_id, module_key) DO UPDATE SET
      is_enabled = true,
      updated_at = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id UUID, _specialty_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _specialty_id UUID;
  _specialty_name TEXT;
  _specialty_desc TEXT;
  _tab RECORD;
  _tabs JSONB;
BEGIN
  CASE _specialty_slug
    WHEN 'geral' THEN _specialty_name := 'Clínica Geral'; _specialty_desc := 'Atendimento médico generalista';
    WHEN 'psicologia' THEN _specialty_name := 'Psicologia'; _specialty_desc := 'Saúde mental e terapia';
    WHEN 'nutricao' THEN _specialty_name := 'Nutrição'; _specialty_desc := 'Alimentação e dieta';
    WHEN 'fisioterapia' THEN _specialty_name := 'Fisioterapia'; _specialty_desc := 'Reabilitação e movimento';
    WHEN 'pilates' THEN _specialty_name := 'Pilates'; _specialty_desc := 'Exercícios terapêuticos';
    WHEN 'estetica' THEN _specialty_name := 'Estética / Harmonização Facial'; _specialty_desc := 'Procedimentos estéticos';
    WHEN 'odontologia' THEN _specialty_name := 'Odontologia'; _specialty_desc := 'Saúde bucal com odontograma digital';
    WHEN 'dermatologia' THEN _specialty_name := 'Dermatologia'; _specialty_desc := 'Cuidados com a pele';
    WHEN 'pediatria' THEN _specialty_name := 'Pediatria'; _specialty_desc := 'Atendimento infantil';
    WHEN 'other_specialty' THEN _specialty_name := 'Outra Especialidade / Atendimento Geral'; _specialty_desc := 'Modelo básico para especialidades ainda não listadas';
    ELSE
      RAISE EXCEPTION 'Unknown official specialty slug: "%"', _specialty_slug;
  END CASE;

  SELECT id INTO _specialty_id
  FROM public.specialties
  WHERE slug = _specialty_slug AND clinic_id = _clinic_id
  LIMIT 1;

  IF _specialty_id IS NULL THEN
    INSERT INTO public.specialties (name, slug, description, clinic_id, specialty_type, is_active)
    VALUES (_specialty_name, _specialty_slug, _specialty_desc, _clinic_id, 'padrao', true)
    ON CONFLICT (clinic_id, slug) DO UPDATE SET is_active = true
    RETURNING id INTO _specialty_id;
  ELSE
    UPDATE public.specialties SET is_active = true WHERE id = _specialty_id;
  END IF;

  CASE _specialty_slug
    WHEN 'psicologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"instrumentos_testes","slug":"instrumentos_testes","name":"Instrumentos / Testes","icon":"TestTube","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"plano_terapeutico","slug":"plano_terapeutico","name":"Plano Terapêutico","icon":"Target","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_psicologia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'nutricao' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Nutricional","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_antropometrica","slug":"avaliacao_antropometrica","name":"Avaliação Antropométrica","icon":"Ruler","display_order":3},
        {"key":"plano_alimentar","slug":"plano_alimentar","name":"Plano Alimentar","icon":"UtensilsCrossed","display_order":4},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_nutricao_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'fisioterapia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_funcional","slug":"avaliacao_funcional","name":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"plano_terapeutico","slug":"plano_terapeutico","name":"Plano Terapêutico","icon":"Target","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_fisioterapia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'pilates' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_funcional","slug":"avaliacao_funcional","name":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"key":"avaliacao_dor","slug":"avaliacao_dor","name":"Avaliação de Dor","icon":"Heart","display_order":4},
        {"key":"plano_exercicios","slug":"plano_exercicios","name":"Plano de Exercícios","icon":"Dumbbell","display_order":5},
        {"key":"sessoes","slug":"sessoes","name":"Sessões","icon":"Calendar","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":8},
        {"key":"alertas","slug":"alertas","name":"Alertas / Restrições","icon":"AlertTriangle","display_order":9},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":10}
      ]';
      PERFORM provision_pilates_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'geral', 'other_specialty' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Exame Físico","icon":"Stethoscope","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"diagnostico","slug":"diagnostico","name":"Hipóteses Diagnósticas","icon":"Search","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano / Conduta","icon":"Target","display_order":6},
        {"key":"documentos_clinicos","slug":"documentos_clinicos","name":"Documentos Clínicos","icon":"FileCheck","display_order":7},
        {"key":"prescricoes","slug":"prescricoes","name":"Prescrições","icon":"Pill","display_order":8},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames","icon":"FolderOpen","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';

    WHEN 'estetica' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Estética","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Avaliação Estética","icon":"Scan","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"procedimentos_realizados","slug":"procedimentos_realizados","name":"Procedimentos","icon":"Syringe","display_order":5},
        {"key":"produtos_utilizados","slug":"produtos_utilizados","name":"Produtos","icon":"Package","display_order":6},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Antes / Depois","icon":"Camera","display_order":7},
        {"key":"termos_consentimentos","slug":"termos_consentimentos","name":"Termos","icon":"Shield","display_order":8},
        {"key":"facial_map","slug":"facial_map","name":"Mapa Facial","icon":"MapPin","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';
      PERFORM provision_estetica_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'odontologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Odontológica","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Avaliação Clínica","icon":"Stethoscope","display_order":3},
        {"key":"odontograma","slug":"odontograma","name":"Odontograma Digital","icon":"Smile","display_order":4},
        {"key":"diagnostico","slug":"diagnostico","name":"Diagnóstico","icon":"Search","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano de Tratamento","icon":"Target","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"procedimentos_realizados","slug":"procedimentos_realizados","name":"Procedimentos","icon":"Syringe","display_order":8},
        {"key":"produtos_utilizados","slug":"produtos_utilizados","name":"Materiais","icon":"Package","display_order":9},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":10},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Antes / Depois","icon":"Camera","display_order":11},
        {"key":"alertas","slug":"alertas","name":"Alertas","icon":"AlertTriangle","display_order":12},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":13}
      ]';

    WHEN 'dermatologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Dermatológica","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Exame Dermatológico","icon":"Scan","display_order":3},
        {"key":"diagnostico","slug":"diagnostico","name":"Diagnóstico","icon":"Search","display_order":4},
        {"key":"prescricoes","slug":"prescricoes","name":"Prescrições","icon":"Pill","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano / Conduta","icon":"Target","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":8},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Clínicas","icon":"Camera","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":11}
      ]';

    WHEN 'pediatria' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese_pediatrica","slug":"anamnese_pediatrica","name":"Anamnese Pediátrica","icon":"ClipboardList","display_order":2},
        {"key":"crescimento_desenvolvimento","slug":"crescimento_desenvolvimento","name":"Crescimento e Desenvolvimento","icon":"TrendingUp","display_order":3},
        {"key":"avaliacao_clinica_pediatrica","slug":"avaliacao_clinica_pediatrica","name":"Avaliação Clínica","icon":"Stethoscope","display_order":4},
        {"key":"diagnostico_pediatrico","slug":"diagnostico_pediatrico","name":"Diagnóstico","icon":"Search","display_order":5},
        {"key":"prescricoes_pediatricas","slug":"prescricoes_pediatricas","name":"Prescrições","icon":"Pill","display_order":6},
        {"key":"vacinacao","slug":"vacinacao","name":"Vacinação","icon":"Syringe","display_order":7},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":8},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Pediátricos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';

    ELSE
      RAISE NOTICE 'No specific provisioning for specialty "%"', _specialty_slug;
      RETURN;
  END CASE;

  IF _specialty_slug = 'other_specialty' THEN
    _tabs := '[
      {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
      {"key":"anamnese","slug":"anamnese","name":"Anamnese Básica","icon":"ClipboardList","display_order":2},
      {"key":"evolucoes","slug":"evolucoes","name":"Evolução","icon":"FileText","display_order":3},
      {"key":"conduta","slug":"conduta","name":"Plano / Conduta","icon":"Target","display_order":4},
      {"key":"procedimentos_realizados","slug":"procedimentos_realizados","name":"Procedimentos Realizados","icon":"Syringe","display_order":5},
      {"key":"documentos_clinicos","slug":"documentos_clinicos","name":"Documentos","icon":"FileCheck","display_order":6},
      {"key":"exames_documentos","slug":"exames_documentos","name":"Anexos","icon":"FolderOpen","display_order":7},
      {"key":"alertas","slug":"alertas","name":"Alertas","icon":"AlertTriangle","display_order":8},
      {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":9}
    ]';
    PERFORM public.provision_other_specialty_defaults(_clinic_id, _specialty_id);
  END IF;


  FOR _tab IN SELECT * FROM jsonb_array_elements(_tabs) AS t(val)
  LOOP
    INSERT INTO public.medical_record_tabs (
      clinic_id, specialty_id, key, slug, name, icon, display_order, is_active, is_system
    ) VALUES (
      _clinic_id, _specialty_id,
      _tab.val->>'key', _tab.val->>'slug', _tab.val->>'name',
      _tab.val->>'icon', (_tab.val->>'display_order')::int,
      true, true
    )
    ON CONFLICT (clinic_id, specialty_id, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      key = EXCLUDED.key,
      icon = EXCLUDED.icon,
      display_order = EXCLUDED.display_order,
      is_active = true;
  END LOOP;
END;
$$;