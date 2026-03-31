
-- Deactivate placeholder template
UPDATE anamnesis_templates 
SET is_active = false, archived = true 
WHERE id = 'b58afd3f-e64e-41e0-b555-9ff99c7c2007';

-- =============================================
-- MODEL 1: Anamnese Pediátrica Geral (YesClin)
-- =============================================
INSERT INTO anamnesis_templates (
  id, clinic_id, name, description, specialty, specialty_id,
  is_active, is_default, is_system, version,
  campos, fields
) VALUES (
  gen_random_uuid(),
  (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
  'Anamnese Pediátrica Geral (YesClin)',
  'Modelo pediátrico geral para avaliação inicial completa.',
  'pediatria',
  '96d3c2cd-1d41-401b-9e53-21e2425f1929',
  true, true, true, 1,
  '[]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('title','Identificação do Atendimento','fields',jsonb_build_array(
      jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
      jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
      jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Puericultura','Intercorrência')),
      jsonb_build_object('name','primeira_consulta_retorno','label','Primeira consulta ou retorno','type','radio','required',false,'options',jsonb_build_array('Primeira consulta','Retorno')),
      jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
      jsonb_build_object('name','grau_parentesco','label','Grau de parentesco do responsável','type','text','required',false),
      jsonb_build_object('name','encaminhamento','label','Encaminhamento','type','text','required',false),
      jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Queixa Principal','fields',jsonb_build_array(
      jsonb_build_object('name','queixa_principal','label','Queixa principal','type','textarea','required',true),
      jsonb_build_object('name','motivo_consulta','label','Motivo da consulta','type','textarea','required',false),
      jsonb_build_object('name','tempo_evolucao','label','Tempo de evolução','type','text','required',false),
      jsonb_build_object('name','inicio_quadro','label','Início do quadro','type','select','required',false,'options',jsonb_build_array('Súbito','Gradual','Recorrente','Desconhecido')),
      jsonb_build_object('name','febre','label','Febre','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','tosse','label','Tosse','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','dor','label','Dor','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','localizacao_queixa','label','Localização da principal queixa','type','text','required',false),
      jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false),
      jsonb_build_object('name','objetivo_crianca','label','Objetivo da criança quando aplicável','type','textarea','required',false)
    )),
    jsonb_build_object('title','História da Doença Atual','fields',jsonb_build_array(
      jsonb_build_object('name','descricao_quadro_atual','label','Descrição detalhada do quadro atual','type','textarea','required',false),
      jsonb_build_object('name','evolucao_quadro','label','Evolução do quadro','type','textarea','required',false),
      jsonb_build_object('name','fatores_melhora','label','Fatores de melhora','type','textarea','required',false),
      jsonb_build_object('name','fatores_piora','label','Fatores de piora','type','textarea','required',false),
      jsonb_build_object('name','sintomas_associados','label','Sintomas associados','type','textarea','required',false),
      jsonb_build_object('name','uso_medicacao_previa','label','Uso de medicação prévia','type','textarea','required',false),
      jsonb_build_object('name','atendimento_previo','label','Atendimento prévio para o mesmo quadro','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','internacao_recente','label','Internação recente','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','contato_doentes','label','Contato com pessoas doentes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_historia_atual','label','Observações da história atual','type','textarea','required',false)
    )),
    jsonb_build_object('title','Antecedentes Gestacionais e Neonatais','fields',jsonb_build_array(
      jsonb_build_object('name','gestacao_sem_intercorrencias','label','Gestação sem intercorrências','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','intercorrencias_gestacao','label','Intercorrências na gestação','type','textarea','required',false),
      jsonb_build_object('name','tipo_parto','label','Tipo de parto','type','select','required',false,'options',jsonb_build_array('Normal','Cesáreo','Fórceps')),
      jsonb_build_object('name','prematuridade','label','Prematuridade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','ig_nascer','label','Idade gestacional ao nascer','type','text','required',false),
      jsonb_build_object('name','peso_nascer','label','Peso ao nascer','type','text','required',false),
      jsonb_build_object('name','apgar','label','Apgar quando disponível','type','text','required',false),
      jsonb_build_object('name','internacao_neonatal','label','Internação neonatal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','ictericia_neonatal','label','Icterícia neonatal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','uti_neonatal','label','Necessidade de UTI neonatal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_neonatais','label','Observações neonatais relevantes','type','textarea','required',false)
    )),
    jsonb_build_object('title','Antecedentes Pessoais','fields',jsonb_build_array(
      jsonb_build_object('name','doencas_previas','label','Doenças prévias relevantes','type','textarea','required',false),
      jsonb_build_object('name','internacoes_previas','label','Internações prévias','type','textarea','required',false),
      jsonb_build_object('name','cirurgias_previas','label','Cirurgias prévias','type','textarea','required',false),
      jsonb_build_object('name','alergias','label','Alergias','type','select','required',false,'options',jsonb_build_array('Não','Sim')),
      jsonb_build_object('name','alergias_descricao','label','Descrição das alergias','type','textarea','required',false),
      jsonb_build_object('name','medicamentos_continuos','label','Uso contínuo de medicamentos','type','textarea','required',false),
      jsonb_build_object('name','doencas_respiratorias','label','Doenças respiratórias prévias','type','textarea','required',false),
      jsonb_build_object('name','convulsoes_previas','label','Convulsões prévias','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','doencas_cronicas','label','Doenças crônicas conhecidas','type','textarea','required',false),
      jsonb_build_object('name','obs_clinicas','label','Observações clínicas relevantes','type','textarea','required',false)
    )),
    jsonb_build_object('title','Alimentação e Hábitos','fields',jsonb_build_array(
      jsonb_build_object('name','amamentacao','label','Amamentação','type','select','required',false,'options',jsonb_build_array('Exclusiva','Predominante','Mista','Não amamenta')),
      jsonb_build_object('name','tempo_aleitamento','label','Tempo de aleitamento','type','text','required',false),
      jsonb_build_object('name','introducao_alimentar','label','Introdução alimentar','type','textarea','required',false),
      jsonb_build_object('name','alimentacao_atual','label','Alimentação atual','type','select','required',false,'options',jsonb_build_array('Adequada','Seletiva','Dificuldade alimentar','Em avaliação')),
      jsonb_build_object('name','seletividade','label','Seletividade alimentar','type','textarea','required',false),
      jsonb_build_object('name','ingesta_hidrica','label','Ingesta hídrica','type','text','required',false),
      jsonb_build_object('name','uso_mamadeira','label','Uso de mamadeira','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','uso_chupeta','label','Uso de chupeta','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','sono','label','Sono','type','select','required',false,'options',jsonb_build_array('Adequado','Irregular','Despertares frequentes','Dificuldade para dormir')),
      jsonb_build_object('name','atividade_fisica','label','Atividade física ou brincadeiras ativas','type','textarea','required',false),
      jsonb_build_object('name','tempo_tela','label','Tempo de tela','type','text','required',false),
      jsonb_build_object('name','obs_habitos','label','Observações de hábitos','type','textarea','required',false)
    )),
    jsonb_build_object('title','Crescimento e Desenvolvimento','fields',jsonb_build_array(
      jsonb_build_object('name','dnpm_percebido','label','Desenvolvimento neuropsicomotor percebido','type','select','required',false,'options',jsonb_build_array('Adequado','Atenção','Atraso suspeito')),
      jsonb_build_object('name','sustentou_cabeca','label','Sustentou cabeça no tempo esperado','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não sabe')),
      jsonb_build_object('name','sentou','label','Sentou no tempo esperado','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não sabe')),
      jsonb_build_object('name','andou','label','Andou no tempo esperado','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não sabe')),
      jsonb_build_object('name','fala_adequada','label','Fala adequada para a idade','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Em avaliação')),
      jsonb_build_object('name','interacao_social','label','Interação social adequada','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Em avaliação')),
      jsonb_build_object('name','aprendizado_escolar','label','Aprendizado escolar quando aplicável','type','textarea','required',false),
      jsonb_build_object('name','sinais_atraso','label','Sinais de atraso percebido','type','textarea','required',false),
      jsonb_build_object('name','avaliacao_desenvolvimento','label','Necessidade de avaliação complementar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_desenvolvimento','label','Observações do desenvolvimento','type','textarea','required',false)
    )),
    jsonb_build_object('title','Eliminações e Rotina Fisiológica','fields',jsonb_build_array(
      jsonb_build_object('name','evacuacao','label','Evacuação','type','select','required',false,'options',jsonb_build_array('Normal','Constipação','Diarreia','Irregular')),
      jsonb_build_object('name','miccao','label','Micção','type','select','required',false,'options',jsonb_build_array('Normal','Reduzida','Aumentada','Dolorosa')),
      jsonb_build_object('name','controle_esfincteriano','label','Controle esfincteriano','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Parcial','Não se aplica')),
      jsonb_build_object('name','dor_evacuar','label','Dor ao evacuar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','dor_urinar','label','Dor ao urinar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','enurese','label','Enurese','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','encoprese','label','Encoprese','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','obs_fisiologica','label','Observações da rotina fisiológica','type','textarea','required',false)
    )),
    jsonb_build_object('title','Vacinação e Prevenção','fields',jsonb_build_array(
      jsonb_build_object('name','vacinacao','label','Vacinação','type','select','required',false,'options',jsonb_build_array('Em dia','Atrasada','Incompleta','Não informado')),
      jsonb_build_object('name','carteira_vacinacao','label','Carteira de vacinação apresentada','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','vacinas_atrasadas','label','Vacinas atrasadas','type','textarea','required',false),
      jsonb_build_object('name','reacoes_vacinais','label','Reações vacinais relevantes','type','textarea','required',false),
      jsonb_build_object('name','suplementacao','label','Suplementação em uso','type','textarea','required',false),
      jsonb_build_object('name','puericultura_regular','label','Acompanhamento regular em puericultura','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_preventivas','label','Observações preventivas','type','textarea','required',false)
    )),
    jsonb_build_object('title','Contexto Familiar e Social','fields',jsonb_build_array(
      jsonb_build_object('name','quem_mora','label','Quem mora com a criança','type','textarea','required',false),
      jsonb_build_object('name','escola_creche','label','Frequenta escola ou creche','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','exposicao_fumantes','label','Exposição a fumantes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','animais_casa','label','Animais em casa','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','situacao_social','label','Situação social relevante','type','textarea','required',false),
      jsonb_build_object('name','rede_apoio','label','Rede de apoio familiar','type','textarea','required',false),
      jsonb_build_object('name','historico_familiar','label','Histórico familiar relevante','type','textarea','required',false),
      jsonb_build_object('name','doencas_hereditarias','label','Doenças hereditárias conhecidas','type','textarea','required',false),
      jsonb_build_object('name','obs_sociais','label','Observações sociais e familiares','type','textarea','required',false)
    )),
    jsonb_build_object('title','Avaliação Clínica Inicial Subjetiva','fields',jsonb_build_array(
      jsonb_build_object('name','estado_geral','label','Estado geral percebido','type','select','required',false,'options',jsonb_build_array('Bom','Regular','Ruim')),
      jsonb_build_object('name','atividade_crianca','label','Atividade da criança','type','select','required',false,'options',jsonb_build_array('Ativa','Hipoativa','Prostrada')),
      jsonb_build_object('name','apetite','label','Apetite','type','select','required',false,'options',jsonb_build_array('Preservado','Reduzido','Ausente')),
      jsonb_build_object('name','hidratacao_percebida','label','Hidratação percebida','type','select','required',false,'options',jsonb_build_array('Adequada','Suspeita de desidratação','Desidratada')),
      jsonb_build_object('name','sono_prejudicado','label','Sono prejudicado pelo quadro atual','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','sinais_alerta_responsavel','label','Sinais de alerta percebidos pelo responsável','type','textarea','required',false),
      jsonb_build_object('name','limitacao_funcional','label','Limitação funcional atual','type','textarea','required',false),
      jsonb_build_object('name','obs_clinicas_iniciais','label','Observações clínicas iniciais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Hipóteses Iniciais','fields',jsonb_build_array(
      jsonb_build_object('name','hipotese_principal','label','Hipótese principal','type','text','required',false),
      jsonb_build_object('name','hipoteses_secundarias','label','Hipóteses secundárias','type','textarea','required',false),
      jsonb_build_object('name','avaliacao_clinica_complementar','label','Necessidade de avaliação clínica complementar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','exames_complementares_necessidade','label','Necessidade de exames complementares','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','necessidade_observacao','label','Necessidade de observação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','necessidade_encaminhamento','label','Necessidade de encaminhamento','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','urgencia_clinica','label','Urgência clínica','type','select','required',false,'options',jsonb_build_array('Eletivo','Prioritário','Urgente')),
      jsonb_build_object('name','risco_clinico','label','Risco clínico','type','select','required',false,'options',jsonb_build_array('Baixo','Moderado','Alto')),
      jsonb_build_object('name','obs_diagnosticas','label','Observações diagnósticas iniciais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
      jsonb_build_object('name','conduta_inicial','label','Conduta inicial sugerida','type','textarea','required',false),
      jsonb_build_object('name','exames_solicitados','label','Exames complementares solicitados','type','textarea','required',false),
      jsonb_build_object('name','prescricao_orientada','label','Prescrição orientada','type','textarea','required',false),
      jsonb_build_object('name','orientacoes_responsavel','label','Orientações dadas ao responsável','type','textarea','required',false),
      jsonb_build_object('name','sinais_alarme','label','Sinais de alarme orientados','type','textarea','required',false),
      jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','prioridade_acompanhamento','label','Prioridade de acompanhamento','type','select','required',false,'options',jsonb_build_array('Baixa','Moderada','Alta')),
      jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
    ))
  )
);

-- Create version for Model 1
INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese Pediátrica Geral (YesClin)' AND specialty = 'pediatria';

-- =============================================
-- MODEL 2: Anamnese de Puericultura
-- =============================================
INSERT INTO anamnesis_templates (
  id, clinic_id, name, description, specialty, specialty_id,
  is_active, is_default, is_system, version, campos, fields
) VALUES (
  gen_random_uuid(),
  (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
  'Anamnese de Puericultura',
  'Modelo focado em acompanhamento de rotina, crescimento, desenvolvimento, alimentação, prevenção, sono, vacinação e orientação longitudinal.',
  'pediatria', '96d3c2cd-1d41-401b-9e53-21e2425f1929',
  true, false, true, 1, '[]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('title','Identificação','fields',jsonb_build_array(
      jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
      jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
      jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Puericultura','Retorno','Intercorrência')),
      jsonb_build_object('name','retorno_puericultura','label','Retorno de puericultura','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
      jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Objetivo da Consulta','fields',jsonb_build_array(
      jsonb_build_object('name','motivo_acompanhamento','label','Motivo principal do acompanhamento','type','textarea','required',false),
      jsonb_build_object('name','duvidas_responsavel','label','Dúvidas do responsável','type','textarea','required',false),
      jsonb_build_object('name','queixas_atuais','label','Queixas atuais','type','textarea','required',false),
      jsonb_build_object('name','intercorrencias','label','Intercorrências desde a última consulta','type','textarea','required',false),
      jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false),
      jsonb_build_object('name','obs_gerais','label','Observações gerais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Crescimento','fields',jsonb_build_array(
      jsonb_build_object('name','peso_atual','label','Peso atual informado','type','text','required',false),
      jsonb_build_object('name','altura_atual','label','Altura atual informada','type','text','required',false),
      jsonb_build_object('name','perimetro_cefalico','label','Perímetro cefálico','type','text','required',false),
      jsonb_build_object('name','ganho_ponderal','label','Ganho ponderal percebido','type','select','required',false,'options',jsonb_build_array('Adequado','Insuficiente','Excessivo')),
      jsonb_build_object('name','ganho_estatural','label','Ganho estatural percebido','type','select','required',false,'options',jsonb_build_array('Adequado','Insuficiente','Excessivo')),
      jsonb_build_object('name','preocupacao_crescimento','label','Preocupação com crescimento','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','acompanhamento_especifico','label','Necessidade de acompanhamento específico','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_crescimento','label','Observações do crescimento','type','textarea','required',false)
    )),
    jsonb_build_object('title','Desenvolvimento','fields',jsonb_build_array(
      jsonb_build_object('name','marcos_adequados','label','Marcos do desenvolvimento adequados','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Parcialmente')),
      jsonb_build_object('name','sustentacao_cefalica','label','Sustentação cefálica','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','sentar','label','Sentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','engatinhar','label','Engatinhar','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','andar','label','Andar','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','linguagem','label','Linguagem','type','select','required',false,'options',jsonb_build_array('Adequada','Atenção','Atraso')),
      jsonb_build_object('name','interacao_social','label','Interação social','type','select','required',false,'options',jsonb_build_array('Adequada','Atenção','Atraso')),
      jsonb_build_object('name','aprendizado','label','Aprendizado compatível com idade','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','sinais_atraso','label','Sinais de atraso','type','textarea','required',false),
      jsonb_build_object('name','obs_desenvolvimento','label','Observações do desenvolvimento','type','textarea','required',false)
    )),
    jsonb_build_object('title','Alimentação','fields',jsonb_build_array(
      jsonb_build_object('name','aleitamento_materno','label','Aleitamento materno','type','select','required',false,'options',jsonb_build_array('Exclusivo','Predominante','Misto','Não amamenta','Desmamado')),
      jsonb_build_object('name','formula_infantil','label','Fórmula infantil','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','introducao_alimentar','label','Introdução alimentar','type','textarea','required',false),
      jsonb_build_object('name','aceitacao_alimentar','label','Aceitação alimentar','type','select','required',false,'options',jsonb_build_array('Boa','Regular','Ruim')),
      jsonb_build_object('name','seletividade','label','Seletividade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','ingesta_hidrica','label','Ingesta hídrica','type','text','required',false),
      jsonb_build_object('name','rotina_alimentar','label','Rotina alimentar','type','textarea','required',false),
      jsonb_build_object('name','suplementacao','label','Suplementação','type','textarea','required',false),
      jsonb_build_object('name','obs_alimentares','label','Observações alimentares','type','textarea','required',false)
    )),
    jsonb_build_object('title','Sono e Rotina','fields',jsonb_build_array(
      jsonb_build_object('name','sono_adequado','label','Sono adequado','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','despertares_noturnos','label','Despertares noturnos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','rotina_sono','label','Rotina de sono','type','textarea','required',false),
      jsonb_build_object('name','sonecas_diurnas','label','Sonecas diurnas','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','tempo_tela','label','Tempo de tela','type','text','required',false),
      jsonb_build_object('name','atividade_fisica','label','Atividade física ou brincadeiras','type','textarea','required',false),
      jsonb_build_object('name','obs_rotina','label','Observações da rotina','type','textarea','required',false)
    )),
    jsonb_build_object('title','Eliminações','fields',jsonb_build_array(
      jsonb_build_object('name','evacuacao','label','Evacuação','type','select','required',false,'options',jsonb_build_array('Normal','Constipação','Diarreia','Irregular')),
      jsonb_build_object('name','miccao','label','Micção','type','select','required',false,'options',jsonb_build_array('Normal','Reduzida','Aumentada','Dolorosa')),
      jsonb_build_object('name','controle_esfincteriano','label','Controle esfincteriano','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Parcial','Não se aplica')),
      jsonb_build_object('name','constipacao','label','Constipação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','enurese','label','Enurese','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
      jsonb_build_object('name','obs_eliminacoes','label','Observações das eliminações','type','textarea','required',false)
    )),
    jsonb_build_object('title','Prevenção e Segurança','fields',jsonb_build_array(
      jsonb_build_object('name','vacinacao_dia','label','Vacinação em dia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','suplemento_preventivo','label','Uso de suplemento preventivo','type','textarea','required',false),
      jsonb_build_object('name','exposicao_fumantes','label','Exposição a fumantes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','prevencao_acidentes','label','Prevenção de acidentes','type','textarea','required',false),
      jsonb_build_object('name','saude_bucal','label','Saúde bucal orientada','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','protecao_solar','label','Proteção solar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_preventivas','label','Observações preventivas','type','textarea','required',false)
    )),
    jsonb_build_object('title','Plano de Acompanhamento','fields',jsonb_build_array(
      jsonb_build_object('name','orientacoes_responsavel','label','Orientações ao responsável','type','textarea','required',false),
      jsonb_build_object('name','necessidade_exames','label','Necessidade de exames','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','encaminhamento','label','Encaminhamento complementar','type','textarea','required',false),
      jsonb_build_object('name','pontos_atencao','label','Pontos de atenção','type','textarea','required',false),
      jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
    ))
  )
);

INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese de Puericultura' AND specialty = 'pediatria';

-- =============================================
-- MODEL 3: Anamnese Neonatal
-- =============================================
INSERT INTO anamnesis_templates (
  id, clinic_id, name, description, specialty, specialty_id,
  is_active, is_default, is_system, version, campos, fields
) VALUES (
  gen_random_uuid(),
  (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
  'Anamnese Neonatal',
  'Modelo focado em recém-nascidos e lactentes iniciais, com atenção para gestação, parto, adaptação neonatal, aleitamento e sinais de risco.',
  'pediatria', '96d3c2cd-1d41-401b-9e53-21e2425f1929',
  true, false, true, 1, '[]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('title','Identificação Neonatal','fields',jsonb_build_array(
      jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
      jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
      jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
      jsonb_build_object('name','idade_dias_semanas','label','Idade em dias ou semanas','type','text','required',false),
      jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Intercorrência')),
      jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Histórico Gestacional','fields',jsonb_build_array(
      jsonb_build_object('name','gestacao_planejada','label','Gestação planejada ou não','type','radio','required',false,'options',jsonb_build_array('Planejada','Não planejada')),
      jsonb_build_object('name','prenatal_adequado','label','Pré-natal adequado','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','intercorrencias_gestacionais','label','Intercorrências gestacionais','type','textarea','required',false),
      jsonb_build_object('name','infeccoes_gestacao','label','Infecções na gestação','type','textarea','required',false),
      jsonb_build_object('name','medicacoes_gestacao','label','Uso de medicações na gestação','type','textarea','required',false),
      jsonb_build_object('name','doencas_maternas','label','Doenças maternas','type','textarea','required',false),
      jsonb_build_object('name','obs_gestacionais','label','Observações gestacionais','type','textarea','required',false)
    )),
    jsonb_build_object('title','Parto e Nascimento','fields',jsonb_build_array(
      jsonb_build_object('name','tipo_parto','label','Tipo de parto','type','select','required',false,'options',jsonb_build_array('Normal','Cesáreo','Fórceps')),
      jsonb_build_object('name','ig_nascer','label','Idade gestacional','type','text','required',false),
      jsonb_build_object('name','peso_nascer','label','Peso ao nascer','type','text','required',false),
      jsonb_build_object('name','apgar','label','Apgar','type','text','required',false),
      jsonb_build_object('name','reanimacao','label','Reanimação ao nascer','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','internacao_neonatal','label','Internação neonatal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','uti_neonatal','label','UTI neonatal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','ictericia','label','Icterícia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_nascimento','label','Observações do nascimento','type','textarea','required',false)
    )),
    jsonb_build_object('title','Alimentação Neonatal','fields',jsonb_build_array(
      jsonb_build_object('name','aleitamento_materno','label','Aleitamento materno','type','select','required',false,'options',jsonb_build_array('Exclusivo','Predominante','Misto','Não amamenta')),
      jsonb_build_object('name','pega_adequada','label','Pega adequada','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','dor_materna','label','Dor materna para amamentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','formula_complementar','label','Fórmula complementar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','frequencia_mamadas','label','Frequência de mamadas','type','text','required',false),
      jsonb_build_object('name','ganho_peso_percebido','label','Ganho de peso percebido','type','select','required',false,'options',jsonb_build_array('Adequado','Insuficiente','Excessivo')),
      jsonb_build_object('name','regurgitacao','label','Regurgitação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_alimentares','label','Observações alimentares','type','textarea','required',false)
    )),
    jsonb_build_object('title','Eliminações e Rotina','fields',jsonb_build_array(
      jsonb_build_object('name','diurese','label','Diurese','type','select','required',false,'options',jsonb_build_array('Normal','Reduzida','Aumentada')),
      jsonb_build_object('name','evacuacao','label','Evacuação','type','select','required',false,'options',jsonb_build_array('Normal','Constipação','Diarreia')),
      jsonb_build_object('name','frequencia_eliminacoes','label','Frequência das eliminações','type','text','required',false),
      jsonb_build_object('name','sono','label','Sono','type','select','required',false,'options',jsonb_build_array('Adequado','Irregular','Excessivo')),
      jsonb_build_object('name','irritabilidade','label','Irritabilidade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','choro_excessivo','label','Choro excessivo','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_rotina','label','Observações da rotina','type','textarea','required',false)
    )),
    jsonb_build_object('title','Sinais Clínicos e Alerta','fields',jsonb_build_array(
      jsonb_build_object('name','febre','label','Febre','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','recusa_alimentar','label','Recusa alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','sonolencia_excessiva','label','Sonolência excessiva','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','gemencia','label','Gemência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','cianose','label','Cianose','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','ictericia_atual','label','Icterícia atual','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','dificuldade_respiratoria','label','Dificuldade respiratória','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_clinicas','label','Observações clínicas relevantes','type','textarea','required',false)
    )),
    jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
      jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
      jsonb_build_object('name','orientacoes_responsavel','label','Orientações ao responsável','type','textarea','required',false),
      jsonb_build_object('name','necessidade_observacao','label','Necessidade de observação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','necessidade_encaminhamento','label','Necessidade de encaminhamento','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
      jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
    ))
  )
);

INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese Neonatal' AND specialty = 'pediatria';
