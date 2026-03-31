
DROP FUNCTION IF EXISTS public.provision_fisioterapia_anamnesis_templates(uuid, uuid);

CREATE FUNCTION public.provision_fisioterapia_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
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
      "name": "Anamnese Respiratória",
      "is_default": false,
      "icon": "Wind",
      "structure": [
        {"id":"resp_identificacao","type":"section","title":"Identificação Respiratória","fields":[
          {"id":"resp_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"resp_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"resp_diagnostico_principal","type":"text","label":"Diagnóstico principal","required":false},
          {"id":"resp_encaminhamento","type":"text","label":"Encaminhamento","required":false},
          {"id":"resp_tipo_atendimento","type":"select","label":"Tipo de atendimento","required":false,"options":["Ambulatorial","Domiciliar","Hospitalar"]},
          {"id":"resp_oxigenoterapia","type":"radio","label":"Oxigenoterapia em uso","required":false,"options":["Sim","Não"]},
          {"id":"resp_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"resp_queixa","type":"section","title":"Queixa Principal Respiratória","fields":[
          {"id":"resp_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"resp_dispneia","type":"textarea","label":"Dispneia","required":false},
          {"id":"resp_tosse","type":"textarea","label":"Tosse","required":false},
          {"id":"resp_secrecao","type":"textarea","label":"Secreção","required":false},
          {"id":"resp_intolerancia_esforco","type":"textarea","label":"Intolerância ao esforço","required":false},
          {"id":"resp_dor_toracica","type":"textarea","label":"Dor torácica","required":false},
          {"id":"resp_fadiga","type":"textarea","label":"Fadiga","required":false},
          {"id":"resp_objetivo_paciente","type":"textarea","label":"Objetivo do paciente","required":true}
        ]},
        {"id":"resp_historia","type":"section","title":"História Clínica Respiratória","fields":[
          {"id":"resp_doenca_previa","type":"textarea","label":"Doença respiratória prévia","required":false},
          {"id":"resp_internacao","type":"radio","label":"Internação prévia","required":false,"options":["Sim","Não"]},
          {"id":"resp_uti","type":"radio","label":"UTI prévia","required":false,"options":["Sim","Não"]},
          {"id":"resp_vm","type":"radio","label":"Ventilação mecânica prévia","required":false,"options":["Sim","Não"]},
          {"id":"resp_infeccoes_recorrentes","type":"textarea","label":"Infecções respiratórias recorrentes","required":false},
          {"id":"resp_tabagismo","type":"select","label":"Tabagismo","required":false,"options":["Nunca fumou","Tabagista ativo","Ex-tabagista"]},
          {"id":"resp_doencas_associadas","type":"textarea","label":"Doenças associadas","required":false},
          {"id":"resp_medicacoes","type":"textarea","label":"Medicações em uso","required":false},
          {"id":"resp_exames","type":"textarea","label":"Exames realizados","required":false}
        ]},
        {"id":"resp_sintomas_atuais","type":"section","title":"Sintomas Atuais","fields":[
          {"id":"resp_falta_ar_repouso","type":"radio","label":"Falta de ar em repouso","required":false,"options":["Sim","Não"]},
          {"id":"resp_falta_ar_esforco","type":"radio","label":"Falta de ar ao esforço","required":false,"options":["Sim","Não"]},
          {"id":"resp_tosse_tipo","type":"select","label":"Tosse","required":false,"options":["Seca","Produtiva","Ausente"]},
          {"id":"resp_qtd_secrecao","type":"select","label":"Quantidade de secreção","required":false,"options":["Ausente","Pequena","Moderada","Grande"]},
          {"id":"resp_cor_secrecao","type":"select","label":"Cor da secreção","required":false,"options":["Transparente","Branca","Amarela","Esverdeada","Sanguinolenta"]},
          {"id":"resp_chiado","type":"radio","label":"Presença de chiado","required":false,"options":["Sim","Não"]},
          {"id":"resp_roncos","type":"radio","label":"Presença de roncos","required":false,"options":["Sim","Não"]},
          {"id":"resp_febre","type":"radio","label":"Febre recente","required":false,"options":["Sim","Não"]},
          {"id":"resp_cansaco_esforcos","type":"textarea","label":"Cansaço aos esforços","required":false},
          {"id":"resp_limitacao_funcional","type":"textarea","label":"Limitação funcional relacionada à respiração","required":false}
        ]},
        {"id":"resp_funcionalidade","type":"section","title":"Funcionalidade Respiratória","fields":[
          {"id":"resp_dif_caminhar","type":"select","label":"Dificuldade para caminhar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"resp_dif_escadas","type":"select","label":"Dificuldade para subir escadas","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"resp_dif_falar","type":"select","label":"Dificuldade para falar frases longas","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"resp_limitacao_avd","type":"textarea","label":"Limitação para atividades de vida diária","required":false},
          {"id":"resp_limitacao_sono","type":"textarea","label":"Limitação para sono","required":false},
          {"id":"resp_intolerancia_exercicio","type":"textarea","label":"Intolerância ao exercício","required":false},
          {"id":"resp_grau_independencia","type":"select","label":"Grau de independência","required":false,"options":["Independente","Parcialmente dependente","Dependente"]},
          {"id":"resp_participacao_comprometida","type":"textarea","label":"Participação funcional comprometida","required":false}
        ]},
        {"id":"resp_exame_fisico","type":"section","title":"Exame Físico Respiratório","fields":[
          {"id":"resp_padrao_ventilatorio","type":"text","label":"Padrão ventilatório","required":false},
          {"id":"resp_freq_respiratoria","type":"number","label":"Frequência respiratória (irpm)","required":false},
          {"id":"resp_musc_acessoria","type":"radio","label":"Uso de musculatura acessória","required":false,"options":["Sim","Não"]},
          {"id":"resp_expansibilidade","type":"textarea","label":"Expansibilidade torácica","required":false},
          {"id":"resp_simetria","type":"textarea","label":"Simetria ventilatória","required":false},
          {"id":"resp_ausculta","type":"textarea","label":"Ausculta","required":false},
          {"id":"resp_tosse_eficaz","type":"radio","label":"Tosse eficaz","required":false,"options":["Sim","Não"]},
          {"id":"resp_eliminacao_secrecao","type":"textarea","label":"Eliminação de secreção","required":false},
          {"id":"resp_spo2","type":"number","label":"Saturação periférica (SpO2)","required":false},
          {"id":"resp_tolerancia_esforco","type":"textarea","label":"Tolerância ao esforço","required":false},
          {"id":"resp_postura","type":"textarea","label":"Postura","required":false},
          {"id":"resp_mobilidade_toracica","type":"textarea","label":"Mobilidade torácica","required":false},
          {"id":"resp_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"resp_diagnostico","type":"section","title":"Diagnóstico Fisioterapêutico Respiratório","fields":[
          {"id":"resp_diag_funcional","type":"textarea","label":"Diagnóstico funcional respiratório","required":false},
          {"id":"resp_deficits_ventilatorios","type":"textarea","label":"Principais déficits ventilatórios","required":false},
          {"id":"resp_limitacoes_esforco","type":"textarea","label":"Limitações relacionadas ao esforço","required":false},
          {"id":"resp_risco_funcional","type":"select","label":"Risco funcional","required":false,"options":["Baixo","Moderado","Alto"]},
          {"id":"resp_prognostico","type":"textarea","label":"Prognóstico inicial","required":false}
        ]},
        {"id":"resp_plano","type":"section","title":"Plano Fisioterapêutico Respiratório","fields":[
          {"id":"resp_obj_ventilatorio","type":"textarea","label":"Objetivo ventilatório","required":false},
          {"id":"resp_obj_higiene","type":"textarea","label":"Objetivo de higiene brônquica","required":false},
          {"id":"resp_obj_condicionamento","type":"textarea","label":"Objetivo de condicionamento","required":false},
          {"id":"resp_estrategia","type":"textarea","label":"Estratégia terapêutica","required":false},
          {"id":"resp_tecnicas","type":"textarea","label":"Técnicas previstas","required":false},
          {"id":"resp_orientacoes","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"resp_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
          {"id":"resp_criterios_evolucao","type":"textarea","label":"Critérios de evolução","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese Desportiva / Esportiva",
      "is_default": false,
      "icon": "Trophy",
      "structure": [
        {"id":"esp_identificacao","type":"section","title":"Identificação Esportiva","fields":[
          {"id":"esp_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"esp_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"esp_modalidade","type":"text","label":"Modalidade esportiva","required":false},
          {"id":"esp_nivel","type":"select","label":"Nível de prática","required":false,"options":["Recreativo","Amador","Semi-profissional","Profissional","Elite"]},
          {"id":"esp_posicao","type":"text","label":"Posição ou função esportiva","required":false},
          {"id":"esp_freq_treino","type":"select","label":"Frequência de treino","required":false,"options":["1-2x/semana","3-4x/semana","5-6x/semana","Diário","Bi-diário"]},
          {"id":"esp_objetivo_esportivo","type":"textarea","label":"Objetivo esportivo atual","required":false},
          {"id":"esp_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"esp_queixa","type":"section","title":"Queixa Esportiva Principal","fields":[
          {"id":"esp_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"esp_regiao_lesionada","type":"text","label":"Região lesionada","required":false},
          {"id":"esp_lado","type":"select","label":"Lado acometido","required":false,"options":["Direito","Esquerdo","Bilateral","Central","Não se aplica"]},
          {"id":"esp_data_inicio","type":"date","label":"Data do início","required":false},
          {"id":"esp_situacao_lesao","type":"textarea","label":"Situação em que ocorreu a lesão","required":false},
          {"id":"esp_mecanismo","type":"select","label":"Mecanismo de lesão","required":false,"options":["Súbito","Gradual","Traumático","Sobrecarga","Desconhecido","Outro"]},
          {"id":"esp_contato","type":"radio","label":"Houve contato","required":false,"options":["Sim","Não"]},
          {"id":"esp_evolucao","type":"select","label":"Evolução clínica","required":false,"options":["Aguda","Subaguda","Crônica","Recorrente"]},
          {"id":"esp_objetivo_atleta","type":"textarea","label":"Objetivo do atleta","required":true}
        ]},
        {"id":"esp_carga","type":"section","title":"Carga de Treino e Contexto","fields":[
          {"id":"esp_volume","type":"textarea","label":"Volume de treino","required":false},
          {"id":"esp_intensidade","type":"textarea","label":"Intensidade de treino","required":false},
          {"id":"esp_mudanca_carga","type":"radio","label":"Mudança recente de carga","required":false,"options":["Sim","Não"]},
          {"id":"esp_mudanca_equip","type":"radio","label":"Mudança recente de equipamento","required":false,"options":["Sim","Não"]},
          {"id":"esp_mudanca_superficie","type":"radio","label":"Mudança de superfície","required":false,"options":["Sim","Não"]},
          {"id":"esp_aquecimento","type":"radio","label":"Aquecimento inadequado","required":false,"options":["Sim","Não"]},
          {"id":"esp_overtraining","type":"radio","label":"Histórico de excesso de treino","required":false,"options":["Sim","Não"]},
          {"id":"esp_periodo","type":"select","label":"Período","required":false,"options":["Preparatório","Competitivo","Transição","Pré-temporada"]},
          {"id":"esp_sono","type":"textarea","label":"Sono","required":false},
          {"id":"esp_recuperacao","type":"textarea","label":"Recuperação","required":false},
          {"id":"esp_estresse","type":"textarea","label":"Estresse","required":false}
        ]},
        {"id":"esp_sintomas","type":"section","title":"Sintomas","fields":[
          {"id":"esp_dor","type":"radio","label":"Dor","required":false,"options":["Sim","Não"]},
          {"id":"esp_eva","type":"number","label":"EVA inicial (0-10)","required":false},
          {"id":"esp_edema","type":"radio","label":"Edema","required":false,"options":["Sim","Não"]},
          {"id":"esp_rigidez","type":"radio","label":"Rigidez","required":false,"options":["Sim","Não"]},
          {"id":"esp_instabilidade","type":"radio","label":"Instabilidade","required":false,"options":["Sim","Não"]},
          {"id":"esp_fraqueza","type":"radio","label":"Fraqueza","required":false,"options":["Sim","Não"]},
          {"id":"esp_limitacao_desempenho","type":"textarea","label":"Limitação de desempenho","required":false},
          {"id":"esp_medo_retorno","type":"radio","label":"Medo de retorno","required":false,"options":["Sim","Não"]},
          {"id":"esp_sintomas_gesto","type":"textarea","label":"Sintomas durante gesto esportivo","required":false},
          {"id":"esp_sintomas_pos_treino","type":"textarea","label":"Sintomas após treino","required":false}
        ]},
        {"id":"esp_historico","type":"section","title":"Histórico Esportivo e de Lesões","fields":[
          {"id":"esp_tempo_pratica","type":"text","label":"Tempo de prática esportiva","required":false},
          {"id":"esp_lesoes_previas","type":"textarea","label":"Lesões prévias","required":false},
          {"id":"esp_cirurgias","type":"textarea","label":"Cirurgias","required":false},
          {"id":"esp_afastamentos","type":"textarea","label":"Afastamentos prévios","required":false},
          {"id":"esp_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"esp_retorno_precoce","type":"radio","label":"Retorno precoce anterior","required":false,"options":["Sim","Não"]},
          {"id":"esp_ortese_bandagem","type":"textarea","label":"Uso de órtese ou bandagem","required":false},
          {"id":"esp_exames_imagem","type":"textarea","label":"Exames de imagem","required":false},
          {"id":"esp_diagnostico_medico","type":"textarea","label":"Diagnóstico médico","required":false}
        ]},
        {"id":"esp_funcionalidade","type":"section","title":"Funcionalidade Esportiva","fields":[
          {"id":"esp_dif_correr","type":"select","label":"Dificuldade para correr","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_saltar","type":"select","label":"Dificuldade para saltar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_mudar_direcao","type":"select","label":"Dificuldade para mudar direção","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_desacelerar","type":"select","label":"Dificuldade para desacelerar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_arremessar","type":"select","label":"Dificuldade para arremessar ou golpear","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_agachar","type":"select","label":"Dificuldade para agachar","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_treino_tecnico","type":"select","label":"Dificuldade para treino técnico","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_dif_treino_fisico","type":"select","label":"Dificuldade para treino físico","required":false,"options":["Nenhuma","Leve","Moderada","Importante","Grave"]},
          {"id":"esp_impacto_funcional","type":"textarea","label":"Impacto funcional esportivo","required":false}
        ]},
        {"id":"esp_exame_fisico","type":"section","title":"Exame Físico Esportivo","fields":[
          {"id":"esp_inspecao","type":"textarea","label":"Inspeção","required":false},
          {"id":"esp_mobilidade","type":"textarea","label":"Mobilidade","required":false},
          {"id":"esp_forca","type":"textarea","label":"Força muscular","required":false},
          {"id":"esp_oxford","type":"number","label":"Escala de Oxford (0-5)","required":false},
          {"id":"esp_controle_motor","type":"textarea","label":"Controle motor","required":false},
          {"id":"esp_equilibrio","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"esp_testes_funcionais","type":"textarea","label":"Testes funcionais","required":false},
          {"id":"esp_testes_gesto","type":"textarea","label":"Testes específicos do gesto esportivo","required":false},
          {"id":"esp_dor_provocada","type":"textarea","label":"Dor provocada","required":false},
          {"id":"esp_palpacao","type":"textarea","label":"Palpação","required":false},
          {"id":"esp_marcha_corrida","type":"textarea","label":"Marcha ou corrida observada","required":false},
          {"id":"esp_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"esp_diagnostico","type":"section","title":"Diagnóstico Funcional Esportivo","fields":[
          {"id":"esp_diag_funcional","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
          {"id":"esp_deficits","type":"textarea","label":"Déficits principais","required":false},
          {"id":"esp_fatores_predisponentes","type":"textarea","label":"Fatores predisponentes","required":false},
          {"id":"esp_fatores_sobrecarga","type":"textarea","label":"Fatores de sobrecarga","required":false},
          {"id":"esp_risco_retorno_precoce","type":"select","label":"Risco de retorno precoce","required":false,"options":["Baixo","Moderado","Alto"]},
          {"id":"esp_prognostico","type":"textarea","label":"Prognóstico","required":false}
        ]},
        {"id":"esp_plano","type":"section","title":"Plano Fisioterapêutico Esportivo","fields":[
          {"id":"esp_obj_analgesico","type":"textarea","label":"Objetivo analgésico","required":false},
          {"id":"esp_obj_funcional","type":"textarea","label":"Objetivo funcional","required":false},
          {"id":"esp_obj_performance","type":"textarea","label":"Objetivo de performance","required":false},
          {"id":"esp_estrategia_recuperacao","type":"textarea","label":"Estratégia de recuperação","required":false},
          {"id":"esp_estrategia_recondicionamento","type":"textarea","label":"Estratégia de recondicionamento","required":false},
          {"id":"esp_estrategia_retorno","type":"textarea","label":"Estratégia de retorno ao esporte","required":false},
          {"id":"esp_exercicios_iniciais","type":"textarea","label":"Exercícios iniciais","required":false},
          {"id":"esp_criterios_progressao","type":"textarea","label":"Critérios de progressão","required":false},
          {"id":"esp_criterios_retorno","type":"textarea","label":"Critérios de retorno","required":false},
          {"id":"esp_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]}
        ]}
      ]
    },
    {
      "name": "Anamnese de Reabilitação Funcional",
      "is_default": false,
      "icon": "Accessibility",
      "structure": [
        {"id":"reab_identificacao","type":"section","title":"Identificação Funcional","fields":[
          {"id":"reab_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"reab_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"reab_motivo","type":"textarea","label":"Motivo principal da reabilitação","required":false},
          {"id":"reab_encaminhamento","type":"text","label":"Encaminhamento","required":false},
          {"id":"reab_contexto","type":"textarea","label":"Contexto clínico","required":false},
          {"id":"reab_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"reab_queixa","type":"section","title":"Queixa e Objetivo Funcional","fields":[
          {"id":"reab_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"reab_limitacao_principal","type":"textarea","label":"Principal limitação funcional","required":false},
          {"id":"reab_objetivo_paciente","type":"textarea","label":"Objetivo do paciente","required":true},
          {"id":"reab_objetivo_cuidador","type":"textarea","label":"Objetivo do cuidador ou família","required":false},
          {"id":"reab_tempo_limitacao","type":"text","label":"Tempo de limitação","required":false},
          {"id":"reab_evolucao","type":"textarea","label":"Evolução da limitação","required":false}
        ]},
        {"id":"reab_historico","type":"section","title":"Histórico Clínico Relevante","fields":[
          {"id":"reab_condicao_base","type":"textarea","label":"Condição clínica de base","required":false},
          {"id":"reab_cirurgias","type":"textarea","label":"Cirurgias","required":false},
          {"id":"reab_internacoes","type":"textarea","label":"Internações","required":false},
          {"id":"reab_imobilizacao","type":"textarea","label":"Imobilização prolongada","required":false},
          {"id":"reab_descondicionamento","type":"textarea","label":"Perda de condicionamento","required":false},
          {"id":"reab_doencas_associadas","type":"textarea","label":"Doenças associadas","required":false},
          {"id":"reab_medicamentos","type":"textarea","label":"Medicamentos em uso","required":false},
          {"id":"reab_exames","type":"textarea","label":"Exames relevantes","required":false},
          {"id":"reab_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false}
        ]},
        {"id":"reab_funcionalidade","type":"section","title":"Funcionalidade Atual","fields":[
          {"id":"reab_mobilidade_leito","type":"select","label":"Mobilidade no leito","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_transferencia","type":"select","label":"Transferência cama-cadeira","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_sentar_levantar","type":"select","label":"Sentar e levantar","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_ortostatismo","type":"select","label":"Ortostatismo","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_marcha","type":"select","label":"Marcha","required":false,"options":["Independente","Com dispositivo","Supervisão","Assistência parcial","Impossibilitada"]},
          {"id":"reab_escadas","type":"select","label":"Escadas","required":false,"options":["Independente","Com corrimão","Supervisão","Assistência","Impossibilitada"]},
          {"id":"reab_autocuidado","type":"select","label":"Autocuidado","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_alimentacao","type":"select","label":"Alimentação","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_vestuario","type":"select","label":"Vestuário","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_banho","type":"select","label":"Banho","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_banheiro","type":"select","label":"Uso do banheiro","required":false,"options":["Independente","Supervisão","Assistência parcial","Assistência total"]},
          {"id":"reab_grau_independencia","type":"select","label":"Grau de independência","required":false,"options":["Independente","Parcialmente dependente","Dependente"]},
          {"id":"reab_necessidade_ajuda","type":"textarea","label":"Necessidade de ajuda","required":false}
        ]},
        {"id":"reab_dispositivos","type":"section","title":"Dispositivos e Adaptações","fields":[
          {"id":"reab_uso_bengala","type":"radio","label":"Uso de bengala","required":false,"options":["Sim","Não"]},
          {"id":"reab_uso_muleta","type":"radio","label":"Uso de muleta","required":false,"options":["Sim","Não"]},
          {"id":"reab_uso_andador","type":"radio","label":"Uso de andador","required":false,"options":["Sim","Não"]},
          {"id":"reab_uso_cadeira_rodas","type":"radio","label":"Uso de cadeira de rodas","required":false,"options":["Sim","Não"]},
          {"id":"reab_uso_ortese","type":"radio","label":"Uso de órtese","required":false,"options":["Sim","Não"]},
          {"id":"reab_uso_protese","type":"radio","label":"Uso de prótese","required":false,"options":["Sim","Não"]},
          {"id":"reab_adaptacoes","type":"textarea","label":"Adaptações domiciliares","required":false},
          {"id":"reab_barreiras","type":"textarea","label":"Barreiras ambientais","required":false}
        ]},
        {"id":"reab_sintomas","type":"section","title":"Sintomas Atuais","fields":[
          {"id":"reab_dor","type":"radio","label":"Dor","required":false,"options":["Sim","Não"]},
          {"id":"reab_eva","type":"number","label":"EVA (0-10)","required":false},
          {"id":"reab_fadiga","type":"radio","label":"Fadiga","required":false,"options":["Sim","Não"]},
          {"id":"reab_fraqueza","type":"radio","label":"Fraqueza","required":false,"options":["Sim","Não"]},
          {"id":"reab_equilibrio_reduzido","type":"radio","label":"Equilíbrio reduzido","required":false,"options":["Sim","Não"]},
          {"id":"reab_tontura","type":"radio","label":"Tontura","required":false,"options":["Sim","Não"]},
          {"id":"reab_medo_movimento","type":"radio","label":"Medo de movimento","required":false,"options":["Sim","Não"]},
          {"id":"reab_medo_cair","type":"radio","label":"Medo de cair","required":false,"options":["Sim","Não"]},
          {"id":"reab_intolerancia_esforco","type":"radio","label":"Intolerância ao esforço","required":false,"options":["Sim","Não"]},
          {"id":"reab_obs_sintomas","type":"textarea","label":"Observações dos sintomas","required":false}
        ]},
        {"id":"reab_exame_fisico","type":"section","title":"Exame Físico Funcional","fields":[
          {"id":"reab_postura","type":"textarea","label":"Postura","required":false},
          {"id":"reab_mobilidade_ef","type":"textarea","label":"Mobilidade","required":false},
          {"id":"reab_forca","type":"textarea","label":"Força muscular","required":false},
          {"id":"reab_oxford","type":"number","label":"Escala de Oxford (0-5)","required":false},
          {"id":"reab_equilibrio","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"reab_coordenacao","type":"textarea","label":"Coordenação","required":false},
          {"id":"reab_marcha_ef","type":"textarea","label":"Marcha","required":false},
          {"id":"reab_tolerancia_esforco","type":"textarea","label":"Tolerância ao esforço","required":false},
          {"id":"reab_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
          {"id":"reab_adm","type":"textarea","label":"Amplitude de movimento","required":false},
          {"id":"reab_controle_postural","type":"textarea","label":"Controle postural","required":false},
          {"id":"reab_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"reab_diagnostico","type":"section","title":"Diagnóstico Funcional","fields":[
          {"id":"reab_diag_funcional","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
          {"id":"reab_deficits","type":"textarea","label":"Déficits principais","required":false},
          {"id":"reab_limitacoes_atividade","type":"textarea","label":"Limitações de atividade","required":false},
          {"id":"reab_restricao_participacao","type":"textarea","label":"Restrição de participação","required":false},
          {"id":"reab_barreiras_diag","type":"textarea","label":"Barreiras","required":false},
          {"id":"reab_prognostico","type":"textarea","label":"Prognóstico funcional","required":false}
        ]},
        {"id":"reab_plano","type":"section","title":"Plano de Reabilitação Funcional","fields":[
          {"id":"reab_obj_imediato","type":"textarea","label":"Objetivo imediato","required":false},
          {"id":"reab_obj_curto","type":"textarea","label":"Objetivo de curto prazo","required":false},
          {"id":"reab_obj_medio","type":"textarea","label":"Objetivo de médio prazo","required":false},
          {"id":"reab_obj_longo","type":"textarea","label":"Objetivo de longo prazo","required":false},
          {"id":"reab_estrategia","type":"textarea","label":"Estratégia terapêutica","required":false},
          {"id":"reab_estrategia_independencia","type":"textarea","label":"Estratégia para independência","required":false},
          {"id":"reab_estrategia_marcha","type":"textarea","label":"Estratégia para marcha","required":false},
          {"id":"reab_estrategia_equilibrio","type":"textarea","label":"Estratégia para equilíbrio","required":false},
          {"id":"reab_orientacoes","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"reab_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]}
        ]}
      ]
    },
    {
      "name": "Anamnese de Dor Crônica",
      "is_default": false,
      "icon": "Flame",
      "structure": [
        {"id":"dc_identificacao","type":"section","title":"Identificação da Dor Crônica","fields":[
          {"id":"dc_data_avaliacao","type":"date","label":"Data da avaliação","required":true},
          {"id":"dc_profissional","type":"text","label":"Profissional responsável","required":true},
          {"id":"dc_tempo_dor","type":"text","label":"Tempo total de dor","required":false},
          {"id":"dc_regiao_principal","type":"text","label":"Região principal da dor","required":false},
          {"id":"dc_padrao_principal","type":"select","label":"Padrão principal","required":false,"options":["Contínuo","Intermitente","Episódico","Flutuante"]},
          {"id":"dc_encaminhamento","type":"text","label":"Encaminhamento","required":false},
          {"id":"dc_obs_iniciais","type":"textarea","label":"Observações iniciais","required":false}
        ]},
        {"id":"dc_queixa","type":"section","title":"Queixa Principal e História da Dor","fields":[
          {"id":"dc_queixa_principal","type":"textarea","label":"Queixa principal","required":true},
          {"id":"dc_inicio_dor","type":"text","label":"Início da dor","required":false},
          {"id":"dc_mecanismo_inicial","type":"select","label":"Mecanismo inicial","required":false,"options":["Súbito","Gradual","Traumático","Pós-cirúrgico","Desconhecido","Outro"]},
          {"id":"dc_evolucao","type":"select","label":"Evolução clínica","required":false,"options":["Aguda","Subaguda","Crônica","Recorrente"]},
          {"id":"dc_continua_episodica","type":"select","label":"Dor contínua ou episódica","required":false,"options":["Contínua","Episódica"]},
          {"id":"dc_crises","type":"textarea","label":"Crises","required":false},
          {"id":"dc_objetivo_paciente","type":"textarea","label":"Objetivo do paciente","required":true},
          {"id":"dc_expectativa","type":"textarea","label":"Expectativa em relação ao tratamento","required":false}
        ]},
        {"id":"dc_caracterizacao","type":"section","title":"Caracterização da Dor","fields":[
          {"id":"dc_eva","type":"number","label":"EVA inicial (0-10)","required":false},
          {"id":"dc_localizacao","type":"textarea","label":"Localização","required":false},
          {"id":"dc_irradiacao","type":"textarea","label":"Irradiação","required":false},
          {"id":"dc_tipo_dor","type":"select","label":"Tipo de dor","required":false,"options":["Pontada","Queimação","Pressão","Latejante","Choque","Peso","Difusa","Outro"]},
          {"id":"dc_frequencia","type":"select","label":"Frequência","required":false,"options":["Contínua","Intermitente","Eventual"]},
          {"id":"dc_intensidade_media","type":"number","label":"Intensidade média (0-10)","required":false},
          {"id":"dc_intensidade_maxima","type":"number","label":"Intensidade máxima (0-10)","required":false},
          {"id":"dc_intensidade_minima","type":"number","label":"Intensidade mínima (0-10)","required":false},
          {"id":"dc_dor_repouso","type":"radio","label":"Dor em repouso","required":false,"options":["Sim","Não"]},
          {"id":"dc_dor_movimento","type":"radio","label":"Dor ao movimento","required":false,"options":["Sim","Não"]},
          {"id":"dc_dor_noturna","type":"radio","label":"Dor noturna","required":false,"options":["Sim","Não"]},
          {"id":"dc_fatores_melhora","type":"textarea","label":"Fatores de melhora","required":false},
          {"id":"dc_fatores_piora","type":"textarea","label":"Fatores de piora","required":false}
        ]},
        {"id":"dc_impacto","type":"section","title":"Impacto da Dor","fields":[
          {"id":"dc_impacto_sono","type":"select","label":"Impacto no sono","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_trabalho","type":"select","label":"Impacto no trabalho","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_domesticas","type":"select","label":"Impacto nas atividades domésticas","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_humor","type":"select","label":"Impacto no humor","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_exercicio","type":"select","label":"Impacto na prática de exercícios","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_social","type":"select","label":"Impacto social","required":false,"options":["Nenhum","Leve","Moderado","Importante","Grave"]},
          {"id":"dc_impacto_global","type":"textarea","label":"Impacto funcional global","required":false},
          {"id":"dc_medo_movimento","type":"radio","label":"Medo de movimento","required":false,"options":["Sim","Não"]},
          {"id":"dc_evitacao","type":"radio","label":"Evitação por dor","required":false,"options":["Sim","Não"]}
        ]},
        {"id":"dc_historico_terapeutico","type":"section","title":"Histórico Terapêutico","fields":[
          {"id":"dc_diagnosticos_previos","type":"textarea","label":"Diagnósticos prévios","required":false},
          {"id":"dc_exames","type":"textarea","label":"Exames realizados","required":false},
          {"id":"dc_tratamentos_previos","type":"textarea","label":"Tratamentos prévios","required":false},
          {"id":"dc_fisio_previa","type":"textarea","label":"Fisioterapia prévia","required":false},
          {"id":"dc_medicamentos","type":"textarea","label":"Uso de medicamentos","required":false},
          {"id":"dc_infiltracao","type":"radio","label":"Infiltração","required":false,"options":["Sim","Não"]},
          {"id":"dc_cirurgias","type":"textarea","label":"Cirurgias","required":false},
          {"id":"dc_multiprofissional","type":"textarea","label":"Abordagem multiprofissional","required":false},
          {"id":"dc_resposta_tratamentos","type":"textarea","label":"Resposta a tratamentos prévios","required":false}
        ]},
        {"id":"dc_psicossocial","type":"section","title":"Aspectos Psicossociais Relacionados","fields":[
          {"id":"dc_ansiedade","type":"select","label":"Ansiedade","required":false,"options":["Ausente","Leve","Moderada","Importante"]},
          {"id":"dc_humor_deprimido","type":"select","label":"Humor deprimido","required":false,"options":["Ausente","Leve","Moderado","Importante"]},
          {"id":"dc_catastrofizacao","type":"select","label":"Catastrofização percebida","required":false,"options":["Ausente","Leve","Moderada","Importante"]},
          {"id":"dc_crenca_dano","type":"radio","label":"Crença de dano estrutural permanente","required":false,"options":["Sim","Não"]},
          {"id":"dc_medo_piorar","type":"radio","label":"Medo de piorar","required":false,"options":["Sim","Não"]},
          {"id":"dc_baixa_adesao","type":"radio","label":"Baixa adesão","required":false,"options":["Sim","Não"]},
          {"id":"dc_estresse","type":"select","label":"Estresse","required":false,"options":["Ausente","Leve","Moderado","Importante"]},
          {"id":"dc_sono_ruim","type":"radio","label":"Sono ruim","required":false,"options":["Sim","Não"]},
          {"id":"dc_fadiga","type":"radio","label":"Fadiga","required":false,"options":["Sim","Não"]},
          {"id":"dc_suporte_familiar","type":"select","label":"Suporte familiar","required":false,"options":["Bom","Regular","Insuficiente"]},
          {"id":"dc_obs_psicossociais","type":"textarea","label":"Observações psicossociais","required":false}
        ]},
        {"id":"dc_exame_fisico","type":"section","title":"Exame Físico da Dor Crônica","fields":[
          {"id":"dc_inspecao","type":"textarea","label":"Inspeção","required":false},
          {"id":"dc_postura","type":"textarea","label":"Postura","required":false},
          {"id":"dc_mobilidade","type":"textarea","label":"Mobilidade","required":false},
          {"id":"dc_forca","type":"textarea","label":"Força muscular","required":false},
          {"id":"dc_oxford","type":"number","label":"Escala de Oxford (0-5)","required":false},
          {"id":"dc_sensibilidade","type":"textarea","label":"Sensibilidade","required":false},
          {"id":"dc_hipersensibilidade","type":"radio","label":"Hipersensibilidade","required":false,"options":["Sim","Não"]},
          {"id":"dc_resposta_toque","type":"textarea","label":"Resposta ao toque","required":false},
          {"id":"dc_palpacao","type":"textarea","label":"Palpação","required":false},
          {"id":"dc_equilibrio","type":"textarea","label":"Equilíbrio","required":false},
          {"id":"dc_marcha","type":"textarea","label":"Marcha","required":false},
          {"id":"dc_tolerancia_esforco","type":"textarea","label":"Tolerância ao esforço","required":false},
          {"id":"dc_obs_exame","type":"textarea","label":"Observações do exame","required":false}
        ]},
        {"id":"dc_diagnostico","type":"section","title":"Diagnóstico Funcional Relacionado à Dor","fields":[
          {"id":"dc_diag_funcional","type":"textarea","label":"Diagnóstico cinético-funcional","required":false},
          {"id":"dc_fatores_perpetuadores","type":"textarea","label":"Fatores perpetuadores","required":false},
          {"id":"dc_comportamentos_protecao","type":"textarea","label":"Comportamentos de proteção","required":false},
          {"id":"dc_deficits","type":"textarea","label":"Déficits identificados","required":false},
          {"id":"dc_mecanismos_suspeitos","type":"textarea","label":"Mecanismos funcionais suspeitos","required":false},
          {"id":"dc_prognostico","type":"textarea","label":"Prognóstico funcional","required":false}
        ]},
        {"id":"dc_plano","type":"section","title":"Plano Terapêutico para Dor Crônica","fields":[
          {"id":"dc_obj_funcional","type":"textarea","label":"Objetivo funcional principal","required":false},
          {"id":"dc_obj_reducao_incapacidade","type":"textarea","label":"Objetivo de redução de incapacidade","required":false},
          {"id":"dc_obj_exposicao_gradual","type":"textarea","label":"Objetivo de exposição gradual","required":false},
          {"id":"dc_obj_retomada","type":"textarea","label":"Objetivo de retomada de atividade","required":false},
          {"id":"dc_estrategia","type":"textarea","label":"Estratégia terapêutica","required":false},
          {"id":"dc_educacao_dor","type":"textarea","label":"Educação em dor","required":false},
          {"id":"dc_exercicios_iniciais","type":"textarea","label":"Exercícios iniciais","required":false},
          {"id":"dc_orientacoes","type":"textarea","label":"Orientações domiciliares","required":false},
          {"id":"dc_frequencia","type":"select","label":"Frequência sugerida","required":false,"options":["1x/semana","2x/semana","3x/semana","Mais de 3x/semana"]},
          {"id":"dc_criterios_evolucao","type":"textarea","label":"Critérios de evolução","required":false}
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
        true, true, false, false,
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
  _clinic RECORD;
  _result INTEGER;
BEGIN
  FOR _clinic IN
    SELECT s.clinic_id, s.id AS specialty_id
    FROM public.specialties s
    WHERE s.slug = 'fisioterapia' AND s.is_active = true
  LOOP
    SELECT public.provision_fisioterapia_anamnesis_templates(_clinic.clinic_id, _clinic.specialty_id) INTO _result;
    RAISE NOTICE 'Clinic %: % new fisio templates (7-10)', _clinic.clinic_id, _result;
  END LOOP;
END;
$$;
