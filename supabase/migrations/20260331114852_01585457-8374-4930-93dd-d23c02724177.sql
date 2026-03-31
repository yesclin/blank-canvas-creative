
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
        {"tab_key":"visao_geral","label":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"tab_key":"anamnese","label":"Anamnese","icon":"ClipboardList","display_order":2},
        {"tab_key":"instrumentos_testes","label":"Instrumentos / Testes","icon":"TestTube","display_order":3},
        {"tab_key":"evolucoes","label":"Evoluções","icon":"FileText","display_order":4},
        {"tab_key":"plano_terapeutico","label":"Plano Terapêutico","icon":"Target","display_order":5},
        {"tab_key":"exames_documentos","label":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"tab_key":"alertas","label":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"tab_key":"historico","label":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_psicologia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'nutricao' THEN
      _tabs := '[
        {"tab_key":"visao_geral","label":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"tab_key":"anamnese","label":"Anamnese Nutricional","icon":"ClipboardList","display_order":2},
        {"tab_key":"avaliacao_antropometrica","label":"Avaliação Antropométrica","icon":"Ruler","display_order":3},
        {"tab_key":"plano_alimentar","label":"Plano Alimentar","icon":"UtensilsCrossed","display_order":4},
        {"tab_key":"evolucoes","label":"Evoluções","icon":"FileText","display_order":5},
        {"tab_key":"exames_documentos","label":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"tab_key":"alertas","label":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"tab_key":"historico","label":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_nutricao_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'fisioterapia' THEN
      _tabs := '[
        {"tab_key":"visao_geral","label":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"tab_key":"anamnese","label":"Anamnese","icon":"ClipboardList","display_order":2},
        {"tab_key":"avaliacao_funcional","label":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"tab_key":"evolucoes","label":"Evoluções","icon":"FileText","display_order":4},
        {"tab_key":"plano_terapeutico","label":"Plano Terapêutico","icon":"Target","display_order":5},
        {"tab_key":"exames_documentos","label":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"tab_key":"alertas","label":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"tab_key":"historico","label":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_fisioterapia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'pilates' THEN
      _tabs := '[
        {"tab_key":"visao_geral","label":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"tab_key":"anamnese","label":"Anamnese","icon":"ClipboardList","display_order":2},
        {"tab_key":"avaliacao_funcional","label":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"tab_key":"avaliacao_postural","label":"Avaliação Postural","icon":"Accessibility","display_order":4},
        {"tab_key":"plano_exercicios","label":"Plano de Exercícios","icon":"Dumbbell","display_order":5},
        {"tab_key":"sessoes","label":"Sessões","icon":"Calendar","display_order":6},
        {"tab_key":"evolucoes","label":"Evoluções","icon":"FileText","display_order":7},
        {"tab_key":"exames_documentos","label":"Exames e Documentos","icon":"FolderOpen","display_order":8},
        {"tab_key":"alertas","label":"Alertas Clínicos","icon":"AlertTriangle","display_order":9},
        {"tab_key":"historico","label":"Histórico","icon":"Clock","display_order":10}
      ]';
      PERFORM provision_pilates_anamnesis_templates(_clinic_id, _specialty_id);

    ELSE
      RAISE NOTICE 'No specific provisioning for specialty "%"', _specialty_slug;
      RETURN;
  END CASE;

  FOR _tab IN SELECT * FROM jsonb_array_elements(_tabs) AS t(val)
  LOOP
    INSERT INTO public.medical_record_tabs (
      clinic_id, specialty_id, tab_key, label, icon, display_order, is_active, is_system
    ) VALUES (
      _clinic_id, _specialty_id,
      _tab.val->>'tab_key', _tab.val->>'label',
      _tab.val->>'icon', (_tab.val->>'display_order')::int,
      true, true
    )
    ON CONFLICT (clinic_id, specialty_id, tab_key)
    DO UPDATE SET
      label = EXCLUDED.label,
      icon = EXCLUDED.icon,
      display_order = EXCLUDED.display_order,
      is_active = true;
  END LOOP;
END;
$function$;
