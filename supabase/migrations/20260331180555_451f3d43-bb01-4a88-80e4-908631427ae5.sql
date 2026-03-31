
DO $$
DECLARE
  v_specialty_id uuid := 'd241f90c-0fdd-4e2c-a959-6482d7ac2370';
  v_clinic_id uuid := 'f95ac79d-9ceb-4e20-83b0-0592276faac1';
  v_template1_id uuid := '9214524d-6f75-4e54-954d-23e14d75906d';
  v_version1_id uuid := '219fc926-16af-4640-8894-96427f7131f4';
  v_t2_id uuid;
  v_v2_id uuid;
  v_t3_id uuid;
  v_v3_id uuid;
  v_struct1 jsonb;
  v_struct2 jsonb;
  v_struct3 jsonb;
BEGIN

-- ═══════════════════════════════════════════════════
-- MODEL 1 - UPDATE: Anamnese Dermatológica Geral (9 blocks)
-- ═══════════════════════════════════════════════════
v_struct1 := '[
  {"id":"identificacao","type":"section","title":"Identificação do Atendimento","fields":[
    {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
    {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
    {"id":"tipo_atendimento","type":"select","label":"Tipo de Atendimento","options":["Consulta","Retorno","Urgência","Acompanhamento"],"required":true},
    {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
    {"id":"encaminhamento","type":"text","label":"Encaminhamento (se houver)"},
    {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
  ]},
  {"id":"queixa_principal","type":"section","title":"Queixa Principal","fields":[
    {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
    {"id":"motivo_consulta","type":"textarea","label":"Motivo da Consulta"},
    {"id":"regiao_acometida","type":"text","label":"Região Acometida Principal"},
    {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
    {"id":"inicio_quadro","type":"select","label":"Início do Quadro","options":["Súbito","Gradual","Recorrente","Desconhecido"]},
    {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente com o Tratamento"},
    {"id":"tipo_queixa","type":"select","label":"Queixa Estética, Funcional ou Ambas","options":["Estética","Funcional","Ambas"]}
  ]},
  {"id":"historia_atual","type":"section","title":"História da Condição Atual","fields":[
    {"id":"descricao_detalhada","type":"textarea","label":"Descrição Detalhada do Quadro"},
    {"id":"evolucao_quadro","type":"select","label":"Evolução do Quadro","options":["Aguda","Subaguda","Crônica","Recorrente"]},
    {"id":"fatores_melhora","type":"textarea","label":"Fatores de Melhora"},
    {"id":"fatores_piora","type":"textarea","label":"Fatores de Piora"},
    {"id":"sintomas_associados","type":"multiselect","label":"Sintomas Associados","options":["Prurido","Dor","Ardência","Descamação","Sangramento","Secreção","Alteração de cor","Alteração de textura"]},
    {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
    {"id":"dor","type":"select","label":"Dor","options":["Ausente","Leve","Moderada","Intensa"]},
    {"id":"ardor","type":"radio","label":"Ardor","options":["Sim","Não"]},
    {"id":"sangramento","type":"radio","label":"Sangramento","options":["Sim","Não"]},
    {"id":"secrecao","type":"radio","label":"Secreção","options":["Sim","Não"]},
    {"id":"tratamentos_tentados","type":"textarea","label":"Tratamentos Já Tentados"},
    {"id":"resposta_tratamentos","type":"textarea","label":"Resposta a Tratamentos Prévios"}
  ]},
  {"id":"historico_dermato","type":"section","title":"Histórico Dermatológico","fields":[
    {"id":"episodios_anteriores","type":"textarea","label":"Episódios Semelhantes Anteriores"},
    {"id":"doencas_dermato_previas","type":"textarea","label":"Doenças Dermatológicas Prévias"},
    {"id":"alergias_cutaneas","type":"textarea","label":"Histórico de Alergias Cutâneas"},
    {"id":"historico_acne","type":"textarea","label":"Histórico de Acne"},
    {"id":"historico_dermatite","type":"textarea","label":"Histórico de Dermatite"},
    {"id":"historico_infeccoes","type":"textarea","label":"Histórico de Infecções de Pele"},
    {"id":"historico_queda_cabelo","type":"textarea","label":"Histórico de Queda de Cabelo"},
    {"id":"historico_ungueal","type":"textarea","label":"Histórico de Alterações Ungueais"},
    {"id":"historico_lesoes_removidas","type":"textarea","label":"Histórico de Lesões Removidas"},
    {"id":"historico_cancer_pele","type":"textarea","label":"Histórico de Câncer de Pele"},
    {"id":"obs_dermato","type":"textarea","label":"Observações Dermatológicas Relevantes"}
  ]},
  {"id":"historico_medico","type":"section","title":"Histórico Médico Geral","fields":[
    {"id":"doencas_sistemicas","type":"textarea","label":"Doenças Sistêmicas"},
    {"id":"medicamentos_uso","type":"textarea","label":"Uso Contínuo de Medicamentos"},
    {"id":"alergias_medicamentosas","type":"textarea","label":"Alergias Medicamentosas"},
    {"id":"alergias_gerais","type":"textarea","label":"Alergias Gerais"},
    {"id":"doencas_autoimunes","type":"textarea","label":"Doenças Autoimunes"},
    {"id":"historico_oncologico","type":"textarea","label":"Histórico Oncológico"},
    {"id":"gestacao","type":"select","label":"Gestação","options":["Não se aplica","Sim","Não"]},
    {"id":"lactacao","type":"select","label":"Lactação","options":["Não se aplica","Sim","Não"]},
    {"id":"internacoes","type":"textarea","label":"Internações Relevantes"},
    {"id":"cirurgias_previas","type":"textarea","label":"Cirurgias Prévias"},
    {"id":"obs_medicas","type":"textarea","label":"Observações Médicas"}
  ]},
  {"id":"habitos","type":"section","title":"Hábitos e Fatores de Risco","fields":[
    {"id":"exposicao_solar","type":"select","label":"Exposição Solar","options":["Baixa","Moderada","Alta"]},
    {"id":"uso_protetor","type":"select","label":"Uso de Protetor Solar","options":["Diário","Eventual","Não usa"]},
    {"id":"ocupacao_exposicao","type":"text","label":"Ocupação com Exposição Cutânea"},
    {"id":"contato_quimicos","type":"textarea","label":"Contato com Produtos Químicos"},
    {"id":"uso_cosmeticos","type":"textarea","label":"Uso de Cosméticos"},
    {"id":"tabagismo","type":"select","label":"Tabagismo","options":["Não","Sim","Ex-tabagista"]},
    {"id":"etilismo","type":"select","label":"Etilismo","options":["Não","Social","Moderado","Elevado"]},
    {"id":"estresse","type":"select","label":"Estresse Associado","options":["Ausente","Leve","Moderado","Intenso"]},
    {"id":"sono","type":"select","label":"Sono","options":["Bom","Regular","Ruim"]},
    {"id":"alimentacao_fator","type":"textarea","label":"Alimentação Percebida como Fator"},
    {"id":"historico_familiar_dermato","type":"textarea","label":"Histórico Familiar Dermatológico"},
    {"id":"fototipo","type":"select","label":"Fototipo Referido","options":["I","II","III","IV","V","VI"]}
  ]},
  {"id":"avaliacao_pele","type":"section","title":"Avaliação Inicial da Pele","fields":[
    {"id":"tipo_pele","type":"select","label":"Tipo de Pele","options":["Normal","Seca","Oleosa","Mista","Sensível"]},
    {"id":"oleosidade","type":"select","label":"Oleosidade","options":["Ausente","Leve","Moderada","Intensa"]},
    {"id":"ressecamento","type":"select","label":"Ressecamento","options":["Ausente","Leve","Moderado","Intenso"]},
    {"id":"sensibilidade_cutanea","type":"select","label":"Sensibilidade Cutânea","options":["Normal","Aumentada","Muito aumentada"]},
    {"id":"eritema","type":"radio","label":"Presença de Eritema","options":["Sim","Não"]},
    {"id":"descamacao","type":"radio","label":"Presença de Descamação","options":["Sim","Não"]},
    {"id":"papulas","type":"radio","label":"Presença de Pápulas","options":["Sim","Não"]},
    {"id":"placas","type":"radio","label":"Presença de Placas","options":["Sim","Não"]},
    {"id":"nodulos","type":"radio","label":"Presença de Nódulos","options":["Sim","Não"]},
    {"id":"vesiculas","type":"radio","label":"Presença de Vesículas","options":["Sim","Não"]},
    {"id":"crostas","type":"radio","label":"Presença de Crostas","options":["Sim","Não"]},
    {"id":"lesoes_pigmentadas","type":"radio","label":"Presença de Lesões Pigmentadas","options":["Sim","Não"]},
    {"id":"obs_exame_inicial","type":"textarea","label":"Observações do Exame Inicial"}
  ]},
  {"id":"hipoteses","type":"section","title":"Hipóteses Iniciais","fields":[
    {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
    {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
    {"id":"suspeita_inflamatoria","type":"radio","label":"Suspeita Inflamatória","options":["Sim","Não"]},
    {"id":"suspeita_infecciosa","type":"radio","label":"Suspeita Infecciosa","options":["Sim","Não"]},
    {"id":"suspeita_tumoral","type":"radio","label":"Suspeita Tumoral","options":["Sim","Não"]},
    {"id":"necessidade_dermatoscopia","type":"radio","label":"Necessidade de Dermatoscopia","options":["Sim","Não"]},
    {"id":"necessidade_exame_complementar","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
    {"id":"necessidade_foto","type":"radio","label":"Necessidade de Registro Fotográfico","options":["Sim","Não"]},
    {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas Iniciais"}
  ]},
  {"id":"plano_inicial","type":"section","title":"Plano Inicial","fields":[
    {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial Sugerida"},
    {"id":"urgencia","type":"select","label":"Necessidade de Urgência","options":["Eletivo","Prioritário","Urgente"]},
    {"id":"exames_complementares","type":"textarea","label":"Exames Complementares Solicitados"},
    {"id":"orientacoes","type":"textarea","label":"Orientações Dadas ao Paciente"},
    {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","90 dias","Conforme necessidade"]},
    {"id":"prioridade_terapeutica","type":"select","label":"Prioridade Terapêutica","options":["Baixa","Moderada","Alta"]},
    {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
  ]}
]'::jsonb;

-- Update template 1
UPDATE anamnesis_templates SET campos = v_struct1 WHERE id = v_template1_id;
UPDATE anamnesis_template_versions SET structure = v_struct1 WHERE id = v_version1_id;

-- ═══════════════════════════════════════════════════
-- MODEL 2 - Anamnese de Lesões Dermatológicas
-- ═══════════════════════════════════════════════════
v_struct2 := '[
  {"id":"identificacao","type":"section","title":"Identificação","fields":[
    {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
    {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
    {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Urgência","Acompanhamento"]},
    {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
    {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
  ]},
  {"id":"queixa_lesao","type":"section","title":"Queixa Principal de Lesão","fields":[
    {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
    {"id":"localizacao_lesao","type":"text","label":"Localização da Lesão"},
    {"id":"numero_lesoes","type":"select","label":"Número de Lesões","options":["Única","Poucas (2-5)","Múltiplas (>5)","Disseminadas"]},
    {"id":"tempo_aparecimento","type":"text","label":"Tempo de Aparecimento"},
    {"id":"inicio_quadro","type":"select","label":"Início do Quadro","options":["Súbito","Gradual","Recorrente","Desconhecido"]},
    {"id":"evolucao_clinica","type":"select","label":"Evolução Clínica","options":["Aguda","Subaguda","Crônica","Recorrente"]},
    {"id":"crescimento_lesao","type":"radio","label":"Crescimento da Lesão","options":["Sim","Não","Não sabe"]},
    {"id":"mudanca_cor","type":"radio","label":"Mudança de Cor","options":["Sim","Não","Não sabe"]},
    {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
  ]},
  {"id":"sintomas","type":"section","title":"Sintomas Associados","fields":[
    {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
    {"id":"dor","type":"select","label":"Dor","options":["Ausente","Leve","Moderada","Intensa"]},
    {"id":"ardor","type":"radio","label":"Ardor","options":["Sim","Não"]},
    {"id":"sangramento","type":"radio","label":"Sangramento","options":["Sim","Não"]},
    {"id":"secrecao","type":"radio","label":"Secreção","options":["Sim","Não"]},
    {"id":"crosta","type":"radio","label":"Crosta","options":["Sim","Não"]},
    {"id":"ulceracao","type":"radio","label":"Ulceração","options":["Sim","Não"]},
    {"id":"sensibilidade_local","type":"select","label":"Sensibilidade Local","options":["Normal","Aumentada","Diminuída"]},
    {"id":"incomodo_estetico","type":"radio","label":"Incômodo Estético","options":["Sim","Não"]},
    {"id":"incomodo_funcional","type":"radio","label":"Incômodo Funcional","options":["Sim","Não"]}
  ]},
  {"id":"caracteristicas","type":"section","title":"Características Relatadas da Lesão","fields":[
    {"id":"cor_percebida","type":"text","label":"Cor Percebida"},
    {"id":"bordas_percebidas","type":"select","label":"Bordas Percebidas","options":["Regulares","Irregulares","Não sabe"]},
    {"id":"superficie_percebida","type":"select","label":"Superfície Percebida","options":["Lisa","Rugosa","Áspera","Não sabe"]},
    {"id":"consistencia_percebida","type":"select","label":"Consistência Percebida","options":["Mole","Firme","Dura","Não sabe"]},
    {"id":"lesao_unica_multipla","type":"select","label":"Lesão Única ou Múltipla","options":["Única","Múltipla"]},
    {"id":"distribuicao","type":"select","label":"Distribuição","options":["Localizada","Disseminada","Generalizada"]},
    {"id":"relacao_trauma","type":"radio","label":"Relação com Trauma","options":["Sim","Não","Não sabe"]},
    {"id":"relacao_sol","type":"radio","label":"Relação com Exposição Solar","options":["Sim","Não","Não sabe"]},
    {"id":"relacao_cosmetico","type":"radio","label":"Relação com Cosmético ou Produto","options":["Sim","Não","Não sabe"]},
    {"id":"obs_paciente","type":"textarea","label":"Observações do Paciente"}
  ]},
  {"id":"historico_lesao","type":"section","title":"Histórico da Lesão","fields":[
    {"id":"episodio_anterior","type":"radio","label":"Episódio Semelhante Anterior","options":["Sim","Não"]},
    {"id":"tratamento_previo","type":"textarea","label":"Tratamento Prévio"},
    {"id":"biopsia_previa","type":"radio","label":"Biópsia Prévia","options":["Sim","Não"]},
    {"id":"remocao_previa","type":"radio","label":"Remoção Prévia","options":["Sim","Não"]},
    {"id":"recorrencia","type":"radio","label":"Recorrência","options":["Sim","Não"]},
    {"id":"crescimento_recente","type":"radio","label":"Crescimento Recente","options":["Sim","Não"]},
    {"id":"mudanca_recente","type":"textarea","label":"Mudança Recente Importante"},
    {"id":"obs_historico","type":"textarea","label":"Observações do Histórico"}
  ]},
  {"id":"exame_lesao","type":"section","title":"Exame Inicial da Lesão","fields":[
    {"id":"tipo_morfologico","type":"multiselect","label":"Tipo Morfológico Inicial","options":["Mácula","Pápula","Placa","Nódulo","Vesícula","Bolha","Pústula","Úlcera","Erosão","Crosta","Cicatriz","Tumor"]},
    {"id":"regiao_anatomica","type":"text","label":"Região Anatômica"},
    {"id":"tamanho_estimado","type":"text","label":"Tamanho Estimado"},
    {"id":"cor_predominante","type":"text","label":"Cor Predominante"},
    {"id":"bordas","type":"select","label":"Bordas","options":["Regulares","Irregulares","Bem definidas","Mal definidas"]},
    {"id":"superficie","type":"select","label":"Superfície","options":["Lisa","Rugosa","Verrucosa","Queratósica","Ulcerada","Crostosa"]},
    {"id":"sinais_inflamatorios","type":"radio","label":"Sinais Inflamatórios","options":["Sim","Não"]},
    {"id":"suspeita_infeccao","type":"radio","label":"Suspeita de Infecção","options":["Sim","Não"]},
    {"id":"suspeita_malignidade","type":"radio","label":"Suspeita de Malignidade","options":["Sim","Não"]},
    {"id":"necessidade_foto","type":"radio","label":"Necessidade de Foto Clínica","options":["Sim","Não"]},
    {"id":"necessidade_dermatoscopia","type":"radio","label":"Necessidade de Dermatoscopia","options":["Sim","Não"]},
    {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
  ]},
  {"id":"hipoteses","type":"section","title":"Hipóteses Iniciais","fields":[
    {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
    {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
    {"id":"natureza_provavel","type":"select","label":"Natureza Provável","options":["Inflamatória","Infecciosa","Neoplásica benigna","Neoplásica maligna","Funcional","Desconhecida"]},
    {"id":"grau_suspeicao","type":"select","label":"Grau de Suspeição","options":["Baixo","Moderado","Alto"]},
    {"id":"necessidade_exame_complementar","type":"radio","label":"Necessidade de Exame Complementar","options":["Sim","Não"]},
    {"id":"necessidade_biopsia","type":"radio","label":"Necessidade de Biópsia","options":["Sim","Não"]},
    {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
  ]},
  {"id":"plano","type":"section","title":"Plano Inicial","fields":[
    {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
    {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
    {"id":"registro_fotografico","type":"radio","label":"Registro Fotográfico","options":["Sim","Não"]},
    {"id":"orientacoes","type":"textarea","label":"Orientações ao Paciente"},
    {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","Conforme necessidade"]},
    {"id":"prioridade","type":"select","label":"Prioridade Clínica","options":["Baixa","Moderada","Alta"]},
    {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
  ]}
]'::jsonb;

INSERT INTO anamnesis_templates (
  clinic_id, name, description, specialty_id, specialty, icon,
  campos, is_active, is_default, is_system, archived, usage_count
) VALUES (
  v_clinic_id,
  'Anamnese de Lesões Dermatológicas',
  'Modelo focado em lesões cutâneas localizadas ou disseminadas, avaliando tipo, evolução, sintomas, distribuição e suspeitas.',
  v_specialty_id, 'dermatologia', 'Search',
  v_struct2, true, false, true, false, 0
) RETURNING id INTO v_t2_id;

INSERT INTO anamnesis_template_versions (template_id, structure, version_number, version)
VALUES (v_t2_id, v_struct2, 1, 1) RETURNING id INTO v_v2_id;

UPDATE anamnesis_templates SET current_version_id = v_v2_id WHERE id = v_t2_id;

-- ═══════════════════════════════════════════════════
-- MODEL 3 - Anamnese de Dermatite / Alergia / Contato
-- ═══════════════════════════════════════════════════
v_struct3 := '[
  {"id":"identificacao","type":"section","title":"Identificação","fields":[
    {"id":"data_avaliacao","type":"date","label":"Data da Avaliação","required":true},
    {"id":"profissional_responsavel","type":"text","label":"Profissional Responsável","required":true},
    {"id":"tipo_consulta","type":"select","label":"Tipo de Consulta","options":["Consulta","Retorno","Urgência","Acompanhamento"]},
    {"id":"primeira_consulta","type":"radio","label":"Primeira Consulta ou Retorno","options":["Primeira consulta","Retorno"]},
    {"id":"observacoes_iniciais","type":"textarea","label":"Observações Iniciais"}
  ]},
  {"id":"queixa","type":"section","title":"Queixa Principal","fields":[
    {"id":"queixa_principal","type":"textarea","label":"Queixa Principal","required":true},
    {"id":"regiao_acometida","type":"text","label":"Região Acometida"},
    {"id":"tempo_evolucao","type":"text","label":"Tempo de Evolução"},
    {"id":"inicio_quadro","type":"select","label":"Início do Quadro","options":["Súbito","Gradual","Recorrente","Desconhecido"]},
    {"id":"prurido","type":"select","label":"Prurido","options":["Ausente","Leve","Moderado","Intenso"]},
    {"id":"ardor","type":"radio","label":"Ardor","options":["Sim","Não"]},
    {"id":"dor","type":"select","label":"Dor","options":["Ausente","Leve","Moderada","Intensa"]},
    {"id":"objetivo_paciente","type":"textarea","label":"Objetivo do Paciente"}
  ]},
  {"id":"historia","type":"section","title":"História do Quadro","fields":[
    {"id":"evolucao_quadro","type":"select","label":"Evolução do Quadro","options":["Aguda","Subaguda","Crônica","Recorrente"]},
    {"id":"recorrencia","type":"radio","label":"Recorrência","options":["Sim","Não"]},
    {"id":"piora_contato","type":"textarea","label":"Piora após Contato Específico"},
    {"id":"piora_calor","type":"radio","label":"Piora com Calor","options":["Sim","Não"]},
    {"id":"piora_suor","type":"radio","label":"Piora com Suor","options":["Sim","Não"]},
    {"id":"piora_cosmeticos","type":"radio","label":"Piora com Cosméticos","options":["Sim","Não"]},
    {"id":"piora_sabonetes","type":"radio","label":"Piora com Sabonetes","options":["Sim","Não"]},
    {"id":"piora_tecido","type":"radio","label":"Piora com Tecido ou Roupa","options":["Sim","Não"]},
    {"id":"piora_ocupacional","type":"radio","label":"Piora com Produto Ocupacional","options":["Sim","Não"]},
    {"id":"melhora_medicacao","type":"textarea","label":"Melhora com Medicação Prévia"},
    {"id":"obs_clinicas","type":"textarea","label":"Observações Clínicas Relatadas"}
  ]},
  {"id":"exposicoes","type":"section","title":"Exposições e Gatilhos","fields":[
    {"id":"cosmeticos_novos","type":"radio","label":"Uso de Cosméticos Novos","options":["Sim","Não"]},
    {"id":"medicacao_nova","type":"radio","label":"Uso de Medicação Nova","options":["Sim","Não"]},
    {"id":"produto_quimico","type":"radio","label":"Uso de Produto Químico","options":["Sim","Não"]},
    {"id":"exposicao_ocupacional","type":"text","label":"Exposição Ocupacional"},
    {"id":"exposicao_domiciliar","type":"text","label":"Exposição Domiciliar"},
    {"id":"contato_metal","type":"radio","label":"Contato com Metal","options":["Sim","Não"]},
    {"id":"contato_planta","type":"radio","label":"Contato com Planta","options":["Sim","Não"]},
    {"id":"contato_animal","type":"radio","label":"Contato com Animal","options":["Sim","Não"]},
    {"id":"relacao_alimento","type":"textarea","label":"Relação com Alimento"},
    {"id":"relacao_estresse","type":"radio","label":"Relação com Estresse","options":["Sim","Não"]},
    {"id":"relacao_clima","type":"textarea","label":"Relação com Clima"},
    {"id":"obs_gatilhos","type":"textarea","label":"Observações de Gatilhos"}
  ]},
  {"id":"historico","type":"section","title":"Histórico Pessoal e Familiar","fields":[
    {"id":"dermatite_atopica","type":"radio","label":"Dermatite Atópica Prévia","options":["Sim","Não"]},
    {"id":"rinite","type":"radio","label":"Rinite","options":["Sim","Não"]},
    {"id":"asma","type":"radio","label":"Asma","options":["Sim","Não"]},
    {"id":"alergias_conhecidas","type":"textarea","label":"Alergias Conhecidas"},
    {"id":"historico_familiar_alergico","type":"textarea","label":"Histórico Familiar Alérgico"},
    {"id":"episodios_previos","type":"textarea","label":"Episódios Prévios Semelhantes"},
    {"id":"tratamentos_previos","type":"textarea","label":"Tratamentos Prévios"},
    {"id":"resposta_tratamento","type":"textarea","label":"Resposta a Tratamento Anterior"},
    {"id":"obs_historico","type":"textarea","label":"Observações do Histórico"}
  ]},
  {"id":"exame","type":"section","title":"Exame Inicial","fields":[
    {"id":"eritema","type":"radio","label":"Eritema","options":["Sim","Não"]},
    {"id":"descamacao","type":"radio","label":"Descamação","options":["Sim","Não"]},
    {"id":"placas","type":"radio","label":"Placas","options":["Sim","Não"]},
    {"id":"vesiculas","type":"radio","label":"Vesículas","options":["Sim","Não"]},
    {"id":"liquenificacao","type":"radio","label":"Liquenificação","options":["Sim","Não"]},
    {"id":"escoriacoes","type":"radio","label":"Escoriações","options":["Sim","Não"]},
    {"id":"distribuicao_lesoes","type":"select","label":"Distribuição das Lesões","options":["Localizada","Disseminada","Generalizada","Segmentar"]},
    {"id":"simetria","type":"select","label":"Simetria","options":["Simétrica","Assimétrica"]},
    {"id":"areas_acometidas","type":"textarea","label":"Áreas Mais Acometidas"},
    {"id":"infeccao_secundaria","type":"radio","label":"Sinais de Infecção Secundária","options":["Sim","Não"]},
    {"id":"obs_exame","type":"textarea","label":"Observações do Exame"}
  ]},
  {"id":"hipoteses","type":"section","title":"Hipóteses Iniciais","fields":[
    {"id":"hipotese_principal","type":"text","label":"Hipótese Principal"},
    {"id":"hipoteses_secundarias","type":"textarea","label":"Hipóteses Secundárias"},
    {"id":"suspeita_alergica","type":"radio","label":"Suspeita Alérgica","options":["Sim","Não"]},
    {"id":"suspeita_irritativa","type":"radio","label":"Suspeita Irritativa","options":["Sim","Não"]},
    {"id":"suspeita_atopica","type":"radio","label":"Suspeita Atópica","options":["Sim","Não"]},
    {"id":"necessidade_teste","type":"radio","label":"Necessidade de Teste Complementar","options":["Sim","Não"]},
    {"id":"obs_diagnosticas","type":"textarea","label":"Observações Diagnósticas"}
  ]},
  {"id":"plano","type":"section","title":"Plano Inicial","fields":[
    {"id":"conduta_inicial","type":"textarea","label":"Conduta Inicial"},
    {"id":"afastamento_gatilhos","type":"textarea","label":"Afastamento de Gatilhos"},
    {"id":"orientacoes_cuidado","type":"textarea","label":"Orientações de Cuidado Cutâneo"},
    {"id":"exames_complementares","type":"textarea","label":"Exames Complementares"},
    {"id":"necessidade_retorno","type":"select","label":"Necessidade de Retorno","options":["7 dias","15 dias","30 dias","60 dias","Conforme necessidade"]},
    {"id":"prioridade","type":"select","label":"Prioridade Terapêutica","options":["Baixa","Moderada","Alta"]},
    {"id":"obs_finais","type":"textarea","label":"Observações Finais"}
  ]}
]'::jsonb;

INSERT INTO anamnesis_templates (
  clinic_id, name, description, specialty_id, specialty, icon,
  campos, is_active, is_default, is_system, archived, usage_count
) VALUES (
  v_clinic_id,
  'Anamnese de Dermatite / Alergia / Contato',
  'Modelo focado em dermatites, reações alérgicas e quadros de contato, avaliando gatilhos, exposição, recorrência e impacto.',
  v_specialty_id, 'dermatologia', 'ShieldAlert',
  v_struct3, true, false, true, false, 0
) RETURNING id INTO v_t3_id;

INSERT INTO anamnesis_template_versions (template_id, structure, version_number, version)
VALUES (v_t3_id, v_struct3, 1, 1) RETURNING id INTO v_v3_id;

UPDATE anamnesis_templates SET current_version_id = v_v3_id WHERE id = v_t3_id;

END $$;
