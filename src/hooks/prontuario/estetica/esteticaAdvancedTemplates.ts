/**
 * Template structure definitions for the 4 advanced aesthetics anamnesis templates.
 * These structures are inserted into anamnesis_template_versions as JSON.
 */

import type { DynamicField } from '@/components/prontuario/aesthetics/anamnese-fields/types';

// ========== TEMPLATE 1: Anamnese Estética Facial ==========
export const TEMPLATE_ESTETICA_FACIAL: DynamicField[] = [
  { id: 'queixa_principal', type: 'rich_text', label: 'Queixa Principal', section: 'Queixa Principal', required: true },
  { id: 'historico_familiar', type: 'rich_text', label: 'Histórico Familiar', section: 'Histórico Familiar' },
  { id: 'tratamentos_anteriores', type: 'rich_text', label: 'Tratamentos Anteriores', section: 'Tratamentos Anteriores' },
  { id: 'alergias', type: 'rich_text', label: 'Alergias', section: 'Alergias' },
  {
    id: 'fitzpatrick', type: 'visual_card_grid', label: 'Escala de Fitzpatrick', section: 'Escala de Fitzpatrick',
    config: {
      columns: 6, selection: 'single',
      options: [
        { id: 'tipo_1', label: 'Tipo I', description: 'Pele muito clara, sempre queima, nunca bronzeia', image_placeholder_key: 'estetica/fitzpatrick/tipo_1', image_url: null, display_order: 1 },
        { id: 'tipo_2', label: 'Tipo II', description: 'Pele clara, queima facilmente, bronzeia pouco', image_placeholder_key: 'estetica/fitzpatrick/tipo_2', image_url: null, display_order: 2 },
        { id: 'tipo_3', label: 'Tipo III', description: 'Pele morena clara, queima moderadamente', image_placeholder_key: 'estetica/fitzpatrick/tipo_3', image_url: null, display_order: 3 },
        { id: 'tipo_4', label: 'Tipo IV', description: 'Pele morena moderada, queima pouco', image_placeholder_key: 'estetica/fitzpatrick/tipo_4', image_url: null, display_order: 4 },
        { id: 'tipo_5', label: 'Tipo V', description: 'Pele morena escura, raramente queima', image_placeholder_key: 'estetica/fitzpatrick/tipo_5', image_url: null, display_order: 5 },
        { id: 'tipo_6', label: 'Tipo VI', description: 'Pele negra, nunca queima', image_placeholder_key: 'estetica/fitzpatrick/tipo_6', image_url: null, display_order: 6 },
      ],
    },
  },
  {
    id: 'baumann', type: 'select_row', label: 'Tipo de Pele segundo Baumann', section: 'Classificação de Baumann',
    config: {
      selects: [
        { id: 'oleosidade', label: 'Oleosidade', options: ['Oleosa (O)', 'Seca (D)'] },
        { id: 'sensibilidade', label: 'Sensibilidade', options: ['Sensível (S)', 'Resistente (R)'] },
        { id: 'pigmentacao', label: 'Pigmentação', options: ['Pigmentada (P)', 'Não-pigmentada (N)'] },
      ],
    },
  },
  {
    id: 'grau_acne', type: 'clinical_table_choice', label: 'Grau da Acne', section: 'Grau da Acne',
    config: {
      rows: [
        { id: 'grau_1', label: 'Grau I', description: 'Não-inflamatória', extra: 'Comedogênica' },
        { id: 'grau_2', label: 'Grau II', description: 'Inflamatória', extra: 'Pápulo-pustulosa' },
        { id: 'grau_3', label: 'Grau III', description: 'Inflamatória', extra: 'Nódulo-cística' },
        { id: 'grau_4', label: 'Grau IV', description: 'Inflamatória', extra: 'Conglobata' },
        { id: 'grau_5', label: 'Grau V', description: 'Inflamatória', extra: 'Fulminans' },
      ],
    },
  },
  {
    id: 'discromia_facial', type: 'visual_card_grid', label: 'Discromia Facial', section: 'Discromia Facial',
    config: {
      columns: 3, selection: 'single',
      options: [
        { id: 'loc_1', label: 'Localização 1', image_placeholder_key: 'estetica/discromia/loc_1', image_url: null, display_order: 1 },
        { id: 'loc_2', label: 'Localização 2', image_placeholder_key: 'estetica/discromia/loc_2', image_url: null, display_order: 2 },
        { id: 'loc_3', label: 'Localização 3', image_placeholder_key: 'estetica/discromia/loc_3', image_url: null, display_order: 3 },
      ],
    },
  },
  {
    id: 'hiperpigmentacao_periocular', type: 'visual_card_grid', label: 'Tipo de Hiperpigmentação Periocular', section: 'Hiperpigmentação Periocular',
    config: {
      columns: 6, selection: 'single',
      options: [
        { id: 'tipo_1', label: 'Tipo 1', image_placeholder_key: 'estetica/periocular/tipo_1', image_url: null, display_order: 1 },
        { id: 'tipo_2', label: 'Tipo 2', image_placeholder_key: 'estetica/periocular/tipo_2', image_url: null, display_order: 2 },
        { id: 'tipo_3', label: 'Tipo 3', image_placeholder_key: 'estetica/periocular/tipo_3', image_url: null, display_order: 3 },
        { id: 'tipo_4', label: 'Tipo 4', image_placeholder_key: 'estetica/periocular/tipo_4', image_url: null, display_order: 4 },
        { id: 'tipo_5', label: 'Tipo 5', image_placeholder_key: 'estetica/periocular/tipo_5', image_url: null, display_order: 5 },
        { id: 'tipo_6', label: 'Tipo 6', image_placeholder_key: 'estetica/periocular/tipo_6', image_url: null, display_order: 6 },
      ],
    },
  },
  { id: 'observacoes', type: 'textarea', label: 'Observações', section: 'Observações' },
  { id: 'plano_tratamento', type: 'rich_text', label: 'Plano de Tratamento', section: 'Plano de Tratamento' },
];

// ========== TEMPLATE 2: Anamnese Pele e Avaliação Facial ==========
export const TEMPLATE_PELE_AVALIACAO: DynamicField[] = [
  {
    id: 'fitzpatrick', type: 'visual_card_grid', label: 'Escala de Fitzpatrick', section: 'Escala de Fitzpatrick',
    config: {
      columns: 6, selection: 'single',
      options: [
        { id: 'tipo_1', label: 'Tipo I', description: 'Pele muito clara', image_placeholder_key: 'estetica/fitzpatrick/tipo_1', image_url: null, display_order: 1 },
        { id: 'tipo_2', label: 'Tipo II', description: 'Pele clara', image_placeholder_key: 'estetica/fitzpatrick/tipo_2', image_url: null, display_order: 2 },
        { id: 'tipo_3', label: 'Tipo III', description: 'Morena clara', image_placeholder_key: 'estetica/fitzpatrick/tipo_3', image_url: null, display_order: 3 },
        { id: 'tipo_4', label: 'Tipo IV', description: 'Morena moderada', image_placeholder_key: 'estetica/fitzpatrick/tipo_4', image_url: null, display_order: 4 },
        { id: 'tipo_5', label: 'Tipo V', description: 'Morena escura', image_placeholder_key: 'estetica/fitzpatrick/tipo_5', image_url: null, display_order: 5 },
        { id: 'tipo_6', label: 'Tipo VI', description: 'Pele negra', image_placeholder_key: 'estetica/fitzpatrick/tipo_6', image_url: null, display_order: 6 },
      ],
    },
  },
  {
    id: 'baumann', type: 'select_row', label: 'Tipo de Pele de Baumann', section: 'Classificação de Baumann',
    config: {
      selects: [
        { id: 'oleosidade', label: 'Oleosidade', options: ['Oleosa (O)', 'Seca (D)'] },
        { id: 'sensibilidade', label: 'Sensibilidade', options: ['Sensível (S)', 'Resistente (R)'] },
        { id: 'pigmentacao', label: 'Pigmentação', options: ['Pigmentada (P)', 'Não-pigmentada (N)'] },
      ],
    },
  },
  {
    id: 'grau_acne', type: 'clinical_table_choice', label: 'Grau da Acne', section: 'Acne',
    config: {
      rows: [
        { id: 'grau_1', label: 'Grau I', description: 'Não-inflamatória', extra: 'Comedogênica' },
        { id: 'grau_2', label: 'Grau II', description: 'Inflamatória', extra: 'Pápulo-pustulosa' },
        { id: 'grau_3', label: 'Grau III', description: 'Inflamatória', extra: 'Nódulo-cística' },
        { id: 'grau_4', label: 'Grau IV', description: 'Inflamatória', extra: 'Conglobata' },
        { id: 'grau_5', label: 'Grau V', description: 'Inflamatória', extra: 'Fulminans' },
      ],
    },
  },
  { id: 'localizacao_acne', type: 'text', label: 'Localização Anatômica da Acne', section: 'Acne', placeholder: 'Ex: Face, região frontal, dorso...' },
  {
    id: 'cicatrizes_acne', type: 'visual_card_grid', label: 'Cicatrizes de Acne', section: 'Cicatrizes de Acne',
    config: {
      columns: 4, selection: 'multiple',
      options: [
        { id: 'icepick', label: 'Icepick', description: 'Pontuais e profundas', image_placeholder_key: 'estetica/cicatrizes/icepick', image_url: null, display_order: 1 },
        { id: 'boxcar', label: 'Boxcar', description: 'Bordas definidas', image_placeholder_key: 'estetica/cicatrizes/boxcar', image_url: null, display_order: 2 },
        { id: 'rolling', label: 'Rolling', description: 'Onduladas', image_placeholder_key: 'estetica/cicatrizes/rolling', image_url: null, display_order: 3 },
        { id: 'hipertrofica', label: 'Hipertrófica', description: 'Elevadas', image_placeholder_key: 'estetica/cicatrizes/hipertrofica', image_url: null, display_order: 4 },
      ],
    },
  },
  { id: 'localizacao_cicatrizes', type: 'text', label: 'Localização Anatômica das Cicatrizes', section: 'Cicatrizes de Acne', placeholder: 'Ex: Bochechas, têmporas...' },
  {
    id: 'rosacea', type: 'visual_card_grid', label: 'Subtipos de Rosácea', section: 'Rosácea',
    config: {
      columns: 4, selection: 'single',
      options: [
        { id: 'subtipo_1', label: 'Subtipo 1', description: 'Eritematotelangiectásica', image_placeholder_key: 'estetica/rosacea/subtipo_1', image_url: null, display_order: 1 },
        { id: 'subtipo_2', label: 'Subtipo 2', description: 'Papulopustulosa', image_placeholder_key: 'estetica/rosacea/subtipo_2', image_url: null, display_order: 2 },
        { id: 'subtipo_3', label: 'Subtipo 3', description: 'Fimatosa', image_placeholder_key: 'estetica/rosacea/subtipo_3', image_url: null, display_order: 3 },
        { id: 'subtipo_4', label: 'Subtipo 4', description: 'Ocular', image_placeholder_key: 'estetica/rosacea/subtipo_4', image_url: null, display_order: 4 },
      ],
    },
  },
  {
    id: 'discromia_facial', type: 'visual_card_grid', label: 'Discromia Facial', section: 'Discromia Facial',
    config: {
      columns: 3, selection: 'single',
      options: [
        { id: 'loc_1', label: 'Localização 1', image_placeholder_key: 'estetica/discromia/loc_1', image_url: null, display_order: 1 },
        { id: 'loc_2', label: 'Localização 2', image_placeholder_key: 'estetica/discromia/loc_2', image_url: null, display_order: 2 },
        { id: 'loc_3', label: 'Localização 3', image_placeholder_key: 'estetica/discromia/loc_3', image_url: null, display_order: 3 },
      ],
    },
  },
  { id: 'tipo_discromia', type: 'text', label: 'Tipo de Discromia', section: 'Discromia Facial', placeholder: 'Ex: Melasma, lentigo solar...' },
  {
    id: 'hiperpigmentacao_periocular', type: 'visual_card_grid', label: 'Tipo de Hiperpigmentação Periocular', section: 'Hiperpigmentação Periocular',
    config: {
      columns: 6, selection: 'single',
      options: [
        { id: 'tipo_1', label: 'Tipo 1', image_placeholder_key: 'estetica/periocular/tipo_1', image_url: null, display_order: 1 },
        { id: 'tipo_2', label: 'Tipo 2', image_placeholder_key: 'estetica/periocular/tipo_2', image_url: null, display_order: 2 },
        { id: 'tipo_3', label: 'Tipo 3', image_placeholder_key: 'estetica/periocular/tipo_3', image_url: null, display_order: 3 },
        { id: 'tipo_4', label: 'Tipo 4', image_placeholder_key: 'estetica/periocular/tipo_4', image_url: null, display_order: 4 },
        { id: 'tipo_5', label: 'Tipo 5', image_placeholder_key: 'estetica/periocular/tipo_5', image_url: null, display_order: 5 },
        { id: 'tipo_6', label: 'Tipo 6', image_placeholder_key: 'estetica/periocular/tipo_6', image_url: null, display_order: 6 },
      ],
    },
  },
  {
    id: 'glogau', type: 'clinical_table_choice', label: 'Escala de Glogau', section: 'Escala de Glogau',
    config: {
      rows: [
        { id: 'tipo_1', label: 'Tipo I', description: 'Entre 20 e 30 anos', extra: 'Sem rugas' },
        { id: 'tipo_2', label: 'Tipo II', description: 'Entre 30 e 40 anos', extra: 'Rugas em movimento' },
        { id: 'tipo_3', label: 'Tipo III', description: 'Entre 40 e 60 anos', extra: 'Rugas em repouso' },
        { id: 'tipo_4', label: 'Tipo IV', description: 'Acima de 60 anos', extra: 'Somente rugas' },
      ],
    },
  },
  { id: 'observacoes', type: 'textarea', label: 'Observações', section: 'Observações' },
];

// ========== TEMPLATE 3: Anamnese Capilar ==========
export const TEMPLATE_CAPILAR: DynamicField[] = [
  {
    id: 'tipo_cabelo', type: 'visual_card_grid', label: 'Tipo de Cabelo', section: 'Tipo de Cabelo',
    config: {
      columns: 3, selection: 'single',
      options: [
        { id: 'liso', label: 'Liso', description: 'Fios alinhados sem ondulação, com cutículas fechadas que refletem mais luz, conferindo brilho natural', image_placeholder_key: 'estetica/capilar/liso', image_url: null, display_order: 1 },
        { id: 'ondulado', label: 'Ondulado', description: 'Fios com curvatura em forma de "S", variando de leve a pronunciada, com tendência ao frizz', image_placeholder_key: 'estetica/capilar/ondulado', image_url: null, display_order: 2 },
        { id: 'crespo', label: 'Crespo', description: 'Comuns na etnia negra, possuem formato elíptico e achatado helicoidal, o que lhe confere aspecto encaracolado', image_placeholder_key: 'estetica/capilar/crespo', image_url: null, display_order: 3 },
      ],
    },
  },
  { id: 'frequencia_lavagem', type: 'radio', label: 'Frequência de Lavagem', section: 'Características Capilares', options: ['Diário', 'A cada dois dias', 'A cada três dias', 'Raramente', 'Outro'] },
  { id: 'diametro_fio', type: 'radio', label: 'Diâmetro do Fio', section: 'Características Capilares', options: ['Fino', 'Médio', 'Grosso'] },
  { id: 'oleosidade_fio', type: 'radio', label: 'Grau de Oleosidade do Fio', section: 'Características Capilares', options: ['Oleoso', 'Seco', 'Misto'] },
  { id: 'oleosidade_couro', type: 'radio', label: 'Grau de Oleosidade do Couro Cabeludo', section: 'Características Capilares', options: ['Oleoso', 'Seco', 'Descamativo'] },
  { id: 'elasticidade', type: 'radio', label: 'Elasticidade do Fio', section: 'Características Capilares', options: ['Ausente', 'Normal', 'Pouca', 'Boa'] },
  { id: 'porosidade', type: 'radio', label: 'Porosidade do Fio', section: 'Características Capilares', options: ['Baixa', 'Normal', 'Alta porosidade'] },
  { id: 'comprimento', type: 'radio', label: 'Comprimento do Cabelo', section: 'Características Capilares', options: ['Extremamente curto', 'Curto', 'Médio', 'Longo', 'Extremamente longo'] },
  { id: 'cor_natural', type: 'text', label: 'Cor Natural', section: 'Cor e Tratamentos', placeholder: 'Ex: Castanho escuro' },
  { id: 'cor_cosmetica', type: 'text', label: 'Cor Cosmética', section: 'Cor e Tratamentos', placeholder: 'Ex: Loiro platinado' },
  { id: 'uso_cosmeticos', type: 'text', label: 'Uso de Cosméticos', section: 'Cor e Tratamentos', placeholder: 'Listar produtos utilizados...' },
  { id: 'uso_quimica', type: 'text', label: 'Uso de Química', section: 'Cor e Tratamentos', placeholder: 'Ex: Progressiva, relaxamento...' },
  { id: 'perda_diaria', type: 'text', label: 'Perda Diária de Fios', section: 'Cor e Tratamentos', placeholder: 'Quantidade estimada...' },
  {
    id: 'displasias_congenitas', type: 'visual_card_grid', label: 'Displasias Pilosas Congênitas', section: 'Displasias Pilosas Congênitas',
    config: {
      columns: 5, selection: 'multiple',
      options: [
        { id: 'moniletrix', label: 'Moniletrix', description: 'Haste capilar com estreitamentos periódicos em forma de contas, causando fragilidade e quebra', image_placeholder_key: 'estetica/capilar/moniletrix', image_url: null, display_order: 1 },
        { id: 'tricorrexe_invaginata', label: 'Tricorrexe Invaginata', description: 'Cabelo em bambu — a parte distal da haste invagina sobre a proximal, formando nós tipo encaixe', image_placeholder_key: 'estetica/capilar/tricorrexe_invaginata', image_url: null, display_order: 2 },
        { id: 'tricoclasia', label: 'Tricopoliodistrofia', description: 'Cabelos quebradiços, curtos e irregulares com alternância de faixas claras e escuras (cabelos em tigre)', image_placeholder_key: 'estetica/capilar/tricoclasia', image_url: null, display_order: 3 },
        { id: 'anageno_frouxo', label: 'Cabelos Anágenos Frouxos', description: 'Fios facilmente arrancados sem dor, com raiz em fase anágena mal ancorada ao folículo', image_placeholder_key: 'estetica/capilar/anageno_frouxo', image_url: null, display_order: 4 },
        { id: 'sindrome_cabelos', label: 'Síndrome dos Cabelos Impenteáveis', description: 'Fios secos, brilhantes e arrepiados que resistem ao penteamento, com secção transversal triangular', image_placeholder_key: 'estetica/capilar/sindrome_cabelos', image_url: null, display_order: 5 },
      ],
    },
  },
  {
    id: 'displasias_adquiridas', type: 'visual_card_grid', label: 'Displasias Pilosas Adquiridas', section: 'Displasias Pilosas Adquiridas',
    config: {
      columns: 4, selection: 'multiple',
      options: [
        { id: 'tricorrexe_nodosa', label: 'Tricorrexe Nodosa', description: 'Nódulos esbranquiçados ao longo da haste onde as fibras se desfiavam como uma escova, principal causa de quebra capilar', image_placeholder_key: 'estetica/capilar/tricorrexe_nodosa', image_url: null, display_order: 1 },
        { id: 'tricoptilose', label: 'Tricoptilose', description: 'Divisão longitudinal da extremidade distal do fio (pontas duplas), causada por dano químico ou mecânico', image_placeholder_key: 'estetica/capilar/tricoptilose', image_url: null, display_order: 2 },
        { id: 'triconodose', label: 'Triconodose', description: 'Formação de nós verdadeiros ao longo da haste capilar, mais comum em cabelos crespos e encaracolados', image_placeholder_key: 'estetica/capilar/triconodose', image_url: null, display_order: 3 },
        { id: 'haste_partida', label: 'Haste Partida', description: 'Fratura transversal abrupta da haste capilar, geralmente associada a trauma mecânico ou químico intenso', image_placeholder_key: 'estetica/capilar/haste_partida', image_url: null, display_order: 4 },
      ],
    },
  },
  {
    id: 'escala_savin', type: 'visual_card_grid', label: 'Escala de Savin', section: 'Escala de Savin',
    config: {
      columns: 3, selection: 'single',
      options: [
        { id: 'i1', label: 'I-1', image_placeholder_key: 'estetica/capilar/savin_i1', image_url: null, display_order: 1 },
        { id: 'i2', label: 'I-2', image_placeholder_key: 'estetica/capilar/savin_i2', image_url: null, display_order: 2 },
        { id: 'i3', label: 'I-3', image_placeholder_key: 'estetica/capilar/savin_i3', image_url: null, display_order: 3 },
        { id: 'i4', label: 'I-4', image_placeholder_key: 'estetica/capilar/savin_i4', image_url: null, display_order: 4 },
        { id: 'ii1', label: 'II-1', image_placeholder_key: 'estetica/capilar/savin_ii1', image_url: null, display_order: 5 },
        { id: 'ii2', label: 'II-2', image_placeholder_key: 'estetica/capilar/savin_ii2', image_url: null, display_order: 6 },
        { id: 'iii', label: 'III', image_placeholder_key: 'estetica/capilar/savin_iii', image_url: null, display_order: 7 },
        { id: 'avancada', label: 'Avançada', image_placeholder_key: 'estetica/capilar/savin_avancada', image_url: null, display_order: 8 },
        { id: 'frontal', label: 'Frontal', image_placeholder_key: 'estetica/capilar/savin_frontal', image_url: null, display_order: 9 },
      ],
    },
  },
  {
    id: 'escala_norwood', type: 'visual_card_grid', label: 'Escala de Norwood-Hamilton', section: 'Escala de Norwood-Hamilton',
    config: {
      columns: 4, selection: 'single',
      options: [
        { id: 'tipo_i', label: 'Tipo I', image_placeholder_key: 'estetica/capilar/norwood_i', image_url: null, display_order: 1 },
        { id: 'tipo_ii', label: 'Tipo II', image_placeholder_key: 'estetica/capilar/norwood_ii', image_url: null, display_order: 2 },
        { id: 'tipo_iii', label: 'Tipo III', image_placeholder_key: 'estetica/capilar/norwood_iii', image_url: null, display_order: 3 },
        { id: 'tipo_iii_vertex', label: 'Tipo III Vertex', image_placeholder_key: 'estetica/capilar/norwood_iii_vertex', image_url: null, display_order: 4 },
        { id: 'tipo_iii_a', label: 'Tipo III A', image_placeholder_key: 'estetica/capilar/norwood_iii_a', image_url: null, display_order: 5 },
        { id: 'tipo_iv', label: 'Tipo IV', image_placeholder_key: 'estetica/capilar/norwood_iv', image_url: null, display_order: 6 },
        { id: 'tipo_iv_a', label: 'Tipo IV A', image_placeholder_key: 'estetica/capilar/norwood_iv_a', image_url: null, display_order: 7 },
        { id: 'tipo_v', label: 'Tipo V', image_placeholder_key: 'estetica/capilar/norwood_v', image_url: null, display_order: 8 },
        { id: 'tipo_v_a', label: 'Tipo V A', image_placeholder_key: 'estetica/capilar/norwood_v_a', image_url: null, display_order: 9 },
        { id: 'tipo_vi', label: 'Tipo VI', image_placeholder_key: 'estetica/capilar/norwood_vi', image_url: null, display_order: 10 },
        { id: 'tipo_vii', label: 'Tipo VII', image_placeholder_key: 'estetica/capilar/norwood_vii', image_url: null, display_order: 11 },
        { id: 'tipo_viii', label: 'Tipo VIII', image_placeholder_key: 'estetica/capilar/norwood_viii', image_url: null, display_order: 12 },
      ],
    },
  },
  {
    id: 'alopecias_areatas', type: 'visual_card_grid', label: 'Alopecias Areatas', section: 'Alopecias Areatas',
    config: {
      columns: 3, selection: 'single',
      options: [
        { id: 'unifocal', label: 'Unifocal', image_placeholder_key: 'estetica/capilar/alopecia_unifocal', image_url: null, display_order: 1 },
        { id: 'total', label: 'Total', image_placeholder_key: 'estetica/capilar/alopecia_total', image_url: null, display_order: 2 },
        { id: 'multilocular', label: 'Multilocular', image_placeholder_key: 'estetica/capilar/alopecia_multilocular', image_url: null, display_order: 3 },
        { id: 'difusa', label: 'Difusa', image_placeholder_key: 'estetica/capilar/alopecia_difusa', image_url: null, display_order: 4 },
        { id: 'ofiasica', label: 'Ofiásica', image_placeholder_key: 'estetica/capilar/alopecia_ofiasica', image_url: null, display_order: 5 },
        { id: 'universal', label: 'Universal', image_placeholder_key: 'estetica/capilar/alopecia_universal', image_url: null, display_order: 6 },
      ],
    },
  },
  {
    id: 'classificacao_etiologica', type: 'clinical_table_choice', label: 'Classificação etiológica de alopecias', section: 'Classificação Etiológica',
    config: {
      rows: [
        { id: 'congenitas', label: 'Congênitas', description: 'Alopecias presentes desde o nascimento ou manifestadas na infância, geralmente de origem genética (ex: aplasia cutis, displasias ectodérmicas)' },
        { id: 'infecciosas', label: 'Infecciosas', description: 'Alopecias causadas por agentes infecciosos como fungos (tinea capitis), bactérias ou vírus que afetam o folículo piloso' },
        { id: 'neoplasias', label: 'Neoplasias', description: 'Perda capilar associada a tumores benignos ou malignos do couro cabeludo, ou como efeito colateral do tratamento oncológico' },
        { id: 'agentes_fisicos', label: 'Agentes físicos', description: 'Alopecias causadas por trauma mecânico (tração, tricotilomania), queimaduras, radiação ou pressão prolongada' },
        { id: 'dermatoses_origens_incertas', label: 'Dermatoses de origens incertas e síndromes', description: 'Condições dermatológicas de etiologia multifatorial ou desconhecida que cursam com alopecia (ex: líquen plano pilar, lúpus discoide, alopecia frontal fibrosante)' },
      ],
    },
  },
  { id: 'tricoscopia', type: 'image_upload', label: 'Tricoscopia', section: 'Tricoscopia', placeholder: 'Upload de imagem de tricoscopia' },
  { id: 'utiliza_bone', type: 'radio', label: 'Utiliza Boné?', section: 'Hábitos', options: ['Sim', 'Não', 'Outro'] },
  { id: 'cabelo_preso', type: 'radio', label: 'Utiliza o Cabelo Preso?', section: 'Hábitos', options: ['Sim', 'Não', 'Outro'] },
  { id: 'utiliza_secador', type: 'radio', label: 'Utiliza Secador?', section: 'Hábitos', options: ['Sim', 'Não', 'Outro'] },
  { id: 'utiliza_chapinha', type: 'radio', label: 'Utiliza Chapinha?', section: 'Hábitos', options: ['Sim', 'Não', 'Outro'] },
  { id: 'observacoes', type: 'rich_text', label: 'Observações', section: 'Observações' },
];

// ========== TEMPLATE 4: Anamnese Corporal ==========
export const TEMPLATE_CORPORAL: DynamicField[] = [
  {
    id: 'distribuicao_gordura', type: 'visual_card_grid', label: 'Distribuição de Gordura Corporal', section: 'Distribuição de Gordura',
    config: {
      columns: 2, selection: 'single',
      options: [
        { id: 'androide', label: 'Androide', description: 'Concentração abdominal', image_placeholder_key: 'estetica/corporal/androide', image_url: null, display_order: 1 },
        { id: 'ginoide', label: 'Ginoide', description: 'Concentração quadril/coxas', image_placeholder_key: 'estetica/corporal/ginoide', image_url: null, display_order: 2 },
      ],
    },
  },
  { id: 'imc', type: 'bmi_calculator', label: 'Cálculo de IMC', section: 'IMC e Composição Corporal' },
  {
    id: 'adipometria', type: 'accordion_measurements', label: 'Adipometria', section: 'Adipometria',
    config: {
      placeholder: 'Protocolo de Petroski – Insira 3 medidas por dobra cutânea para cálculo da mediana.',
      sections: [
        { id: 'tricipital', label: 'Tricipital', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'subescapular', label: 'Subescapular', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'bicipital', label: 'Bicipital', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'axilar', label: 'Axilar', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'iliaca', label: 'Ilíaca', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'supraespinhal', label: 'Supraespinhal', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'abdominal', label: 'Abdominal', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'coxa', label: 'Coxa', fields: ['medida_1', 'medida_2', 'medida_3'] },
        { id: 'panturrilha', label: 'Panturrilha', fields: ['medida_1', 'medida_2', 'medida_3'] },
      ],
    },
  },
  {
    id: 'perimetria', type: 'accordion_measurements', label: 'Perimetria', section: 'Perimetria',
    config: {
      sections: [
        { id: 'braco', label: 'Braço', fields: ['medida_1'] },
        { id: 'torax', label: 'Tórax', fields: ['medida_1'] },
        { id: 'quadril', label: 'Quadril', fields: ['medida_1'] },
        { id: 'panturrilha_p', label: 'Panturrilha', fields: ['medida_1'] },
        { id: 'femur', label: 'Fêmur', fields: ['medida_1'] },
        { id: 'braco_contraido', label: 'Braço Contraído', fields: ['medida_1'] },
        { id: 'cintura', label: 'Cintura', fields: ['medida_1'] },
        { id: 'coxa_mediana', label: 'Coxa Mediana', fields: ['medida_1'] },
        { id: 'umero', label: 'Úmero', fields: ['medida_1'] },
      ],
    },
  },
  {
    id: 'celulite', type: 'visual_card_grid', label: 'Grau de Celulite', section: 'Celulite',
    config: {
      columns: 4, selection: 'single',
      options: [
        { id: 'grau_1', label: 'Grau 01', description: 'Visível apenas com compressão', image_placeholder_key: 'estetica/corporal/celulite_1', image_url: null, display_order: 1 },
        { id: 'grau_2', label: 'Grau 02', description: 'Visível em pé', image_placeholder_key: 'estetica/corporal/celulite_2', image_url: null, display_order: 2 },
        { id: 'grau_3', label: 'Grau 03', description: 'Visível sempre', image_placeholder_key: 'estetica/corporal/celulite_3', image_url: null, display_order: 3 },
        { id: 'grau_4', label: 'Grau 04', description: 'Nodular dolorosa', image_placeholder_key: 'estetica/corporal/celulite_4', image_url: null, display_order: 4 },
      ],
    },
  },
  {
    id: 'estrias', type: 'visual_card_grid', label: 'Estrias', section: 'Estrias',
    config: {
      columns: 2, selection: 'single',
      options: [
        { id: 'rubra', label: 'Rubra', description: 'Recentes, avermelhadas', image_placeholder_key: 'estetica/corporal/estria_rubra', image_url: null, display_order: 1 },
        { id: 'alba', label: 'Alba', description: 'Antigas, esbranquiçadas', image_placeholder_key: 'estetica/corporal/estria_alba', image_url: null, display_order: 2 },
      ],
    },
  },
  { id: 'observacoes_corpo', type: 'textarea', label: 'Observações', section: 'Observações Corporais' },
  {
    id: 'teste_diastase', type: 'visual_card_grid', label: 'Teste de Diástase de Reto Abdominal', section: 'Diástase',
    config: {
      columns: 2, selection: 'single',
      options: [
        { id: 'negativo', label: 'Negativo', description: 'Sem separação significativa', image_placeholder_key: 'estetica/corporal/diastase_negativo', image_url: null, display_order: 1 },
        { id: 'positivo', label: 'Positivo', description: 'Separação presente', image_placeholder_key: 'estetica/corporal/diastase_positivo', image_url: null, display_order: 2 },
      ],
    },
  },
  {
    id: 'tipo_diastase', type: 'visual_card_grid', label: 'Tipo de Diástase de Reto Abdominal', section: 'Diástase',
    config: {
      columns: 4, selection: 'single',
      options: [
        { id: 'tipo_a', label: 'Tipo A', image_placeholder_key: 'estetica/corporal/diastase_a', image_url: null, display_order: 1 },
        { id: 'tipo_b', label: 'Tipo B', image_placeholder_key: 'estetica/corporal/diastase_b', image_url: null, display_order: 2 },
        { id: 'tipo_c', label: 'Tipo C', image_placeholder_key: 'estetica/corporal/diastase_c', image_url: null, display_order: 3 },
        { id: 'tipo_d', label: 'Tipo D', image_placeholder_key: 'estetica/corporal/diastase_d', image_url: null, display_order: 4 },
      ],
    },
  },
  { id: 'observacoes_diastase', type: 'textarea', label: 'Observações da Diástase', section: 'Diástase' },
  {
    id: 'aparencia_percebida', type: 'body_type_selector', label: 'Aparência Percebida', section: 'Aparência',
    config: {
      selection: 'single',
      options: Array.from({ length: 9 }, (_, i) => ({
        id: `fig_${i + 1}`,
        label: `${i + 1}`,
        image_placeholder_key: `estetica/corporal/aparencia_${i + 1}`,
        image_url: null,
        display_order: i + 1,
      })),
    },
  },
  {
    id: 'aparencia_desejada', type: 'body_type_selector', label: 'Aparência Desejada', section: 'Aparência',
    config: {
      selection: 'single',
      options: Array.from({ length: 9 }, (_, i) => ({
        id: `fig_${i + 1}`,
        label: `${i + 1}`,
        image_placeholder_key: `estetica/corporal/aparencia_desejada_${i + 1}`,
        image_url: null,
        display_order: i + 1,
      })),
    },
  },
];

/** Map of template keys to their structure definitions */
export const ADVANCED_TEMPLATE_MAP: Record<string, DynamicField[]> = {
  'anamnese_estetica_facial': TEMPLATE_ESTETICA_FACIAL,
  'anamnese_pele_avaliacao': TEMPLATE_PELE_AVALIACAO,
  'anamnese_capilar': TEMPLATE_CAPILAR,
  'anamnese_corporal_avancada': TEMPLATE_CORPORAL,
};

/** Template metadata for provisioning */
export const ADVANCED_TEMPLATES_META = [
  {
    key: 'anamnese_estetica_facial',
    name: 'Anamnese Estética Facial - YesClin',
    description: 'Avaliação facial com Fitzpatrick, Baumann, acne, discromia e hiperpigmentação periocular',
    icon: 'Sparkles',
  },
  {
    key: 'anamnese_pele_avaliacao',
    name: 'Anamnese Pele e Avaliação Facial - YesClin',
    description: 'Avaliação dermatológica com escalas de cicatrizes, rosácea, discromia e Glogau',
    icon: 'ScanFace',
  },
  {
    key: 'anamnese_capilar',
    name: 'Anamnese Capilar - YesClin',
    description: 'Avaliação capilar com displasias, escalas de Savin e Norwood-Hamilton, tricoscopia',
    icon: 'Scissors',
  },
  {
    key: 'anamnese_corporal_avancada',
    name: 'Anamnese Corporal - YesClin',
    description: 'Avaliação corporal com IMC, adipometria, perimetria, celulite, estrias e diástase',
    icon: 'User',
  },
];
