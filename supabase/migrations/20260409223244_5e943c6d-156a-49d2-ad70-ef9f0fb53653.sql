
-- 1. Anamnese Estética Facial - YesClin (b3f309e3)
UPDATE public.anamnesis_template_versions
SET structure = '[
  {"id":"sec_dados_facial","type":"section","title":"Dados da Consulta","fields":[
    {"id":"data_avaliacao_facial_yc","type":"date","label":"Data da avaliação","required":true},
    {"id":"tipo_consulta_facial_yc","type":"select","label":"Tipo de consulta","options":["Primeira consulta","Retorno","Reavaliação"],"required":false},
    {"id":"queixa_principal_facial_yc","type":"textarea","label":"Queixa principal","required":true}
  ]},
  {"id":"sec_avaliacao_facial_yc","type":"section","title":"Avaliação Facial","fields":[
    {"id":"tipo_pele_facial_yc","type":"select","label":"Tipo de pele","options":["Normal","Seca","Oleosa","Mista","Sensível"],"required":true},
    {"id":"fototipo_facial_yc","type":"select","label":"Fototipo (Fitzpatrick)","options":["I - Muito clara","II - Clara","III - Morena clara","IV - Morena","V - Morena escura","VI - Negra"],"required":true},
    {"id":"rugas_facial_yc","type":"select","label":"Rugas / Linhas de expressão","options":["Ausentes","Finas","Moderadas","Profundas"],"required":false},
    {"id":"flacidez_facial_yc","type":"select","label":"Flacidez facial","options":["Ausente","Leve","Moderada","Acentuada"],"required":false},
    {"id":"manchas_facial_yc","type":"select","label":"Manchas / Hiperpigmentação","options":["Ausentes","Leves","Moderadas","Extensas"],"required":false},
    {"id":"acne_facial_yc","type":"select","label":"Acne","options":["Ausente","Comedônica","Inflamatória leve","Inflamatória moderada","Severa"],"required":false},
    {"id":"poros_facial_yc","type":"select","label":"Poros dilatados","options":["Ausentes","Zona T","Bochechas","Generalizado"],"required":false},
    {"id":"olheiras_facial_yc","type":"select","label":"Olheiras","options":["Ausentes","Pigmentar","Vascular","Estrutural","Mista"],"required":false}
  ]},
  {"id":"sec_fotos_facial_yc","type":"section","title":"Registro Fotográfico","fields":[
    {"id":"foto_frontal_facial_yc","type":"image_upload","label":"Foto frontal","required":false},
    {"id":"foto_lateral_dir_facial_yc","type":"image_upload","label":"Foto lateral direita","required":false},
    {"id":"foto_lateral_esq_facial_yc","type":"image_upload","label":"Foto lateral esquerda","required":false},
    {"id":"foto_obliqua_facial_yc","type":"image_upload","label":"Foto oblíqua","required":false}
  ]},
  {"id":"sec_historico_facial_yc","type":"section","title":"Histórico e Saúde","fields":[
    {"id":"procedimentos_anteriores_facial_yc","type":"textarea","label":"Procedimentos estéticos anteriores","required":false},
    {"id":"alergias_facial_yc","type":"textarea","label":"Alergias conhecidas","required":false},
    {"id":"medicamentos_facial_yc","type":"textarea","label":"Medicamentos em uso","required":false},
    {"id":"exposicao_solar_facial_yc","type":"select","label":"Exposição solar","options":["Mínima","Moderada","Intensa","Sem proteção"],"required":false},
    {"id":"uso_protetor_facial_yc","type":"select","label":"Uso de protetor solar","options":["Diário","Eventual","Não usa"],"required":false},
    {"id":"skincare_atual_facial_yc","type":"textarea","label":"Rotina de skincare atual","required":false}
  ]},
  {"id":"sec_plano_facial_yc","type":"section","title":"Plano Terapêutico","fields":[
    {"id":"objetivos_facial_yc","type":"textarea","label":"Objetivos do tratamento","required":false},
    {"id":"procedimentos_sugeridos_facial_yc","type":"textarea","label":"Procedimentos sugeridos","required":false},
    {"id":"observacoes_facial_yc","type":"textarea","label":"Observações gerais","required":false}
  ]}
]'::jsonb
WHERE id = '6bd6c87c-455a-4856-8fb7-90abab747cb9';

-- Also update campos on the template itself
UPDATE public.anamnesis_templates
SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '6bd6c87c-455a-4856-8fb7-90abab747cb9'),
    is_active = true
WHERE id = 'b3f309e3-77bf-46ae-8689-cece3c25328d';

-- 2. Anamnese Pele e Avaliação Facial - YesClin (7ee5973f)
UPDATE public.anamnesis_template_versions
SET structure = '[
  {"id":"sec_dados_pele","type":"section","title":"Dados da Avaliação","fields":[
    {"id":"data_avaliacao_pele","type":"date","label":"Data da avaliação","required":true},
    {"id":"motivo_consulta_pele","type":"textarea","label":"Motivo da consulta","required":true}
  ]},
  {"id":"sec_analise_pele","type":"section","title":"Análise da Pele","fields":[
    {"id":"tipo_pele_analise","type":"select","label":"Tipo de pele","options":["Normal","Seca","Oleosa","Mista","Sensível","Reativa"],"required":true},
    {"id":"fototipo_pele","type":"select","label":"Fototipo (Fitzpatrick)","options":["I","II","III","IV","V","VI"],"required":true},
    {"id":"hidratacao_pele","type":"select","label":"Hidratação","options":["Adequada","Desidratada leve","Desidratada moderada","Desidratada severa"],"required":false},
    {"id":"oleosidade_pele","type":"select","label":"Oleosidade","options":["Normal","Zona T","Generalizada","Ausente"],"required":false},
    {"id":"textura_pele","type":"select","label":"Textura","options":["Lisa","Áspera","Irregular","Descamativa"],"required":false},
    {"id":"tonus_pele","type":"select","label":"Tônus","options":["Firme","Levemente flácida","Flácida","Muito flácida"],"required":false},
    {"id":"sensibilidade_pele","type":"select","label":"Sensibilidade","options":["Normal","Leve","Moderada","Alta / Reativa"],"required":false}
  ]},
  {"id":"sec_lesoes_pele","type":"section","title":"Lesões e Alterações","fields":[
    {"id":"manchas_pele","type":"multiselect","label":"Manchas","options":["Melasma","Efélides","Lentigo solar","Hiperpigmentação pós-inflamatória","Nenhuma"],"required":false},
    {"id":"acne_pele","type":"select","label":"Acne","options":["Ausente","Grau I","Grau II","Grau III","Grau IV"],"required":false},
    {"id":"rosácea_pele","type":"select","label":"Rosácea","options":["Ausente","Eritematosa","Papulopustulosa","Fimatosa"],"required":false},
    {"id":"cicatrizes_pele","type":"select","label":"Cicatrizes","options":["Ausentes","Atróficas","Hipertróficas","Queloides","Ice pick"],"required":false},
    {"id":"outras_lesoes_pele","type":"textarea","label":"Outras alterações observadas","required":false}
  ]},
  {"id":"sec_fotos_pele","type":"section","title":"Registro Fotográfico","fields":[
    {"id":"foto_frontal_pele","type":"image_upload","label":"Foto frontal","required":false},
    {"id":"foto_wood_pele","type":"image_upload","label":"Foto com lâmpada de Wood","required":false},
    {"id":"foto_detalhe_pele","type":"image_upload","label":"Foto de detalhe da lesão","required":false}
  ]},
  {"id":"sec_cuidados_pele","type":"section","title":"Cuidados Atuais","fields":[
    {"id":"rotina_limpeza_pele","type":"textarea","label":"Rotina de limpeza","required":false},
    {"id":"produtos_uso_pele","type":"textarea","label":"Produtos em uso","required":false},
    {"id":"acidos_uso_pele","type":"textarea","label":"Ácidos / Ativos em uso","required":false},
    {"id":"protetor_solar_pele","type":"select","label":"Protetor solar","options":["FPS 30+","FPS 50+","Não usa","Uso irregular"],"required":false}
  ]},
  {"id":"sec_plano_pele","type":"section","title":"Conduta","fields":[
    {"id":"diagnostico_pele","type":"textarea","label":"Diagnóstico estético","required":false},
    {"id":"protocolo_sugerido_pele","type":"textarea","label":"Protocolo sugerido","required":false},
    {"id":"observacoes_pele","type":"textarea","label":"Observações","required":false}
  ]}
]'::jsonb
WHERE id = '5d697326-c0a9-433b-94f4-e07aa1b60209';

UPDATE public.anamnesis_templates
SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '5d697326-c0a9-433b-94f4-e07aa1b60209'),
    is_active = true
WHERE id = '7ee5973f-d130-4e71-b09a-01e30a11954c';

-- 3. Anamnese Capilar - YesClin (0b30c2f1)
UPDATE public.anamnesis_template_versions
SET structure = '[
  {"id":"sec_dados_capilar","type":"section","title":"Dados da Consulta","fields":[
    {"id":"data_avaliacao_capilar","type":"date","label":"Data da avaliação","required":true},
    {"id":"queixa_principal_capilar","type":"textarea","label":"Queixa principal","required":true}
  ]},
  {"id":"sec_avaliacao_capilar","type":"section","title":"Avaliação Capilar","fields":[
    {"id":"tipo_cabelo","type":"select","label":"Tipo de cabelo","options":["Liso","Ondulado","Cacheado","Crespo"],"required":false},
    {"id":"textura_fio","type":"select","label":"Textura do fio","options":["Fino","Médio","Grosso"],"required":false},
    {"id":"oleosidade_couro","type":"select","label":"Oleosidade do couro cabeludo","options":["Normal","Oleoso","Seco","Misto"],"required":false},
    {"id":"queda_capilar","type":"select","label":"Queda capilar","options":["Ausente","Leve","Moderada","Intensa","Alopecia localizada"],"required":true},
    {"id":"inicio_queda","type":"text","label":"Início da queda (quando)","required":false},
    {"id":"padrao_rarefacao","type":"select","label":"Padrão de rarefação","options":["Difusa","Frontal","Temporal","Vertex","Bitemporal","Sem rarefação"],"required":false},
    {"id":"dermatite_couro","type":"select","label":"Dermatite seborreica","options":["Ausente","Leve","Moderada","Intensa"],"required":false},
    {"id":"caspa","type":"select","label":"Caspa / Descamação","options":["Ausente","Seca","Oleosa"],"required":false}
  ]},
  {"id":"sec_fotos_capilar","type":"section","title":"Registro Fotográfico","fields":[
    {"id":"foto_topo_capilar","type":"image_upload","label":"Foto do topo","required":false},
    {"id":"foto_frontal_capilar","type":"image_upload","label":"Foto frontal","required":false},
    {"id":"foto_temporal_capilar","type":"image_upload","label":"Foto temporal","required":false},
    {"id":"foto_tricoscopia","type":"image_upload","label":"Tricoscopia / Dermatoscopia","required":false}
  ]},
  {"id":"sec_saude_capilar","type":"section","title":"Saúde e Histórico","fields":[
    {"id":"historico_familiar_capilar","type":"textarea","label":"Histórico familiar de calvície","required":false},
    {"id":"tratamentos_anteriores_capilar","type":"textarea","label":"Tratamentos capilares anteriores","required":false},
    {"id":"medicamentos_capilar","type":"textarea","label":"Medicamentos em uso","required":false},
    {"id":"doencas_tireoide","type":"select","label":"Doenças da tireoide","options":["Não","Hipotireoidismo","Hipertireoidismo","Em investigação"],"required":false},
    {"id":"anemia_capilar","type":"select","label":"Anemia / Ferritina baixa","options":["Não","Sim","Em investigação"],"required":false},
    {"id":"hormonal_capilar","type":"textarea","label":"Alterações hormonais (menopausa, pós-parto, etc.)","required":false},
    {"id":"quimica_capilar","type":"textarea","label":"Química no cabelo (tintura, alisamento, etc.)","required":false}
  ]},
  {"id":"sec_plano_capilar","type":"section","title":"Conduta","fields":[
    {"id":"diagnostico_capilar","type":"textarea","label":"Diagnóstico capilar","required":false},
    {"id":"protocolo_capilar","type":"textarea","label":"Protocolo sugerido","required":false},
    {"id":"observacoes_capilar","type":"textarea","label":"Observações","required":false}
  ]}
]'::jsonb
WHERE id = '332fc8c2-a611-4c91-b3aa-dface1710821';

UPDATE public.anamnesis_templates
SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '332fc8c2-a611-4c91-b3aa-dface1710821'),
    is_active = true
WHERE id = '0b30c2f1-2beb-4cd3-ae5e-71d78f9ba236';

-- 4. Anamnese Corporal - YesClin (430eac8a)
UPDATE public.anamnesis_template_versions
SET structure = '[
  {"id":"sec_dados_corporal_yc","type":"section","title":"Dados da Consulta","fields":[
    {"id":"data_avaliacao_corporal_yc","type":"date","label":"Data da avaliação","required":true},
    {"id":"queixa_principal_corporal_yc","type":"textarea","label":"Queixa principal","required":true},
    {"id":"objetivo_corporal_yc","type":"textarea","label":"Objetivo corporal principal","required":true}
  ]},
  {"id":"sec_avaliacao_corporal_yc","type":"section","title":"Avaliação Corporal","fields":[
    {"id":"gordura_localizada_yc","type":"select","label":"Gordura localizada","options":["Ausente","Leve","Moderada","Intensa"],"required":false},
    {"id":"flacidez_corporal_yc","type":"select","label":"Flacidez","options":["Ausente","Leve","Moderada","Acentuada"],"required":false},
    {"id":"celulite_yc","type":"select","label":"Celulite","options":["Ausente","Grau I","Grau II","Grau III","Grau IV"],"required":false},
    {"id":"estrias_yc","type":"select","label":"Estrias","options":["Ausentes","Recentes (rosadas)","Antigas (brancas)","Mistas"],"required":false},
    {"id":"fibro_edema_yc","type":"select","label":"Fibro Edema Gelóide","options":["Ausente","Brando","Moderado","Grave"],"required":false},
    {"id":"edema_retencao_yc","type":"select","label":"Edema / Retenção hídrica","options":["Ausente","Leve","Moderado","Intenso"],"required":false}
  ]},
  {"id":"sec_medidas_corporal_yc","type":"section","title":"Medidas Corporais","fields":[
    {"id":"peso_yc","type":"number","label":"Peso (kg)","required":false},
    {"id":"altura_yc","type":"number","label":"Altura (cm)","required":false},
    {"id":"cintura_yc","type":"number","label":"Cintura (cm)","required":false},
    {"id":"quadril_yc","type":"number","label":"Quadril (cm)","required":false},
    {"id":"abdome_yc","type":"number","label":"Abdome (cm)","required":false},
    {"id":"coxa_dir_yc","type":"number","label":"Coxa direita (cm)","required":false},
    {"id":"coxa_esq_yc","type":"number","label":"Coxa esquerda (cm)","required":false},
    {"id":"braco_dir_yc","type":"number","label":"Braço direito (cm)","required":false},
    {"id":"braco_esq_yc","type":"number","label":"Braço esquerdo (cm)","required":false}
  ]},
  {"id":"sec_fotos_corporal_yc","type":"section","title":"Registro Fotográfico","fields":[
    {"id":"foto_frontal_corporal_yc","type":"image_upload","label":"Foto frontal","required":false},
    {"id":"foto_lateral_dir_corporal_yc","type":"image_upload","label":"Foto lateral direita","required":false},
    {"id":"foto_lateral_esq_corporal_yc","type":"image_upload","label":"Foto lateral esquerda","required":false},
    {"id":"foto_posterior_corporal_yc","type":"image_upload","label":"Foto posterior","required":false}
  ]},
  {"id":"sec_saude_corporal_yc","type":"section","title":"Saúde e Histórico","fields":[
    {"id":"atividade_fisica_yc","type":"select","label":"Atividade física","options":["Sedentário","1-2x/semana","3-4x/semana","5+x/semana"],"required":false},
    {"id":"alimentacao_yc","type":"select","label":"Alimentação","options":["Equilibrada","Rica em carboidratos","Rica em gorduras","Restritiva","Vegetariana/Vegana"],"required":false},
    {"id":"hidratacao_diaria_yc","type":"select","label":"Ingestão de água","options":["< 1L/dia","1-2L/dia","> 2L/dia"],"required":false},
    {"id":"procedimentos_anteriores_corporal_yc","type":"textarea","label":"Procedimentos corporais anteriores","required":false},
    {"id":"cirurgias_corporal_yc","type":"textarea","label":"Cirurgias (lipo, abdominoplastia, etc.)","required":false},
    {"id":"medicamentos_corporal_yc","type":"textarea","label":"Medicamentos em uso","required":false}
  ]},
  {"id":"sec_plano_corporal_yc","type":"section","title":"Conduta","fields":[
    {"id":"diagnostico_corporal_yc","type":"textarea","label":"Diagnóstico estético corporal","required":false},
    {"id":"protocolo_corporal_yc","type":"textarea","label":"Protocolo sugerido","required":false},
    {"id":"observacoes_corporal_yc","type":"textarea","label":"Observações","required":false}
  ]}
]'::jsonb
WHERE id = '7c9214c7-d02d-4a7e-84be-2bf11fdbe811';

UPDATE public.anamnesis_templates
SET campos = (SELECT structure FROM anamnesis_template_versions WHERE id = '7c9214c7-d02d-4a7e-84be-2bf11fdbe811'),
    is_active = true
WHERE id = '430eac8a-a8ad-4480-8c6f-79201651c447';
