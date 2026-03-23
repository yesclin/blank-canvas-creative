
-- Insert the template
INSERT INTO public.anamnesis_templates (
  id, clinic_id, specialty_id, name, description, template_type,
  icon, campos, is_active, is_default, is_system, usage_count, archived
) VALUES (
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  NULL,
  '52263356-d53b-4724-937c-907bc00f71fb',
  'Anamnese de Infecções Dermatológicas',
  'Modelo clínico específico para investigação de infecções cutâneas bacterianas, fúngicas, virais e parasitárias.',
  'anamnese',
  'Bug',
  '[]'::jsonb,
  true, false, true, 0, false
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true, archived = false, template_type = 'anamnese',
  name = EXCLUDED.name, description = EXCLUDED.description;

-- Insert version v1
INSERT INTO public.anamnesis_template_versions (
  id, template_id, version_number, structure, created_by
) VALUES (
  'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  1,
  '[
    {
      "id": "secao_identificacao",
      "title": "Identificação do Atendimento",
      "fields": [
        {"id":"data_hora_anamnese","label":"Data/Hora da Anamnese","type":"text","required":false},
        {"id":"tipo_atendimento","label":"Tipo de Atendimento","type":"select","required":true,"options":["Primeira consulta","Retorno","Avaliação","Reavaliação","Urgência"]},
        {"id":"motivo_consulta","label":"Motivo da Consulta","type":"text","required":false}
      ]
    },
    {
      "id": "secao_queixa",
      "title": "Queixa Principal e História Atual",
      "fields": [
        {"id":"queixa_principal","label":"Queixa Principal","type":"textarea","required":true},
        {"id":"inicio_quadro","label":"Início do Quadro","type":"text","required":false},
        {"id":"tempo_evolucao","label":"Tempo de Evolução","type":"text","required":false},
        {"id":"forma_inicio","label":"Forma de Início","type":"select","required":false,"options":["Súbito","Gradual","Recorrente","Pós-trauma","Após contato","Não sabe informar"]},
        {"id":"evolucao_quadro","label":"Evolução do Quadro","type":"textarea","required":false},
        {"id":"local_inicio_lesao","label":"Local de Início da Lesão","type":"text","required":false},
        {"id":"areas_atualmente_afetadas","label":"Áreas Atualmente Afetadas","type":"textarea","required":false},
        {"id":"progressao_quadro","label":"Progressão do Quadro","type":"select","required":false,"options":["Estável","Piorando","Melhorando","Oscilante","Disseminando"]},
        {"id":"episodios_previos_semelhantes","label":"Episódios Prévios Semelhantes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"episodios_previos_descricao","label":"Descrição dos Episódios Prévios","type":"textarea","required":false,"conditional":{"field":"episodios_previos_semelhantes","value":"Sim"}},
        {"id":"tratamento_previo_antes_consulta","label":"Tratamento Prévio Antes da Consulta","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_classificacao_infecciosa",
      "title": "Classificação Inicial da Suspeita Infecciosa",
      "fields": [
        {"id":"grupo_suspeito","label":"Grupo Suspeito","type":"multiselect","required":false,"options":["Bacteriana","Fúngica","Viral","Parasitária","Mista","Indefinida"]},
        {"id":"suspeita_bacteriana_tipo","label":"Suspeita Bacteriana - Tipo","type":"multiselect","required":false,"options":["Impetigo","Foliculite","Furúnculo","Abscesso","Celulite","Erisipela","Paroníquia","Outro"]},
        {"id":"suspeita_bacteriana_tipo_outro","label":"Outro (Bacteriana)","type":"text","required":false,"conditional":{"field":"suspeita_bacteriana_tipo","value":"Outro"}},
        {"id":"suspeita_fungica_tipo","label":"Suspeita Fúngica - Tipo","type":"multiselect","required":false,"options":["Tínea corporal","Tínea pedis","Tínea cruris","Tínea capitis","Candidíase cutânea","Pitiríase versicolor","Onicomicose associada","Outro"]},
        {"id":"suspeita_fungica_tipo_outro","label":"Outro (Fúngica)","type":"text","required":false,"conditional":{"field":"suspeita_fungica_tipo","value":"Outro"}},
        {"id":"suspeita_viral_tipo","label":"Suspeita Viral - Tipo","type":"multiselect","required":false,"options":["Herpes simples","Herpes-zóster","Verruga viral","Molusco contagioso","Exantema viral","Outro"]},
        {"id":"suspeita_viral_tipo_outro","label":"Outro (Viral)","type":"text","required":false,"conditional":{"field":"suspeita_viral_tipo","value":"Outro"}},
        {"id":"suspeita_parasitaria_tipo","label":"Suspeita Parasitária - Tipo","type":"multiselect","required":false,"options":["Escabiose","Pediculose","Larva migrans cutânea","Miíase","Outro"]},
        {"id":"suspeita_parasitaria_tipo_outro","label":"Outro (Parasitária)","type":"text","required":false,"conditional":{"field":"suspeita_parasitaria_tipo","value":"Outro"}}
      ]
    },
    {
      "id": "secao_caracterizacao_lesoes",
      "title": "Caracterização das Lesões",
      "fields": [
        {"id":"morfologia_predominante","label":"Morfologia Predominante","type":"multiselect","required":false,"options":["Mácula","Pápula","Placa","Vesícula","Bolha","Pústula","Crosta","Nódulo","Erosão","Úlcera","Escama","Fissura","Exsudação","Outro"]},
        {"id":"morfologia_predominante_outro","label":"Outro (Morfologia)","type":"text","required":false,"conditional":{"field":"morfologia_predominante","value":"Outro"}},
        {"id":"cor_predominante","label":"Cor Predominante","type":"text","required":false},
        {"id":"numero_lesoes","label":"Número de Lesões","type":"select","required":false,"options":["Única","Poucas","Múltiplas","Incontáveis"]},
        {"id":"distribuicao_lesoes","label":"Distribuição das Lesões","type":"multiselect","required":false,"options":["Localizada","Generalizada","Simétrica","Assimétrica","Linear","Dermatomérica","Flexural","Extensora","Intertriginosa","Acral","Outro"]},
        {"id":"distribuicao_lesoes_outro","label":"Outro (Distribuição)","type":"text","required":false,"conditional":{"field":"distribuicao_lesoes","value":"Outro"}},
        {"id":"delimitacao_lesoes","label":"Delimitação das Lesões","type":"select","required":false,"options":["Bem delimitadas","Mal delimitadas","Mistas","Não informado"]},
        {"id":"secrecao_visivel","label":"Secreção Visível","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"secrecao_descricao","label":"Descrição da Secreção","type":"textarea","required":false,"conditional":{"field":"secrecao_visivel","value":"Sim"}},
        {"id":"crostas_presentes","label":"Crostas Presentes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"descamacao_presente","label":"Descamação Presente","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"odor_fetido","label":"Odor Fétido","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"observacoes_morfologicas","label":"Observações Morfológicas","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_sintomas",
      "title": "Sintomas Associados",
      "fields": [
        {"id":"sintomas_associados","label":"Sintomas Associados","type":"multiselect","required":false,"options":["Prurido","Dor","Ardor","Queimação","Sensibilidade","Edema","Calor local","Febre","Mal-estar","Linfonodos aumentados","Sangramento","Assintomático","Outro"]},
        {"id":"sintomas_associados_outro","label":"Outro (Sintomas)","type":"text","required":false,"conditional":{"field":"sintomas_associados","value":"Outro"}},
        {"id":"intensidade_prurido","label":"Intensidade do Prurido","type":"select","required":false,"options":["Leve","Moderado","Intenso","Não se aplica"]},
        {"id":"intensidade_dor","label":"Intensidade da Dor","type":"select","required":false,"options":["Leve","Moderada","Intensa","Não se aplica"]},
        {"id":"febre_associada","label":"Febre Associada","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"mal_estar_associado","label":"Mal-estar Associado","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"linfonodomegalia_referida","label":"Linfonodomegalia Referida","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"dor_local_importante","label":"Dor Local Importante","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"observacoes_sintomas","label":"Observações dos Sintomas","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_fatores_risco",
      "title": "Fatores de Risco, Contágio e Exposição",
      "fields": [
        {"id":"contato_com_pessoas_lesoes_semelhantes","label":"Contato com Pessoas com Lesões Semelhantes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"contato_domiciliar_sintomatico","label":"Contato Domiciliar Sintomático","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"contato_sexual_relacionado","label":"Contato Sexual Relacionado","type":"radio","required":false,"options":["Sim","Não","Não se aplica"]},
        {"id":"contato_animais","label":"Contato com Animais","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"frequenta_piscina_academia_vestiario","label":"Frequenta Piscina/Academia/Vestiário","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"compartilhamento_objetos_pessoais","label":"Compartilhamento de Objetos Pessoais","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_calcado_coletivo_ou_ambiente_umido","label":"Uso de Calçado Coletivo ou Ambiente Úmido","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"trauma_previo_na_area","label":"Trauma Prévio na Área","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"picada_inseto_previa","label":"Picada de Inseto Prévia","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"ferida_previa_na_area","label":"Ferida Prévia na Área","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"cirurgia_recente_na_area","label":"Cirurgia Recente na Área","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"exposicao_ocupacional_relevante","label":"Exposição Ocupacional Relevante","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"exposicao_ocupacional_descricao","label":"Descrição da Exposição Ocupacional","type":"textarea","required":false,"conditional":{"field":"exposicao_ocupacional_relevante","value":"Sim"}},
        {"id":"viagens_recentes","label":"Viagens Recentes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"viagens_recentes_descricao","label":"Descrição das Viagens","type":"textarea","required":false,"conditional":{"field":"viagens_recentes","value":"Sim"}}
      ]
    },
    {
      "id": "secao_antecedentes",
      "title": "Antecedentes Pessoais Relevantes",
      "fields": [
        {"id":"historico_infeccoes_cutaneas_previas","label":"Histórico de Infecções Cutâneas Prévias","type":"textarea","required":false},
        {"id":"recorrencia_frequente","label":"Recorrência Frequente","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"diabetes","label":"Diabetes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"imunossupressao","label":"Imunossupressão","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"hiv_ou_risco_imunologico","label":"HIV ou Risco Imunológico","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"doenca_vascular_periferica","label":"Doença Vascular Periférica","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"dermatite_atopica","label":"Dermatite Atópica","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"psoriase","label":"Psoríase","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"obesidade","label":"Obesidade","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"gestante","label":"Gestante","type":"radio","required":false,"options":["Sim","Não","Não se aplica"]},
        {"id":"lactante","label":"Lactante","type":"radio","required":false,"options":["Sim","Não","Não se aplica"]},
        {"id":"medicamentos_em_uso","label":"Medicamentos em Uso","type":"textarea","required":false},
        {"id":"uso_antibiotico_recente","label":"Uso de Antibiótico Recente","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antifungico_recente","label":"Uso de Antifúngico Recente","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_corticoide_ou_imunobiologico","label":"Uso de Corticóide ou Imunobiológico","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"alergias_medicamentosas","label":"Alergias Medicamentosas","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_tratamentos_previos",
      "title": "Tratamentos Prévios e Resposta",
      "fields": [
        {"id":"tratamento_previo_realizado","label":"Tratamento Prévio Realizado","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"tratamento_previo_descricao","label":"Descrição do Tratamento Prévio","type":"textarea","required":false,"conditional":{"field":"tratamento_previo_realizado","value":"Sim"}},
        {"id":"uso_antibiotico_topico","label":"Uso de Antibiótico Tópico","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antibiotico_oral","label":"Uso de Antibiótico Oral","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antifungico_topico","label":"Uso de Antifúngico Tópico","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antifungico_oral","label":"Uso de Antifúngico Oral","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antiviral","label":"Uso de Antiviral","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"uso_antiparasitario","label":"Uso de Antiparasitário","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"automedicacao","label":"Automedicação","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"resposta_tratamento_previo","label":"Resposta ao Tratamento Prévio","type":"textarea","required":false},
        {"id":"recidiva_apos_melhora","label":"Recidiva Após Melhora","type":"radio","required":false,"options":["Sim","Não"]}
      ]
    },
    {
      "id": "secao_exame_dermatologico",
      "title": "Exame Dermatológico",
      "fields": [
        {"id":"estado_geral_paciente","label":"Estado Geral do Paciente","type":"select","required":false,"options":["Bom","Regular","Comprometido"]},
        {"id":"fototipo_cutaneo","label":"Fototipo Cutâneo","type":"select","required":false,"options":["I","II","III","IV","V","VI","Não avaliado"]},
        {"id":"descricao_exame_fisico","label":"Descrição do Exame Físico","type":"textarea","required":true},
        {"id":"localizacao_exame","label":"Localização no Exame","type":"textarea","required":true},
        {"id":"sinais_inflamacao_local","label":"Sinais de Inflamação Local","type":"multiselect","required":false,"options":["Eritema","Edema","Calor","Dor","Exsudato","Crostas melicéricas","Descamação","Fissuras","Outro"]},
        {"id":"sinais_inflamacao_local_outro","label":"Outro (Inflamação)","type":"text","required":false,"conditional":{"field":"sinais_inflamacao_local","value":"Outro"}},
        {"id":"sinais_infeccao_secundaria","label":"Sinais de Infecção Secundária","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"lesoes_satelites","label":"Lesões Satélites","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_folicular","label":"Acometimento Folicular","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_intertriginoso","label":"Acometimento Intertriginoso","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_dobras","label":"Acometimento de Dobras","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_dermatomerico","label":"Acometimento Dermatomérico","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_mucosas","label":"Acometimento de Mucosas","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"acometimento_unhas_associado","label":"Acometimento de Unhas Associado","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"sinais_sistemicos_importantes","label":"Sinais Sistêmicos Importantes","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"sinais_sistemicos_descricao","label":"Descrição dos Sinais Sistêmicos","type":"textarea","required":false,"conditional":{"field":"sinais_sistemicos_importantes","value":"Sim"}}
      ]
    },
    {
      "id": "secao_exames_complementares",
      "title": "Exames Complementares",
      "fields": [
        {"id":"necessidade_exames_complementares","label":"Necessidade de Exames Complementares","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"exames_indicados","label":"Exames Indicados","type":"multiselect","required":false,"options":["Cultura bacteriana","Antibiograma","Exame micológico direto","Cultura fúngica","Lâmpada de Wood","PCR/raspado","Biópsia","Hemograma","Sorologias","Outro"]},
        {"id":"exames_indicados_outro","label":"Outro (Exames)","type":"text","required":false,"conditional":{"field":"exames_indicados","value":"Outro"}},
        {"id":"coleta_realizada","label":"Coleta Realizada","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"observacoes_exames","label":"Observações sobre Exames","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_hipotese_plano",
      "title": "Hipótese Diagnóstica e Plano Terapêutico",
      "fields": [
        {"id":"hipotese_diagnostica_principal","label":"Hipótese Diagnóstica Principal","type":"text","required":false},
        {"id":"hipoteses_diferenciais","label":"Hipóteses Diferenciais","type":"textarea","required":false},
        {"id":"classificacao_caso","label":"Classificação do Caso","type":"select","required":false,"options":["Infecção bacteriana","Infecção fúngica","Infecção viral","Infecção parasitária","Infecção mista","Quadro infeccioso não confirmado","Indefinido","Outro"]},
        {"id":"classificacao_caso_outro","label":"Outro (Classificação)","type":"text","required":false,"conditional":{"field":"classificacao_caso","value":"Outro"}},
        {"id":"agente_suspeito_principal","label":"Agente Suspeito Principal","type":"text","required":false},
        {"id":"gravidade_clinica","label":"Gravidade Clínica","type":"select","required":false,"options":["Leve","Moderada","Grave"]},
        {"id":"necessidade_isolamento_ou_orientacao_contagio","label":"Necessidade de Isolamento ou Orientação de Contágio","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"conduta_clinica","label":"Conduta Clínica","type":"textarea","required":false},
        {"id":"medicamentos_prescritos","label":"Medicamentos Prescritos","type":"textarea","required":false},
        {"id":"orientacoes_higiene_e_contagio","label":"Orientações de Higiene e Contágio","type":"textarea","required":false},
        {"id":"orientacoes_gerais_paciente","label":"Orientações Gerais ao Paciente","type":"textarea","required":false},
        {"id":"necessidade_retorno","label":"Necessidade de Retorno","type":"radio","required":false,"options":["Sim","Não"]},
        {"id":"prazo_retorno","label":"Prazo de Retorno","type":"text","required":false},
        {"id":"encaminhamento","label":"Encaminhamento","type":"textarea","required":false}
      ]
    },
    {
      "id": "secao_observacoes",
      "title": "Observações Finais",
      "fields": [
        {"id":"observacoes_gerais","label":"Observações Gerais","type":"textarea","required":false}
      ]
    }
  ]'::jsonb,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Link current version and sync campos
UPDATE public.anamnesis_templates
SET current_version_id = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
    campos = (SELECT structure FROM public.anamnesis_template_versions WHERE id = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f')
WHERE id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
