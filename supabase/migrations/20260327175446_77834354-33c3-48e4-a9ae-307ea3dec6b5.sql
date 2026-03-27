
-- Update Anamnese Geral Adulto as default
UPDATE anamnesis_templates SET is_default = false WHERE specialty_id = 'b6795527-da40-421c-9004-1aedb5a6148b' AND clinic_id = 'f95ac79d-9ceb-4e20-83b0-0592276faac1';
UPDATE anamnesis_templates SET is_default = true WHERE id = '8b5d3ecd-42af-4c16-8db6-f0fe35e00b1a';

-- Update version structure for Anamnese Geral Adulto
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"queixa_principal","title":"Queixa Principal","fields":[
    {"id":"queixa_principal_texto","name":"queixa_principal","label":"Queixa principal","type":"textarea","required":true,"placeholder":"Descreva a queixa principal"}
  ]},
  {"id":"historia_doenca_atual","title":"História da Doença Atual","fields":[
    {"id":"historia_doenca_atual_texto","name":"historia_doenca_atual","label":"História da doença atual","type":"textarea","required":false},
    {"id":"inicio_sintomas","name":"inicio_sintomas","label":"Início dos sintomas","type":"text","required":false},
    {"id":"tempo_evolucao","name":"tempo_evolucao","label":"Tempo de evolução","type":"text","required":false},
    {"id":"fatores_melhora","name":"fatores_melhora","label":"Fatores de melhora","type":"textarea","required":false},
    {"id":"fatores_piora","name":"fatores_piora","label":"Fatores de piora","type":"textarea","required":false},
    {"id":"sintomas_associados","name":"sintomas_associados","label":"Sintomas associados","type":"textarea","required":false}
  ]},
  {"id":"revisao_sistemas","title":"Revisão de Sistemas","fields":[
    {"id":"revisao_sistemas_texto","name":"revisao_sistemas","label":"Revisão de sistemas","type":"textarea","required":false}
  ]},
  {"id":"antecedentes_pessoais","title":"Antecedentes Pessoais","fields":[
    {"id":"antecedentes_pessoais_texto","name":"antecedentes_pessoais","label":"Antecedentes pessoais relevantes","type":"textarea","required":false},
    {"id":"cirurgias_previas","name":"cirurgias_previas","label":"Cirurgias prévias","type":"textarea","required":false},
    {"id":"internacoes_previas","name":"internacoes_previas","label":"Internações prévias","type":"textarea","required":false},
    {"id":"alergias","name":"alergias","label":"Alergias","type":"textarea","required":false},
    {"id":"medicamentos_uso","name":"medicamentos_uso","label":"Medicamentos em uso","type":"textarea","required":false}
  ]},
  {"id":"antecedentes_familiares","title":"Antecedentes Familiares","fields":[
    {"id":"antecedentes_familiares_texto","name":"antecedentes_familiares","label":"Antecedentes familiares relevantes","type":"textarea","required":false}
  ]},
  {"id":"habitos_vida","title":"Hábitos de Vida","fields":[
    {"id":"tabagismo","name":"tabagismo","label":"Tabagismo","type":"select","required":false,"options":["Não","Sim","Ex-tabagista"]},
    {"id":"etilismo","name":"etilismo","label":"Etilismo","type":"select","required":false,"options":["Não","Sim","Social"]},
    {"id":"atividade_fisica","name":"atividade_fisica","label":"Atividade física","type":"select","required":false,"options":["Sedentário","Leve","Moderada","Intensa"]},
    {"id":"alimentacao","name":"alimentacao","label":"Alimentação","type":"textarea","required":false},
    {"id":"sono","name":"sono","label":"Sono","type":"textarea","required":false}
  ]},
  {"id":"sinais_vitais_exame_fisico","title":"Sinais Vitais e Exame Físico","fields":[
    {"id":"pressao_arterial","name":"pressao_arterial","label":"Pressão arterial","type":"text","required":false},
    {"id":"frequencia_cardiaca","name":"frequencia_cardiaca","label":"Frequência cardíaca","type":"text","required":false},
    {"id":"frequencia_respiratoria","name":"frequencia_respiratoria","label":"Frequência respiratória","type":"text","required":false},
    {"id":"temperatura","name":"temperatura","label":"Temperatura","type":"text","required":false},
    {"id":"saturacao","name":"saturacao","label":"Saturação de O2","type":"text","required":false},
    {"id":"peso","name":"peso","label":"Peso","type":"text","required":false},
    {"id":"altura","name":"altura","label":"Altura","type":"text","required":false},
    {"id":"exame_fisico_geral","name":"exame_fisico_geral","label":"Exame físico geral","type":"textarea","required":false}
  ]},
  {"id":"hipoteses_diagnosticas","title":"Hipóteses Diagnósticas","fields":[
    {"id":"hipoteses_diagnosticas_texto","name":"hipoteses_diagnosticas","label":"Hipóteses diagnósticas","type":"textarea","required":false}
  ]},
  {"id":"plano_conduta","title":"Plano / Conduta","fields":[
    {"id":"plano_conduta_texto","name":"plano_conduta","label":"Plano / conduta","type":"textarea","required":false},
    {"id":"exames_solicitados","name":"exames_solicitados","label":"Exames solicitados","type":"textarea","required":false},
    {"id":"orientacoes","name":"orientacoes","label":"Orientações","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = '32ccb443-6019-43ab-b691-66c9d54a79b2';

-- Update version structure for Anamnese de Primeira Consulta
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"motivo_consulta","title":"Motivo da Consulta","fields":[
    {"id":"motivo_consulta_texto","name":"motivo_consulta","label":"Motivo da consulta","type":"textarea","required":true}
  ]},
  {"id":"historia_clinica_atual","title":"História Clínica Atual","fields":[
    {"id":"historia_clinica_atual_texto","name":"historia_clinica_atual","label":"História clínica atual","type":"textarea","required":false},
    {"id":"tempo_evolucao_primeira_consulta","name":"tempo_evolucao_primeira_consulta","label":"Tempo de evolução","type":"text","required":false},
    {"id":"tratamentos_previos","name":"tratamentos_previos","label":"Tratamentos prévios realizados","type":"textarea","required":false}
  ]},
  {"id":"antecedentes_clinicos","title":"Antecedentes Clínicos","fields":[
    {"id":"doencas_previas","name":"doencas_previas","label":"Doenças prévias","type":"textarea","required":false},
    {"id":"comorbidades","name":"comorbidades","label":"Comorbidades","type":"textarea","required":false},
    {"id":"cirurgias_previas_primeira_consulta","name":"cirurgias_previas_primeira_consulta","label":"Cirurgias prévias","type":"textarea","required":false},
    {"id":"internacoes_primeira_consulta","name":"internacoes_primeira_consulta","label":"Internações","type":"textarea","required":false},
    {"id":"alergias_primeira_consulta","name":"alergias_primeira_consulta","label":"Alergias","type":"textarea","required":false},
    {"id":"medicamentos_uso_primeira_consulta","name":"medicamentos_uso_primeira_consulta","label":"Medicamentos em uso","type":"textarea","required":false}
  ]},
  {"id":"historico_familiar","title":"Histórico Familiar","fields":[
    {"id":"historico_familiar_texto","name":"historico_familiar","label":"Histórico familiar","type":"textarea","required":false}
  ]},
  {"id":"habitos_estilo_vida","title":"Hábitos e Estilo de Vida","fields":[
    {"id":"tabagismo_primeira_consulta","name":"tabagismo_primeira_consulta","label":"Tabagismo","type":"select","required":false,"options":["Não","Sim","Ex-tabagista"]},
    {"id":"etilismo_primeira_consulta","name":"etilismo_primeira_consulta","label":"Etilismo","type":"select","required":false,"options":["Não","Sim","Social"]},
    {"id":"uso_substancias","name":"uso_substancias","label":"Uso de substâncias","type":"textarea","required":false},
    {"id":"atividade_fisica_primeira_consulta","name":"atividade_fisica_primeira_consulta","label":"Atividade física","type":"textarea","required":false},
    {"id":"alimentacao_primeira_consulta","name":"alimentacao_primeira_consulta","label":"Alimentação","type":"textarea","required":false},
    {"id":"sono_primeira_consulta","name":"sono_primeira_consulta","label":"Sono","type":"textarea","required":false}
  ]},
  {"id":"imunizacao_preventivos","title":"Imunização e Preventivos","fields":[
    {"id":"vacinacao","name":"vacinacao","label":"Situação vacinal","type":"textarea","required":false},
    {"id":"rastreios_previos","name":"rastreios_previos","label":"Rastreios prévios","type":"textarea","required":false}
  ]},
  {"id":"exame_fisico_inicial","title":"Exame Físico Inicial","fields":[
    {"id":"sinais_vitais_primeira_consulta","name":"sinais_vitais_primeira_consulta","label":"Sinais vitais","type":"textarea","required":false},
    {"id":"exame_fisico_inicial_texto","name":"exame_fisico_inicial","label":"Exame físico inicial","type":"textarea","required":false}
  ]},
  {"id":"avaliacao_clinica","title":"Avaliação Clínica","fields":[
    {"id":"impressao_clinica","name":"impressao_clinica","label":"Impressão clínica inicial","type":"textarea","required":false},
    {"id":"hipoteses_diagnosticas_primeira_consulta","name":"hipoteses_diagnosticas_primeira_consulta","label":"Hipóteses diagnósticas","type":"textarea","required":false},
    {"id":"plano_inicial","name":"plano_inicial","label":"Plano inicial","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = '4d7b9ff2-2529-4cda-99ab-3a3deb73636b';

-- Update version structure for Anamnese de Retorno
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"motivo_retorno","title":"Motivo do Retorno","fields":[
    {"id":"motivo_retorno_texto","name":"motivo_retorno","label":"Motivo do retorno","type":"textarea","required":true}
  ]},
  {"id":"evolucao_clinica","title":"Evolução Clínica","fields":[
    {"id":"evolucao_desde_ultima_consulta","name":"evolucao_desde_ultima_consulta","label":"Evolução desde a última consulta","type":"textarea","required":false},
    {"id":"melhora_piora_estabilidade","name":"melhora_piora_estabilidade","label":"Evolução referida","type":"radio","required":false,"options":["Melhora","Piora","Estável"]},
    {"id":"novos_sintomas","name":"novos_sintomas","label":"Novos sintomas","type":"textarea","required":false},
    {"id":"persistencia_sintomas","name":"persistencia_sintomas","label":"Persistência dos sintomas prévios","type":"textarea","required":false}
  ]},
  {"id":"tratamento_em_curso","title":"Tratamento em Curso","fields":[
    {"id":"adesao_tratamento","name":"adesao_tratamento","label":"Adesão ao tratamento","type":"textarea","required":false},
    {"id":"uso_medicacoes_retorno","name":"uso_medicacoes_retorno","label":"Uso das medicações prescritas","type":"textarea","required":false},
    {"id":"efeitos_adversos_retorno","name":"efeitos_adversos_retorno","label":"Efeitos adversos","type":"textarea","required":false},
    {"id":"exames_realizados","name":"exames_realizados","label":"Exames realizados desde a última consulta","type":"textarea","required":false}
  ]},
  {"id":"reavaliacao_clinica","title":"Reavaliação Clínica","fields":[
    {"id":"sinais_vitais_retorno","name":"sinais_vitais_retorno","label":"Sinais vitais","type":"textarea","required":false},
    {"id":"exame_fisico_retorno","name":"exame_fisico_retorno","label":"Exame físico de retorno","type":"textarea","required":false},
    {"id":"reavaliacao_clinica_texto","name":"reavaliacao_clinica","label":"Reavaliação clínica","type":"textarea","required":false}
  ]},
  {"id":"conduta_retorno","title":"Conduta","fields":[
    {"id":"hipoteses_diagnosticas_retorno","name":"hipoteses_diagnosticas_retorno","label":"Hipóteses diagnósticas","type":"textarea","required":false},
    {"id":"ajuste_conduta","name":"ajuste_conduta","label":"Ajuste de conduta","type":"textarea","required":false},
    {"id":"orientacoes_retorno","name":"orientacoes_retorno","label":"Orientações","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = 'fde95f87-a559-47b4-8c9a-d5f8e4b4ac99';

-- Update version structure for Anamnese de Queixa Aguda
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"queixa_aguda","title":"Queixa Aguda","fields":[
    {"id":"queixa_aguda_texto","name":"queixa_aguda","label":"Queixa aguda","type":"textarea","required":true},
    {"id":"inicio_quadro","name":"inicio_quadro","label":"Início do quadro","type":"text","required":false},
    {"id":"tempo_evolucao_aguda","name":"tempo_evolucao_aguda","label":"Tempo de evolução","type":"text","required":false}
  ]},
  {"id":"caracterizacao_quadro","title":"Caracterização do Quadro","fields":[
    {"id":"descricao_sintomas","name":"descricao_sintomas","label":"Descrição dos sintomas","type":"textarea","required":false},
    {"id":"intensidade","name":"intensidade","label":"Intensidade","type":"select","required":false,"options":["Leve","Moderada","Intensa"]},
    {"id":"frequencia","name":"frequencia","label":"Frequência","type":"text","required":false},
    {"id":"fatores_melhora_aguda","name":"fatores_melhora_aguda","label":"Fatores de melhora","type":"textarea","required":false},
    {"id":"fatores_piora_aguda","name":"fatores_piora_aguda","label":"Fatores de piora","type":"textarea","required":false},
    {"id":"sintomas_associados_aguda","name":"sintomas_associados_aguda","label":"Sintomas associados","type":"textarea","required":false}
  ]},
  {"id":"sinais_alarme","title":"Sinais de Alarme","fields":[
    {"id":"sinais_alarme_texto","name":"sinais_alarme","label":"Sinais de alarme","type":"textarea","required":false},
    {"id":"gravidade_percebida","name":"gravidade_percebida","label":"Gravidade clínica inicial","type":"radio","required":false,"options":["Baixa","Moderada","Alta"]}
  ]},
  {"id":"exame_clinico_agudo","title":"Exame Clínico","fields":[
    {"id":"sinais_vitais_aguda","name":"sinais_vitais_aguda","label":"Sinais vitais","type":"textarea","required":false},
    {"id":"exame_fisico_focado","name":"exame_fisico_focado","label":"Exame físico focado","type":"textarea","required":false}
  ]},
  {"id":"avaliacao_conduta_aguda","title":"Avaliação e Conduta","fields":[
    {"id":"hipotese_principal","name":"hipotese_principal","label":"Hipótese principal","type":"textarea","required":false},
    {"id":"diagnosticos_diferenciais","name":"diagnosticos_diferenciais","label":"Diagnósticos diferenciais","type":"textarea","required":false},
    {"id":"conduta_imediata","name":"conduta_imediata","label":"Conduta imediata","type":"textarea","required":false},
    {"id":"necessidade_encaminhamento","name":"necessidade_encaminhamento","label":"Necessidade de encaminhamento","type":"radio","required":false,"options":["Não","Sim"]},
    {"id":"orientacoes_aguda","name":"orientacoes_aguda","label":"Orientações","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = 'bb52d107-e4db-4704-a350-82ccb42e618b';

-- Update version structure for Anamnese de Doença Crônica / Seguimento
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"doenca_acompanhamento","title":"Doença em Acompanhamento","fields":[
    {"id":"diagnostico_cronico","name":"diagnostico_cronico","label":"Doença crônica em acompanhamento","type":"textarea","required":true},
    {"id":"tempo_doenca","name":"tempo_doenca","label":"Tempo de diagnóstico","type":"text","required":false},
    {"id":"acompanhamento_regular","name":"acompanhamento_regular","label":"Faz acompanhamento regular","type":"radio","required":false,"options":["Sim","Não"]}
  ]},
  {"id":"controle_clinico_cronico","title":"Controle Clínico","fields":[
    {"id":"sintomas_atuais","name":"sintomas_atuais","label":"Sintomas atuais","type":"textarea","required":false},
    {"id":"controle_referido","name":"controle_referido","label":"Controle referido pelo paciente","type":"textarea","required":false},
    {"id":"complicacoes","name":"complicacoes","label":"Complicações","type":"textarea","required":false},
    {"id":"descompensacoes_recentes","name":"descompensacoes_recentes","label":"Descompensações recentes","type":"textarea","required":false}
  ]},
  {"id":"tratamento_atual_cronico","title":"Tratamento Atual","fields":[
    {"id":"medicacoes_uso_cronico","name":"medicacoes_uso_cronico","label":"Medicações em uso","type":"textarea","required":false},
    {"id":"adesao_tratamento_cronico","name":"adesao_tratamento_cronico","label":"Adesão ao tratamento","type":"textarea","required":false},
    {"id":"efeitos_adversos_cronico","name":"efeitos_adversos_cronico","label":"Efeitos adversos","type":"textarea","required":false},
    {"id":"controle_domiciliar","name":"controle_domiciliar","label":"Controle domiciliar quando aplicável","type":"textarea","required":false}
  ]},
  {"id":"habitos_fatores_risco_cronico","title":"Hábitos e Fatores de Risco","fields":[
    {"id":"alimentacao_cronico","name":"alimentacao_cronico","label":"Alimentação","type":"textarea","required":false},
    {"id":"atividade_fisica_cronico","name":"atividade_fisica_cronico","label":"Atividade física","type":"textarea","required":false},
    {"id":"tabagismo_cronico","name":"tabagismo_cronico","label":"Tabagismo","type":"textarea","required":false},
    {"id":"etilismo_cronico","name":"etilismo_cronico","label":"Etilismo","type":"textarea","required":false}
  ]},
  {"id":"reavaliacao_cronico","title":"Reavaliação","fields":[
    {"id":"sinais_vitais_cronico","name":"sinais_vitais_cronico","label":"Sinais vitais","type":"textarea","required":false},
    {"id":"exame_fisico_cronico","name":"exame_fisico_cronico","label":"Exame físico","type":"textarea","required":false},
    {"id":"exames_controle","name":"exames_controle","label":"Exames de controle","type":"textarea","required":false},
    {"id":"metas_terapeuticas","name":"metas_terapeuticas","label":"Metas terapêuticas","type":"textarea","required":false}
  ]},
  {"id":"conduta_cronico","title":"Conduta","fields":[
    {"id":"avaliacao_clinica_cronico","name":"avaliacao_clinica_cronico","label":"Avaliação clínica","type":"textarea","required":false},
    {"id":"ajuste_tratamento","name":"ajuste_tratamento","label":"Ajuste do tratamento","type":"textarea","required":false},
    {"id":"orientacoes_cronico","name":"orientacoes_cronico","label":"Orientações","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = '99dd5051-811f-40cf-bb51-fc1cd0019863';

-- Update version structure for Anamnese de Check-up / Preventiva
UPDATE anamnesis_template_versions SET structure = '[
  {"id":"objetivo_consulta_checkup","title":"Objetivo da Consulta","fields":[
    {"id":"objetivo_checkup","name":"objetivo_checkup","label":"Objetivo do check-up","type":"textarea","required":true}
  ]},
  {"id":"historico_clinico_checkup","title":"Histórico Clínico","fields":[
    {"id":"historico_pessoal","name":"historico_pessoal","label":"Histórico pessoal","type":"textarea","required":false},
    {"id":"historico_familiar_checkup","name":"historico_familiar_checkup","label":"Histórico familiar","type":"textarea","required":false},
    {"id":"doencas_previas_checkup","name":"doencas_previas_checkup","label":"Doenças prévias","type":"textarea","required":false},
    {"id":"medicamentos_uso_checkup","name":"medicamentos_uso_checkup","label":"Medicamentos em uso","type":"textarea","required":false},
    {"id":"alergias_checkup","name":"alergias_checkup","label":"Alergias","type":"textarea","required":false}
  ]},
  {"id":"fatores_risco_checkup","title":"Fatores de Risco","fields":[
    {"id":"risco_cardiovascular","name":"risco_cardiovascular","label":"Fatores de risco cardiovascular","type":"textarea","required":false},
    {"id":"tabagismo_checkup","name":"tabagismo_checkup","label":"Tabagismo","type":"select","required":false,"options":["Não","Sim","Ex-tabagista"]},
    {"id":"etilismo_checkup","name":"etilismo_checkup","label":"Etilismo","type":"select","required":false,"options":["Não","Sim","Social"]},
    {"id":"atividade_fisica_checkup","name":"atividade_fisica_checkup","label":"Atividade física","type":"textarea","required":false},
    {"id":"alimentacao_checkup","name":"alimentacao_checkup","label":"Alimentação","type":"textarea","required":false},
    {"id":"sono_checkup","name":"sono_checkup","label":"Sono","type":"textarea","required":false}
  ]},
  {"id":"prevencao_rastreios_checkup","title":"Prevenção e Rastreios","fields":[
    {"id":"vacinacao_checkup","name":"vacinacao_checkup","label":"Situação vacinal","type":"textarea","required":false},
    {"id":"rastreios_previos_checkup","name":"rastreios_previos_checkup","label":"Rastreios prévios","type":"textarea","required":false},
    {"id":"historico_exames_preventivos","name":"historico_exames_preventivos","label":"Histórico de exames preventivos","type":"textarea","required":false}
  ]},
  {"id":"avaliacao_clinica_checkup","title":"Avaliação Clínica","fields":[
    {"id":"sinais_vitais_checkup","name":"sinais_vitais_checkup","label":"Sinais vitais","type":"textarea","required":false},
    {"id":"exame_fisico_geral_checkup","name":"exame_fisico_geral_checkup","label":"Exame físico geral","type":"textarea","required":false}
  ]},
  {"id":"plano_preventivo_checkup","title":"Plano Preventivo","fields":[
    {"id":"exames_solicitados_checkup","name":"exames_solicitados_checkup","label":"Exames solicitados","type":"textarea","required":false},
    {"id":"orientacoes_preventivas","name":"orientacoes_preventivas","label":"Orientações preventivas","type":"textarea","required":false},
    {"id":"plano_acompanhamento","name":"plano_acompanhamento","label":"Plano de acompanhamento","type":"textarea","required":false}
  ]}
]'::jsonb WHERE id = '12a1431d-c769-43af-95c9-f691b01f6c99';

-- Also update campos column on the templates to match (used as fallback)
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '32ccb443-6019-43ab-b691-66c9d54a79b2') WHERE id = '8b5d3ecd-42af-4c16-8db6-f0fe35e00b1a';
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '4d7b9ff2-2529-4cda-99ab-3a3deb73636b') WHERE id = 'a4be2331-12b9-4e5b-ad0a-ff64c60d2bbb';
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = 'fde95f87-a559-47b4-8c9a-d5f8e4b4ac99') WHERE id = '8ae730e2-0c0a-4786-982d-f05636963eb5';
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = 'bb52d107-e4db-4704-a350-82ccb42e618b') WHERE id = '80c2b7aa-6be5-4c92-8cf9-b026e16a7c15';
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '99dd5051-811f-40cf-bb51-fc1cd0019863') WHERE id = '85e57908-07c7-4758-87d9-d24e6a3e1e4d';
UPDATE anamnesis_templates SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '12a1431d-c769-43af-95c9-f691b01f6c99') WHERE id = '3f2d8883-007a-4442-b561-0bb648c5aa67';
