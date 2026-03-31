
DROP FUNCTION IF EXISTS public.provision_specialty(uuid, text);

CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id uuid, _specialty_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _specialty_id UUID;
  _tab RECORD;
  _tabs JSONB;
BEGIN
  SELECT id INTO _specialty_id
  FROM public.specialties
  WHERE slug = _specialty_slug
    AND clinic_id = _clinic_id
  LIMIT 1;

  IF _specialty_id IS NULL THEN
    RAISE EXCEPTION 'Specialty "%" not found for clinic %', _specialty_slug, _clinic_id;
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

    WHEN 'clinica-geral' THEN
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
$function$;
