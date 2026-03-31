
DO $$
DECLARE
  v_sid uuid := 'd241f90c-0fdd-4e2c-a959-6482d7ac2370';
  v_cid uuid := 'f95ac79d-9ceb-4e20-83b0-0592276faac1';
  v_tid uuid; v_vid uuid;
  v_s4 jsonb; v_s5 jsonb; v_s6 jsonb;
BEGIN

-- MODEL 4 - ACNE
v_s4 := '[
{"id":"id4_1","type":"section","title":"Identificação","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Urgência","Acompanhamento"]},
  {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"id4_2","type":"section","title":"Queixa Principal","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
  {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
  {"id":"inicio_quadro","type":"select","label":"Início do Quadro","options":["Súbito","Gradual","Recorrente","Desconhecido"]},
  {"id":"regiao_principal","type":"text","label":"Região Principal Acometida"},
  {"id":"piora_recente","type":"radio","label":"Piora Recente","options":["Sim","Não"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"},
  {"id":"queixa_estetica","type":"textarea","label":"Queixa Estética Principal"}
]},
{"id":"id4_3","type":"section","title":"História da Acne","fields":[
  {"id":"acne_adolescencia","type":"radio","label":"Acne desde Adolescência","options":["Sim","Não"]},
  {"id":"inicio_adulta","type":"radio","label":"Início na Vida Adulta","options":["Sim","Não"]},
  {"id":"padrao_recorrente","type":"radio","label":"Padrão Recorrente","options":["Sim","Não"]},
  {"id":"piora_premenstrual","type":"radio","label":"Piora Pré-menstrual","options":["Sim","Não","Não se aplica"]},
  {"id":"piora_cosmeticos","type":"radio","label":"Piora com Cosméticos","options":["Sim","Não"]},
  {"id":"piora_estresse","type":"radio","label":"Piora com Estresse","options":["Sim","Não"]},
  {"id":"piora_alimentacao","type":"radio","label":"Piora com Alimentação","options":["Sim","Não"]},
  {"id":"piora_medicacoes","type":"radio","label":"Piora com Medicações","options":["Sim","Não"]},
  {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos Prévios"},
  {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos Prévios"},
  {"id":"efeitos_adversos","type":"textarea","label":"Efeitos Adversos Prévios"},
  {"id":"obs_historia","type":"textarea","label":"Observações da História"}
]},
{"id":"id4_4","type":"section","title":"Características do Quadro","fields":[
  {"id":"oleosidade","type":"select","label":"Oleosidade","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"comedoes","type":"radio","label":"Comedões","options":["Sim","Não"]},
  {"id":"papulas","type":"radio","label":"Pápulas","options":["Sim","Não"]},
  {"id":"pustulas","type":"radio","label":"Pústulas","options":["Sim","Não"]},
  {"id":"nodulos","type":"radio","label":"Nódulos","options":["Sim","Não"]},
  {"id":"cistos","type":"radio","label":"Cistos","options":["Sim","Não"]},
  {"id":"cicatrizes","type":"radio","label":"Cicatrizes","options":["Sim","Não"]},
  {"id":"manchas_pos","type":"radio","label":"Manchas Pós-inflamatórias","options":["Sim","Não"]},
  {"id":"dor_local","type":"select","label":"Dor Local","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
  {"id":"regiao_facial","type":"multiselect","label":"Região Facial Acometida","options":["Testa","Nariz","Bochechas","Queixo","Mandíbula","Perioral"]},
  {"id":"tronco_acometido","type":"multiselect","label":"Tronco Acometido","options":["Peito","Costas superior","Costas inferior","Ombros","Não acometido"]},
  {"id":"obs_clinicas","type":"textarea","label":"Observações Clínicas Percebidas"}
]},
{"id":"id4_5","type":"section","title":"Histórico Médico e Hormonal","fields":[
  {"id":"menstruacao_irregular","type":"radio","label":"Menstruação Irregular","options":["Sim","Não","Não se aplica"]},
  {"id":"suspeita_hormonal","type":"radio","label":"Suspeita Hormonal","options":["Sim","Não"]},
  {"id":"sop","type":"radio","label":"SOP Conhecida","options":["Sim","Não","Não se aplica"]},
  {"id":"anticoncepcional","type":"radio","label":"Uso de Anticoncepcional","options":["Sim","Não","Não se aplica"]},
  {"id":"gestacao","type":"select","label":"Gestação","options":["Não se aplica","Sim","Não"]},
  {"id":"lactacao","type":"select","label":"Lactação","options":["Não se aplica","Sim","Não"]},
  {"id":"medicacoes_relacionadas","type":"textarea","label":"Uso de Medicações Relacionadas"},
  {"id":"doencas_sistemicas","type":"textarea","label":"Doenças Sistêmicas"},
  {"id":"alergias","type":"textarea","label":"Alergias"},
  {"id":"obs_medicas","type":"textarea","label":"Observações Médicas"}
]},
{"id":"id4_6","type":"section","title":"Hábitos e Cuidados","fields":[
  {"id":"frequencia_lavagem","type":"select","label":"Frequência de Lavagem do Rosto","options":["1x/dia","2x/dia","3x ou mais","Irregular"]},
  {"id":"uso_maquiagem","type":"radio","label":"Uso de Maquiagem","options":["Sim","Não"]},
  {"id":"cosmeticos_oleosos","type":"radio","label":"Uso de Cosméticos Oleosos","options":["Sim","Não"]},
  {"id":"manipulacao_lesoes","type":"radio","label":"Manipulação das Lesões","options":["Sim","Não"]},
  {"id":"uso_protetor","type":"select","label":"Uso de Protetor Solar","options":["Diário","Eventual","Não usa"]},
  {"id":"rotina_skincare","type":"textarea","label":"Rotina de Skincare"},
  {"id":"exposicao_solar","type":"select","label":"Exposição Solar","options":["Baixa","Moderada","Alta"]},
  {"id":"tabagismo","type":"select","label":"Tabagismo","options":["Não","Sim","Ex-tabagista"]},
  {"id":"obs_habitos","type":"textarea","label":"Observações de Hábitos"}
]},
{"id":"id4_7","type":"section","title":"Exame Inicial","fields":[
  {"id":"grau_clinico","type":"select","label":"Grau Clínico Inicial","options":["Grau I - Comedoniana","Grau II - Pápulo-pustulosa","Grau III - Nódulo-cística","Grau IV - Conglobata","Grau V - Fulminans"]},
  {"id":"predominio_inflamatorio","type":"radio","label":"Predomínio Inflamatório","options":["Sim","Não"]},
  {"id":"predominio_comedoniano","type":"radio","label":"Predomínio Comedoniano","options":["Sim","Não"]},
  {"id":"cicatriz_atrofica","type":"radio","label":"Presença de Cicatriz Atrófica","options":["Sim","Não"]},
  {"id":"hiperpigmentacao","type":"radio","label":"Presença de Hiperpigmentação","options":["Sim","Não"]},
  {"id":"distribuicao_lesoes","type":"select","label":"Distribuição das Lesões","options":["Localizada","Disseminada","Facial","Truncal","Mista"]},
  {"id":"acne_excoriada","type":"radio","label":"Sinais de Acne Excoriada","options":["Sim","Não"]},
  {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
  {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
]},
{"id":"id4_8","type":"section","title":"Hipóteses Iniciais e Plano","fields":[
  {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
  {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
  {"id":"gravidade_inicial","type":"select","label":"Gravidade Inicial","options":["Leve","Moderada","Grave","Muito grave"]},
  {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
  {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
  {"id":"orientacoes","type":"textarea","label":"Orientações ao Paciente"},
  {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","Conforme necessidade"]},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese de Acne','Modelo focado em acne, oleosidade, hábitos, gatilhos, impacto estético e resposta a tratamentos.',v_sid,'dermatologia','Droplets',v_s4,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s4,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

-- MODEL 5 - TRICOLOGIA
v_s5 := '[
{"id":"id5_1","type":"section","title":"Identificação","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Urgência","Acompanhamento"]},
  {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"id5_2","type":"section","title":"Queixa Principal","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
  {"id":"queda_difusa","type":"radio","label":"Queda Difusa","options":["Sim","Não"]},
  {"id":"queda_localizada","type":"radio","label":"Queda Localizada","options":["Sim","Não"]},
  {"id":"afinamento","type":"radio","label":"Afinamento","options":["Sim","Não"]},
  {"id":"falhas","type":"radio","label":"Falhas","options":["Sim","Não"]},
  {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
  {"id":"inicio","type":"select","label":"Início","options":["Súbito","Gradual","Desconhecido"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
]},
{"id":"id5_3","type":"section","title":"História do Quadro Capilar","fields":[
  {"id":"piora_recente","type":"radio","label":"Piora Recente","options":["Sim","Não"]},
  {"id":"queda_banho","type":"radio","label":"Queda no Banho","options":["Sim","Não"]},
  {"id":"queda_pentear","type":"radio","label":"Queda ao Pentear","options":["Sim","Não"]},
  {"id":"reducao_volume","type":"radio","label":"Redução de Volume","options":["Sim","Não"]},
  {"id":"prurido_couro","type":"select","label":"Prurido no Couro Cabeludo","options":["Ausente","Leve","Moderado","Intenso"]},
  {"id":"dor_couro","type":"radio","label":"Dor no Couro Cabeludo","options":["Sim","Não"]},
  {"id":"descamacao","type":"radio","label":"Descamação","options":["Sim","Não"]},
  {"id":"oleosidade","type":"select","label":"Oleosidade","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"vermelhidao","type":"radio","label":"Vermelhidão","options":["Sim","Não"]},
  {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos Prévios"},
  {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos"},
  {"id":"obs_historia","type":"textarea","label":"Observações da História"}
]},
{"id":"id5_4","type":"section","title":"Histórico Pessoal e Fatores Associados","fields":[
  {"id":"estresse","type":"radio","label":"Estresse Importante","options":["Sim","Não"]},
  {"id":"pos_parto","type":"radio","label":"Pós-parto","options":["Sim","Não","Não se aplica"]},
  {"id":"dieta_restritiva","type":"radio","label":"Dieta Restritiva","options":["Sim","Não"]},
  {"id":"deficiencia_conhecida","type":"textarea","label":"Deficiência Conhecida (ferro, vitamina D, etc.)"},
  {"id":"cirurgia_recente","type":"radio","label":"Cirurgia Recente","options":["Sim","Não"]},
  {"id":"febre_recente","type":"radio","label":"Febre Recente","options":["Sim","Não"]},
  {"id":"doenca_sistemica","type":"textarea","label":"Doença Sistêmica"},
  {"id":"medicamentos","type":"textarea","label":"Uso de Medicamentos"},
  {"id":"alteracao_hormonal","type":"radio","label":"Alteração Hormonal","options":["Sim","Não"]},
  {"id":"hist_familiar_alopecia","type":"radio","label":"Histórico Familiar de Alopecia","options":["Sim","Não"]},
  {"id":"procedimentos_quimicos","type":"multiselect","label":"Procedimentos Químicos","options":["Tintura","Alisamento","Permanente","Descoloração","Nenhum"]},
  {"id":"tracao_penteado","type":"radio","label":"Tração por Penteado","options":["Sim","Não"]},
  {"id":"obs_associados","type":"textarea","label":"Observações Associadas"}
]},
{"id":"id5_5","type":"section","title":"Exame Inicial do Couro Cabeludo e Fios","fields":[
  {"id":"rarefacao_difusa","type":"radio","label":"Rarefação Difusa","options":["Sim","Não"]},
  {"id":"rarefacao_localizada","type":"radio","label":"Rarefação Localizada","options":["Sim","Não"]},
  {"id":"recuo_frontal","type":"radio","label":"Recuo de Linha Frontal","options":["Sim","Não"]},
  {"id":"miniaturizacao","type":"radio","label":"Miniaturização Percebida","options":["Sim","Não"]},
  {"id":"descamacao_exame","type":"radio","label":"Descamação","options":["Sim","Não"]},
  {"id":"eritema_exame","type":"radio","label":"Eritema","options":["Sim","Não"]},
  {"id":"oleosidade_exame","type":"radio","label":"Oleosidade Aumentada","options":["Sim","Não"]},
  {"id":"quebra_fios","type":"radio","label":"Quebra dos Fios","options":["Sim","Não"]},
  {"id":"areas_cicatriciais","type":"radio","label":"Áreas Cicatriciais Suspeitas","options":["Sim","Não"]},
  {"id":"necessidade_tricoscopia","type":"radio","label":"Necessidade de Tricoscopia","options":["Sim","Não"]},
  {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
  {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
]},
{"id":"id5_6","type":"section","title":"Hipóteses Iniciais","fields":[
  {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
  {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
  {"id":"padrao_provavel","type":"select","label":"Padrão Provável","options":["Androgenética","Eflúvio telógeno","Alopecia areata","Cicatricial","Tração","Outro"]},
  {"id":"necessidade_exame","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"necessidade_lab","type":"radio","label":"Necessidade de Avaliação Laboratorial","options":["Sim","Não"]},
  {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
]},
{"id":"id5_7","type":"section","title":"Plano Inicial","fields":[
  {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
  {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
  {"id":"orientacoes_gerais","type":"textarea","label":"Orientações Gerais"},
  {"id":"orientacoes_capilar","type":"textarea","label":"Orientações de Cuidado Capilar"},
  {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["15 dias","30 dias","60 dias","90 dias","Conforme necessidade"]},
  {"id":"prioridade","type":"select","label":"Prioridade Terapêutica","options":["Baixa","Moderada","Alta"]},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese de Tricologia','Modelo focado em queda de cabelo, afinamento, falhas, doenças do couro cabeludo e fatores hormonais.',v_sid,'dermatologia','Scissors',v_s5,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s5,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

-- MODEL 6 - UNHAS (ONICOLOGIA)
v_s6 := '[
{"id":"id6_1","type":"section","title":"Identificação","fields":[
  {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
  {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
  {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Urgência","Acompanhamento"]},
  {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
  {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
]},
{"id":"id6_2","type":"section","title":"Queixa Principal","fields":[
  {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
  {"id":"unha_regiao","type":"text","label":"Unha ou Região Acometida"},
  {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
  {"id":"dor_local","type":"select","label":"Dor Local","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"inflamacao_local","type":"radio","label":"Inflamação Local","options":["Sim","Não"]},
  {"id":"alteracao_estetica","type":"radio","label":"Alteração Estética","options":["Sim","Não"]},
  {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
]},
{"id":"id6_3","type":"section","title":"História do Quadro Ungueal","fields":[
  {"id":"inicio","type":"select","label":"Início","options":["Súbito","Gradual","Desconhecido"]},
  {"id":"episodios_previos","type":"radio","label":"Episódios Prévios","options":["Sim","Não"]},
  {"id":"trauma_local","type":"radio","label":"Trauma Local","options":["Sim","Não"]},
  {"id":"manipulacao_estetica","type":"radio","label":"Manipulação Estética","options":["Sim","Não"]},
  {"id":"uso_esmalte","type":"radio","label":"Uso de Esmalte ou Produto","options":["Sim","Não"]},
  {"id":"procedimentos_previos","type":"textarea","label":"Procedimentos Prévios"},
  {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos Prévios"},
  {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos"},
  {"id":"recorrencia","type":"radio","label":"Recorrência","options":["Sim","Não"]},
  {"id":"obs_historia","type":"textarea","label":"Observações da História"}
]},
{"id":"id6_4","type":"section","title":"Características da Alteração","fields":[
  {"id":"espessamento","type":"radio","label":"Espessamento","options":["Sim","Não"]},
  {"id":"descolamento","type":"radio","label":"Descolamento","options":["Sim","Não"]},
  {"id":"mudanca_cor","type":"radio","label":"Mudança de Cor","options":["Sim","Não"]},
  {"id":"fragilidade","type":"radio","label":"Fragilidade","options":["Sim","Não"]},
  {"id":"quebra","type":"radio","label":"Quebra","options":["Sim","Não"]},
  {"id":"dor","type":"select","label":"Dor","options":["Ausente","Leve","Moderada","Intensa"]},
  {"id":"secrecao","type":"radio","label":"Secreção","options":["Sim","Não"]},
  {"id":"inflamacao_periungueal","type":"radio","label":"Inflamação Periungueal","options":["Sim","Não"]},
  {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
  {"id":"mau_odor","type":"radio","label":"Mau Odor","options":["Sim","Não"]},
  {"id":"numero_unhas","type":"select","label":"Número de Unhas Acometidas","options":["1","2-3","4-5","Mais de 5","Todas"]},
  {"id":"maos_pes","type":"select","label":"Mãos ou Pés","options":["Mãos","Pés","Ambos"]},
  {"id":"obs_percebidas","type":"textarea","label":"Observações Percebidas"}
]},
{"id":"id6_5","type":"section","title":"Fatores Associados","fields":[
  {"id":"umidade_frequente","type":"radio","label":"Umidade Frequente","options":["Sim","Não"]},
  {"id":"calcado_fechado","type":"radio","label":"Uso de Calçado Fechado","options":["Sim","Não"]},
  {"id":"trauma_repetitivo","type":"radio","label":"Trauma Repetitivo","options":["Sim","Não"]},
  {"id":"atividade_ocupacional","type":"text","label":"Atividade Ocupacional"},
  {"id":"diabetes","type":"radio","label":"Diabetes","options":["Sim","Não"]},
  {"id":"doenca_vascular","type":"radio","label":"Doença Vascular","options":["Sim","Não"]},
  {"id":"imunossupressao","type":"radio","label":"Imunossupressão","options":["Sim","Não"]},
  {"id":"historico_familiar","type":"radio","label":"Histórico Familiar","options":["Sim","Não"]},
  {"id":"obs_clinicas","type":"textarea","label":"Observações Clínicas Relevantes"}
]},
{"id":"id6_6","type":"section","title":"Exame Inicial das Unhas","fields":[
  {"id":"coloracao","type":"text","label":"Coloração"},
  {"id":"espessura","type":"select","label":"Espessura","options":["Normal","Aumentada","Diminuída"]},
  {"id":"integridade_lamina","type":"select","label":"Integridade da Lâmina","options":["Íntegra","Parcialmente comprometida","Muito comprometida"]},
  {"id":"leito_ungueal","type":"select","label":"Leito Ungueal","options":["Normal","Alterado"]},
  {"id":"inflamacao_peri","type":"radio","label":"Inflamação Periungueal","options":["Sim","Não"]},
  {"id":"sinais_infeccao","type":"radio","label":"Sinais de Infecção","options":["Sim","Não"]},
  {"id":"sinais_micose","type":"radio","label":"Sinais de Micose","options":["Sim","Não"]},
  {"id":"sinais_trauma","type":"radio","label":"Sinais de Trauma","options":["Sim","Não"]},
  {"id":"necessidade_exame","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
  {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
]},
{"id":"id6_7","type":"section","title":"Hipóteses Iniciais e Plano","fields":[
  {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
  {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
  {"id":"necessidade_exame_comp","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
  {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
  {"id":"orientacoes","type":"textarea","label":"Orientações ao Paciente"},
  {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","Conforme necessidade"]},
  {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
]}
]'::jsonb;

INSERT INTO anamnesis_templates (clinic_id,name,description,specialty_id,specialty,icon,campos,is_active,is_default,is_system,archived,usage_count)
VALUES (v_cid,'Anamnese de Unhas (Onicologia)','Modelo focado em alterações ungueais, deformidades, infecção, dor, fragilidade e recorrência.',v_sid,'dermatologia','Fingerprint',v_s6,true,false,true,false,0) RETURNING id INTO v_tid;
INSERT INTO anamnesis_template_versions (template_id,structure,version_number,version) VALUES (v_tid,v_s6,1,1) RETURNING id INTO v_vid;
UPDATE anamnesis_templates SET current_version_id=v_vid WHERE id=v_tid;

END $$;
