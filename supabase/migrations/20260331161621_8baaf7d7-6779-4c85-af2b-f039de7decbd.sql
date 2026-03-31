
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
          {"id":"tipo_atendimento","type":"select","label":"Tipo de atendimento","required":false,"options":["Avaliação inicial","Reavaliação","Retorno","Alta"]},
          {"id":"origem_encaminhamento","type":"text","label":"Origem do encaminhamento","required":false},
          {"id":"convenio_particular","type":"select","label":"Convênio / Particular","required":false,"options":["Particular","Convênio"]},
          {"id":"primeira_avaliacao_ou_reavaliacao","type":"select","label":"Primeira avaliação ou reavaliação","required":false,"options":["Primeira avaliação","Reavaliação"]},
          {"id":"observacoes_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"bloco_queixa_principal","type":"section","title":"Queixa Principal","fields":[
          {"id":"queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"regiao_corporal_acometida","type":"text","label":"Região corporal acometida","required":false},
          {"id":"lado_acometido","type":"select","label":"Lado acometido","required":false,"options":["Direito","Esquerdo","Bilateral","Central","Não se aplica"]},
          {"id":"tempo_queixa","type":"text","label":"Tempo de queixa","required":false},
          {"id":"inicio_sintomas","type":"select","label":"Início dos sintomas","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Congênito","Desconhecido","Outro"]},
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
          {"id":"tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Peso","Difusa","Outro"]},
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
          {"id":"observacoes_biopsicossocial","type":"textarea","label":"Observações biopsicossociais","required":false}
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
      "name": "Anamnese Ortopédica / Traumato-Ortopédica",
      "is_default": false,
      "icon": "Bone",
      "structure": [
        {"id":"bloco_id_ortopedica","type":"section","title":"Identificação","fields":[
          {"id":"ort_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"ort_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"ort_tipo_avaliacao","type":"select","label":"Tipo de avaliação","required":false,"options":["Avaliação inicial","Reavaliação","Retorno","Alta"]},
          {"id":"ort_segmento_principal","type":"text","label":"Segmento ortopédico principal","required":false},
          {"id":"ort_encaminhamento","type":"text","label":"Origem do encaminhamento","required":false},
          {"id":"ort_lateralidade","type":"select","label":"Lateralidade principal","required":false,"options":["Direito","Esquerdo","Bilateral","Central","Não se aplica"]},
          {"id":"ort_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"bloco_queixa_ortopedica","type":"section","title":"Queixa Ortopédica Principal","fields":[
          {"id":"ort_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"ort_regiao_anatomica","type":"text","label":"Região anatômica","required":false},
          {"id":"ort_estrutura_suspeita","type":"text","label":"Estrutura suspeita acometida","required":false},
          {"id":"ort_lado_acometido","type":"select","label":"Lado acometido","required":false,"options":["Direito","Esquerdo","Bilateral","Central","Não se aplica"]},
          {"id":"ort_data_inicio","type":"date","label":"Data de início","required":false},
          {"id":"ort_mecanismo_lesao","type":"select","label":"Mecanismo de lesão","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Congênito","Desconhecido","Outro"]},
          {"id":"ort_evolucao_clinica","type":"select","label":"Evolução clínica","required":false,"options":["Aguda","Subaguda","Crônica","Recorrente"]},
          {"id":"ort_objetivo_funcional","type":"textarea","label":"Objetivo funcional do paciente","required":false}
        ]},
        {"id":"bloco_evento_traumatico","type":"section","title":"Evento Traumático ou Mecanismo de Sobrecarga","fields":[
          {"id":"ort_houve_trauma","type":"radio","label":"Houve trauma","required":false,"options":["Sim","Não"]},
          {"id":"ort_tipo_trauma","type":"select","label":"Tipo de trauma","required":false,"options":["Queda","Torção","Impacto","Esforço repetitivo","Outro"]},
          {"id":"ort_houve_estalido","type":"radio","label":"Houve estalido","required":false,"options":["Sim","Não"]},
          {"id":"ort_houve_edema_imediato","type":"radio","label":"Houve edema imediato","required":false,"options":["Sim","Não"]},
          {"id":"ort_limitacao_imediata","type":"radio","label":"Houve limitação imediata","required":false,"options":["Sim","Não"]},
          {"id":"ort_tempo_atendimento","type":"text","label":"Tempo até procurar atendimento","required":false},
          {"id":"ort_imobilizacao_inicial","type":"radio","label":"Necessidade de imobilização inicial","required":false,"options":["Sim","Não"]}
        ]},
        {"id":"bloco_dor_sintomas_ort","type":"section","title":"Dor e Sintomas Locais","fields":[
          {"id":"ort_presenca_dor","type":"radio","label":"Presença de dor","required":false,"options":["Sim","Não"]},
          {"id":"ort_eva_inicial","type":"number","label":"EVA inicial (0-10)","required":false,"min":0,"max":10},
          {"id":"ort_tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Peso","Difusa","Outro"]},
          {"id":"ort_dor_palpacao","type":"radio","label":"Dor à palpação","required":false,"options":["Sim","Não"]},
          {"id":"ort_dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
          {"id":"ort_dor_apoio_carga","type":"radio","label":"Dor ao apoio ou carga","required":false,"options":["Sim","Não"]},
          {"id":"ort_rigidez","type":"radio","label":"Rigidez","required":false,"options":["Sim","Não"]},
          {"id":"ort_falseio","type":"radio","label":"Sensação de falseio","required":false,"options":["Sim","Não"]},
          {"id":"ort_crepitacao","type":"radio","label":"Crepitação","required":false,"options":["Sim","Não"]},
          {"id":"ort_irradiacao","type":"textarea","label":"Irradiação","required":false},
          {"id":"ort_formigamento","type":"radio","label":"Formigamento","required":false,"options":["Sim","Não"]},
          {"id":"ort_dormencia","type":"radio","label":"Dormência","required":false,"options":["Sim","Não"]},
          {"id":"ort_obs_sintomas","type":"textarea","label":"Observações dos sintomas","required":false}
        ]},
        {"id":"bloco_historico_ortopedico","type":"section","title":"Histórico Ortopédico","fields":[
          {"id":"ort_lesoes_previas","type":"textarea","label":"Lesões prévias na mesma região","required":false},
          {"id":"ort_cirurgias_previas","type":"textarea","label":"Cirurgias prévias","required":false},
          {"id":"ort_fraturas_anteriores","type":"textarea","label":"Fraturas anteriores","required":false},
          {"id":"ort_luxacoes","type":"textarea","label":"Luxações anteriores","required":false},
          {"id":"ort_uso_orteses","type":"textarea","label":"Uso prévio de órteses ou imobilizadores","required":false},
          {"id":"ort_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"ort_infiltracao","type":"radio","label":"Infiltração prévia","required":false,"options":["Sim","Não"]},
          {"id":"ort_exames_imagem","type":"textarea","label":"Exames de imagem realizados","required":false},
          {"id":"ort_diag_medico","type":"textarea","label":"Diagnóstico médico prévio","required":false}
        ]},
        {"id":"bloco_limitacao_funcional_ort","type":"section","title":"Limitação Funcional","fields":[
          {"id":"ort_dif_marcha","type":"radio","label":"Dificuldade para marcha","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_apoio","type":"radio","label":"Dificuldade para apoio","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_escadas","type":"radio","label":"Dificuldade para subir e descer escadas","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_agachar","type":"radio","label":"Dificuldade para agachar","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_pegar_peso","type":"radio","label":"Dificuldade para pegar peso","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_alcance","type":"radio","label":"Dificuldade para alcance","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_laborais","type":"radio","label":"Dificuldade para atividades laborais","required":false,"options":["Sim","Não"]},
          {"id":"ort_dif_esporte","type":"radio","label":"Dificuldade para esporte","required":false,"options":["Sim","Não"]},
          {"id":"ort_incapacidade_percebida","type":"select","label":"Nível de incapacidade percebida","required":false,"options":["Leve","Moderada","Importante","Grave"]},
          {"id":"ort_grau_independencia","type":"select","label":"Grau de independência","required":false,"options":["Independente","Parcialmente dependente","Dependente"]}
        ]},
        {"id":"bloco_exame_fisico_ort","type":"section","title":"Exame Físico Ortopédico","fields":[
          {"id":"ort_inspecao_segmentar","type":"textarea","label":"Inspeção segmentar","required":false},
          {"id":"ort_edema","type":"textarea","label":"Edema","required":false},
          {"id":"ort_equimose","type":"radio","label":"Equimose","required":false,"options":["Sim","Não"]},
          {"id":"ort_deformidade","type":"radio","label":"Deformidade","required":false,"options":["Sim","Não"]},
          {"id":"ort_cicatriz","type":"radio","label":"Cicatriz","required":false,"options":["Sim","Não"]},
          {"id":"ort_temperatura_local","type":"textarea","label":"Temperatura local","required":false},
          {"id":"ort_adm_ativa","type":"textarea","label":"Amplitude de movimento ativa","required":false},
          {"id":"ort_adm_passiva","type":"textarea","label":"Amplitude de movimento passiva","required":false},
          {"id":"ort_limitacao_dor","type":"textarea","label":"Limitação por dor","required":false},
          {"id":"ort_forca_muscular","type":"textarea","label":"Força muscular","required":false},
          {"id":"ort_oxford","type":"select","label":"Escala de Oxford","required":false,"options":["0 - Sem contração","1 - Contração visível sem movimento","2 - Movimento sem gravidade","3 - Movimento contra gravidade","4 - Movimento contra resistência moderada","5 - Força normal"]},
          {"id":"ort_instabilidade","type":"textarea","label":"Instabilidade articular","required":false},
          {"id":"ort_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
          {"id":"ort_palpacao_segmentar","type":"textarea","label":"Palpação segmentar","required":false},
          {"id":"ort_testes_especiais","type":"textarea","label":"Testes ortopédicos especiais","required":false},
          {"id":"ort_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"bloco_carga_mecanica","type":"section","title":"Carga, Apoio e Mecânica","fields":[
          {"id":"ort_apoio_peso","type":"textarea","label":"Apoio de peso","required":false},
          {"id":"ort_descarga","type":"select","label":"Descarga","required":false,"options":["Total","Parcial","Sem carga"]},
          {"id":"ort_auxilio_marcha","type":"select","label":"Uso de auxílio para marcha","required":false,"options":["Não usa","Bengala","Muleta","Andador","Cadeira de rodas","Órtese","Prótese","Outro"]},
          {"id":"ort_padrao_marcha","type":"textarea","label":"Padrão de marcha","required":false},
          {"id":"ort_compensacoes","type":"textarea","label":"Compensações biomecânicas observadas","required":false},
          {"id":"ort_restricao_impacto","type":"radio","label":"Restrição para impacto","required":false,"options":["Sim","Não"]},
          {"id":"ort_restricao_carga","type":"radio","label":"Restrição para carga","required":false,"options":["Sim","Não"]},
          {"id":"ort_tolerancia_esforco","type":"textarea","label":"Tolerância ao esforço","required":false}
        ]},
        {"id":"bloco_diag_ort","type":"section","title":"Diagnóstico Fisioterapêutico Ortopédico","fields":[
          {"id":"ort_diag_cinetico","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
          {"id":"ort_estruturas_comprometidas","type":"textarea","label":"Estruturas comprometidas","required":false},
          {"id":"ort_deficits_principais","type":"textarea","label":"Déficits principais","required":false},
          {"id":"ort_limitacoes_mecanicas","type":"textarea","label":"Limitações mecânicas","required":false},
          {"id":"ort_fatores_agravantes","type":"textarea","label":"Fatores agravantes","required":false},
          {"id":"ort_prognostico","type":"textarea","label":"Prognóstico funcional","required":false}
        ]},
        {"id":"bloco_plano_ort","type":"section","title":"Plano de Tratamento Ortopédico","fields":[
          {"id":"ort_objetivo_inicial","type":"textarea","label":"Objetivo inicial","required":false},
          {"id":"ort_objetivo_intermediario","type":"textarea","label":"Objetivo intermediário","required":false},
          {"id":"ort_objetivo_final","type":"textarea","label":"Objetivo final","required":false},
          {"id":"ort_recursos_previstos","type":"textarea","label":"Recursos terapêuticos previstos","required":false},
          {"id":"ort_estrategia_mobilidade","type":"textarea","label":"Estratégia de ganho de mobilidade","required":false},
          {"id":"ort_estrategia_forca","type":"textarea","label":"Estratégia de ganho de força","required":false},
          {"id":"ort_estrategia_analgesia","type":"textarea","label":"Estratégia de analgesia","required":false},
          {"id":"ort_orientacoes_domiciliares","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"ort_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
          {"id":"ort_criterios_alta","type":"textarea","label":"Critérios de alta ou progressão","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese de Coluna Vertebral",
      "is_default": false,
      "icon": "Spine",
      "structure": [
        {"id":"bloco_id_coluna","type":"section","title":"Identificação","fields":[
          {"id":"col_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"col_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"col_segmento_principal","type":"select","label":"Segmento principal da coluna","required":false,"options":["Cervical","Torácica","Lombar","Lombossacra","Múltiplos segmentos"]},
          {"id":"col_primeira_avaliacao","type":"select","label":"Primeira avaliação ou retorno","required":false,"options":["Primeira avaliação","Retorno"]},
          {"id":"col_encaminhamento","type":"text","label":"Encaminhamento","required":false},
          {"id":"col_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"bloco_queixa_coluna","type":"section","title":"Queixa Principal da Coluna","fields":[
          {"id":"col_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"col_segmento_acometido","type":"select","label":"Segmento acometido","required":false,"options":["Cervical","Torácica","Lombar","Lombossacra","Múltiplos segmentos"]},
          {"id":"col_inicio_sintomas","type":"select","label":"Início dos sintomas","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Desconhecido","Outro"]},
          {"id":"col_tempo_sintomas","type":"text","label":"Tempo de sintomas","required":false},
          {"id":"col_evolucao_clinica","type":"select","label":"Evolução clínica","required":false,"options":["Aguda","Subaguda","Crônica","Recorrente"]},
          {"id":"col_crise_ou_continuo","type":"select","label":"Crise atual ou quadro contínuo","required":false,"options":["Crise aguda atual","Quadro contínuo"]},
          {"id":"col_objetivo_paciente","type":"textarea","label":"Objetivo do paciente","required":false}
        ]},
        {"id":"bloco_dor_coluna","type":"section","title":"Características da Dor","fields":[
          {"id":"col_presenca_dor","type":"radio","label":"Presença de dor","required":false,"options":["Sim","Não"]},
          {"id":"col_eva_inicial","type":"number","label":"EVA inicial (0-10)","required":false,"min":0,"max":10},
          {"id":"col_localizacao_dor","type":"textarea","label":"Localização da dor","required":false},
          {"id":"col_irradiacao","type":"textarea","label":"Irradiação","required":false},
          {"id":"col_dor_unilateral_bilateral","type":"select","label":"Dor unilateral ou bilateral","required":false,"options":["Unilateral direita","Unilateral esquerda","Bilateral","Central"]},
          {"id":"col_dor_repouso","type":"radio","label":"Dor em repouso","required":false,"options":["Sim","Não"]},
          {"id":"col_dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
          {"id":"col_dor_sentado","type":"radio","label":"Dor ao permanecer sentado","required":false,"options":["Sim","Não"]},
          {"id":"col_dor_em_pe","type":"radio","label":"Dor ao permanecer em pé","required":false,"options":["Sim","Não"]},
          {"id":"col_dor_caminhar","type":"radio","label":"Dor ao caminhar","required":false,"options":["Sim","Não"]},
          {"id":"col_dor_noturna","type":"radio","label":"Dor noturna","required":false,"options":["Sim","Não"]},
          {"id":"col_tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Peso","Difusa","Outro"]}
        ]},
        {"id":"bloco_sinais_associados_coluna","type":"section","title":"Sinais Associados","fields":[
          {"id":"col_formigamento","type":"radio","label":"Formigamento","required":false,"options":["Sim","Não"]},
          {"id":"col_dormencia","type":"radio","label":"Dormência","required":false,"options":["Sim","Não"]},
          {"id":"col_fraqueza","type":"radio","label":"Fraqueza","required":false,"options":["Sim","Não"]},
          {"id":"col_sensacao_peso","type":"radio","label":"Sensação de peso","required":false,"options":["Sim","Não"]},
          {"id":"col_travamento","type":"radio","label":"Travamento","required":false,"options":["Sim","Não"]},
          {"id":"col_rigidez_matinal","type":"radio","label":"Rigidez matinal","required":false,"options":["Sim","Não"]},
          {"id":"col_perda_equilibrio","type":"radio","label":"Perda de equilíbrio","required":false,"options":["Sim","Não"]},
          {"id":"col_alteracao_esfincteriana","type":"radio","label":"Alteração esfincteriana","required":false,"options":["Sim","Não"]},
          {"id":"col_piora_tosse_espirro","type":"radio","label":"Piora com tosse ou espirro","required":false,"options":["Sim","Não"]},
          {"id":"col_outros_sinais_neuro","type":"textarea","label":"Outros sinais neurológicos","required":false}
        ]},
        {"id":"bloco_historia_quadro_coluna","type":"section","title":"História do Quadro","fields":[
          {"id":"col_episodios_previos","type":"radio","label":"Episódios prévios","required":false,"options":["Sim","Não"]},
          {"id":"col_crises_recorrentes","type":"radio","label":"Crises recorrentes","required":false,"options":["Sim","Não"]},
          {"id":"col_trauma_previo","type":"radio","label":"Trauma prévio","required":false,"options":["Sim","Não"]},
          {"id":"col_queda_previa","type":"radio","label":"Queda prévia","required":false,"options":["Sim","Não"]},
          {"id":"col_cirurgia_coluna","type":"radio","label":"Cirurgia de coluna","required":false,"options":["Sim","Não"]},
          {"id":"col_exames_imagem","type":"textarea","label":"Exames de imagem realizados","required":false},
          {"id":"col_diag_medico","type":"textarea","label":"Diagnóstico médico prévio","required":false},
          {"id":"col_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"col_uso_medicacao","type":"textarea","label":"Uso de medicação","required":false},
          {"id":"col_afastamento_laboral","type":"radio","label":"Afastamento laboral","required":false,"options":["Sim","Não"]}
        ]},
        {"id":"bloco_habitos_mecanicos_coluna","type":"section","title":"Hábitos e Fatores Mecânicos","fields":[
          {"id":"col_trabalho_sentado","type":"radio","label":"Trabalho sentado","required":false,"options":["Sim","Não"]},
          {"id":"col_trabalho_em_pe","type":"radio","label":"Trabalho em pé","required":false,"options":["Sim","Não"]},
          {"id":"col_carga_fisica","type":"textarea","label":"Carga física ocupacional","required":false},
          {"id":"col_levantamento_peso","type":"radio","label":"Levantamento de peso","required":false,"options":["Sim","Não"]},
          {"id":"col_posturas_mantidas","type":"textarea","label":"Posturas mantidas","required":false},
          {"id":"col_direcao_prolongada","type":"radio","label":"Direção prolongada","required":false,"options":["Sim","Não"]},
          {"id":"col_sedentarismo","type":"radio","label":"Sedentarismo","required":false,"options":["Sim","Não"]},
          {"id":"col_atividade_fisica","type":"textarea","label":"Atividade física","required":false},
          {"id":"col_qualidade_sono","type":"textarea","label":"Qualidade do sono","required":false},
          {"id":"col_colchao_travesseiro","type":"radio","label":"Colchão ou travesseiro inadequado","required":false,"options":["Sim","Não"]},
          {"id":"col_estresse","type":"radio","label":"Estresse associado","required":false,"options":["Sim","Não"]}
        ]},
        {"id":"bloco_funcionalidade_coluna","type":"section","title":"Funcionalidade","fields":[
          {"id":"col_dif_sentar","type":"radio","label":"Dificuldade para sentar","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_levantar","type":"radio","label":"Dificuldade para levantar","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_andar","type":"radio","label":"Dificuldade para andar","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_abaixar","type":"radio","label":"Dificuldade para se abaixar","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_girar_tronco","type":"radio","label":"Dificuldade para girar o tronco","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_domesticas","type":"radio","label":"Dificuldade para atividades domésticas","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_trabalho","type":"radio","label":"Dificuldade para trabalho","required":false,"options":["Sim","Não"]},
          {"id":"col_dif_exercicio","type":"radio","label":"Dificuldade para exercício","required":false,"options":["Sim","Não"]},
          {"id":"col_impacto_funcional","type":"textarea","label":"Impacto funcional geral","required":false}
        ]},
        {"id":"bloco_exame_fisico_coluna","type":"section","title":"Exame Físico da Coluna","fields":[
          {"id":"col_inspecao_postural","type":"textarea","label":"Inspeção postural","required":false},
          {"id":"col_curvaturas","type":"textarea","label":"Curvaturas fisiológicas","required":false},
          {"id":"col_assimetrias","type":"textarea","label":"Assimetrias","required":false},
          {"id":"col_marcha","type":"textarea","label":"Marcha","required":false},
          {"id":"col_mobilidade_cervical","type":"textarea","label":"Mobilidade cervical","required":false},
          {"id":"col_mobilidade_toracica","type":"textarea","label":"Mobilidade torácica","required":false},
          {"id":"col_mobilidade_lombar","type":"textarea","label":"Mobilidade lombar","required":false},
          {"id":"col_flexao","type":"textarea","label":"Flexão","required":false},
          {"id":"col_extensao","type":"textarea","label":"Extensão","required":false},
          {"id":"col_inclinacao_lateral","type":"textarea","label":"Inclinação lateral","required":false},
          {"id":"col_rotacao","type":"textarea","label":"Rotação","required":false},
          {"id":"col_dor_palpacao","type":"textarea","label":"Dor à palpação","required":false},
          {"id":"col_espasmo_muscular","type":"textarea","label":"Espasmo muscular","required":false},
          {"id":"col_forca_muscular","type":"textarea","label":"Força muscular","required":false},
          {"id":"col_oxford","type":"select","label":"Escala de Oxford","required":false,"options":["0 - Sem contração","1 - Contração visível sem movimento","2 - Movimento sem gravidade","3 - Movimento contra gravidade","4 - Movimento contra resistência moderada","5 - Força normal"]},
          {"id":"col_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
          {"id":"col_reflexos","type":"textarea","label":"Reflexos","required":false},
          {"id":"col_testes_neurodinamicos","type":"textarea","label":"Testes neurodinâmicos","required":false},
          {"id":"col_testes_especiais","type":"textarea","label":"Testes especiais de coluna","required":false},
          {"id":"col_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"bloco_diag_coluna","type":"section","title":"Diagnóstico Funcional da Coluna","fields":[
          {"id":"col_diag_cinetico","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
          {"id":"col_hipotese_mecanica","type":"textarea","label":"Hipótese mecânica principal","required":false},
          {"id":"col_componentes_miofasciais","type":"textarea","label":"Componentes miofasciais","required":false},
          {"id":"col_componentes_articulares","type":"textarea","label":"Componentes articulares","required":false},
          {"id":"col_componentes_neurais","type":"textarea","label":"Componentes neurais","required":false},
          {"id":"col_deficits","type":"textarea","label":"Déficits identificados","required":false},
          {"id":"col_fatores_perpetuadores","type":"textarea","label":"Fatores perpetuadores","required":false},
          {"id":"col_prognostico","type":"textarea","label":"Prognóstico","required":false}
        ]},
        {"id":"bloco_plano_coluna","type":"section","title":"Plano Terapêutico para Coluna","fields":[
          {"id":"col_objetivo_analgesico","type":"textarea","label":"Objetivo analgésico","required":false},
          {"id":"col_objetivo_funcional","type":"textarea","label":"Objetivo funcional","required":false},
          {"id":"col_objetivo_postural","type":"textarea","label":"Objetivo postural","required":false},
          {"id":"col_objetivo_mobilidade","type":"textarea","label":"Objetivo de mobilidade","required":false},
          {"id":"col_objetivo_forca_estabilizacao","type":"textarea","label":"Objetivo de força e estabilização","required":false},
          {"id":"col_estrategia_inicial","type":"textarea","label":"Estratégia inicial","required":false},
          {"id":"col_exercicios_iniciais","type":"textarea","label":"Exercícios iniciais","required":false},
          {"id":"col_orientacoes_ergonomicas","type":"textarea","label":"Orientações ergonômicas","required":false},
          {"id":"col_orientacoes_domiciliares","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"col_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
          {"id":"col_criterios_reavaliacao","type":"textarea","label":"Critérios de reavaliação","required":false}
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

-- Provision for all existing clinics with fisioterapia
DO $$
DECLARE
  _rec RECORD;
  _result INTEGER;
BEGIN
  FOR _rec IN
    SELECT DISTINCT s.id AS specialty_id, cs.clinic_id
    FROM public.specialties s
    JOIN public.clinic_specialty_modules cs ON cs.specialty_id = s.id AND cs.is_enabled = true
    WHERE s.slug = 'fisioterapia'
  LOOP
    SELECT public.provision_fisioterapia_anamnesis_templates(_rec.clinic_id, _rec.specialty_id) INTO _result;
    RAISE NOTICE 'Provisioned % new fisioterapia templates for clinic %', _result, _rec.clinic_id;
  END LOOP;
END;
$$;
