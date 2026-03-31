
-- 1. Rename and activate old templates to match the official 10-model names
UPDATE anamnesis_templates SET name = 'Anamnese Ortopédica / Traumato-Ortopédica', is_active = true WHERE id = '94a18672-402a-4e3c-b534-88a42123d8bb';
UPDATE anamnesis_templates SET name = 'Anamnese Neurológica', is_active = true WHERE id = 'f5404dc5-80b9-4135-9385-4b0697274932';
UPDATE anamnesis_templates SET name = 'Anamnese Geriátrica Funcional', is_active = true WHERE id = '581a464d-3144-4ec7-9caf-0634ae0e6178';

-- 2. Archive duplicates and placeholder
UPDATE anamnesis_templates SET archived = true, is_active = false WHERE id = 'f1d9c952-a991-4f7f-b354-6d2d0fc7aca8';
UPDATE anamnesis_templates SET archived = true, is_active = false WHERE id = '31d5389a-5295-4ee9-886e-6b2bbdaee0a9';
UPDATE anamnesis_templates SET archived = true, is_active = false WHERE id = '485a1bde-5035-48a9-a7e0-e4115f9d252e';
UPDATE anamnesis_templates SET archived = true, is_active = false WHERE id = '9f8a4677-1025-43e5-b96b-1e65febf105b';

-- 3. Create Coluna Vertebral
DO $$
DECLARE
  _template_id UUID;
  _version_id UUID;
  _clinic_id UUID;
  _specialty_id UUID := '1ff6d500-458c-47f8-8e5b-aea513ab9d07';
  _structure JSONB;
BEGIN
  SELECT clinic_id INTO _clinic_id FROM anamnesis_templates WHERE specialty_id = _specialty_id LIMIT 1;
  SELECT id INTO _template_id FROM anamnesis_templates WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = 'Anamnese de Coluna Vertebral' AND archived = false LIMIT 1;
  IF _template_id IS NULL THEN
    _structure := '[
      {"id":"col_identificacao","type":"section","title":"Identificação","fields":[
        {"id":"col_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
        {"id":"col_profissional","type":"text","label":"Profissional responsável","required":true},
        {"id":"col_segmento","type":"select","label":"Segmento principal da coluna","required":false,"options":["Cervical","Torácica","Lombar","Lombossacra","Múltiplos segmentos"]},
        {"id":"col_primeira_avaliacao","type":"radio","label":"Primeira avaliação ou retorno","required":false,"options":["Primeira avaliação","Retorno"]},
        {"id":"col_encaminhamento","type":"text","label":"Encaminhamento","required":false},
        {"id":"col_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
      ]},
      {"id":"col_queixa","type":"section","title":"Queixa Principal da Coluna","fields":[
        {"id":"col_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
        {"id":"col_segmento_acometido","type":"select","label":"Segmento acometido","required":false,"options":["Cervical","Torácica","Lombar","Lombossacra","Múltiplos"]},
        {"id":"col_inicio_sintomas","type":"select","label":"Início dos sintomas","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Desconhecido","Outro"]},
        {"id":"col_tempo_sintomas","type":"text","label":"Tempo de sintomas","required":false},
        {"id":"col_evolucao","type":"select","label":"Evolução clínica","required":false,"options":["Aguda","Subaguda","Crônica","Recorrente"]},
        {"id":"col_crise_continuo","type":"radio","label":"Crise atual ou quadro contínuo","required":false,"options":["Crise atual","Quadro contínuo"]},
        {"id":"col_objetivo","type":"textarea","label":"Objetivo do paciente","required":true}
      ]},
      {"id":"col_dor","type":"section","title":"Características da Dor","fields":[
        {"id":"col_presenca_dor","type":"radio","label":"Presença de dor","required":false,"options":["Sim","Não"]},
        {"id":"col_eva","type":"number","label":"EVA inicial (0-10)","required":false},
        {"id":"col_localizacao","type":"textarea","label":"Localização da dor","required":false},
        {"id":"col_irradiacao","type":"textarea","label":"Irradiação","required":false},
        {"id":"col_lateralidade","type":"radio","label":"Dor unilateral ou bilateral","required":false,"options":["Unilateral","Bilateral"]},
        {"id":"col_dor_repouso","type":"radio","label":"Dor em repouso","required":false,"options":["Sim","Não"]},
        {"id":"col_dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
        {"id":"col_dor_sentado","type":"radio","label":"Dor ao permanecer sentado","required":false,"options":["Sim","Não"]},
        {"id":"col_dor_pe","type":"radio","label":"Dor ao permanecer em pé","required":false,"options":["Sim","Não"]},
        {"id":"col_dor_caminhar","type":"radio","label":"Dor ao caminhar","required":false,"options":["Sim","Não"]},
        {"id":"col_dor_noturna","type":"radio","label":"Dor noturna","required":false,"options":["Sim","Não"]},
        {"id":"col_tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Peso","Difusa","Outro"]}
      ]},
      {"id":"col_sinais","type":"section","title":"Sinais Associados","fields":[
        {"id":"col_formigamento","type":"radio","label":"Formigamento","required":false,"options":["Sim","Não"]},
        {"id":"col_dormencia","type":"radio","label":"Dormência","required":false,"options":["Sim","Não"]},
        {"id":"col_fraqueza","type":"radio","label":"Fraqueza","required":false,"options":["Sim","Não"]},
        {"id":"col_travamento","type":"radio","label":"Travamento","required":false,"options":["Sim","Não"]},
        {"id":"col_rigidez_matinal","type":"radio","label":"Rigidez matinal","required":false,"options":["Sim","Não"]},
        {"id":"col_equilibrio","type":"radio","label":"Perda de equilíbrio","required":false,"options":["Sim","Não"]},
        {"id":"col_esfincteriana","type":"radio","label":"Alteração esfincteriana","required":false,"options":["Sim","Não"]},
        {"id":"col_tosse_espirro","type":"radio","label":"Piora com tosse ou espirro","required":false,"options":["Sim","Não"]},
        {"id":"col_outros_neuro","type":"textarea","label":"Outros sinais neurológicos","required":false}
      ]},
      {"id":"col_historia","type":"section","title":"História do Quadro","fields":[
        {"id":"col_episodios_previos","type":"textarea","label":"Episódios prévios","required":false},
        {"id":"col_crises_recorrentes","type":"radio","label":"Crises recorrentes","required":false,"options":["Sim","Não"]},
        {"id":"col_trauma_previo","type":"radio","label":"Trauma prévio","required":false,"options":["Sim","Não"]},
        {"id":"col_cirurgia_coluna","type":"radio","label":"Cirurgia de coluna","required":false,"options":["Sim","Não"]},
        {"id":"col_exames_imagem","type":"textarea","label":"Exames de imagem realizados","required":false},
        {"id":"col_diagnostico_medico","type":"textarea","label":"Diagnóstico médico prévio","required":false},
        {"id":"col_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
        {"id":"col_medicacao","type":"textarea","label":"Uso de medicação","required":false},
        {"id":"col_afastamento","type":"radio","label":"Afastamento laboral","required":false,"options":["Sim","Não"]}
      ]},
      {"id":"col_habitos","type":"section","title":"Hábitos e Fatores Mecânicos","fields":[
        {"id":"col_trabalho_sentado","type":"radio","label":"Trabalho sentado","required":false,"options":["Sim","Não"]},
        {"id":"col_trabalho_pe","type":"radio","label":"Trabalho em pé","required":false,"options":["Sim","Não"]},
        {"id":"col_carga_ocupacional","type":"textarea","label":"Carga física ocupacional","required":false},
        {"id":"col_posturas_mantidas","type":"textarea","label":"Posturas mantidas","required":false},
        {"id":"col_direcao_prolongada","type":"radio","label":"Direção prolongada","required":false,"options":["Sim","Não"]},
        {"id":"col_sedentarismo","type":"radio","label":"Sedentarismo","required":false,"options":["Sim","Não"]},
        {"id":"col_atividade_fisica","type":"textarea","label":"Atividade física","required":false},
        {"id":"col_sono","type":"textarea","label":"Qualidade do sono","required":false},
        {"id":"col_colchao","type":"radio","label":"Colchão ou travesseiro inadequado","required":false,"options":["Sim","Não"]},
        {"id":"col_estresse","type":"textarea","label":"Estresse associado","required":false}
      ]},
      {"id":"col_funcionalidade","type":"section","title":"Funcionalidade","fields":[
        {"id":"col_dif_sentar","type":"select","label":"Dificuldade para sentar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_levantar","type":"select","label":"Dificuldade para levantar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_andar","type":"select","label":"Dificuldade para andar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_abaixar","type":"select","label":"Dificuldade para se abaixar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_girar","type":"select","label":"Dificuldade para girar o tronco","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_domesticas","type":"select","label":"Dificuldade para atividades domésticas","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_trabalho","type":"select","label":"Dificuldade para trabalho","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_dif_exercicio","type":"select","label":"Dificuldade para exercício","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"col_impacto_funcional","type":"textarea","label":"Impacto funcional geral","required":false}
      ]},
      {"id":"col_exame_fisico","type":"section","title":"Exame Físico da Coluna","fields":[
        {"id":"col_inspecao_postural","type":"textarea","label":"Inspeção postural","required":false},
        {"id":"col_curvaturas","type":"textarea","label":"Curvaturas fisiológicas","required":false},
        {"id":"col_assimetrias","type":"textarea","label":"Assimetrias","required":false},
        {"id":"col_marcha","type":"textarea","label":"Marcha","required":false},
        {"id":"col_mob_cervical","type":"textarea","label":"Mobilidade cervical","required":false},
        {"id":"col_mob_toracica","type":"textarea","label":"Mobilidade torácica","required":false},
        {"id":"col_mob_lombar","type":"textarea","label":"Mobilidade lombar","required":false},
        {"id":"col_palpacao","type":"textarea","label":"Dor à palpação","required":false},
        {"id":"col_espasmo","type":"textarea","label":"Espasmo muscular","required":false},
        {"id":"col_forca","type":"textarea","label":"Força muscular","required":false},
        {"id":"col_oxford","type":"number","label":"Escala de Oxford (0-5)","required":false},
        {"id":"col_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
        {"id":"col_reflexos","type":"textarea","label":"Reflexos","required":false},
        {"id":"col_testes_neuro","type":"textarea","label":"Testes neurodinâmicos","required":false},
        {"id":"col_testes_especiais","type":"textarea","label":"Testes especiais de coluna","required":false},
        {"id":"col_obs_exame","type":"textarea","label":"Observações do exame","required":false}
      ]},
      {"id":"col_diagnostico","type":"section","title":"Diagnóstico Funcional da Coluna","fields":[
        {"id":"col_diag_funcional","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
        {"id":"col_hipotese_mecanica","type":"textarea","label":"Hipótese mecânica principal","required":false},
        {"id":"col_componentes_mio","type":"textarea","label":"Componentes miofasciais","required":false},
        {"id":"col_componentes_art","type":"textarea","label":"Componentes articulares","required":false},
        {"id":"col_componentes_neurais","type":"textarea","label":"Componentes neurais","required":false},
        {"id":"col_deficits","type":"textarea","label":"Déficits identificados","required":false},
        {"id":"col_fatores_perpetuadores","type":"textarea","label":"Fatores perpetuadores","required":false},
        {"id":"col_prognostico","type":"textarea","label":"Prognóstico","required":false}
      ]},
      {"id":"col_plano","type":"section","title":"Plano Terapêutico para Coluna","fields":[
        {"id":"col_obj_analgesico","type":"textarea","label":"Objetivo analgésico","required":false},
        {"id":"col_obj_funcional","type":"textarea","label":"Objetivo funcional","required":false},
        {"id":"col_obj_postural","type":"textarea","label":"Objetivo postural","required":false},
        {"id":"col_obj_mobilidade","type":"textarea","label":"Objetivo de mobilidade","required":false},
        {"id":"col_obj_forca","type":"textarea","label":"Objetivo de força e estabilização","required":false},
        {"id":"col_estrategia_inicial","type":"textarea","label":"Estratégia inicial","required":false},
        {"id":"col_exercicios","type":"textarea","label":"Exercícios iniciais","required":false},
        {"id":"col_orientacoes_ergo","type":"textarea","label":"Orientações ergonômicas","required":false},
        {"id":"col_orientacoes_dom","type":"textarea","label":"Orientações domiciliares","required":false},
        {"id":"col_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
        {"id":"col_criterios_reavaliacao","type":"textarea","label":"Critérios de reavaliação","required":false}
      ]}
    ]';
    INSERT INTO anamnesis_templates (clinic_id, specialty_id, name, description, version, fields, campos, is_active, is_system, is_default, archived, icon, usage_count, template_type, specialty)
    VALUES (_clinic_id, _specialty_id, 'Anamnese de Coluna Vertebral', 'Modelo oficial de Fisioterapia - Anamnese de Coluna Vertebral', 1, _structure, _structure, true, true, false, false, 'Bone', 0, 'anamnese', 'fisioterapia')
    RETURNING id INTO _template_id;
    INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields) VALUES (_template_id, 1, 1, _structure, _structure) RETURNING id INTO _version_id;
    UPDATE anamnesis_templates SET current_version_id = _version_id WHERE id = _template_id;
  END IF;
END;
$$;

-- 4. Create Pós-Operatória
DO $$
DECLARE
  _template_id UUID;
  _version_id UUID;
  _clinic_id UUID;
  _specialty_id UUID := '1ff6d500-458c-47f8-8e5b-aea513ab9d07';
  _structure JSONB;
BEGIN
  SELECT clinic_id INTO _clinic_id FROM anamnesis_templates WHERE specialty_id = _specialty_id LIMIT 1;
  SELECT id INTO _template_id FROM anamnesis_templates WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = 'Anamnese Pós-Operatória' AND archived = false LIMIT 1;
  IF _template_id IS NULL THEN
    _structure := '[
      {"id":"pos_identificacao","type":"section","title":"Identificação Cirúrgica","fields":[
        {"id":"pos_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
        {"id":"pos_profissional","type":"text","label":"Profissional responsável","required":true},
        {"id":"pos_tipo_cirurgia","type":"text","label":"Tipo de cirurgia","required":false},
        {"id":"pos_regiao_operada","type":"text","label":"Região operada","required":false},
        {"id":"pos_lado_operado","type":"select","label":"Lado operado","required":false,"options":["Direito","Esquerdo","Bilateral","Central","Não se aplica"]},
        {"id":"pos_data_cirurgia","type":"date","label":"Data da cirurgia","required":false},
        {"id":"pos_tempo_po","type":"text","label":"Tempo de pós-operatório","required":false},
        {"id":"pos_cirurgiao","type":"text","label":"Cirurgião responsável","required":false},
        {"id":"pos_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
      ]},
      {"id":"pos_procedimento","type":"section","title":"Informações do Procedimento","fields":[
        {"id":"pos_tecnica","type":"textarea","label":"Técnica cirúrgica informada","required":false},
        {"id":"pos_ortese","type":"radio","label":"Houve uso de órtese","required":false,"options":["Sim","Não"]},
        {"id":"pos_imobilizacao","type":"radio","label":"Houve imobilização","required":false,"options":["Sim","Não"]},
        {"id":"pos_enxerto","type":"radio","label":"Houve enxerto ou prótese","required":false,"options":["Sim","Não"]},
        {"id":"pos_complicacoes","type":"textarea","label":"Complicações relatadas","required":false},
        {"id":"pos_internacao","type":"textarea","label":"Internação","required":false},
        {"id":"pos_alta","type":"date","label":"Alta hospitalar","required":false},
        {"id":"pos_encaminhamento","type":"textarea","label":"Encaminhamento médico","required":false},
        {"id":"pos_objetivo_po","type":"textarea","label":"Objetivo principal do pós-operatório","required":true}
      ]},
      {"id":"pos_restricoes","type":"section","title":"Restrições Médicas","fields":[
        {"id":"pos_restricao_carga","type":"textarea","label":"Restrição de carga","required":false},
        {"id":"pos_restricao_adm","type":"textarea","label":"Restrição de amplitude","required":false},
        {"id":"pos_restricao_mov","type":"textarea","label":"Restrição de movimento","required":false},
        {"id":"pos_restricao_apoio","type":"textarea","label":"Restrição de apoio","required":false},
        {"id":"pos_restricao_exercicio","type":"textarea","label":"Restrição para exercício","required":false},
        {"id":"pos_uso_ortese_obr","type":"radio","label":"Uso obrigatório de órtese","required":false,"options":["Sim","Não"]},
        {"id":"pos_prazo_restricoes","type":"text","label":"Prazo das restrições","required":false},
        {"id":"pos_condutas_proibidas","type":"textarea","label":"Condutas proibidas","required":false},
        {"id":"pos_obs_medicas","type":"textarea","label":"Observações médicas adicionais","required":false}
      ]},
      {"id":"pos_quadro","type":"section","title":"Quadro Atual","fields":[
        {"id":"pos_dor","type":"radio","label":"Dor atual","required":false,"options":["Sim","Não"]},
        {"id":"pos_eva","type":"number","label":"EVA inicial (0-10)","required":false},
        {"id":"pos_edema","type":"radio","label":"Edema","required":false,"options":["Sim","Não"]},
        {"id":"pos_limitacao_funcional","type":"textarea","label":"Limitação funcional","required":false},
        {"id":"pos_rigidez","type":"radio","label":"Sensação de rigidez","required":false,"options":["Sim","Não"]},
        {"id":"pos_instabilidade","type":"radio","label":"Sensação de instabilidade","required":false,"options":["Sim","Não"]},
        {"id":"pos_deficit_forca","type":"radio","label":"Déficit de força","required":false,"options":["Sim","Não"]},
        {"id":"pos_alt_sensibilidade","type":"radio","label":"Alteração de sensibilidade","required":false,"options":["Sim","Não"]},
        {"id":"pos_medo_mov","type":"radio","label":"Medo de movimento","required":false,"options":["Sim","Não"]},
        {"id":"pos_obs_quadro","type":"textarea","label":"Observações do quadro atual","required":false}
      ]},
      {"id":"pos_cicatriz","type":"section","title":"Cicatrização e Sinais Locais","fields":[
        {"id":"pos_presenca_cicatriz","type":"radio","label":"Presença de cicatriz","required":false,"options":["Sim","Não"]},
        {"id":"pos_aspecto_cicatriz","type":"textarea","label":"Aspecto da cicatriz","required":false},
        {"id":"pos_sinais_inflam","type":"radio","label":"Sinais inflamatórios","required":false,"options":["Sim","Não"]},
        {"id":"pos_calor","type":"radio","label":"Calor local","required":false,"options":["Sim","Não"]},
        {"id":"pos_rubor","type":"radio","label":"Rubor","required":false,"options":["Sim","Não"]},
        {"id":"pos_secrecao","type":"radio","label":"Secreção","required":false,"options":["Sim","Não"]},
        {"id":"pos_aderencia","type":"radio","label":"Aderência cicatricial","required":false,"options":["Sim","Não"]},
        {"id":"pos_integridade_pele","type":"textarea","label":"Integridade da pele","required":false},
        {"id":"pos_sinais_alerta","type":"textarea","label":"Sinais de alerta cirúrgico","required":false}
      ]},
      {"id":"pos_funcionalidade","type":"section","title":"Funcionalidade Pós-Operatória","fields":[
        {"id":"pos_dif_marcha","type":"select","label":"Dificuldade para marcha","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dif_transferencias","type":"select","label":"Dificuldade para transferências","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dif_apoio","type":"select","label":"Dificuldade para apoio","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dif_avd","type":"select","label":"Dificuldade para AVDs","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dif_autocuidado","type":"select","label":"Dificuldade para autocuidado","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dif_trabalho","type":"select","label":"Dificuldade para trabalho","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
        {"id":"pos_dependencia","type":"select","label":"Dependência funcional","required":false,"options":["Independente","Parcialmente dependente","Dependente"]},
        {"id":"pos_dispositivo","type":"select","label":"Uso de dispositivo auxiliar","required":false,"options":["Não usa","Bengala","Muleta","Andador","Cadeira de rodas","Órtese","Outro"]},
        {"id":"pos_capacidade_percebida","type":"textarea","label":"Capacidade funcional percebida","required":false}
      ]},
      {"id":"pos_exame","type":"section","title":"Exame Físico Pós-Operatório","fields":[
        {"id":"pos_inspecao","type":"textarea","label":"Inspeção geral","required":false},
        {"id":"pos_edema_segmentar","type":"textarea","label":"Edema segmentar","required":false},
        {"id":"pos_mobilidade_permitida","type":"textarea","label":"Mobilidade permitida","required":false},
        {"id":"pos_adm_ativa","type":"textarea","label":"Amplitude ativa","required":false},
        {"id":"pos_adm_passiva","type":"textarea","label":"Amplitude passiva","required":false},
        {"id":"pos_dor_movimento","type":"textarea","label":"Dor ao movimento","required":false},
        {"id":"pos_forca","type":"textarea","label":"Força muscular","required":false},
        {"id":"pos_oxford","type":"number","label":"Escala de Oxford (0-5)","required":false},
        {"id":"pos_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
        {"id":"pos_tolerancia_toque","type":"textarea","label":"Tolerância ao toque","required":false},
        {"id":"pos_marcha_ef","type":"textarea","label":"Marcha","required":false},
        {"id":"pos_descarga_peso","type":"textarea","label":"Padrão de descarga de peso","required":false},
        {"id":"pos_testes_funcionais","type":"textarea","label":"Testes funcionais permitidos","required":false},
        {"id":"pos_obs_exame","type":"textarea","label":"Observações do exame","required":false}
      ]},
      {"id":"pos_diagnostico","type":"section","title":"Diagnóstico Funcional Pós-Operatório","fields":[
        {"id":"pos_diag_funcional","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
        {"id":"pos_limitacoes","type":"textarea","label":"Limitações principais","required":false},
        {"id":"pos_deficits","type":"textarea","label":"Déficits identificados","required":false},
        {"id":"pos_risco_funcional","type":"select","label":"Risco funcional","required":false,"options":["Baixo","Moderado","Alto"]},
        {"id":"pos_fatores_atraso","type":"textarea","label":"Fatores que atrasam progressão","required":false},
        {"id":"pos_prognostico","type":"textarea","label":"Prognóstico inicial","required":false}
      ]},
      {"id":"pos_plano","type":"section","title":"Plano Fisioterapêutico Pós-Operatório","fields":[
        {"id":"pos_obj_imediato","type":"textarea","label":"Objetivo imediato","required":false},
        {"id":"pos_obj_curto","type":"textarea","label":"Objetivo de curto prazo","required":false},
        {"id":"pos_obj_medio","type":"textarea","label":"Objetivo de médio prazo","required":false},
        {"id":"pos_obj_longo","type":"textarea","label":"Objetivo de longo prazo","required":false},
        {"id":"pos_estrategia_dor_edema","type":"textarea","label":"Estratégia para controle de dor e edema","required":false},
        {"id":"pos_estrategia_mobilidade","type":"textarea","label":"Estratégia para ganho de mobilidade","required":false},
        {"id":"pos_estrategia_forca","type":"textarea","label":"Estratégia para ganho de força","required":false},
        {"id":"pos_estrategia_funcao","type":"textarea","label":"Estratégia para função","required":false},
        {"id":"pos_orientacoes","type":"textarea","label":"Orientações domiciliares","required":false},
        {"id":"pos_frequencia","type":"select","label":"Frequência semanal","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
        {"id":"pos_criterios_progressao","type":"textarea","label":"Critérios de progressão","required":false},
        {"id":"pos_contato_equipe","type":"textarea","label":"Necessidade de contato com equipe médica","required":false}
      ]}
    ]';
    INSERT INTO anamnesis_templates (clinic_id, specialty_id, name, description, version, fields, campos, is_active, is_system, is_default, archived, icon, usage_count, template_type, specialty)
    VALUES (_clinic_id, _specialty_id, 'Anamnese Pós-Operatória', 'Modelo oficial de Fisioterapia - Anamnese Pós-Operatória', 1, _structure, _structure, true, true, false, false, 'Scissors', 0, 'anamnese', 'fisioterapia')
    RETURNING id INTO _template_id;
    INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields) VALUES (_template_id, 1, 1, _structure, _structure) RETURNING id INTO _version_id;
    UPDATE anamnesis_templates SET current_version_id = _version_id WHERE id = _template_id;
  END IF;
END;
$$;
