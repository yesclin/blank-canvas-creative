
DO $$
DECLARE
  v_specialty_id uuid := 'd241f90c-0fdd-4e2c-a959-6482d7ac2370';
  v_template_id uuid;
  v_version_id uuid;
  v_clinic_id uuid;
  v_structure jsonb;
BEGIN
  -- Get first clinic that has this specialty enabled
  SELECT cs.clinic_id INTO v_clinic_id
  FROM clinic_specialty_modules cs
  WHERE cs.specialty_id = v_specialty_id
  LIMIT 1;

  -- Fallback: get any clinic
  IF v_clinic_id IS NULL THEN
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
  END IF;

  IF v_clinic_id IS NULL THEN
    RAISE NOTICE 'No clinic found, skipping';
    RETURN;
  END IF;

  v_structure := '[
    {
      "id": "identificacao",
      "type": "section",
      "title": "Identificação",
      "fields": [
        {"id": "data_avaliacao", "type": "date", "label": "Data da Avaliação", "required": true},
        {"id": "tipo_consulta", "type": "select", "label": "Tipo de Consulta", "options": ["Primeira consulta", "Retorno", "Urgência", "Acompanhamento"], "required": true},
        {"id": "encaminhamento", "type": "text", "label": "Encaminhamento (se houver)"},
        {"id": "observacoes_iniciais", "type": "textarea", "label": "Observações Iniciais"}
      ]
    },
    {
      "id": "queixa_principal",
      "type": "section",
      "title": "Queixa Principal",
      "fields": [
        {"id": "queixa_principal", "type": "textarea", "label": "Queixa Principal", "required": true},
        {"id": "tempo_sintomas", "type": "text", "label": "Tempo de Sintomas"},
        {"id": "localizacao", "type": "text", "label": "Localização"},
        {"id": "evolucao", "type": "select", "label": "Evolução", "options": ["Estável", "Progressiva", "Regressiva", "Intermitente"]},
        {"id": "sintomas_associados", "type": "multiselect", "label": "Sintomas Associados", "options": ["Prurido", "Dor", "Ardência", "Descamação", "Sangramento", "Secreção", "Alteração de cor", "Alteração de textura"]},
        {"id": "tratamentos_previos", "type": "textarea", "label": "Tratamentos Prévios"},
        {"id": "objetivo_paciente", "type": "textarea", "label": "Objetivo do Paciente"}
      ]
    },
    {
      "id": "historico_dermatologico",
      "type": "section",
      "title": "Histórico Dermatológico",
      "fields": [
        {"id": "doencas_pele_previas", "type": "textarea", "label": "Doenças de Pele Prévias"},
        {"id": "historico_familiar", "type": "textarea", "label": "Histórico Familiar Dermatológico"},
        {"id": "alergias_cutaneas", "type": "textarea", "label": "Alergias Cutâneas"},
        {"id": "fototipo", "type": "select", "label": "Fototipo (Fitzpatrick)", "options": ["I - Muito clara", "II - Clara", "III - Morena clara", "IV - Morena", "V - Morena escura", "VI - Negra"]},
        {"id": "exposicao_solar", "type": "select", "label": "Exposição Solar", "options": ["Baixa", "Moderada", "Alta", "Muito alta"]},
        {"id": "uso_fotoprotetor", "type": "select", "label": "Uso de Fotoprotetor", "options": ["Diário", "Eventual", "Não usa"]},
        {"id": "cosmeticos_uso", "type": "textarea", "label": "Cosméticos em Uso"}
      ]
    },
    {
      "id": "historico_medico",
      "type": "section",
      "title": "Histórico Médico Relevante",
      "fields": [
        {"id": "doencas_sistemicas", "type": "textarea", "label": "Doenças Sistêmicas"},
        {"id": "medicamentos_uso", "type": "textarea", "label": "Medicamentos em Uso"},
        {"id": "alergias_medicamentosas", "type": "textarea", "label": "Alergias Medicamentosas"},
        {"id": "cirurgias_previas", "type": "textarea", "label": "Cirurgias Prévias"},
        {"id": "tabagismo", "type": "select", "label": "Tabagismo", "options": ["Não", "Sim", "Ex-tabagista"]},
        {"id": "etilismo", "type": "select", "label": "Etilismo", "options": ["Não", "Social", "Moderado", "Elevado"]},
        {"id": "gestacao", "type": "select", "label": "Gestação", "options": ["Não se aplica", "Sim", "Não"]},
        {"id": "observacoes_medicas", "type": "textarea", "label": "Observações Médicas"}
      ]
    },
    {
      "id": "exame_dermatologico",
      "type": "section",
      "title": "Exame Dermatológico Inicial",
      "fields": [
        {"id": "descricao_exame_fisico", "type": "textarea", "label": "Descrição do Exame Físico", "required": true},
        {"id": "tipo_lesao", "type": "multiselect", "label": "Tipo de Lesão", "options": ["Mácula", "Pápula", "Placa", "Nódulo", "Vesícula", "Bolha", "Pústula", "Úlcera", "Erosão", "Crosta", "Escama", "Cicatriz", "Atrofia"]},
        {"id": "distribuicao", "type": "select", "label": "Distribuição", "options": ["Localizada", "Disseminada", "Generalizada", "Segmentar", "Simétrica", "Assimétrica"]},
        {"id": "coloracao", "type": "multiselect", "label": "Coloração", "options": ["Eritematosa", "Hipercrômica", "Hipocrômica", "Acrômica", "Violácea", "Amarelada", "Enegrecida"]},
        {"id": "bordas", "type": "select", "label": "Bordas", "options": ["Regulares", "Irregulares", "Bem definidas", "Mal definidas"]},
        {"id": "superficie", "type": "select", "label": "Superfície", "options": ["Lisa", "Rugosa", "Verrucosa", "Queratósica", "Ulcerada", "Crostosa"]},
        {"id": "tamanho_estimado", "type": "text", "label": "Tamanho Estimado"},
        {"id": "dermatoscopia", "type": "textarea", "label": "Dermatoscopia (se realizada)"},
        {"id": "observacoes_exame", "type": "textarea", "label": "Observações do Exame"}
      ]
    },
    {
      "id": "hipotese_diagnostica",
      "type": "section",
      "title": "Hipótese Diagnóstica",
      "fields": [
        {"id": "hipotese_principal", "type": "text", "label": "Hipótese Principal"},
        {"id": "hipoteses_secundarias", "type": "textarea", "label": "Hipóteses Secundárias"},
        {"id": "exames_complementares", "type": "multiselect", "label": "Exames Complementares", "options": ["Biópsia", "Cultura", "Micológico direto", "Dermatoscopia digital", "Patch test", "Fototeste", "Exames laboratoriais", "Ultrassom cutâneo"]},
        {"id": "observacoes_diagnosticas", "type": "textarea", "label": "Observações Diagnósticas"}
      ]
    },
    {
      "id": "plano_inicial",
      "type": "section",
      "title": "Plano Inicial",
      "fields": [
        {"id": "conduta_inicial", "type": "textarea", "label": "Conduta Inicial"},
        {"id": "prescricao_topica", "type": "textarea", "label": "Prescrição Tópica"},
        {"id": "prescricao_sistemica", "type": "textarea", "label": "Prescrição Sistêmica"},
        {"id": "orientacoes", "type": "textarea", "label": "Orientações ao Paciente"},
        {"id": "necessidade_retorno", "type": "select", "label": "Necessidade de Retorno", "options": ["7 dias", "15 dias", "30 dias", "60 dias", "90 dias", "Conforme necessidade"]},
        {"id": "observacoes_finais", "type": "textarea", "label": "Observações Finais"}
      ]
    }
  ]'::jsonb;

  -- Insert template
  INSERT INTO anamnesis_templates (
    clinic_id, name, description, specialty_id, specialty, icon,
    campos, is_active, is_default, is_system, archived, usage_count
  ) VALUES (
    v_clinic_id,
    'Anamnese Dermatológica Geral (YesClin)',
    'Modelo completo de anamnese dermatológica com queixa, histórico, exame, hipótese e plano inicial.',
    v_specialty_id,
    'dermatologia',
    'Scan',
    v_structure,
    true, true, true, false, 0
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_template_id;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template already exists or insert failed';
    RETURN;
  END IF;

  -- Create version
  INSERT INTO anamnesis_template_versions (
    template_id, structure, version_number, version
  ) VALUES (
    v_template_id, v_structure, 1, 1
  ) RETURNING id INTO v_version_id;

  -- Link version
  UPDATE anamnesis_templates
  SET current_version_id = v_version_id
  WHERE id = v_template_id;
END $$;
