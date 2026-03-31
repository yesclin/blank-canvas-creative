
-- 1. Create provisioning function for aesthetic anamnesis templates
CREATE OR REPLACE FUNCTION public.provision_estetica_anamnesis_templates(_clinic_id uuid, _specialty_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _tpl RECORD;
  _template_id UUID;
  _version_id UUID;
  _count INTEGER := 0;
  _templates JSONB;
BEGIN
  _templates := '[
    {
      "name": "Anamnese Estética Facial Geral",
      "is_default": true,
      "icon": "ClipboardList",
      "structure": [
        {"id":"sec_consulta_facial","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_facial","type":"date","label":"Data da avaliação","required":true},
          {"id":"tipo_consulta_facial","type":"select","label":"Tipo de consulta","options":["Primeira consulta","Retorno","Reavaliação"],"required":false},
          {"id":"queixa_principal_facial","type":"textarea","label":"Queixa principal","required":true},
          {"id":"objetivo_estetico_principal","type":"textarea","label":"Objetivo estético principal","required":false},
          {"id":"regiao_maior_incomodo","type":"text","label":"Região de maior incômodo","required":false}
        ]},
        {"id":"sec_historico_estetico_facial","type":"section","title":"Histórico Estético","fields":[
          {"id":"historico_estetico_previo","type":"textarea","label":"Histórico estético prévio","required":false},
          {"id":"procedimentos_previos_facial","type":"textarea","label":"Procedimentos prévios","required":false},
          {"id":"intercorrencias_previas_facial","type":"textarea","label":"Intercorrências prévias","required":false}
        ]},
        {"id":"sec_saude_facial","type":"section","title":"Saúde e Contraindicações","fields":[
          {"id":"alergias_facial","type":"textarea","label":"Alergias","required":false},
          {"id":"medicacoes_facial","type":"textarea","label":"Uso de medicações","required":false},
          {"id":"gestacao_facial","type":"select","label":"Gestação","options":["Sim","Não"],"required":false},
          {"id":"lactacao_facial","type":"select","label":"Lactação","options":["Sim","Não"],"required":false},
          {"id":"tendencia_queloide","type":"select","label":"Tendência a queloide","options":["Sim","Não","Não sei"],"required":false},
          {"id":"herpes_recorrente","type":"select","label":"Herpes recorrente","options":["Sim","Não"],"required":false},
          {"id":"doencas_autoimunes_facial","type":"select","label":"Doenças autoimunes","options":["Sim","Não"],"required":false},
          {"id":"sensibilidade_cutanea","type":"select","label":"Sensibilidade cutânea","options":["Baixa","Moderada","Alta"],"required":false}
        ]},
        {"id":"sec_avaliacao_pele_facial","type":"section","title":"Avaliação da Pele","fields":[
          {"id":"tipo_pele_facial","type":"select","label":"Tipo de pele","options":["Normal","Seca","Oleosa","Mista","Sensível"],"required":false},
          {"id":"oleosidade_facial","type":"select","label":"Oleosidade","options":["Baixa","Moderada","Alta"],"required":false},
          {"id":"manchas_facial","type":"select","label":"Manchas","options":["Ausentes","Leves","Moderadas","Intensas"],"required":false},
          {"id":"flacidez_facial","type":"select","label":"Flacidez","options":["Ausente","Leve","Moderada","Acentuada"],"required":false},
          {"id":"rugas_finas","type":"select","label":"Rugas finas","options":["Ausentes","Leves","Moderadas","Intensas"],"required":false},
          {"id":"rugas_profundas","type":"select","label":"Rugas profundas","options":["Ausentes","Leves","Moderadas","Intensas"],"required":false},
          {"id":"poros_dilatados_facial","type":"select","label":"Poros dilatados","options":["Ausentes","Leves","Moderados","Intensos"],"required":false},
          {"id":"cicatrizes_facial","type":"textarea","label":"Cicatrizes","required":false},
          {"id":"assimetrias_percebidas","type":"textarea","label":"Assimetrias percebidas","required":false}
        ]},
        {"id":"sec_plano_facial","type":"section","title":"Plano Inicial","fields":[
          {"id":"observacoes_clinicas_facial","type":"textarea","label":"Observações clínicas","required":false},
          {"id":"hipotese_inicial_facial","type":"textarea","label":"Hipótese inicial","required":false},
          {"id":"plano_inicial_facial","type":"textarea","label":"Plano inicial","required":false},
          {"id":"necessidade_foto_clinica","type":"select","label":"Necessidade de foto clínica","options":["Sim","Não"],"required":false},
          {"id":"necessidade_retorno_facial","type":"select","label":"Necessidade de retorno","options":["Sim","Não"],"required":false}
        ]}
      ]
    },
    {
      "name": "Plano de Aplicação de Toxina Botulínica",
      "is_default": false,
      "icon": "Syringe",
      "structure": [
        {"id":"sec_consulta_toxina","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_toxina","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_procedimento_toxina","type":"textarea","label":"Objetivo do procedimento","required":true},
          {"id":"indicacao_principal_toxina","type":"text","label":"Indicação principal","required":false},
          {"id":"queixa_funcional_estetica_toxina","type":"textarea","label":"Queixa funcional ou estética","required":false}
        ]},
        {"id":"sec_saude_toxina","type":"section","title":"Saúde e Contraindicações","fields":[
          {"id":"contraindicacoes_toxina","type":"textarea","label":"Contraindicações","required":false},
          {"id":"alergias_toxina","type":"textarea","label":"Alergias","required":false},
          {"id":"medicamentos_toxina","type":"textarea","label":"Uso de medicamentos","required":false},
          {"id":"gestacao_toxina","type":"select","label":"Gestação","options":["Sim","Não"],"required":false},
          {"id":"lactacao_toxina","type":"select","label":"Lactação","options":["Sim","Não"],"required":false},
          {"id":"doenca_neuromuscular_toxina","type":"select","label":"Doença neuromuscular","options":["Sim","Não"],"required":false}
        ]},
        {"id":"sec_historico_toxina","type":"section","title":"Histórico com Toxina","fields":[
          {"id":"historico_toxina_previa","type":"select","label":"Já aplicou toxina anteriormente?","options":["Sim","Não"],"required":false},
          {"id":"resposta_previa_toxina","type":"textarea","label":"Resposta prévia ao procedimento","required":false},
          {"id":"assimetrias_faciais_toxina","type":"textarea","label":"Assimetrias faciais","required":false},
          {"id":"avaliacao_dinamica_mimica","type":"textarea","label":"Avaliação dinâmica da mímica","required":false}
        ]},
        {"id":"sec_mapa_aplicacao_toxina","type":"section","title":"Mapa de Aplicação (Áreas Faciais)","fields":[
          {"id":"mapa_facial_toxina","type":"imagem_interativa","label":"Mapa facial de aplicação","required":false},
          {"id":"areas_aplicacao_toxina","type":"textarea","label":"Áreas de aplicação (frontal, glabela, pés de galinha, bunny lines, mento, masseter, platisma, orbicular, etc.)","required":false}
        ]},
        {"id":"sec_produto_toxina","type":"section","title":"Rastreabilidade do Produto","fields":[
          {"id":"produto_toxina","type":"text","label":"Produto","required":false},
          {"id":"lote_toxina","type":"text","label":"Lote","required":false},
          {"id":"validade_toxina","type":"date","label":"Validade","required":false},
          {"id":"fabricante_toxina","type":"text","label":"Fabricante","required":false},
          {"id":"diluicao_toxina","type":"text","label":"Diluição","required":false},
          {"id":"unidades_total_toxina","type":"number","label":"Total de unidades aplicadas","required":false}
        ]},
        {"id":"sec_resumo_toxina","type":"section","title":"Resumo e Orientações","fields":[
          {"id":"observacoes_gerais_toxina","type":"textarea","label":"Observações gerais","required":false},
          {"id":"intercorrencias_orientadas_toxina","type":"textarea","label":"Intercorrências orientadas","required":false},
          {"id":"necessidade_retorno_toxina","type":"select","label":"Necessidade de retorno","options":["Sim","Não"],"required":false}
        ]}
      ]
    },
    {
      "name": "Plano de Preenchimento com Ácido Hialurônico",
      "is_default": false,
      "icon": "Droplets",
      "structure": [
        {"id":"sec_consulta_ah","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_ah","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_principal_ah","type":"textarea","label":"Objetivo principal","required":true},
          {"id":"queixa_estetica_ah","type":"textarea","label":"Queixa estética principal","required":false},
          {"id":"areas_perda_volume","type":"textarea","label":"Áreas de perda de volume","required":false},
          {"id":"assimetrias_ah","type":"textarea","label":"Assimetrias","required":false}
        ]},
        {"id":"sec_saude_ah","type":"section","title":"Saúde e Contraindicações","fields":[
          {"id":"contraindicacoes_ah","type":"textarea","label":"Contraindicações","required":false},
          {"id":"alergias_ah","type":"textarea","label":"Alergias","required":false},
          {"id":"historico_preenchimento_previo","type":"textarea","label":"Histórico de preenchimento prévio","required":false},
          {"id":"intercorrencias_anteriores_ah","type":"textarea","label":"Intercorrências anteriores","required":false}
        ]},
        {"id":"sec_mapa_ah","type":"section","title":"Mapa de Aplicação (Áreas Faciais)","fields":[
          {"id":"mapa_facial_ah","type":"imagem_interativa","label":"Mapa facial de preenchimento","required":false},
          {"id":"areas_tratadas_ah","type":"textarea","label":"Áreas tratadas (lábios, sulco nasogeniano, malar, olheira, mento, mandíbula, têmporas, nariz, linhas de marionete, etc.)","required":false}
        ]},
        {"id":"sec_produto_ah","type":"section","title":"Rastreabilidade do Produto","fields":[
          {"id":"produto_ah","type":"text","label":"Produto","required":false},
          {"id":"lote_ah","type":"text","label":"Lote","required":false},
          {"id":"validade_ah","type":"date","label":"Validade","required":false},
          {"id":"fabricante_ah","type":"text","label":"Fabricante","required":false},
          {"id":"volume_total_ah","type":"text","label":"Volume total aplicado","required":false},
          {"id":"tecnica_ah","type":"text","label":"Técnica utilizada","required":false}
        ]},
        {"id":"sec_resumo_ah","type":"section","title":"Resumo e Orientações","fields":[
          {"id":"areas_programadas_ah","type":"textarea","label":"Áreas programadas","required":false},
          {"id":"necessidade_retoque_ah","type":"select","label":"Necessidade de retoque","options":["Sim","Não"],"required":false},
          {"id":"orientacoes_pos_ah","type":"textarea","label":"Orientações pós-procedimento","required":false},
          {"id":"necessidade_retorno_ah","type":"select","label":"Necessidade de retorno","options":["Sim","Não"],"required":false}
        ]}
      ]
    },
    {
      "name": "Avaliação Corporal Estética",
      "is_default": false,
      "icon": "User",
      "structure": [
        {"id":"sec_consulta_corporal","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_corporal","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_corporal_principal","type":"textarea","label":"Objetivo corporal principal","required":true},
          {"id":"regiao_maior_incomodo_corp","type":"text","label":"Região de maior incômodo","required":false}
        ]},
        {"id":"sec_avaliacao_corporal","type":"section","title":"Avaliação Corporal","fields":[
          {"id":"gordura_localizada","type":"select","label":"Gordura localizada","options":["Ausente","Leve","Moderada","Intensa"],"required":false},
          {"id":"flacidez_corporal","type":"select","label":"Flacidez","options":["Ausente","Leve","Moderada","Acentuada"],"required":false},
          {"id":"celulite","type":"select","label":"Celulite","options":["Ausente","Grau I","Grau II","Grau III","Grau IV"],"required":false},
          {"id":"estrias","type":"select","label":"Estrias","options":["Ausentes","Recentes","Antigas","Mistas"],"required":false},
          {"id":"retencao_edema","type":"select","label":"Retenção / Edema","options":["Ausente","Leve","Moderado","Intenso"],"required":false},
          {"id":"dor_local","type":"select","label":"Dor local","options":["Ausente","Leve","Moderada","Intensa"],"required":false}
        ]},
        {"id":"sec_mapa_corporal","type":"section","title":"Mapa Corporal","fields":[
          {"id":"mapa_corporal_frente","type":"imagem_interativa","label":"Mapa corporal (frente)","required":false},
          {"id":"mapa_corporal_costas","type":"imagem_interativa","label":"Mapa corporal (costas)","required":false},
          {"id":"areas_marcadas_corporal","type":"textarea","label":"Áreas marcadas (abdome, flancos, culote, glúteos, coxas, braços, costas, etc.)","required":false}
        ]},
        {"id":"sec_saude_corporal","type":"section","title":"Saúde e Histórico","fields":[
          {"id":"historico_procedimentos_corp","type":"textarea","label":"Histórico de procedimentos prévios","required":false},
          {"id":"comorbidades_corporal","type":"textarea","label":"Comorbidades","required":false},
          {"id":"medicacoes_corporal","type":"textarea","label":"Medicações","required":false},
          {"id":"atividade_fisica_corporal","type":"textarea","label":"Atividade física","required":false},
          {"id":"alimentacao_corporal","type":"textarea","label":"Alimentação percebida","required":false},
          {"id":"ingesta_hidrica_corporal","type":"text","label":"Ingesta hídrica","required":false}
        ]},
        {"id":"sec_medidas_corporal","type":"section","title":"Medições Corporais","fields":[
          {"id":"peso_corporal","type":"number","label":"Peso (kg)","required":false},
          {"id":"altura_corporal","type":"number","label":"Altura (cm)","required":false},
          {"id":"busto_corporal","type":"number","label":"Busto (cm)","required":false},
          {"id":"cintura_corporal","type":"number","label":"Cintura (cm)","required":false},
          {"id":"abdome_corporal","type":"number","label":"Abdome (cm)","required":false},
          {"id":"quadril_corporal","type":"number","label":"Quadril (cm)","required":false},
          {"id":"coxa_dir_corporal","type":"number","label":"Coxa direita (cm)","required":false},
          {"id":"coxa_esq_corporal","type":"number","label":"Coxa esquerda (cm)","required":false},
          {"id":"braco_dir_corporal","type":"number","label":"Braço direito (cm)","required":false},
          {"id":"braco_esq_corporal","type":"number","label":"Braço esquerdo (cm)","required":false},
          {"id":"observacoes_antropometricas_corp","type":"textarea","label":"Observações antropométricas","required":false}
        ]},
        {"id":"sec_plano_corporal","type":"section","title":"Plano Corporal","fields":[
          {"id":"protocolo_sugerido_corporal","type":"textarea","label":"Protocolo sugerido","required":false},
          {"id":"sessoes_previstas_corporal","type":"number","label":"Sessões previstas","required":false},
          {"id":"recursos_planejados_corporal","type":"textarea","label":"Recursos planejados","required":false},
          {"id":"necessidade_fotos_ba_corp","type":"select","label":"Necessidade de fotos antes/depois","options":["Sim","Não"],"required":false},
          {"id":"observacoes_finais_corporal","type":"textarea","label":"Observações finais","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese para Bioestimulador de Colágeno",
      "is_default": false,
      "icon": "Sparkles",
      "structure": [
        {"id":"sec_consulta_bio","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_bio","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_tratamento_bio","type":"textarea","label":"Objetivo do tratamento","required":true},
          {"id":"area_principal_bio","type":"select","label":"Área principal","options":["Facial","Corporal","Ambas"],"required":false}
        ]},
        {"id":"sec_avaliacao_bio","type":"section","title":"Avaliação","fields":[
          {"id":"flacidez_bio","type":"select","label":"Flacidez","options":["Leve","Moderada","Acentuada"],"required":false},
          {"id":"perda_sustentacao_bio","type":"select","label":"Perda de sustentação","options":["Leve","Moderada","Acentuada"],"required":false},
          {"id":"qualidade_pele_bio","type":"select","label":"Qualidade de pele","options":["Boa","Regular","Comprometida"],"required":false}
        ]},
        {"id":"sec_saude_bio","type":"section","title":"Saúde e Contraindicações","fields":[
          {"id":"contraindicacoes_bio","type":"textarea","label":"Contraindicações","required":false},
          {"id":"historico_previo_bio","type":"textarea","label":"Histórico prévio com bioestimuladores","required":false},
          {"id":"doenca_autoimune_bio","type":"select","label":"Doença autoimune","options":["Sim","Não"],"required":false},
          {"id":"tendencia_queloides_bio","type":"select","label":"Tendência a queloides","options":["Sim","Não","Não sei"],"required":false},
          {"id":"gestante_lactante_bio","type":"select","label":"Gestante ou lactante","options":["Sim","Não"],"required":false}
        ]},
        {"id":"sec_mapa_bio","type":"section","title":"Mapa de Aplicação","fields":[
          {"id":"mapa_aplicacao_bio","type":"imagem_interativa","label":"Mapa de aplicação (facial ou corporal)","required":false},
          {"id":"regioes_tratadas_bio","type":"textarea","label":"Regiões tratadas","required":false}
        ]},
        {"id":"sec_produto_bio","type":"section","title":"Rastreabilidade do Produto","fields":[
          {"id":"produto_bio","type":"text","label":"Produto","required":false},
          {"id":"lote_bio","type":"text","label":"Lote","required":false},
          {"id":"validade_bio","type":"date","label":"Validade","required":false},
          {"id":"fabricante_bio","type":"text","label":"Fabricante","required":false},
          {"id":"quantidade_bio","type":"text","label":"Quantidade","required":false},
          {"id":"plano_aplicacao_bio","type":"textarea","label":"Plano de aplicação","required":false}
        ]},
        {"id":"sec_obs_bio","type":"section","title":"Observações","fields":[
          {"id":"observacoes_clinicas_bio","type":"textarea","label":"Observações clínicas","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese para Microagulhamento / Skinbooster / Revitalização",
      "is_default": false,
      "icon": "Scan",
      "structure": [
        {"id":"sec_consulta_skin","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_skin","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_principal_skin","type":"textarea","label":"Objetivo principal","required":true}
        ]},
        {"id":"sec_avaliacao_skin","type":"section","title":"Avaliação da Pele","fields":[
          {"id":"manchas_skin","type":"select","label":"Manchas","options":["Ausentes","Leves","Moderadas","Intensas"],"required":false},
          {"id":"poros_skin","type":"select","label":"Poros","options":["Normais","Dilatados","Muito dilatados"],"required":false},
          {"id":"textura_skin","type":"select","label":"Textura","options":["Lisa","Irregular","Muito irregular"],"required":false},
          {"id":"acne_skin","type":"select","label":"Acne","options":["Ausente","Leve","Moderada","Severa"],"required":false},
          {"id":"cicatriz_acne_skin","type":"select","label":"Cicatriz de acne","options":["Ausente","Leve","Moderada","Severa"],"required":false},
          {"id":"melasma_skin","type":"select","label":"Melasma","options":["Ausente","Leve","Moderado","Severo"],"required":false},
          {"id":"vico_skin","type":"select","label":"Viço","options":["Bom","Regular","Opaco"],"required":false},
          {"id":"ressecamento_skin","type":"select","label":"Ressecamento","options":["Ausente","Leve","Moderado","Intenso"],"required":false},
          {"id":"sensibilidade_skin","type":"select","label":"Sensibilidade","options":["Baixa","Moderada","Alta"],"required":false}
        ]},
        {"id":"sec_saude_skin","type":"section","title":"Saúde e Histórico","fields":[
          {"id":"historico_previo_skin","type":"textarea","label":"Histórico prévio","required":false},
          {"id":"contraindicacoes_skin","type":"textarea","label":"Contraindicações","required":false}
        ]},
        {"id":"sec_fotos_skin","type":"section","title":"Documentação Fotográfica","fields":[
          {"id":"foto_antes_skin","type":"textarea","label":"Descrição da foto clínica antes","required":false},
          {"id":"observacao_fotos_skin","type":"textarea","label":"Observações sobre registro fotográfico (use módulo Antes/Depois para upload)","required":false}
        ]},
        {"id":"sec_plano_skin","type":"section","title":"Plano Inicial","fields":[
          {"id":"hipotese_estetica_skin","type":"textarea","label":"Hipótese estética inicial","required":false},
          {"id":"plano_inicial_skin","type":"textarea","label":"Plano inicial","required":false},
          {"id":"observacoes_clinicas_skin","type":"textarea","label":"Observações clínicas","required":false}
        ]}
      ]
    },
    {
      "name": "Anamnese para Procedimentos Estéticos Combinados",
      "is_default": false,
      "icon": "Layers",
      "structure": [
        {"id":"sec_consulta_comb","type":"section","title":"Dados da Consulta","fields":[
          {"id":"data_avaliacao_comb","type":"date","label":"Data da avaliação","required":true},
          {"id":"objetivo_geral_comb","type":"textarea","label":"Objetivo geral","required":true},
          {"id":"queixa_principal_comb","type":"textarea","label":"Queixa principal","required":false},
          {"id":"procedimentos_planejados_comb","type":"textarea","label":"Procedimentos planejados","required":true}
        ]},
        {"id":"sec_areas_comb","type":"section","title":"Áreas Tratadas","fields":[
          {"id":"areas_tratadas_comb","type":"textarea","label":"Áreas tratadas","required":false},
          {"id":"mapa_facial_comb","type":"imagem_interativa","label":"Mapa facial (se houver procedimento facial injetável)","required":false},
          {"id":"mapa_corporal_comb","type":"imagem_interativa","label":"Mapa corporal (se houver procedimento corporal)","required":false}
        ]},
        {"id":"sec_saude_comb","type":"section","title":"Saúde e Histórico","fields":[
          {"id":"historico_previo_comb","type":"textarea","label":"Histórico prévio","required":false},
          {"id":"contraindicacoes_comb","type":"textarea","label":"Contraindicações","required":false}
        ]},
        {"id":"sec_produtos_comb","type":"section","title":"Rastreabilidade de Produtos","fields":[
          {"id":"produtos_utilizados_comb","type":"textarea","label":"Produtos utilizados (nome, lote, validade, fabricante)","required":false},
          {"id":"observacoes_produtos_comb","type":"textarea","label":"Observações sobre produtos","required":false}
        ]},
        {"id":"sec_plano_comb","type":"section","title":"Plano por Sessão","fields":[
          {"id":"plano_sessao_comb","type":"textarea","label":"Plano por sessão","required":false},
          {"id":"foto_clinica_comb","type":"textarea","label":"Descrição da foto clínica (use módulo Antes/Depois para upload)","required":false},
          {"id":"observacoes_finais_comb","type":"textarea","label":"Observações finais","required":false}
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
        'Modelo oficial de Estética - ' || (_tpl.val->>'name'),
        1,
        _tpl.val->'structure', _tpl.val->'structure',
        true, true, (_tpl.val->>'is_default')::boolean, false,
        COALESCE(_tpl.val->>'icon', 'ClipboardList'), 0,
        'anamnese', 'estetica'
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
$fn$;

-- 2. Update provision_specialty to call estetica provisioner
CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id UUID, _specialty_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _specialty_id UUID;
  _specialty_name TEXT;
  _specialty_desc TEXT;
  _tab RECORD;
  _tabs JSONB;
BEGIN
  CASE _specialty_slug
    WHEN 'geral' THEN _specialty_name := 'Clínica Geral'; _specialty_desc := 'Atendimento médico generalista';
    WHEN 'psicologia' THEN _specialty_name := 'Psicologia'; _specialty_desc := 'Saúde mental e terapia';
    WHEN 'nutricao' THEN _specialty_name := 'Nutrição'; _specialty_desc := 'Alimentação e dieta';
    WHEN 'fisioterapia' THEN _specialty_name := 'Fisioterapia'; _specialty_desc := 'Reabilitação e movimento';
    WHEN 'pilates' THEN _specialty_name := 'Pilates'; _specialty_desc := 'Exercícios terapêuticos';
    WHEN 'estetica' THEN _specialty_name := 'Estética / Harmonização Facial'; _specialty_desc := 'Procedimentos estéticos';
    WHEN 'odontologia' THEN _specialty_name := 'Odontologia'; _specialty_desc := 'Saúde bucal com odontograma digital';
    WHEN 'dermatologia' THEN _specialty_name := 'Dermatologia'; _specialty_desc := 'Cuidados com a pele';
    WHEN 'pediatria' THEN _specialty_name := 'Pediatria'; _specialty_desc := 'Atendimento infantil';
    ELSE
      RAISE EXCEPTION 'Unknown official specialty slug: "%"', _specialty_slug;
  END CASE;

  SELECT id INTO _specialty_id
  FROM public.specialties
  WHERE slug = _specialty_slug AND clinic_id = _clinic_id
  LIMIT 1;

  IF _specialty_id IS NULL THEN
    INSERT INTO public.specialties (name, slug, description, clinic_id, specialty_type, is_active)
    VALUES (_specialty_name, _specialty_slug, _specialty_desc, _clinic_id, 'padrao', true)
    ON CONFLICT (clinic_id, slug) DO UPDATE SET is_active = true
    RETURNING id INTO _specialty_id;
  ELSE
    UPDATE public.specialties SET is_active = true WHERE id = _specialty_id;
  END IF;

  CASE _specialty_slug
    WHEN 'psicologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"instrumentos_testes","slug":"instrumentos_testes","name":"Instrumentos / Testes","icon":"TestTube","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"plano_terapeutico","slug":"plano_terapeutico","name":"Plano Terapêutico","icon":"Target","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_psicologia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'nutricao' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Nutricional","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_antropometrica","slug":"avaliacao_antropometrica","name":"Avaliação Antropométrica","icon":"Ruler","display_order":3},
        {"key":"plano_alimentar","slug":"plano_alimentar","name":"Plano Alimentar","icon":"UtensilsCrossed","display_order":4},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_nutricao_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'fisioterapia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_funcional","slug":"avaliacao_funcional","name":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"plano_terapeutico","slug":"plano_terapeutico","name":"Plano Terapêutico","icon":"Target","display_order":5},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":6},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":7},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":8}
      ]';
      PERFORM provision_fisioterapia_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'pilates' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"avaliacao_funcional","slug":"avaliacao_funcional","name":"Avaliação Funcional","icon":"Activity","display_order":3},
        {"key":"avaliacao_dor","slug":"avaliacao_dor","name":"Avaliação de Dor","icon":"Heart","display_order":4},
        {"key":"plano_exercicios","slug":"plano_exercicios","name":"Plano de Exercícios","icon":"Dumbbell","display_order":5},
        {"key":"sessoes","slug":"sessoes","name":"Sessões","icon":"Calendar","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames e Documentos","icon":"FolderOpen","display_order":8},
        {"key":"alertas","slug":"alertas","name":"Alertas / Restrições","icon":"AlertTriangle","display_order":9},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":10}
      ]';
      PERFORM provision_pilates_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'geral' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Exame Físico","icon":"Stethoscope","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"diagnostico","slug":"diagnostico","name":"Hipóteses Diagnósticas","icon":"Search","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano / Conduta","icon":"Target","display_order":6},
        {"key":"documentos_clinicos","slug":"documentos_clinicos","name":"Documentos Clínicos","icon":"FileCheck","display_order":7},
        {"key":"prescricoes","slug":"prescricoes","name":"Prescrições","icon":"Pill","display_order":8},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames","icon":"FolderOpen","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';

    WHEN 'estetica' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Estética","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Avaliação Estética","icon":"Scan","display_order":3},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":4},
        {"key":"procedimentos_realizados","slug":"procedimentos_realizados","name":"Procedimentos","icon":"Syringe","display_order":5},
        {"key":"produtos_utilizados","slug":"produtos_utilizados","name":"Produtos","icon":"Package","display_order":6},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Antes / Depois","icon":"Camera","display_order":7},
        {"key":"termos_consentimentos","slug":"termos_consentimentos","name":"Termos","icon":"Shield","display_order":8},
        {"key":"facial_map","slug":"facial_map","name":"Mapa Facial","icon":"MapPin","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';
      PERFORM provision_estetica_anamnesis_templates(_clinic_id, _specialty_id);

    WHEN 'odontologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Odontológica","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Avaliação Clínica","icon":"Stethoscope","display_order":3},
        {"key":"odontograma","slug":"odontograma","name":"Odontograma Digital","icon":"Smile","display_order":4},
        {"key":"diagnostico","slug":"diagnostico","name":"Diagnóstico","icon":"Search","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano de Tratamento","icon":"Target","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"procedimentos_realizados","slug":"procedimentos_realizados","name":"Procedimentos","icon":"Syringe","display_order":8},
        {"key":"produtos_utilizados","slug":"produtos_utilizados","name":"Materiais","icon":"Package","display_order":9},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":10},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Antes / Depois","icon":"Camera","display_order":11},
        {"key":"alertas","slug":"alertas","name":"Alertas","icon":"AlertTriangle","display_order":12},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":13}
      ]';

    WHEN 'dermatologia' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese","slug":"anamnese","name":"Anamnese Dermatológica","icon":"ClipboardList","display_order":2},
        {"key":"exame_fisico","slug":"exame_fisico","name":"Exame Dermatológico","icon":"Scan","display_order":3},
        {"key":"diagnostico","slug":"diagnostico","name":"Diagnóstico","icon":"Search","display_order":4},
        {"key":"prescricoes","slug":"prescricoes","name":"Prescrições","icon":"Pill","display_order":5},
        {"key":"conduta","slug":"conduta","name":"Plano / Conduta","icon":"Target","display_order":6},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":7},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":8},
        {"key":"before_after_photos","slug":"before_after_photos","name":"Fotos Clínicas","icon":"Camera","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Clínicos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Histórico","icon":"Clock","display_order":11}
      ]';

    WHEN 'pediatria' THEN
      _tabs := '[
        {"key":"visao_geral","slug":"visao_geral","name":"Visão Geral","icon":"LayoutDashboard","display_order":1},
        {"key":"anamnese_pediatrica","slug":"anamnese_pediatrica","name":"Anamnese Pediátrica","icon":"ClipboardList","display_order":2},
        {"key":"crescimento_desenvolvimento","slug":"crescimento_desenvolvimento","name":"Crescimento e Desenvolvimento","icon":"TrendingUp","display_order":3},
        {"key":"avaliacao_clinica_pediatrica","slug":"avaliacao_clinica_pediatrica","name":"Avaliação Clínica","icon":"Stethoscope","display_order":4},
        {"key":"diagnostico_pediatrico","slug":"diagnostico_pediatrico","name":"Diagnóstico","icon":"Search","display_order":5},
        {"key":"prescricoes_pediatricas","slug":"prescricoes_pediatricas","name":"Prescrições","icon":"Pill","display_order":6},
        {"key":"vacinacao","slug":"vacinacao","name":"Vacinação","icon":"Syringe","display_order":7},
        {"key":"evolucoes","slug":"evolucoes","name":"Evoluções","icon":"FileText","display_order":8},
        {"key":"exames_documentos","slug":"exames_documentos","name":"Exames / Documentos","icon":"FolderOpen","display_order":9},
        {"key":"alertas","slug":"alertas","name":"Alertas Pediátricos","icon":"AlertTriangle","display_order":10},
        {"key":"historico","slug":"historico","name":"Linha do Tempo","icon":"Clock","display_order":11}
      ]';

    ELSE
      RAISE NOTICE 'No specific provisioning for specialty "%"', _specialty_slug;
      RETURN;
  END CASE;

  FOR _tab IN SELECT * FROM jsonb_array_elements(_tabs) AS t(val)
  LOOP
    INSERT INTO public.medical_record_tabs (
      clinic_id, specialty_id, key, slug, name, icon, display_order, is_active, is_system
    ) VALUES (
      _clinic_id, _specialty_id,
      _tab.val->>'key', _tab.val->>'slug', _tab.val->>'name',
      _tab.val->>'icon', (_tab.val->>'display_order')::int,
      true, true
    )
    ON CONFLICT (clinic_id, specialty_id, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      key = EXCLUDED.key,
      icon = EXCLUDED.icon,
      display_order = EXCLUDED.display_order,
      is_active = true;
  END LOOP;
END;
$$;

-- 3. Auto-provision for existing estetica clinics
DO $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT s.clinic_id, s.id AS specialty_id
    FROM public.specialties s
    WHERE s.slug = 'estetica' AND s.is_active = true
  LOOP
    PERFORM public.provision_estetica_anamnesis_templates(_rec.clinic_id, _rec.specialty_id);
  END LOOP;
END;
$$;
