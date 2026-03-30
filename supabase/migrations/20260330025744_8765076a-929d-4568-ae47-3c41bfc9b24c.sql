
-- Function to provision all 6 psychology anamnesis templates for a clinic
CREATE OR REPLACE FUNCTION public.provision_psicologia_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _tpl RECORD;
  _template_id UUID;
  _version_id UUID;
  _count INTEGER := 0;
  _templates JSONB;
BEGIN
  _templates := '[
    {
      "name": "Anamnese Psicológica Adulto",
      "is_default": true,
      "icon": "Brain",
      "structure": [
        {"id":"demanda_principal_adulto","type":"section","title":"Demanda Principal","fields":[
          {"id":"queixa_principal_adulto","type":"textarea","label":"Queixa principal","required":true},
          {"id":"motivo_busca_terapia_adulto","type":"textarea","label":"Motivo da busca por terapia","required":false}
        ]},
        {"id":"historia_demanda_adulto","type":"section","title":"História da Demanda Atual","fields":[
          {"id":"inicio_demanda_adulto","type":"text","label":"Início da demanda","required":false},
          {"id":"contexto_demanda_adulto","type":"textarea","label":"Contexto da demanda","required":false},
          {"id":"gatilhos_identificados_adulto","type":"textarea","label":"Gatilhos identificados","required":false},
          {"id":"impactos_funcionais_adulto","type":"textarea","label":"Impactos na rotina","required":false}
        ]},
        {"id":"historico_pessoal_adulto","type":"section","title":"Histórico Pessoal","fields":[
          {"id":"historico_familiar_adulto","type":"textarea","label":"Histórico familiar","required":false},
          {"id":"historia_afetiva_adulto","type":"textarea","label":"História afetiva e relacional","required":false},
          {"id":"historia_escolar_profissional_adulto","type":"textarea","label":"História escolar e profissional","required":false},
          {"id":"eventos_marcantes_adulto","type":"textarea","label":"Eventos marcantes","required":false}
        ]},
        {"id":"saude_habitos_adulto","type":"section","title":"Saúde e Hábitos","fields":[
          {"id":"sono_adulto","type":"textarea","label":"Sono","required":false},
          {"id":"alimentacao_adulto","type":"textarea","label":"Alimentação","required":false},
          {"id":"uso_substancias_adulto","type":"textarea","label":"Uso de substâncias","required":false},
          {"id":"medicacoes_adulto","type":"textarea","label":"Medicações em uso","required":false}
        ]},
        {"id":"aspectos_emocionais_adulto","type":"section","title":"Aspectos Emocionais e Cognitivos","fields":[
          {"id":"humor_adulto","type":"textarea","label":"Humor","required":false},
          {"id":"ansiedade_adulto","type":"textarea","label":"Ansiedade","required":false},
          {"id":"autoimagem_adulto","type":"textarea","label":"Autoimagem e autoestima","required":false},
          {"id":"cognicao_adulto","type":"textarea","label":"Atenção, memória e concentração","required":false}
        ]},
        {"id":"avaliacao_inicial_adulto","type":"section","title":"Avaliação Inicial","fields":[
          {"id":"recursos_enfrentamento_adulto","type":"textarea","label":"Recursos de enfrentamento","required":false},
          {"id":"rede_apoio_adulto","type":"textarea","label":"Rede de apoio","required":false},
          {"id":"objetivos_terapeuticos_adulto","type":"textarea","label":"Objetivos terapêuticos iniciais","required":false},
          {"id":"observacoes_iniciais_adulto","type":"textarea","label":"Observações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Psicológica Infantil",
      "is_default": false,
      "icon": "Baby",
      "structure": [
        {"id":"demanda_principal_infantil","type":"section","title":"Demanda Principal","fields":[
          {"id":"queixa_principal_infantil","type":"textarea","label":"Queixa principal","required":true},
          {"id":"quem_trouxe_demanda_infantil","type":"text","label":"Quem trouxe a demanda","required":false},
          {"id":"motivo_busca_terapia_infantil","type":"textarea","label":"Motivo da busca por atendimento","required":false}
        ]},
        {"id":"gestacao_desenvolvimento_infantil","type":"section","title":"Gestação e Desenvolvimento","fields":[
          {"id":"historico_gestacional_infantil","type":"textarea","label":"Histórico gestacional e parto","required":false},
          {"id":"desenvolvimento_neuropsicomotor_infantil","type":"textarea","label":"Desenvolvimento neuropsicomotor","required":false},
          {"id":"desfralde_sono_alimentacao_infantil","type":"textarea","label":"Desfralde, sono e alimentação","required":false}
        ]},
        {"id":"contexto_familiar_infantil","type":"section","title":"Contexto Familiar","fields":[
          {"id":"estrutura_familiar_infantil","type":"textarea","label":"Estrutura familiar","required":false},
          {"id":"relacao_cuidadores_infantil","type":"textarea","label":"Relação com cuidadores","required":false},
          {"id":"rotina_casa_infantil","type":"textarea","label":"Rotina em casa","required":false}
        ]},
        {"id":"escola_socializacao_infantil","type":"section","title":"Escola e Socialização","fields":[
          {"id":"vida_escolar_infantil","type":"textarea","label":"Vida escolar","required":false},
          {"id":"aprendizagem_infantil","type":"textarea","label":"Aprendizagem","required":false},
          {"id":"socializacao_infantil","type":"textarea","label":"Socialização","required":false}
        ]},
        {"id":"comportamento_emocoes_infantil","type":"section","title":"Comportamento e Emoções","fields":[
          {"id":"comportamentos_observados_infantil","type":"textarea","label":"Comportamentos observados","required":false},
          {"id":"expressao_emocional_infantil","type":"textarea","label":"Expressão emocional","required":false},
          {"id":"gatilhos_comportamentais_infantil","type":"textarea","label":"Gatilhos comportamentais","required":false}
        ]},
        {"id":"avaliacao_inicial_infantil","type":"section","title":"Avaliação Inicial","fields":[
          {"id":"recursos_potencialidades_infantil","type":"textarea","label":"Recursos e potencialidades","required":false},
          {"id":"objetivos_terapeuticos_infantil","type":"textarea","label":"Objetivos terapêuticos iniciais","required":false},
          {"id":"observacoes_iniciais_infantil","type":"textarea","label":"Observações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Terapia de Casal",
      "is_default": false,
      "icon": "Heart",
      "structure": [
        {"id":"demanda_casal","type":"section","title":"Demanda do Casal","fields":[
          {"id":"queixa_principal_casal","type":"textarea","label":"Queixa principal do casal","required":true},
          {"id":"motivo_busca_terapia_casal","type":"textarea","label":"Motivo da busca por terapia","required":false},
          {"id":"tempo_relacao_casal","type":"text","label":"Tempo de relação","required":false}
        ]},
        {"id":"historia_relacao_casal","type":"section","title":"História da Relação","fields":[
          {"id":"inicio_relacao_casal","type":"textarea","label":"Início da relação","required":false},
          {"id":"eventos_marcantes_casal","type":"textarea","label":"Eventos marcantes da relação","required":false},
          {"id":"configuracao_atual_casal","type":"textarea","label":"Configuração atual da relação","required":false}
        ]},
        {"id":"dinamica_relacional_casal","type":"section","title":"Dinâmica Relacional","fields":[
          {"id":"comunicacao_casal","type":"textarea","label":"Comunicação do casal","required":false},
          {"id":"conflitos_recorrentes_casal","type":"textarea","label":"Conflitos recorrentes","required":false},
          {"id":"vinculo_afetivo_casal","type":"textarea","label":"Vínculo afetivo","required":false},
          {"id":"sexualidade_intimidade_casal","type":"textarea","label":"Sexualidade e intimidade","required":false}
        ]},
        {"id":"contexto_familiar_casal","type":"section","title":"Contexto Familiar e Rede","fields":[
          {"id":"filhos_dependentes_casal","type":"textarea","label":"Filhos e dependentes","required":false},
          {"id":"familias_origem_casal","type":"textarea","label":"Influência das famílias de origem","required":false},
          {"id":"rede_apoio_casal","type":"textarea","label":"Rede de apoio","required":false}
        ]},
        {"id":"avaliacao_inicial_casal","type":"section","title":"Avaliação Inicial","fields":[
          {"id":"recursos_casal","type":"textarea","label":"Recursos do casal","required":false},
          {"id":"objetivos_terapeuticos_casal","type":"textarea","label":"Objetivos terapêuticos iniciais","required":false},
          {"id":"observacoes_iniciais_casal","type":"textarea","label":"Observações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Terapia Familiar",
      "is_default": false,
      "icon": "Users",
      "structure": [
        {"id":"demanda_familiar","type":"section","title":"Demanda Familiar","fields":[
          {"id":"queixa_principal_familiar","type":"textarea","label":"Queixa principal da família","required":true},
          {"id":"motivo_busca_terapia_familiar","type":"textarea","label":"Motivo da busca por terapia familiar","required":false}
        ]},
        {"id":"estrutura_familiar","type":"section","title":"Estrutura Familiar","fields":[
          {"id":"composicao_familiar","type":"textarea","label":"Composição familiar","required":false},
          {"id":"papel_membros_familiar","type":"textarea","label":"Papéis dos membros","required":false},
          {"id":"historico_familiar_familiar","type":"textarea","label":"Histórico familiar relevante","required":false}
        ]},
        {"id":"dinamica_familiar","type":"section","title":"Dinâmica Familiar","fields":[
          {"id":"comunicacao_familiar","type":"textarea","label":"Comunicação familiar","required":false},
          {"id":"conflitos_recorrentes_familiar","type":"textarea","label":"Conflitos recorrentes","required":false},
          {"id":"vinculos_familiares","type":"textarea","label":"Vínculos familiares","required":false},
          {"id":"limites_regras_familiar","type":"textarea","label":"Limites e regras","required":false}
        ]},
        {"id":"contexto_funcional_familiar","type":"section","title":"Contexto Funcional","fields":[
          {"id":"rotina_familiar","type":"textarea","label":"Rotina familiar","required":false},
          {"id":"eventos_estressores_familiar","type":"textarea","label":"Eventos estressores","required":false},
          {"id":"rede_apoio_familiar","type":"textarea","label":"Rede de apoio","required":false}
        ]},
        {"id":"avaliacao_inicial_familiar","type":"section","title":"Avaliação Inicial","fields":[
          {"id":"recursos_familia","type":"textarea","label":"Recursos e potencialidades da família","required":false},
          {"id":"objetivos_terapeuticos_familiar","type":"textarea","label":"Objetivos terapêuticos iniciais","required":false},
          {"id":"observacoes_iniciais_familiar","type":"textarea","label":"Observações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese para Avaliação Psicológica / Psicodiagnóstico",
      "is_default": false,
      "icon": "ClipboardCheck",
      "structure": [
        {"id":"demanda_psicodiagnostico","type":"section","title":"Demanda e Encaminhamento","fields":[
          {"id":"demanda_formal_psicodiagnostico","type":"textarea","label":"Demanda formal","required":true},
          {"id":"origem_encaminhamento_psicodiagnostico","type":"text","label":"Origem do encaminhamento","required":false},
          {"id":"objetivo_avaliacao_psicodiagnostico","type":"textarea","label":"Objetivo da avaliação","required":false}
        ]},
        {"id":"historico_clinico_psicodiagnostico","type":"section","title":"Histórico Clínico e Contextual","fields":[
          {"id":"historico_pessoal_psicodiagnostico","type":"textarea","label":"Histórico pessoal relevante","required":false},
          {"id":"historico_familiar_psicodiagnostico","type":"textarea","label":"Histórico familiar","required":false},
          {"id":"historico_escolar_profissional_psicodiagnostico","type":"textarea","label":"Histórico escolar e profissional","required":false}
        ]},
        {"id":"observacoes_tecnicas_psicodiagnostico","type":"section","title":"Observações Técnicas","fields":[
          {"id":"observacoes_comportamentais_psicodiagnostico","type":"textarea","label":"Observações comportamentais","required":false},
          {"id":"hipoteses_iniciais_psicodiagnostico","type":"textarea","label":"Hipóteses iniciais","required":false},
          {"id":"fundamentacao_tecnica_psicodiagnostico","type":"textarea","label":"Fundamentação técnica inicial","required":false}
        ]},
        {"id":"instrumentos_psicodiagnostico","type":"section","title":"Instrumentos e Estratégia Avaliativa","fields":[
          {"id":"instrumentos_previstos_psicodiagnostico","type":"textarea","label":"Instrumentos previstos","required":false},
          {"id":"fontes_informacao_psicodiagnostico","type":"textarea","label":"Fontes de informação","required":false},
          {"id":"planejamento_avaliacao_psicodiagnostico","type":"textarea","label":"Planejamento da avaliação","required":false}
        ]},
        {"id":"fechamento_psicodiagnostico","type":"section","title":"Fechamento Inicial","fields":[
          {"id":"objetivos_devolutiva_psicodiagnostico","type":"textarea","label":"Objetivos da devolutiva","required":false},
          {"id":"observacoes_iniciais_psicodiagnostico","type":"textarea","label":"Observações iniciais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Psiquiátrica Integrada",
      "is_default": false,
      "icon": "BrainCircuit",
      "structure": [
        {"id":"demanda_psiquiatrica_integrada","type":"section","title":"Demanda Principal","fields":[
          {"id":"queixa_principal_psiquiatrica_integrada","type":"textarea","label":"Queixa principal","required":true},
          {"id":"motivo_busca_psiquiatrica_integrada","type":"textarea","label":"Motivo da busca por atendimento","required":false}
        ]},
        {"id":"historia_sintomas_psiquiatrica_integrada","type":"section","title":"História dos Sintomas","fields":[
          {"id":"inicio_sintomas_psiquiatrica_integrada","type":"text","label":"Início dos sintomas","required":false},
          {"id":"evolucao_sintomas_psiquiatrica_integrada","type":"textarea","label":"Evolução dos sintomas","required":false},
          {"id":"gatilhos_sintomas_psiquiatrica_integrada","type":"textarea","label":"Gatilhos e fatores associados","required":false}
        ]},
        {"id":"historico_clinico_psiquiatrico_integrada","type":"section","title":"Histórico Clínico e Psiquiátrico","fields":[
          {"id":"historico_psiquiatrico_previo_integrada","type":"textarea","label":"Histórico psiquiátrico prévio","required":false},
          {"id":"historico_psicologico_previo_integrada","type":"textarea","label":"Histórico psicológico prévio","required":false},
          {"id":"medicacoes_atuais_integrada","type":"textarea","label":"Medicações atuais","required":false},
          {"id":"uso_substancias_integrada","type":"textarea","label":"Uso de substâncias","required":false}
        ]},
        {"id":"funcionamento_psiquiatrica_integrada","type":"section","title":"Funcionamento Atual","fields":[
          {"id":"sono_psiquiatrica_integrada","type":"textarea","label":"Sono","required":false},
          {"id":"alimentacao_psiquiatrica_integrada","type":"textarea","label":"Alimentação","required":false},
          {"id":"humor_psiquiatrica_integrada","type":"textarea","label":"Humor","required":false},
          {"id":"ansiedade_psiquiatrica_integrada","type":"textarea","label":"Ansiedade","required":false},
          {"id":"funcionamento_social_ocupacional_integrada","type":"textarea","label":"Funcionamento social e ocupacional","required":false}
        ]},
        {"id":"avaliacao_risco_psiquiatrica_integrada","type":"section","title":"Avaliação Inicial e Risco","fields":[
          {"id":"avaliacao_risco_integrada","type":"textarea","label":"Avaliação de risco atual","required":false},
          {"id":"rede_apoio_integrada","type":"textarea","label":"Rede de apoio","required":false},
          {"id":"objetivos_terapeuticos_integrada","type":"textarea","label":"Objetivos terapêuticos iniciais","required":false},
          {"id":"observacoes_iniciais_integrada","type":"textarea","label":"Observações iniciais","required":false}
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
        'Modelo oficial de Psicologia - ' || (_tpl.val->>'name'),
        1,
        _tpl.val->'structure', _tpl.val->'structure',
        true, true, (_tpl.val->>'is_default')::boolean, false,
        COALESCE(_tpl.val->>'icon', 'Brain'), 0,
        'anamnese', 'psicologia'
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
$fn$;
