
DO $$
DECLARE
  v_sid uuid := 'd241f90c-0fdd-4e2c-a959-6482d7ac2370';
  v_cid uuid := 'f95ac79d-9ceb-4e20-83b0-0592276faac1';
  v_tid uuid; v_vid uuid;
  v_s10 jsonb; v_s11 jsonb; v_s12 jsonb;
BEGIN

-- MODEL 10 - PROCEDIMENTOS ESTÉTICOS
v_s10 := '[
{"id":"s10_1","type":"section","title":"Identificação","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Acompanhamento"]},
  {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
  {"id":"procedimento_interesse","type":"text","label":"Procedimento de Interesse"},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"s10_2","type":"section","title":"Queixa Estética Principal","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
  {"id":"objetivo_estetico","type":"textarea","label":"Objetivo Estético"},
  {"id":"regiao_incomodo","type":"text","label":"Região de Maior Incômodo"},
  {"id":"manchas","type":"radio","label":"Manchas","options":["Sim","Não"]},
  {"id":"cicatrizes","type":"radio","label":"Cicatrizes","options":["Sim","Não"]},
  {"id":"rugas_finas","type":"radio","label":"Rugas Finas","options":["Sim","Não"]},
  {"id":"flacidez","type":"radio","label":"Flacidez","options":["Sim","Não"]},
  {"id":"poros_dilatados","type":"radio","label":"Poros Dilatados","options":["Sim","Não"]},
  {"id":"oleosidade","type":"select","label":"Oleosidade","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"sensibilidade","type":"select","label":"Sensibilidade","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
]},
{"id":"s10_3","type":"section","title":"Histórico Estético Prévio","fields":[
  {"id":"procedimentos_previos","type":"textarea","label":"Procedimentos Prévios"},
  {"id":"peelings_previos","type":"radio","label":"Peelings Prévios","options":["Sim","Não"]},
  {"id":"laser_previo","type":"radio","label":"Laser Prévio","options":["Sim","Não"]},
  {"id":"microagulhamento_previo","type":"radio","label":"Microagulhamento Prévio","options":["Sim","Não"]},
  {"id":"preenchimento_previo","type":"radio","label":"Preenchimento Prévio","options":["Sim","Não"]},
  {"id":"toxina_previa","type":"radio","label":"Toxina Prévia","options":["Sim","Não"]},
  {"id":"complicacoes_esteticas","type":"textarea","label":"Complicações Estéticas Prévias"},
  {"id":"hiperpigmentacao_pos","type":"radio","label":"Hiperpigmentação Pós-procedimento","options":["Sim","Não"]},
  {"id":"cicatrizacao_alterada","type":"radio","label":"Cicatrização Alterada","options":["Sim","Não"]},
  {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos Prévios"},
  {"id":"obs_historico","type":"textarea","label":"Observações do Histórico"}
]},
{"id":"s10_4","type":"section","title":"Segurança Clínica","fields":[
  {"id":"uso_isotretinoina","type":"radio","label":"Uso de Isotretinoína","options":["Sim","Não"]},
  {"id":"gestacao","type":"select","label":"Gestação","options":["Não se aplica","Sim","Não"]},
  {"id":"lactacao","type":"select","label":"Lactação","options":["Não se aplica","Sim","Não"]},
  {"id":"doencas_autoimunes","type":"radio","label":"Doenças Autoimunes","options":["Sim","Não"]},
  {"id":"tendencia_queloide","type":"radio","label":"Tendência a Queloide","options":["Sim","Não"]},
  {"id":"herpes_recorrente","type":"radio","label":"Herpes Recorrente","options":["Sim","Não"]},
  {"id":"alergias","type":"textarea","label":"Alergias"},
  {"id":"uso_anticoagulantes","type":"radio","label":"Uso de Anticoagulantes","options":["Sim","Não"]},
  {"id":"fototipo","type":"select","label":"Fototipo Referido","options":["I","II","III","IV","V","VI"]},
  {"id":"exposicao_solar_recente","type":"radio","label":"Exposição Solar Recente","options":["Sim","Não"]},
  {"id":"obs_medicas","type":"textarea","label":"Observações Médicas Relevantes"}
]},
{"id":"s10_5","type":"section","title":"Exame Inicial","fields":[
  {"id":"tipo_pele","type":"select","label":"Tipo de Pele","options":["Normal","Seca","Oleosa","Mista","Sensível"]},
  {"id":"oleosidade_exame","type":"select","label":"Oleosidade","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"sensibilidade_cutanea","type":"select","label":"Sensibilidade Cutânea","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"eritema","type":"radio","label":"Eritema","options":["Sim","Não"]},
  {"id":"manchas_exame","type":"radio","label":"Manchas","options":["Sim","Não"]},
  {"id":"cicatrizes_exame","type":"radio","label":"Cicatrizes","options":["Sim","Não"]},
  {"id":"flacidez_exame","type":"radio","label":"Flacidez","options":["Sim","Não"]},
  {"id":"rugas_exame","type":"radio","label":"Rugas","options":["Sim","Não"]},
  {"id":"textura_irregular","type":"radio","label":"Textura Irregular","options":["Sim","Não"]},
  {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
  {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
]},
{"id":"s10_6","type":"section","title":"Hipóteses e Elegibilidade Inicial","fields":[
  {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
  {"id":"objetivo_terapeutico","type":"textarea","label":"Objetivo Terapêutico Principal"},
  {"id":"elegibilidade","type":"select","label":"Elegibilidade Inicial para Procedimento","options":["Elegível","Condicionada","Não elegível"]},
  {"id":"risco_clinico","type":"select","label":"Risco Clínico","options":["Baixo","Moderado","Alto"]},
  {"id":"necessidade_preparo","type":"radio","label":"Necessidade de Preparo Prévio","options":["Sim","Não"]},
  {"id":"necessidade_exame","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
]},
{"id":"s10_7","type":"section","title":"Plano Inicial Estético","fields":[
  {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
  {"id":"procedimento_sugerido","type":"text","label":"Procedimento Sugerido"},
  {"id":"orientacoes_pre","type":"textarea","label":"Orientações Pré-procedimento"},
  {"id":"fotoprotecao","type":"textarea","label":"Fotoproteção Orientada"},
  {"id":"registro_fotografico","type":"radio","label":"Registro Fotográfico","options":["Sim","Não"]},
  {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","Conforme necessidade"]},
  {"id":"prioridade","type":"select","label":"Prioridade Terapêutica","options":["Baixa","Moderada","Alta"]},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese Dermatológica para Procedimentos Estéticos','Modelo focado em queixas estéticas dermatológicas, textura, manchas, linhas, poros, oleosidade, cicatrizes e segurança para procedimentos.',v_sid,'dermatologia','Sparkles',v_s10,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s10,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

-- MODEL 11 - DERMATOSES CRÔNICAS DE SEGUIMENTO
v_s11 := '[
{"id":"s11_1","type":"section","title":"Identificação","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Retorno","Acompanhamento","Reavaliação"]},
  {"id":"retorno_seguimento","type":"radio","label":"Retorno de Seguimento","options":["Sim","Não"]},
  {"id":"diagnostico_previo","type":"text","label":"Diagnóstico Prévio Conhecido"},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"s11_2","type":"section","title":"Estado Atual do Quadro","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal Atual","required":true},
  {"id":"estabilidade","type":"select","label":"Estabilidade ou Piora","options":["Estável","Melhora","Piora","Flutuante"]},
  {"id":"recorrencia","type":"radio","label":"Recorrência","options":["Sim","Não"]},
  {"id":"frequencia_crises","type":"select","label":"Frequência de Crises","options":["Rara","Eventual","Frequente","Contínua"]},
  {"id":"regiao_acometida","type":"text","label":"Região Acometida Atual"},
  {"id":"intensidade_sintomas","type":"select","label":"Intensidade dos Sintomas","options":["Leve","Moderada","Intensa","Muito intensa"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
]},
{"id":"s11_3","type":"section","title":"Controle Clínico","fields":[
  {"id":"prurido","type":"select","label":"Prurido Atual","options":["Ausente","Leve","Moderado","Intenso"]},
  {"id":"dor","type":"select","label":"Dor Atual","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"ardor","type":"radio","label":"Ardor Atual","options":["Sim","Não"]},
  {"id":"descamacao","type":"radio","label":"Descamação Atual","options":["Sim","Não"]},
  {"id":"secrecao","type":"radio","label":"Secreção Atual","options":["Sim","Não"]},
  {"id":"impacto_sono","type":"select","label":"Impacto no Sono","options":["Nenhum","Leve","Moderado","Grave"]},
  {"id":"impacto_funcional","type":"select","label":"Impacto Funcional","options":["Nenhum","Leve","Moderado","Grave"]},
  {"id":"impacto_emocional","type":"select","label":"Impacto Emocional","options":["Nenhum","Leve","Moderado","Grave"]},
  {"id":"obs_controle","type":"textarea","label":"Observações do Controle Atual"}
]},
{"id":"s11_4","type":"section","title":"Tratamento e Adesão","fields":[
  {"id":"medicacao_atual","type":"textarea","label":"Medicação Atual"},
  {"id":"uso_correto","type":"radio","label":"Uso Correto do Tratamento","options":["Sim","Não","Parcial"]},
  {"id":"baixa_adesao","type":"radio","label":"Baixa Adesão","options":["Sim","Não"]},
  {"id":"efeitos_adversos","type":"textarea","label":"Efeitos Adversos"},
  {"id":"suspensao_previa","type":"radio","label":"Suspensão Prévia do Tratamento","options":["Sim","Não"]},
  {"id":"automedicacao","type":"radio","label":"Automedicação","options":["Sim","Não"]},
  {"id":"melhora_tratamento","type":"radio","label":"Melhora com Tratamento Atual","options":["Sim","Não","Parcial"]},
  {"id":"piora_apesar","type":"radio","label":"Piora Apesar de Tratamento","options":["Sim","Não"]},
  {"id":"obs_adesao","type":"textarea","label":"Observações de Adesão"}
]},
{"id":"s11_5","type":"section","title":"Gatilhos e Fatores de Manutenção","fields":[
  {"id":"estresse","type":"radio","label":"Estresse","options":["Sim","Não"]},
  {"id":"exposicao_solar","type":"select","label":"Exposição Solar","options":["Baixa","Moderada","Alta"]},
  {"id":"cosmeticos","type":"radio","label":"Cosméticos","options":["Sim","Não"]},
  {"id":"clima","type":"radio","label":"Clima","options":["Sim","Não"]},
  {"id":"alimentos","type":"radio","label":"Alimentos","options":["Sim","Não"]},
  {"id":"infeccao_associada","type":"radio","label":"Infecção Associada","options":["Sim","Não"]},
  {"id":"contato_irritantes","type":"radio","label":"Contato com Irritantes","options":["Sim","Não"]},
  {"id":"comorbidades","type":"textarea","label":"Comorbidades"},
  {"id":"obs_gatilhos","type":"textarea","label":"Observações dos Gatilhos"}
]},
{"id":"s11_6","type":"section","title":"Exame Atual","fields":[
  {"id":"eritema","type":"radio","label":"Eritema","options":["Sim","Não"]},
  {"id":"descamacao_exame","type":"radio","label":"Descamação","options":["Sim","Não"]},
  {"id":"placas","type":"radio","label":"Placas","options":["Sim","Não"]},
  {"id":"liquenificacao","type":"radio","label":"Liquenificação","options":["Sim","Não"]},
  {"id":"escoriacoes","type":"radio","label":"Escoriações","options":["Sim","Não"]},
  {"id":"extensao_corporal","type":"select","label":"Extensão Corporal Acometida","options":["Localizada","Regional","Extensa","Generalizada"]},
  {"id":"infeccao_secundaria","type":"radio","label":"Sinais de Infecção Secundária","options":["Sim","Não"]},
  {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
  {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
]},
{"id":"s11_7","type":"section","title":"Reavaliação Diagnóstica","fields":[
  {"id":"diagnostico_seguimento","type":"text","label":"Diagnóstico Principal em Seguimento"},
  {"id":"hipoteses_associadas","type":"textarea","label":"Hipóteses Associadas"},
  {"id":"grau_atividade","type":"select","label":"Grau de Atividade da Doença","options":["Remissão","Leve","Moderada","Grave","Muito grave"]},
  {"id":"necessidade_exame","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
]},
{"id":"s11_8","type":"section","title":"Plano de Seguimento","fields":[
  {"id":"conduta_atualizada","type":"textarea","label":"Conduta Atualizada"},
  {"id":"ajuste_terapeutico","type":"textarea","label":"Ajuste Terapêutico"},
  {"id":"orientacoes_reforcadas","type":"textarea","label":"Orientações Reforçadas"},
  {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
  {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["15 dias","30 dias","60 dias","90 dias","6 meses","Conforme necessidade"]},
  {"id":"intervalo_acompanhamento","type":"select","label":"Intervalo de Acompanhamento","options":["Quinzenal","Mensal","Bimestral","Trimestral","Semestral"]},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese de Dermatoses Crônicas de Seguimento','Modelo focado em doenças dermatológicas crônicas, recorrência, adesão terapêutica, crises, controle de sintomas e acompanhamento longitudinal.',v_sid,'dermatologia','Clock',v_s11,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s11,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

-- MODEL 12 - TELEATENDIMENTO / TELETRIAGEM
v_s12 := '[
{"id":"s12_1","type":"section","title":"Identificação do Teleatendimento","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_atendimento","type":"select","label":"Tipo de Atendimento Remoto","options":["Teleconsulta","Teletriagem","Retorno remoto","Acompanhamento remoto"]},
  {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
  {"id":"qualidade_imagens","type":"select","label":"Qualidade das Imagens Enviadas","options":["Boa","Razoável","Ruim","Não enviadas"]},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"s12_2","type":"section","title":"Queixa Principal Remota","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
  {"id":"regiao_acometida","type":"text","label":"Região Acometida"},
  {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
  {"id":"inicio_quadro","type":"select","label":"Início do Quadro","options":["Súbito","Gradual","Recorrente","Desconhecido"]},
  {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
  {"id":"dor","type":"select","label":"Dor","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"ardor","type":"radio","label":"Ardor","options":["Sim","Não"]},
  {"id":"sangramento","type":"radio","label":"Sangramento","options":["Sim","Não"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
]},
{"id":"s12_3","type":"section","title":"História Clínica Remota","fields":[
  {"id":"evolucao_quadro","type":"select","label":"Evolução do Quadro","options":["Aguda","Subaguda","Crônica","Recorrente"]},
  {"id":"piora_recente","type":"radio","label":"Piora Recente","options":["Sim","Não"]},
  {"id":"crescimento_lesao","type":"radio","label":"Crescimento de Lesão","options":["Sim","Não"]},
  {"id":"mudanca_cor","type":"radio","label":"Mudança de Cor","options":["Sim","Não"]},
  {"id":"secrecao","type":"radio","label":"Secreção","options":["Sim","Não"]},
  {"id":"febre_associada","type":"radio","label":"Febre Associada","options":["Sim","Não"]},
  {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos Prévios"},
  {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos"},
  {"id":"obs_clinicas","type":"textarea","label":"Observações Clínicas Relatadas"}
]},
{"id":"s12_4","type":"section","title":"Sinais de Alerta e Segurança","fields":[
  {"id":"lesao_progressiva","type":"radio","label":"Lesão Rapidamente Progressiva","options":["Sim","Não"]},
  {"id":"sangramento_persistente","type":"radio","label":"Sangramento Persistente","options":["Sim","Não"]},
  {"id":"dor_intensa","type":"radio","label":"Dor Intensa","options":["Sim","Não"]},
  {"id":"sinais_infeccao","type":"radio","label":"Sinais de Infecção","options":["Sim","Não"]},
  {"id":"febre","type":"radio","label":"Febre","options":["Sim","Não"]},
  {"id":"comprometimento_funcional","type":"radio","label":"Comprometimento Funcional","options":["Sim","Não"]},
  {"id":"lesao_area_sensivel","type":"radio","label":"Lesão em Área Sensível","options":["Sim","Não"]},
  {"id":"suspeita_tumoral","type":"radio","label":"Suspeita Tumoral","options":["Sim","Não"]},
  {"id":"avaliacao_presencial_urgente","type":"radio","label":"Necessidade de Avaliação Presencial Urgente","options":["Sim","Não"]},
  {"id":"obs_seguranca","type":"textarea","label":"Observações de Segurança"}
]},
{"id":"s12_5","type":"section","title":"Dados Visuais e Documentação","fields":[
  {"id":"foto_recebida","type":"radio","label":"Foto Recebida","options":["Sim","Não"]},
  {"id":"foto_adequada","type":"radio","label":"Foto Adequada","options":["Sim","Não"]},
  {"id":"foto_insuficiente","type":"radio","label":"Foto Insuficiente","options":["Sim","Não"]},
  {"id":"multiplos_angulos","type":"radio","label":"Múltiplos Ângulos Enviados","options":["Sim","Não"]},
  {"id":"necessidade_novas_imagens","type":"radio","label":"Necessidade de Novas Imagens","options":["Sim","Não"]},
  {"id":"necessidade_dermatoscopia","type":"radio","label":"Necessidade de Dermatoscopia Presencial","options":["Sim","Não"]},
  {"id":"obs_documentacao","type":"textarea","label":"Observações da Documentação"}
]},
{"id":"s12_6","type":"section","title":"Hipóteses Remotas Iniciais","fields":[
  {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
  {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
  {"id":"limitacao_diagnostica","type":"select","label":"Limitação Diagnóstica do Teleatendimento","options":["Baixa","Moderada","Alta","Muito alta"]},
  {"id":"necessidade_presencial","type":"radio","label":"Necessidade de Exame Presencial","options":["Sim","Não"]},
  {"id":"necessidade_exame","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
]},
{"id":"s12_7","type":"section","title":"Plano Inicial Remoto","fields":[
  {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
  {"id":"orientacoes_imediatas","type":"textarea","label":"Orientações Imediatas"},
  {"id":"indicacao_presencial","type":"select","label":"Indicação de Retorno Presencial","options":["Sim, urgente","Sim, eletivo","Não necessário","Avaliar evolução"]},
  {"id":"grau_urgencia","type":"select","label":"Grau de Urgência","options":["Eletivo","Prioritário","Urgente"]},
  {"id":"solicitacao_fotos","type":"radio","label":"Solicitação de Novas Fotos","options":["Sim","Não"]},
  {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese Dermatológica para Teleatendimento / Teletriagem','Modelo focado em avaliação dermatológica remota, qualidade de imagem, sintomas, sinais de alerta e definição de conduta.',v_sid,'dermatologia','Video',v_s12,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s12,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

END $$;
