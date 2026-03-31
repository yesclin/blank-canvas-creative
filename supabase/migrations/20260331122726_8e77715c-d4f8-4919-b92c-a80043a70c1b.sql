
CREATE OR REPLACE FUNCTION public.provision_pilates_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _tpl RECORD;
  _template_id UUID;
  _version_id UUID;
  _count INTEGER := 0;
  _templates JSONB;
BEGIN
  _templates := '[
    {
      "name": "Anamnese de Pilates Geral",
      "is_default": true,
      "icon": "Activity",
      "structure": [
        {"id":"objetivo_pilates_geral","type":"section","title":"Objetivo do Pilates","fields":[
          {"id":"objetivo_principal_pilates_geral","type":"textarea","label":"Objetivo principal","required":true},
          {"id":"queixa_principal_pilates_geral","type":"textarea","label":"Queixa principal","required":false}
        ]},
        {"id":"historico_saude_pilates_geral","type":"section","title":"Histórico de Saúde","fields":[
          {"id":"historico_clinico_pilates_geral","type":"textarea","label":"Histórico clínico","required":false},
          {"id":"cirurgias_lesoes_pilates_geral","type":"textarea","label":"Cirurgias / lesões prévias","required":false},
          {"id":"medicacoes_pilates_geral","type":"textarea","label":"Medicações em uso","required":false},
          {"id":"restricoes_medicas_pilates_geral","type":"textarea","label":"Restrições médicas","required":false}
        ]},
        {"id":"avaliacao_funcional_pilates_geral","type":"section","title":"Avaliação Funcional Inicial","fields":[
          {"id":"dor_regioes_pilates_geral","type":"textarea","label":"Dor / regiões afetadas","required":false},
          {"id":"mobilidade_pilates_geral","type":"textarea","label":"Mobilidade","required":false},
          {"id":"postura_pilates_geral","type":"textarea","label":"Postura","required":false},
          {"id":"equilibrio_pilates_geral","type":"textarea","label":"Equilíbrio","required":false}
        ]},
        {"id":"condicionamento_habitos_pilates_geral","type":"section","title":"Condicionamento e Hábitos","fields":[
          {"id":"atividade_fisica_pilates_geral","type":"textarea","label":"Atividade física atual","required":false},
          {"id":"experiencia_pilates_geral","type":"textarea","label":"Experiência prévia com Pilates","required":false},
          {"id":"rotina_trabalho_pilates_geral","type":"textarea","label":"Rotina de trabalho / hábitos posturais","required":false}
        ]},
        {"id":"plano_inicial_pilates_geral","type":"section","title":"Plano Inicial","fields":[
          {"id":"objetivos_funcionais_pilates_geral","type":"textarea","label":"Objetivos funcionais","required":false},
          {"id":"restricoes_exercicio_pilates_geral","type":"textarea","label":"Restrições para exercício","required":false},
          {"id":"conduta_inicial_pilates_geral","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Pilates para Iniciantes",
      "is_default": false,
      "icon": "UserPlus",
      "structure": [
        {"id":"objetivo_iniciantes","type":"section","title":"Objetivo Inicial","fields":[
          {"id":"objetivo_principal_iniciantes","type":"textarea","label":"Objetivo principal","required":true},
          {"id":"motivacao_iniciantes","type":"textarea","label":"Motivação para iniciar","required":false}
        ]},
        {"id":"historico_iniciantes","type":"section","title":"Histórico e Experiência","fields":[
          {"id":"experiencia_atividade_fisica_iniciantes","type":"textarea","label":"Experiência com atividade física","required":false},
          {"id":"historico_clinico_iniciantes","type":"textarea","label":"Histórico clínico","required":false},
          {"id":"restricoes_iniciantes","type":"textarea","label":"Restrições / limitações","required":false}
        ]},
        {"id":"avaliacao_inicial_iniciantes","type":"section","title":"Avaliação Inicial","fields":[
          {"id":"mobilidade_iniciantes","type":"textarea","label":"Mobilidade","required":false},
          {"id":"postura_iniciantes","type":"textarea","label":"Postura","required":false},
          {"id":"equilibrio_iniciantes","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"condicionamento_iniciantes","type":"textarea","label":"Condicionamento atual","required":false}
        ]},
        {"id":"plano_iniciantes","type":"section","title":"Plano Inicial","fields":[
          {"id":"objetivos_iniciantes","type":"textarea","label":"Objetivos iniciais","required":false},
          {"id":"cuidados_iniciantes","type":"textarea","label":"Cuidados e observações","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Pilates Terapêutico",
      "is_default": false,
      "icon": "HeartPulse",
      "structure": [
        {"id":"queixa_terapeutico","type":"section","title":"Queixa e Objetivo Terapêutico","fields":[
          {"id":"queixa_principal_terapeutico","type":"textarea","label":"Queixa principal","required":true},
          {"id":"objetivo_terapeutico","type":"textarea","label":"Objetivo terapêutico","required":false}
        ]},
        {"id":"historico_terapeutico","type":"section","title":"Histórico Clínico","fields":[
          {"id":"diagnostico_medico_terapeutico","type":"textarea","label":"Diagnóstico médico","required":false},
          {"id":"historico_dor_terapeutico","type":"textarea","label":"Histórico da dor / disfunção","required":false},
          {"id":"tratamentos_previos_terapeutico","type":"textarea","label":"Tratamentos prévios","required":false}
        ]},
        {"id":"avaliacao_funcional_terapeutico","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"regiao_dor_terapeutico","type":"textarea","label":"Região de dor / limitação","required":false},
          {"id":"movimentos_limitados_terapeutico","type":"textarea","label":"Movimentos limitados","required":false},
          {"id":"postura_terapeutico","type":"textarea","label":"Alterações posturais","required":false},
          {"id":"restricoes_terapeutico","type":"textarea","label":"Restrições para prática","required":false}
        ]},
        {"id":"plano_terapeutico_pilates","type":"section","title":"Plano Terapêutico Inicial","fields":[
          {"id":"objetivos_funcionais_terapeutico","type":"textarea","label":"Objetivos funcionais","required":false},
          {"id":"conduta_inicial_terapeutico","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Pilates para Reabilitação Postural",
      "is_default": false,
      "icon": "Waypoints",
      "structure": [
        {"id":"objetivo_postural","type":"section","title":"Objetivo Postural","fields":[
          {"id":"queixa_postural","type":"textarea","label":"Queixa postural principal","required":true},
          {"id":"objetivo_reabilitacao_postural","type":"textarea","label":"Objetivo da reabilitação postural","required":false}
        ]},
        {"id":"historico_postural","type":"section","title":"Histórico","fields":[
          {"id":"historico_dor_postural","type":"textarea","label":"Histórico de dor / desconforto","required":false},
          {"id":"habitos_posturais","type":"textarea","label":"Hábitos posturais e rotina","required":false},
          {"id":"atividade_profissional_postural","type":"textarea","label":"Atividade profissional","required":false}
        ]},
        {"id":"avaliacao_postural","type":"section","title":"Avaliação Postural","fields":[
          {"id":"observacoes_posturais","type":"textarea","label":"Observações posturais","required":false},
          {"id":"desvios_posturais","type":"textarea","label":"Desvios / compensações","required":false},
          {"id":"mobilidade_postural","type":"textarea","label":"Mobilidade associada","required":false}
        ]},
        {"id":"plano_postural","type":"section","title":"Plano Inicial","fields":[
          {"id":"objetivos_posturais","type":"textarea","label":"Objetivos posturais","required":false},
          {"id":"conduta_postural","type":"textarea","label":"Conduta inicial","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Pilates para Gestantes",
      "is_default": false,
      "icon": "Heart",
      "structure": [
        {"id":"objetivo_gestante_pilates","type":"section","title":"Objetivo da Prática","fields":[
          {"id":"objetivo_gestante_pilates_texto","type":"textarea","label":"Objetivo principal","required":true},
          {"id":"idade_gestacional_pilates","type":"text","label":"Idade gestacional","required":false}
        ]},
        {"id":"historico_gestacional_pilates","type":"section","title":"Histórico Gestacional","fields":[
          {"id":"historico_gestacao_pilates","type":"textarea","label":"Histórico da gestação","required":false},
          {"id":"intercorrencias_gestante_pilates","type":"textarea","label":"Intercorrências / restrições","required":false},
          {"id":"liberacao_medica_gestante_pilates","type":"textarea","label":"Liberação médica / observações","required":false}
        ]},
        {"id":"avaliacao_funcional_gestante_pilates","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"dor_gestante_pilates","type":"textarea","label":"Dor / desconfortos","required":false},
          {"id":"postura_gestante_pilates","type":"textarea","label":"Postura","required":false},
          {"id":"mobilidade_gestante_pilates","type":"textarea","label":"Mobilidade","required":false}
        ]},
        {"id":"plano_gestante_pilates","type":"section","title":"Plano Inicial","fields":[
          {"id":"objetivos_gestante_pilates","type":"textarea","label":"Objetivos da prática","required":false},
          {"id":"cuidados_gestante_pilates","type":"textarea","label":"Cuidados e restrições","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Pilates para Condicionamento Físico",
      "is_default": false,
      "icon": "Dumbbell",
      "structure": [
        {"id":"objetivo_condicionamento_pilates","type":"section","title":"Objetivo do Condicionamento","fields":[
          {"id":"objetivo_principal_condicionamento_pilates","type":"textarea","label":"Objetivo principal","required":true},
          {"id":"meta_condicionamento_pilates","type":"textarea","label":"Meta de condicionamento","required":false}
        ]},
        {"id":"historico_condicionamento_pilates","type":"section","title":"Histórico de Atividade Física","fields":[
          {"id":"historico_atividade_condicionamento_pilates","type":"textarea","label":"Histórico de atividade física","required":false},
          {"id":"condicionamento_atual_pilates","type":"textarea","label":"Condicionamento atual","required":false},
          {"id":"lesoes_previas_condicionamento_pilates","type":"textarea","label":"Lesões / limitações prévias","required":false}
        ]},
        {"id":"avaliacao_funcional_condicionamento_pilates","type":"section","title":"Avaliação Funcional","fields":[
          {"id":"mobilidade_condicionamento_pilates","type":"textarea","label":"Mobilidade","required":false},
          {"id":"resistencia_condicionamento_pilates","type":"textarea","label":"Resistência","required":false},
          {"id":"controle_corporal_condicionamento_pilates","type":"textarea","label":"Controle corporal","required":false}
        ]},
        {"id":"plano_condicionamento_pilates","type":"section","title":"Plano Inicial","fields":[
          {"id":"objetivos_funcionais_condicionamento_pilates","type":"textarea","label":"Objetivos funcionais","required":false},
          {"id":"conduta_inicial_condicionamento_pilates","type":"textarea","label":"Conduta inicial","required":false}
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
        'Modelo oficial de Pilates - ' || (_tpl.val->>'name'),
        1,
        _tpl.val->'structure', _tpl.val->'structure',
        true, true, (_tpl.val->>'is_default')::boolean, false,
        COALESCE(_tpl.val->>'icon', 'Activity'), 0,
        'anamnese', 'pilates'
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
$$;

-- Provision for existing clinic with Pilates
SELECT provision_pilates_anamnesis_templates(
  'f95ac79d-9ceb-4e20-83b0-0592276faac1'::uuid,
  'f41fded2-e22f-40ec-9d0d-adaa477e10a9'::uuid
);
