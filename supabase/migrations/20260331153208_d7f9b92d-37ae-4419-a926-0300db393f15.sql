
-- Insert the "Anamnese Fisioterapêutica Geral (YesClin)" template for all clinics that have fisioterapia active
DO $$
DECLARE
  _rec RECORD;
  _template_id UUID;
  _version_id UUID;
  _structure JSONB;
BEGIN
  _structure := '[
    {"id":"bloco_identificacao_atendimento","type":"section","title":"Identificação do Atendimento","fields":[
      {"id":"data_avaliacao","type":"date","label":"Data da avaliação","required":true},
      {"id":"profissional_responsavel","type":"text","label":"Profissional responsável","required":true},
      {"id":"especialidade","type":"text","label":"Especialidade","required":false},
      {"id":"tipo_atendimento","type":"select","label":"Tipo de atendimento","required":false,"options":["Avaliação inicial","Reavaliação","Retorno","Alta"]},
      {"id":"origem_encaminhamento","type":"text","label":"Origem do encaminhamento","required":false},
      {"id":"convenio_particular","type":"select","label":"Convênio / Particular","required":false,"options":["Particular","Convênio"]},
      {"id":"observacoes_iniciais","type":"textarea","label":"Observações iniciais","required":false}
    ]},
    {"id":"bloco_queixa_principal","type":"section","title":"Queixa Principal","fields":[
      {"id":"queixa_principal","type":"textarea","label":"Queixa principal","required":true},
      {"id":"regiao_corporal_acometida","type":"text","label":"Região corporal acometida","required":false},
      {"id":"lado_acometido","type":"select","label":"Lado acometido","required":false,"options":["Direito","Esquerdo","Bilateral","Central"]},
      {"id":"tempo_queixa","type":"text","label":"Tempo de queixa","required":false},
      {"id":"inicio_sintomas","type":"text","label":"Início dos sintomas","required":false},
      {"id":"mecanismo_inicio","type":"select","label":"Mecanismo de início","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Desconhecido","Outro"]},
      {"id":"objetivo_paciente_tratamento","type":"textarea","label":"Objetivo do paciente com o tratamento","required":true}
    ]},
    {"id":"bloco_historia_doenca_atual","type":"section","title":"História da Doença Atual","fields":[
      {"id":"descricao_condicao_atual","type":"textarea","label":"Descrição detalhada da condição atual","required":false},
      {"id":"evolucao_quadro","type":"textarea","label":"Evolução do quadro","required":false},
      {"id":"fatores_melhora","type":"textarea","label":"Fatores de melhora","required":false},
      {"id":"fatores_piora","type":"textarea","label":"Fatores de piora","required":false},
      {"id":"sintomas_associados","type":"textarea","label":"Sintomas associados","required":false},
      {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
      {"id":"exames_realizados","type":"textarea","label":"Exames já realizados","required":false},
      {"id":"diagnostico_medico_previo","type":"textarea","label":"Diagnóstico médico prévio","required":false},
      {"id":"medicamentos_uso_quadro","type":"textarea","label":"Medicamentos em uso relacionados ao quadro","required":false}
    ]},
    {"id":"bloco_dor","type":"section","title":"Dor","fields":[
      {"id":"presenca_dor","type":"radio","label":"Presença de dor","required":false,"options":["Sim","Não"]},
      {"id":"escala_eva_inicial","type":"number","label":"Escala EVA inicial (0-10)","required":false,"min":0,"max":10},
      {"id":"tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Difusa","Outro"]},
      {"id":"frequencia_dor","type":"select","label":"Frequência da dor","required":false,"options":["Contínua","Intermitente","Eventual"]},
      {"id":"irradiacao_dor","type":"textarea","label":"Irradiação","required":false},
      {"id":"dor_repouso","type":"radio","label":"Dor em repouso","required":false,"options":["Sim","Não"]},
      {"id":"dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
      {"id":"dor_noturna","type":"radio","label":"Dor noturna","required":false,"options":["Sim","Não"]},
      {"id":"observacoes_dor","type":"textarea","label":"Observações sobre dor","required":false}
    ]},
    {"id":"bloco_historico_clinico","type":"section","title":"Histórico Clínico e Antecedentes","fields":[
      {"id":"doencas_preexistentes","type":"textarea","label":"Doenças pré-existentes","required":false},
      {"id":"comorbidades","type":"textarea","label":"Comorbidades","required":false},
      {"id":"cirurgias_previas","type":"textarea","label":"Cirurgias prévias","required":false},
      {"id":"historico_fraturas_lesoes","type":"textarea","label":"Histórico de fraturas / lesões","required":false},
      {"id":"alergias","type":"textarea","label":"Alergias","required":false},
      {"id":"medicamentos_continuos","type":"textarea","label":"Uso de medicamentos contínuos","required":false},
      {"id":"historico_familiar_relevante","type":"textarea","label":"Histórico familiar relevante","required":false},
      {"id":"restricao_medica","type":"textarea","label":"Restrição médica","required":false},
      {"id":"sinais_alerta_clinico","type":"textarea","label":"Sinais de alerta clínico","required":false}
    ]},
    {"id":"bloco_funcionalidade_avd","type":"section","title":"Funcionalidade e Atividades de Vida Diária","fields":[
      {"id":"limitacoes_funcionais_principais","type":"textarea","label":"Limitações funcionais principais","required":false},
      {"id":"dificuldade_caminhar","type":"radio","label":"Dificuldade para caminhar","required":false,"options":["Sim","Não"]},
      {"id":"dificuldade_sentar_levantar","type":"radio","label":"Dificuldade para sentar / levantar","required":false,"options":["Sim","Não"]},
      {"id":"dificuldade_subir_escadas","type":"radio","label":"Dificuldade para subir escadas","required":false,"options":["Sim","Não"]},
      {"id":"dificuldade_atividades_laborais","type":"radio","label":"Dificuldade para atividades laborais","required":false,"options":["Sim","Não"]},
      {"id":"dificuldade_atividades_domesticas","type":"radio","label":"Dificuldade para atividades domésticas","required":false,"options":["Sim","Não"]},
      {"id":"dificuldade_sono","type":"radio","label":"Dificuldade para sono","required":false,"options":["Sim","Não"]},
      {"id":"impacto_funcional_geral","type":"textarea","label":"Impacto funcional geral","required":false},
      {"id":"grau_independencia_funcional","type":"select","label":"Grau de independência funcional","required":false,"options":["Independente","Parcialmente dependente","Dependente"]}
    ]},
    {"id":"bloco_habitos_contexto","type":"section","title":"Hábitos e Contexto","fields":[
      {"id":"nivel_atividade_fisica","type":"textarea","label":"Nível de atividade física","required":false},
      {"id":"profissao","type":"text","label":"Profissão","required":false},
      {"id":"atividades_repetitivas_trabalho","type":"textarea","label":"Atividades repetitivas no trabalho","required":false},
      {"id":"posturas_mantidas","type":"textarea","label":"Posturas mantidas","required":false},
      {"id":"pratica_esportiva","type":"textarea","label":"Prática esportiva","required":false},
      {"id":"tabagismo","type":"radio","label":"Tabagismo","required":false,"options":["Sim","Não","Ex-tabagista"]},
      {"id":"etilismo","type":"radio","label":"Etilismo","required":false,"options":["Sim","Não","Social"]},
      {"id":"qualidade_sono","type":"textarea","label":"Qualidade do sono","required":false},
      {"id":"observacoes_biopsicossocial","type":"textarea","label":"Observações de contexto biopsicossocial","required":false}
    ]},
    {"id":"bloco_exame_fisico","type":"section","title":"Exame Físico Fisioterapêutico Inicial","fields":[
      {"id":"inspecao_geral","type":"textarea","label":"Inspeção geral","required":false},
      {"id":"postura","type":"textarea","label":"Postura","required":false},
      {"id":"marcha","type":"textarea","label":"Marcha","required":false},
      {"id":"amplitude_movimento","type":"textarea","label":"Amplitude de movimento","required":false},
      {"id":"limitacao_mobilidade","type":"textarea","label":"Limitação de mobilidade","required":false},
      {"id":"forca_muscular","type":"textarea","label":"Força muscular","required":false},
      {"id":"escala_oxford","type":"select","label":"Escala de Oxford","required":false,"options":["0 - Sem contração","1 - Contração visível sem movimento","2 - Movimento sem gravidade","3 - Movimento contra gravidade","4 - Movimento contra resistência moderada","5 - Força normal"]},
      {"id":"tonus_muscular","type":"textarea","label":"Tônus muscular","required":false},
      {"id":"sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
      {"id":"edema","type":"textarea","label":"Edema","required":false},
      {"id":"equilibrio","type":"textarea","label":"Equilíbrio","required":false},
      {"id":"coordenacao_motora","type":"textarea","label":"Coordenação motora","required":false},
      {"id":"testes_especiais","type":"textarea","label":"Testes especiais realizados","required":false},
      {"id":"palpacao","type":"textarea","label":"Palpação","required":false},
      {"id":"observacoes_exame_fisico","type":"textarea","label":"Observações do exame físico","required":false}
    ]},
    {"id":"bloco_avaliacao_funcional_inicial","type":"section","title":"Avaliação Funcional Inicial","fields":[
      {"id":"diagnostico_cinetico_funcional","type":"textarea","label":"Diagnóstico cinético-funcional inicial","required":false},
      {"id":"principais_deficits","type":"textarea","label":"Principais déficits identificados","required":false},
      {"id":"estruturas_acometidas","type":"textarea","label":"Estruturas acometidas","required":false},
      {"id":"padrao_funcional_alterado","type":"textarea","label":"Padrão funcional alterado","required":false},
      {"id":"prognostico_funcional_inicial","type":"textarea","label":"Prognóstico funcional inicial","required":false},
      {"id":"necessidade_encaminhamento","type":"textarea","label":"Necessidade de encaminhamento complementar","required":false}
    ]},
    {"id":"bloco_objetivos_terapeuticos","type":"section","title":"Objetivos Terapêuticos","fields":[
      {"id":"objetivo_geral_tratamento","type":"textarea","label":"Objetivo geral do tratamento","required":false},
      {"id":"objetivos_curto_prazo","type":"textarea","label":"Objetivos de curto prazo","required":false},
      {"id":"objetivos_medio_prazo","type":"textarea","label":"Objetivos de médio prazo","required":false},
      {"id":"objetivos_longo_prazo","type":"textarea","label":"Objetivos de longo prazo","required":false},
      {"id":"meta_funcional_principal","type":"textarea","label":"Meta funcional principal","required":false},
      {"id":"criterios_evolucao","type":"textarea","label":"Critérios de evolução","required":false}
    ]},
    {"id":"bloco_conduta_inicial","type":"section","title":"Conduta Inicial","fields":[
      {"id":"plano_terapeutico_inicial","type":"textarea","label":"Plano terapêutico inicial","required":false},
      {"id":"frequencia_semanal","type":"select","label":"Frequência semanal sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
      {"id":"recursos_terapeuticos_previstos","type":"textarea","label":"Recursos terapêuticos previstos","required":false},
      {"id":"exercicios_iniciais","type":"textarea","label":"Exercícios iniciais propostos","required":false},
      {"id":"orientacoes_domiciliares","type":"textarea","label":"Orientações domiciliares","required":false},
      {"id":"necessidade_reavaliacao","type":"radio","label":"Necessidade de reavaliação","required":false,"options":["Sim","Não"]},
      {"id":"observacoes_finais","type":"textarea","label":"Observações finais","required":false}
    ]}
  ]';

  FOR _rec IN
    SELECT s.id AS specialty_id, s.clinic_id
    FROM public.specialties s
    WHERE s.slug = 'fisioterapia'
      AND s.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.anamnesis_templates at2
        WHERE at2.clinic_id = s.clinic_id
          AND at2.specialty_id = s.id
          AND at2.name = 'Anamnese Fisioterapêutica Geral (YesClin)'
      )
  LOOP
    INSERT INTO public.anamnesis_templates (
      clinic_id, specialty_id, name, description, version,
      fields, campos, is_active, is_system, is_default, archived,
      icon, usage_count, template_type, specialty
    ) VALUES (
      _rec.clinic_id, _rec.specialty_id,
      'Anamnese Fisioterapêutica Geral (YesClin)',
      'Modelo inicial completo para avaliação fisioterapêutica geral, com foco em queixa principal, dor, histórico funcional, limitações, exame físico funcional e definição de objetivos terapêuticos.',
      1,
      _structure, _structure,
      true, true, false, false,
      'Activity', 0,
      'anamnese', 'fisioterapia'
    )
    RETURNING id INTO _template_id;

    INSERT INTO public.anamnesis_template_versions (
      template_id, version, version_number, structure, fields, created_by
    ) VALUES (
      _template_id, 1, 1, _structure, _structure, NULL
    )
    RETURNING id INTO _version_id;

    UPDATE public.anamnesis_templates
    SET current_version_id = _version_id
    WHERE id = _template_id;
  END LOOP;
END;
$$;

-- Update provision_fisioterapia_anamnesis_templates to include the new YesClin template for future activations
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
      "name": "Anamnese Fisioterapêutica Geral (YesClin)",
      "is_default": false,
      "icon": "Activity",
      "structure": [
        {"id":"bloco_identificacao_atendimento","type":"section","title":"Identificação do Atendimento","fields":[
          {"id":"data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"profissional_responsavel","type":"text","label":"Profissional responsável","required":true},
          {"id":"especialidade","type":"text","label":"Especialidade","required":false},
          {"id":"tipo_atendimento","type":"select","label":"Tipo de atendimento","required":false,"options":["Avaliação inicial","Reavaliação","Retorno","Alta"]},
          {"id":"origem_encaminhamento","type":"text","label":"Origem do encaminhamento","required":false},
          {"id":"convenio_particular","type":"select","label":"Convênio / Particular","required":false,"options":["Particular","Convênio"]},
          {"id":"observacoes_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"bloco_queixa_principal","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"regiao_corporal_acometida","type":"text","label":"Região corporal acometida","required":false},
          {"id":"lado_acometido","type":"select","label":"Lado acometido","required":false,"options":["Direito","Esquerdo","Bilateral","Central"]},
          {"id":"tempo_queixa","type":"text","label":"Tempo de queixa","required":false},
          {"id":"inicio_sintomas","type":"text","label":"Início dos sintomas","required":false},
          {"id":"mecanismo_inicio","type":"select","label":"Mecanismo de início","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Desconhecido","Outro"]},
          {"id":"objetivo_paciente_tratamento","type":"textarea","label":"Objetivo do paciente com o tratamento","required":true}
        ]},
        {"id":"bloco_historia_doenca_atual","type":"section","title":"História da Doença Atual","fields":[
          {"id":"descricao_condicao_atual","type":"textarea","label":"Descrição detalhada da condição atual","required":false},
          {"id":"evolucao_quadro","type":"textarea","label":"Evolução do quadro","required":false},
          {"id":"fatores_melhora","type":"textarea","label":"Fatores de melhora","required":false},
          {"id":"fatores_piora","type":"textarea","label":"Fatores de piora","required":false},
          {"id":"sintomas_associados","type":"textarea","label":"Sintomas associados","required":false},
          {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"exames_realizados","type":"textarea","label":"Exames já realizados","required":false},
          {"id":"diagnostico_medico_previo","type":"textarea","label":"Diagnóstico médico prévio","required":false},
          {"id":"medicamentos_uso_quadro","type":"textarea","label":"Medicamentos em uso relacionados ao quadro","required":false}
        ]},
        {"id":"bloco_dor","type":"section","title":"Dor","fields":[
          {"id":"presenca_dor","type":"radio","label":"Presença de dor","required":false,"options":["Sim","Não"]},
          {"id":"escala_eva_inicial","type":"number","label":"Escala EVA inicial (0-10)","required":false,"min":0,"max":10},
          {"id":"tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Difusa","Outro"]},
          {"id":"frequencia_dor","type":"select","label":"Frequência da dor","required":false,"options":["Contínua","Intermitente","Eventual"]},
          {"id":"irradiacao_dor","type":"textarea","label":"Irradiação","required":false},
          {"id":"dor_repouso","type":"radio","label":"Dor em repouso","required":false,"options":["Sim","Não"]},
          {"id":"dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
          {"id":"dor_noturna","type":"radio","label":"Dor noturna","required":false,"options":["Sim","Não"]},
          {"id":"observacoes_dor","type":"textarea","label":"Observações sobre dor","required":false}
        ]},
        {"id":"bloco_historico_clinico","type":"section","title":"Histórico Clínico e Antecedentes","fields":[
          {"id":"doencas_preexistentes","type":"textarea","label":"Doenças pré-existentes","required":false},
          {"id":"comorbidades","type":"textarea","label":"Comorbidades","required":false},
          {"id":"cirurgias_previas","type":"textarea","label":"Cirurgias prévias","required":false},
          {"id":"historico_fraturas_lesoes","type":"textarea","label":"Histórico de fraturas / lesões","required":false},
          {"id":"alergias","type":"textarea","label":"Alergias","required":false},
          {"id":"medicamentos_continuos","type":"textarea","label":"Uso de medicamentos contínuos","required":false},
          {"id":"historico_familiar_relevante","type":"textarea","label":"Histórico familiar relevante","required":false},
          {"id":"restricao_medica","type":"textarea","label":"Restrição médica","required":false},
          {"id":"sinais_alerta_clinico","type":"textarea","label":"Sinais de alerta clínico","required":false}
        ]},
        {"id":"bloco_funcionalidade_avd","type":"section","title":"Funcionalidade e Atividades de Vida Diária","fields":[
          {"id":"limitacoes_funcionais_principais","type":"textarea","label":"Limitações funcionais principais","required":false},
          {"id":"dificuldade_caminhar","type":"radio","label":"Dificuldade para caminhar","required":false,"options":["Sim","Não"]},
          {"id":"dificuldade_sentar_levantar","type":"radio","label":"Dificuldade para sentar / levantar","required":false,"options":["Sim","Não"]},
          {"id":"dificuldade_subir_escadas","type":"radio","label":"Dificuldade para subir escadas","required":false,"options":["Sim","Não"]},
          {"id":"dificuldade_atividades_laborais","type":"radio","label":"Dificuldade para atividades laborais","required":false,"options":["Sim","Não"]},
          {"id":"dificuldade_atividades_domesticas","type":"radio","label":"Dificuldade para atividades domésticas","required":false,"options":["Sim","Não"]},
          {"id":"dificuldade_sono","type":"radio","label":"Dificuldade para sono","required":false,"options":["Sim","Não"]},
          {"id":"impacto_funcional_geral","type":"textarea","label":"Impacto funcional geral","required":false},
          {"id":"grau_independencia_funcional","type":"select","label":"Grau de independência funcional","required":false,"options":["Independente","Parcialmente dependente","Dependente"]}
        ]},
        {"id":"bloco_habitos_contexto","type":"section","title":"Hábitos e Contexto","fields":[
          {"id":"nivel_atividade_fisica","type":"textarea","label":"Nível de atividade física","required":false},
          {"id":"profissao","type":"text","label":"Profissão","required":false},
          {"id":"atividades_repetitivas_trabalho","type":"textarea","label":"Atividades repetitivas no trabalho","required":false},
          {"id":"posturas_mantidas","type":"textarea","label":"Posturas mantidas","required":false},
          {"id":"pratica_esportiva","type":"textarea","label":"Prática esportiva","required":false},
          {"id":"tabagismo","type":"radio","label":"Tabagismo","required":false,"options":["Sim","Não","Ex-tabagista"]},
          {"id":"etilismo","type":"radio","label":"Etilismo","required":false,"options":["Sim","Não","Social"]},
          {"id":"qualidade_sono","type":"textarea","label":"Qualidade do sono","required":false},
          {"id":"observacoes_biopsicossocial","type":"textarea","label":"Observações de contexto biopsicossocial","required":false}
        ]},
        {"id":"bloco_exame_fisico","type":"section","title":"Exame Físico Fisioterapêutico Inicial","fields":[
          {"id":"inspecao_geral","type":"textarea","label":"Inspeção geral","required":false},
          {"id":"postura","type":"textarea","label":"Postura","required":false},
          {"id":"marcha","type":"textarea","label":"Marcha","required":false},
          {"id":"amplitude_movimento","type":"textarea","label":"Amplitude de movimento","required":false},
          {"id":"limitacao_mobilidade","type":"textarea","label":"Limitação de mobilidade","required":false},
          {"id":"forca_muscular","type":"textarea","label":"Força muscular","required":false},
          {"id":"escala_oxford","type":"select","label":"Escala de Oxford","required":false,"options":["0 - Sem contração","1 - Contração visível sem movimento","2 - Movimento sem gravidade","3 - Movimento contra gravidade","4 - Movimento contra resistência moderada","5 - Força normal"]},
          {"id":"tonus_muscular","type":"textarea","label":"Tônus muscular","required":false},
          {"id":"sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
          {"id":"edema","type":"textarea","label":"Edema","required":false},
          {"id":"equilibrio","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"coordenacao_motora","type":"textarea","label":"Coordenação motora","required":false},
          {"id":"testes_especiais","type":"textarea","label":"Testes especiais realizados","required":false},
          {"id":"palpacao","type":"textarea","label":"Palpação","required":false},
          {"id":"observacoes_exame_fisico","type":"textarea","label":"Observações do exame físico","required":false}
        ]},
        {"id":"bloco_avaliacao_funcional_inicial","type":"section","title":"Avaliação Funcional Inicial","fields":[
          {"id":"diagnostico_cinetico_funcional","type":"textarea","label":"Diagnóstico cinético-funcional inicial","required":false},
          {"id":"principais_deficits","type":"textarea","label":"Principais déficits identificados","required":false},
          {"id":"estruturas_acometidas","type":"textarea","label":"Estruturas acometidas","required":false},
          {"id":"padrao_funcional_alterado","type":"textarea","label":"Padrão funcional alterado","required":false},
          {"id":"prognostico_funcional_inicial","type":"textarea","label":"Prognóstico funcional inicial","required":false},
          {"id":"necessidade_encaminhamento","type":"textarea","label":"Necessidade de encaminhamento complementar","required":false}
        ]},
        {"id":"bloco_objetivos_terapeuticos","type":"section","title":"Objetivos Terapêuticos","fields":[
          {"id":"objetivo_geral_tratamento","type":"textarea","label":"Objetivo geral do tratamento","required":false},
          {"id":"objetivos_curto_prazo","type":"textarea","label":"Objetivos de curto prazo","required":false},
          {"id":"objetivos_medio_prazo","type":"textarea","label":"Objetivos de médio prazo","required":false},
          {"id":"objetivos_longo_prazo","type":"textarea","label":"Objetivos de longo prazo","required":false},
          {"id":"meta_funcional_principal","type":"textarea","label":"Meta funcional principal","required":false},
          {"id":"criterios_evolucao","type":"textarea","label":"Critérios de evolução","required":false}
        ]},
        {"id":"bloco_conduta_inicial","type":"section","title":"Conduta Inicial","fields":[
          {"id":"plano_terapeutico_inicial","type":"textarea","label":"Plano terapêutico inicial","required":false},
          {"id":"frequencia_semanal","type":"select","label":"Frequência semanal sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
          {"id":"recursos_terapeuticos_previstos","type":"textarea","label":"Recursos terapêuticos previstos","required":false},
          {"id":"exercicios_iniciais","type":"textarea","label":"Exercícios iniciais propostos","required":false},
          {"id":"orientacoes_domiciliares","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"necessidade_reavaliacao","type":"radio","label":"Necessidade de reavaliação","required":false,"options":["Sim","Não"]},
          {"id":"observacoes_finais","type":"textarea","label":"Observações finais","required":false}
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
