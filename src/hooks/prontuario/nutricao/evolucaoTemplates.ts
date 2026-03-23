/**
 * NUTRIÇÃO - Templates de Evolução
 * 
 * Define os modelos estruturados para diferentes tipos de evolução nutricional.
 * Cada template possui campos específicos para sua finalidade clínica.
 */

export type TipoEvolucaoNutricao = 
  | 'avaliacao_inicial'
  | 'avaliacao_antropometrica'
  | 'diagnostico_nutricional'
  | 'plano_alimentar'
  | 'evolucao_retorno';

export interface CampoTemplate {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'checkbox_group' | 'tags';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  unit?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface EvolucaoTemplate {
  id: TipoEvolucaoNutricao;
  nome: string;
  descricao: string;
  icon: string;
  campos: CampoTemplate[];
}

// =============================================================================
// TEMPLATE: AVALIAÇÃO NUTRICIONAL INICIAL
// =============================================================================
const avaliacaoInicialTemplate: EvolucaoTemplate = {
  id: 'avaliacao_inicial',
  nome: 'Avaliação Nutricional Inicial',
  descricao: 'Primeira consulta com anamnese completa, histórico alimentar e objetivos',
  icon: 'ClipboardList',
  campos: [
    {
      id: 'motivo_consulta',
      label: 'Motivo da Consulta',
      type: 'textarea',
      placeholder: 'Qual o principal motivo que trouxe o paciente à consulta...',
      required: true,
      rows: 3,
    },
    {
      id: 'objetivos_paciente',
      label: 'Objetivos do Paciente',
      type: 'textarea',
      placeholder: 'Quais são os objetivos e expectativas do paciente...',
      required: true,
      rows: 3,
    },
    {
      id: 'historico_peso',
      label: 'Histórico de Peso',
      type: 'textarea',
      placeholder: 'Histórico de variações de peso, dietas anteriores...',
      rows: 3,
    },
    {
      id: 'rotina_alimentar',
      label: 'Rotina Alimentar Atual',
      type: 'textarea',
      placeholder: 'Descreva a rotina alimentar típica do paciente...',
      required: true,
      rows: 4,
    },
    {
      id: 'restricoes_alimentares',
      label: 'Restrições Alimentares',
      type: 'tags',
      placeholder: 'Alergias, intolerâncias, restrições...',
    },
    {
      id: 'preferencias_aversoes',
      label: 'Preferências e Aversões',
      type: 'textarea',
      placeholder: 'Alimentos que gosta, não gosta, não come...',
      rows: 3,
    },
    {
      id: 'habito_intestinal',
      label: 'Hábito Intestinal',
      type: 'select',
      options: [
        { value: 'regular', label: 'Regular (diário)' },
        { value: 'constipacao_leve', label: 'Constipação leve (2-3x/semana)' },
        { value: 'constipacao_moderada', label: 'Constipação moderada (<2x/semana)' },
        { value: 'diarreia', label: 'Tendência a diarréia' },
        { value: 'alternado', label: 'Alternado' },
      ],
    },
    {
      id: 'ingestao_hidrica',
      label: 'Ingestão Hídrica (L/dia)',
      type: 'number',
      placeholder: 'Ex: 2.0',
      unit: 'L',
      step: 0.1,
      min: 0,
      max: 10,
    },
    {
      id: 'pratica_atividade',
      label: 'Prática de Atividade Física',
      type: 'select',
      options: [
        { value: 'sedentario', label: 'Sedentário' },
        { value: 'leve', label: 'Leve (1-2x/semana)' },
        { value: 'moderado', label: 'Moderado (3-4x/semana)' },
        { value: 'intenso', label: 'Intenso (5+ vezes/semana)' },
        { value: 'atleta', label: 'Atleta profissional' },
      ],
    },
    {
      id: 'detalhes_atividade',
      label: 'Detalhes da Atividade Física',
      type: 'textarea',
      placeholder: 'Tipo de exercício, frequência, duração...',
      rows: 2,
    },
    {
      id: 'sono_qualidade',
      label: 'Qualidade do Sono',
      type: 'select',
      options: [
        { value: 'excelente', label: 'Excelente (7-9h, sem interrupções)' },
        { value: 'bom', label: 'Bom (6-7h)' },
        { value: 'regular', label: 'Regular (interrupções ocasionais)' },
        { value: 'ruim', label: 'Ruim (<6h ou muito fragmentado)' },
      ],
    },
    {
      id: 'medicamentos_suplementos',
      label: 'Medicamentos e Suplementos em Uso',
      type: 'textarea',
      placeholder: 'Liste os medicamentos e suplementos...',
      rows: 3,
    },
    {
      id: 'observacoes_iniciais',
      label: 'Observações da Avaliação Inicial',
      type: 'textarea',
      placeholder: 'Observações gerais, impressões, pontos de atenção...',
      rows: 4,
    },
  ],
};

// =============================================================================
// TEMPLATE: AVALIAÇÃO ANTROPOMÉTRICA
// =============================================================================
const avaliacaoAntropometricaTemplate: EvolucaoTemplate = {
  id: 'avaliacao_antropometrica',
  nome: 'Avaliação Antropométrica',
  descricao: 'Registro de medidas corporais, composição corporal e análise bioquímica',
  icon: 'Ruler',
  campos: [
    {
      id: 'peso_atual',
      label: 'Peso Atual',
      type: 'number',
      placeholder: 'Ex: 75.5',
      unit: 'kg',
      required: true,
      step: 0.1,
      min: 20,
      max: 300,
    },
    {
      id: 'altura',
      label: 'Altura',
      type: 'number',
      placeholder: 'Ex: 1.70',
      unit: 'm',
      step: 0.01,
      min: 0.5,
      max: 2.5,
    },
    {
      id: 'imc_calculado',
      label: 'IMC Calculado',
      type: 'number',
      placeholder: 'Calculado automaticamente',
      unit: 'kg/m²',
      step: 0.1,
    },
    {
      id: 'circunferencia_cintura',
      label: 'Circunferência da Cintura',
      type: 'number',
      placeholder: 'Ex: 85',
      unit: 'cm',
      step: 0.1,
      min: 40,
      max: 200,
    },
    {
      id: 'circunferencia_quadril',
      label: 'Circunferência do Quadril',
      type: 'number',
      placeholder: 'Ex: 98',
      unit: 'cm',
      step: 0.1,
      min: 40,
      max: 200,
    },
    {
      id: 'relacao_cintura_quadril',
      label: 'Relação Cintura/Quadril',
      type: 'number',
      placeholder: 'Calculado automaticamente',
      step: 0.01,
    },
    {
      id: 'circunferencia_braco',
      label: 'Circunferência do Braço',
      type: 'number',
      placeholder: 'Ex: 32',
      unit: 'cm',
      step: 0.1,
    },
    {
      id: 'circunferencia_coxa',
      label: 'Circunferência da Coxa',
      type: 'number',
      placeholder: 'Ex: 55',
      unit: 'cm',
      step: 0.1,
    },
    {
      id: 'dobras_cutaneas',
      label: 'Dobras Cutâneas (se aplicável)',
      type: 'textarea',
      placeholder: 'Tricipital, bicipital, subescapular, suprailíaca...',
      rows: 3,
    },
    {
      id: 'percentual_gordura',
      label: 'Percentual de Gordura Corporal',
      type: 'number',
      placeholder: 'Ex: 25.5',
      unit: '%',
      step: 0.1,
      min: 3,
      max: 60,
    },
    {
      id: 'massa_magra',
      label: 'Massa Magra',
      type: 'number',
      placeholder: 'Ex: 55.0',
      unit: 'kg',
      step: 0.1,
    },
    {
      id: 'massa_gorda',
      label: 'Massa Gorda',
      type: 'number',
      placeholder: 'Ex: 20.5',
      unit: 'kg',
      step: 0.1,
    },
    {
      id: 'metodo_avaliacao',
      label: 'Método de Avaliação',
      type: 'select',
      options: [
        { value: 'bioimpedancia', label: 'Bioimpedância' },
        { value: 'dobras_cutaneas', label: 'Dobras Cutâneas (Adipômetro)' },
        { value: 'dexa', label: 'DEXA' },
        { value: 'perimetria', label: 'Perimetria apenas' },
      ],
    },
    {
      id: 'observacoes_antropometria',
      label: 'Observações da Avaliação',
      type: 'textarea',
      placeholder: 'Análise dos dados antropométricos, evolução em relação à avaliação anterior...',
      rows: 4,
    },
  ],
};

// =============================================================================
// TEMPLATE: DIAGNÓSTICO NUTRICIONAL
// =============================================================================
const diagnosticoNutricionalTemplate: EvolucaoTemplate = {
  id: 'diagnostico_nutricional',
  nome: 'Diagnóstico Nutricional',
  descricao: 'Análise do estado nutricional e definição de diagnósticos',
  icon: 'Stethoscope',
  campos: [
    {
      id: 'estado_nutricional',
      label: 'Estado Nutricional',
      type: 'select',
      required: true,
      options: [
        { value: 'eutrofia', label: 'Eutrofia (peso adequado)' },
        { value: 'sobrepeso', label: 'Sobrepeso' },
        { value: 'obesidade_grau1', label: 'Obesidade Grau I' },
        { value: 'obesidade_grau2', label: 'Obesidade Grau II' },
        { value: 'obesidade_grau3', label: 'Obesidade Grau III (mórbida)' },
        { value: 'desnutricao_leve', label: 'Desnutrição Leve' },
        { value: 'desnutricao_moderada', label: 'Desnutrição Moderada' },
        { value: 'desnutricao_grave', label: 'Desnutrição Grave' },
        { value: 'risco_nutricional', label: 'Risco Nutricional' },
      ],
    },
    {
      id: 'classificacao_imc',
      label: 'Classificação pelo IMC',
      type: 'text',
      placeholder: 'Ex: Obesidade Grau I (IMC 32.5)',
    },
    {
      id: 'diagnosticos_nutricionais',
      label: 'Diagnósticos Nutricionais Identificados',
      type: 'checkbox_group',
      options: [
        { value: 'obesidade', label: 'Obesidade' },
        { value: 'desnutricao', label: 'Desnutrição' },
        { value: 'carencia_vitaminas', label: 'Carência de Vitaminas/Minerais' },
        { value: 'dislipidemia', label: 'Dislipidemia' },
        { value: 'diabetes', label: 'Diabetes/Resistência Insulínica' },
        { value: 'hipertensao', label: 'Hipertensão' },
        { value: 'sarcopenia', label: 'Sarcopenia' },
        { value: 'transtorno_alimentar', label: 'Transtorno Alimentar' },
        { value: 'sindrome_metabolica', label: 'Síndrome Metabólica' },
        { value: 'intolerancia_alimentar', label: 'Intolerância Alimentar' },
        { value: 'alergia_alimentar', label: 'Alergia Alimentar' },
        { value: 'disturbio_gi', label: 'Distúrbio Gastrointestinal' },
      ],
    },
    {
      id: 'outros_diagnosticos',
      label: 'Outros Diagnósticos',
      type: 'textarea',
      placeholder: 'Diagnósticos adicionais não listados acima...',
      rows: 2,
    },
    {
      id: 'fatores_risco',
      label: 'Fatores de Risco Identificados',
      type: 'textarea',
      placeholder: 'Histórico familiar, estilo de vida, comorbidades...',
      rows: 3,
    },
    {
      id: 'necessidades_nutricionais',
      label: 'Necessidades Nutricionais Estimadas',
      type: 'textarea',
      placeholder: 'VET, distribuição de macronutrientes, micronutrientes de atenção...',
      rows: 3,
    },
    {
      id: 'metas_terapeuticas',
      label: 'Metas Terapêuticas',
      type: 'textarea',
      placeholder: 'Metas de peso, composição corporal, parâmetros bioquímicos...',
      required: true,
      rows: 4,
    },
    {
      id: 'prazo_reavaliacao',
      label: 'Prazo para Reavaliação',
      type: 'select',
      options: [
        { value: '7_dias', label: '7 dias' },
        { value: '15_dias', label: '15 dias' },
        { value: '30_dias', label: '30 dias (1 mês)' },
        { value: '45_dias', label: '45 dias' },
        { value: '60_dias', label: '60 dias (2 meses)' },
        { value: '90_dias', label: '90 dias (3 meses)' },
      ],
    },
    {
      id: 'conclusao_diagnostica',
      label: 'Conclusão Diagnóstica',
      type: 'textarea',
      placeholder: 'Resumo do diagnóstico nutricional e prognóstico...',
      required: true,
      rows: 4,
    },
  ],
};

// =============================================================================
// TEMPLATE: PLANO ALIMENTAR
// =============================================================================
const planoAlimentarTemplate: EvolucaoTemplate = {
  id: 'plano_alimentar',
  nome: 'Plano Alimentar',
  descricao: 'Prescrição dietética completa com orientações e metas calóricas',
  icon: 'UtensilsCrossed',
  campos: [
    {
      id: 'valor_energetico_total',
      label: 'Valor Energético Total (VET)',
      type: 'number',
      placeholder: 'Ex: 1800',
      unit: 'kcal',
      required: true,
      min: 800,
      max: 5000,
    },
    {
      id: 'carboidratos_percentual',
      label: 'Carboidratos (%)',
      type: 'number',
      placeholder: 'Ex: 50',
      unit: '%',
      min: 0,
      max: 100,
    },
    {
      id: 'proteinas_percentual',
      label: 'Proteínas (%)',
      type: 'number',
      placeholder: 'Ex: 25',
      unit: '%',
      min: 0,
      max: 100,
    },
    {
      id: 'lipidios_percentual',
      label: 'Lipídios (%)',
      type: 'number',
      placeholder: 'Ex: 25',
      unit: '%',
      min: 0,
      max: 100,
    },
    {
      id: 'proteina_g_kg',
      label: 'Proteína por kg de peso',
      type: 'number',
      placeholder: 'Ex: 1.5',
      unit: 'g/kg',
      step: 0.1,
      min: 0.5,
      max: 3.0,
    },
    {
      id: 'tipo_dieta',
      label: 'Tipo de Dieta',
      type: 'select',
      options: [
        { value: 'equilibrada', label: 'Equilibrada/Tradicional' },
        { value: 'low_carb', label: 'Low Carb' },
        { value: 'cetogenica', label: 'Cetogênica' },
        { value: 'hipocalorica', label: 'Hipocalórica' },
        { value: 'hiperproteica', label: 'Hiperproteica' },
        { value: 'vegetariana', label: 'Vegetariana' },
        { value: 'vegana', label: 'Vegana' },
        { value: 'mediterranea', label: 'Mediterrânea' },
        { value: 'dash', label: 'DASH' },
        { value: 'fodmap', label: 'Low FODMAP' },
        { value: 'sem_gluten', label: 'Sem Glúten' },
        { value: 'sem_lactose', label: 'Sem Lactose' },
      ],
    },
    {
      id: 'numero_refeicoes',
      label: 'Número de Refeições/dia',
      type: 'select',
      options: [
        { value: '3', label: '3 refeições' },
        { value: '4', label: '4 refeições' },
        { value: '5', label: '5 refeições' },
        { value: '6', label: '6 refeições' },
        { value: 'jejum_intermitente', label: 'Jejum Intermitente' },
      ],
    },
    {
      id: 'prescricao_cafe_manha',
      label: 'Café da Manhã',
      type: 'textarea',
      placeholder: 'Orientações e opções para o café da manhã...',
      rows: 3,
    },
    {
      id: 'prescricao_lanche_manha',
      label: 'Lanche da Manhã',
      type: 'textarea',
      placeholder: 'Orientações e opções para o lanche da manhã...',
      rows: 2,
    },
    {
      id: 'prescricao_almoco',
      label: 'Almoço',
      type: 'textarea',
      placeholder: 'Orientações e opções para o almoço...',
      rows: 4,
    },
    {
      id: 'prescricao_lanche_tarde',
      label: 'Lanche da Tarde',
      type: 'textarea',
      placeholder: 'Orientações e opções para o lanche da tarde...',
      rows: 2,
    },
    {
      id: 'prescricao_jantar',
      label: 'Jantar',
      type: 'textarea',
      placeholder: 'Orientações e opções para o jantar...',
      rows: 4,
    },
    {
      id: 'prescricao_ceia',
      label: 'Ceia (opcional)',
      type: 'textarea',
      placeholder: 'Orientações e opções para a ceia...',
      rows: 2,
    },
    {
      id: 'suplementacao',
      label: 'Suplementação Prescrita',
      type: 'textarea',
      placeholder: 'Suplementos, vitaminas, minerais prescritos...',
      rows: 3,
    },
    {
      id: 'alimentos_evitar',
      label: 'Alimentos a Evitar',
      type: 'tags',
      placeholder: 'Alimentos que devem ser evitados...',
    },
    {
      id: 'alimentos_preferir',
      label: 'Alimentos a Preferir',
      type: 'tags',
      placeholder: 'Alimentos que devem ser priorizados...',
    },
    {
      id: 'orientacoes_gerais',
      label: 'Orientações Gerais',
      type: 'textarea',
      placeholder: 'Orientações sobre preparação, horários, hidratação...',
      rows: 4,
    },
    {
      id: 'observacoes_plano',
      label: 'Observações do Plano',
      type: 'textarea',
      placeholder: 'Observações adicionais sobre o plano alimentar...',
      rows: 3,
    },
  ],
};

// =============================================================================
// TEMPLATE: EVOLUÇÃO NUTRICIONAL
// =============================================================================
const evolucaoRetornoTemplate: EvolucaoTemplate = {
  id: 'evolucao_retorno',
  nome: 'Evolução Nutricional',
  descricao: 'Registro de acompanhamento nutricional com adesão e ajustes no plano',
  icon: 'RefreshCcw',
  campos: [
    {
      id: 'data_evolucao',
      label: 'Data',
      type: 'date',
      required: true,
    },
    {
      id: 'peso_atual',
      label: 'Peso Atual',
      type: 'number',
      placeholder: 'Ex: 74.5',
      unit: 'kg',
      required: true,
      step: 0.1,
    },
    {
      id: 'adesao_plano',
      label: 'Adesão ao Plano Alimentar',
      type: 'select',
      required: true,
      options: [
        { value: 'excelente', label: 'Excelente (>90%)' },
        { value: 'boa', label: 'Boa (70-90%)' },
        { value: 'regular', label: 'Regular (50-70%)' },
        { value: 'baixa', label: 'Baixa (30-50%)' },
        { value: 'muito_baixa', label: 'Muito baixa (<30%)' },
      ],
    },
    {
      id: 'dificuldades_relatadas',
      label: 'Dificuldades Relatadas',
      type: 'textarea',
      placeholder: 'Quais dificuldades o paciente teve em seguir o plano...',
      rows: 3,
    },
    {
      id: 'sintomas_gi',
      label: 'Sintomas Gastrointestinais',
      type: 'checkbox_group',
      options: [
        { value: 'nenhum', label: 'Nenhum' },
        { value: 'constipacao', label: 'Constipação' },
        { value: 'diarreia', label: 'Diarréia' },
        { value: 'gases', label: 'Gases/Flatulência' },
        { value: 'distensao', label: 'Distensão Abdominal' },
        { value: 'nausea', label: 'Náusea' },
        { value: 'azia', label: 'Azia/Refluxo' },
        { value: 'dor_abdominal', label: 'Dor Abdominal' },
      ],
    },
    {
      id: 'melhoras_percebidas',
      label: 'Melhoras Percebidas',
      type: 'textarea',
      placeholder: 'Quais melhoras o paciente percebeu (energia, disposição, sono, etc.)...',
      rows: 3,
    },
    {
      id: 'avaliacao_progresso',
      label: 'Avaliação do Progresso',
      type: 'select',
      options: [
        { value: 'acima_esperado', label: 'Acima do esperado' },
        { value: 'dentro_esperado', label: 'Dentro do esperado' },
        { value: 'abaixo_esperado', label: 'Abaixo do esperado' },
        { value: 'estagnado', label: 'Estagnado' },
        { value: 'retrocesso', label: 'Retrocesso' },
      ],
    },
    {
      id: 'ajustes_realizados',
      label: 'Ajustes Realizados no Plano',
      type: 'textarea',
      placeholder: 'Quais ajustes foram feitos no plano alimentar...',
      rows: 4,
    },
    {
      id: 'orientacoes_reforco',
      label: 'Orientações Reforçadas',
      type: 'tags',
      placeholder: 'Orientações que precisam ser reforçadas...',
    },
    {
      id: 'novas_orientacoes',
      label: 'Novas Orientações',
      type: 'textarea',
      placeholder: 'Novas orientações para o paciente...',
      rows: 3,
    },
    {
      id: 'proximos_passos',
      label: 'Próximos Passos',
      type: 'textarea',
      placeholder: 'O que o paciente deve fazer até o próximo retorno...',
      rows: 3,
    },
    {
      id: 'prazo_retorno',
      label: 'Prazo para Próximo Retorno',
      type: 'select',
      options: [
        { value: '7_dias', label: '7 dias' },
        { value: '15_dias', label: '15 dias' },
        { value: '30_dias', label: '30 dias (1 mês)' },
        { value: '45_dias', label: '45 dias' },
        { value: '60_dias', label: '60 dias (2 meses)' },
        { value: '90_dias', label: '90 dias (3 meses)' },
      ],
    },
    {
      id: 'observacoes_nutricionista',
      label: 'Observações do Nutricionista',
      type: 'textarea',
      placeholder: 'Observações gerais sobre o atendimento e evolução...',
      rows: 4,
    },
  ],
};

// =============================================================================
// EXPORTAÇÃO DOS TEMPLATES
// =============================================================================
export const EVOLUCAO_TEMPLATES: EvolucaoTemplate[] = [
  avaliacaoInicialTemplate,
  avaliacaoAntropometricaTemplate,
  diagnosticoNutricionalTemplate,
  planoAlimentarTemplate,
  evolucaoRetornoTemplate,
];

export const getTemplateById = (id: TipoEvolucaoNutricao): EvolucaoTemplate | undefined => {
  return EVOLUCAO_TEMPLATES.find(t => t.id === id);
};

export const TIPO_EVOLUCAO_LABELS: Record<TipoEvolucaoNutricao, string> = {
  avaliacao_inicial: 'Avaliação Nutricional Inicial',
  avaliacao_antropometrica: 'Avaliação Antropométrica',
  diagnostico_nutricional: 'Diagnóstico Nutricional',
  plano_alimentar: 'Plano Alimentar',
  evolucao_retorno: 'Evolução Nutricional',
};
