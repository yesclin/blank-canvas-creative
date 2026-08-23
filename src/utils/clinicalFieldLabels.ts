/**
 * Dicionário central de rótulos clínicos em português-BR.
 *
 * Usado exclusivamente na camada de exibição / serialização / geração de
 * documentos. Nomes técnicos do banco permanecem inalterados.
 */

const FIELD_LABELS: Record<string, string> = {
  // ── Evolução clínica (geral) ──
  evolution_date: 'Data da evolução',
  evolution_type: 'Tipo de atendimento',
  procedure_performed: 'Procedimento realizado',
  procedures_performed: 'Procedimentos realizados',
  treatment_area: 'Área tratada',
  treatment_areas: 'Áreas tratadas',
  patient_response: 'Resposta do paciente',
  complications: 'Complicações',
  complications_notes: 'Observações sobre complicações',
  satisfaction_level: 'Nível de satisfação',
  satisfaction_notes: 'Observações sobre satisfação',
  planned_adjustments: 'Ajustes planejados',
  post_procedure_guidelines: 'Orientações pós-procedimento',
  pre_procedure_care: 'Cuidados pré-procedimento',
  post_procedure_care: 'Cuidados pós-procedimento',
  follow_up_date: 'Data de retorno',
  follow_up: 'Acompanhamento',
  photos_taken: 'Fotos registradas',
  photos: 'Fotos',
  notes: 'Observações',
  general_notes: 'Observações gerais',
  observations: 'Observações',
  general_observations: 'Observações gerais',
  next_steps: 'Próximos passos',
  summary: 'Resumo',
  description: 'Descrição',
  status: 'Status',
  signed_at: 'Assinado em',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
  professional_name: 'Profissional',
  patient_name: 'Paciente',
  template_name: 'Modelo',
  specialty: 'Especialidade',

  // ── Anamnese / história clínica ──
  chief_complaint: 'Queixa principal',
  main_complaint: 'Queixa principal',
  current_disease_history: 'História da doença atual',
  clinical_history: 'História clínica',
  medical_history: 'Histórico médico',
  pre_existing_conditions: 'Doenças pré-existentes',
  chronic_diseases: 'Doenças crônicas',
  allergies: 'Alergias',
  allergy: 'Alergia',
  medications: 'Medicamentos',
  current_medications: 'Medicamentos em uso',
  medications_in_use: 'Medicamentos em uso',
  family_history: 'Histórico familiar',
  surgical_history: 'Histórico cirúrgico',
  previous_surgeries: 'Cirurgias anteriores',
  habits: 'Hábitos',
  smoking: 'Tabagismo',
  alcohol: 'Consumo de álcool',
  physical_activity: 'Atividade física',
  diet_notes: 'Observações alimentares',
  sleep_notes: 'Observações sobre sono',
  blood_type: 'Tipo sanguíneo',
  clinical_restrictions: 'Restrições clínicas',
  contraindications: 'Contraindicações',
  pregnancy: 'Gestação',
  breastfeeding: 'Amamentação',
  custom_fields: 'Campos personalizados',
  responses: 'Respostas',

  // ── Exame físico / sinais vitais ──
  physical_exam: 'Exame físico',
  vital_signs: 'Sinais vitais',
  blood_pressure: 'Pressão arterial',
  heart_rate: 'Frequência cardíaca',
  respiratory_rate: 'Frequência respiratória',
  temperature: 'Temperatura',
  oxygen_saturation: 'Saturação de oxigênio',
  weight: 'Peso',
  height: 'Altura',
  bmi: 'IMC',
  pain_scale: 'Escala de dor',
  pain_level: 'Nível de dor',

  // ── Conduta / diagnóstico ──
  diagnosis: 'Diagnóstico',
  diagnostic_hypothesis: 'Hipótese diagnóstica',
  diagnostic_hypotheses: 'Hipóteses diagnósticas',
  conduct: 'Conduta',
  conduta: 'Conduta',
  treatment_plan: 'Plano de tratamento',
  prescription: 'Prescrição',
  exams_requested: 'Exames solicitados',
  referrals: 'Encaminhamentos',
  evolution: 'Evolução',
  progress: 'Progresso',
  results: 'Resultados',
  recommendations: 'Recomendações',
  guidelines: 'Orientações',
  goals: 'Objetivos',
  session_number: 'Número da sessão',
  session_summary: 'Resumo da sessão',
  duration: 'Duração',
  duration_minutes: 'Duração (minutos)',

  // ── Estética / harmonização ──
  product_used: 'Produto utilizado',
  products_used: 'Produtos utilizados',
  product_name: 'Produto',
  brand: 'Marca',
  batch: 'Lote',
  batch_number: 'Lote',
  lot_number: 'Lote',
  expiration_date: 'Validade',
  volume: 'Volume',
  volume_ml: 'Volume (ml)',
  units: 'Unidades',
  units_applied: 'Unidades aplicadas',
  dilution: 'Diluição',
  technique: 'Técnica',
  application_technique: 'Técnica de aplicação',
  needle_type: 'Tipo de agulha',
  anesthesia: 'Anestesia',
  fitzpatrick: 'Fototipo (Fitzpatrick)',
  skin_type: 'Tipo de pele',
  modality: 'Modalidade',
  facial_map: 'Mapa facial',
  before_after: 'Antes e depois',
  before: 'Antes',
  after: 'Depois',
  intercurrences: 'Intercorrências',
  materials_used: 'Materiais utilizados',
  quantity: 'Quantidade',
  unit: 'Unidade',
  price: 'Preço',
  total: 'Total',
};

/** Valores enum comuns exibidos ao usuário final. */
const VALUE_LABELS: Record<string, string> = {
  // tipos de evolução
  consultation: 'Consulta',
  return: 'Retorno',
  procedure: 'Procedimento',
  exam: 'Exame',
  followup: 'Acompanhamento',
  follow_up: 'Acompanhamento',
  // status
  draft: 'Rascunho',
  rascunho: 'Rascunho',
  signed: 'Assinado',
  assinada: 'Assinada',
  amended: 'Retificado',
  pending: 'Pendente',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  // respostas / satisfação
  excellent: 'Excelente',
  good: 'Boa',
  regular: 'Regular',
  poor: 'Ruim',
  bad: 'Ruim',
  satisfied: 'Satisfeito',
  very_satisfied: 'Muito satisfeito',
  unsatisfied: 'Insatisfeito',
  neutral: 'Neutro',
  yes: 'Sim',
  no: 'Não',
  none: 'Nenhum',
  never: 'Nunca',
  low: 'Baixo',
  medium: 'Médio',
  moderate: 'Moderado',
  high: 'Alto',
  intense: 'Intenso',
  light: 'Leve',
  sedentary: 'Sedentário',
  former: 'Ex-usuário',
  current: 'Atual',
  social: 'Social',
  regular_use: 'Uso regular',
};

function toTitleCase(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Converte uma chave técnica em rótulo legível em português-BR. */
export function formatClinicalFieldLabel(key: string): string {
  if (!key) return '';
  const normalized = key.trim().toLowerCase();
  if (FIELD_LABELS[normalized]) return FIELD_LABELS[normalized];

  // tenta remover sufixos/prefixos comuns (ex.: "evolution_notes_1")
  const withoutIndex = normalized.replace(/_\d+$/, '');
  if (FIELD_LABELS[withoutIndex]) return FIELD_LABELS[withoutIndex];

  return toTitleCase(key);
}

/** Traduz um valor enum/booleano para exibição em português-BR. */
export function formatClinicalFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';

  if (Array.isArray(value)) {
    return value.map((v) => formatClinicalFieldValue(v)).filter(Boolean).join(', ');
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return 'Sim';
    if (normalized === 'false') return 'Não';
    return VALUE_LABELS[normalized] ?? value;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${formatClinicalFieldLabel(k)}: ${formatClinicalFieldValue(v)}`)
      .filter((line) => !line.endsWith(': '));
    return entries.join(' • ');
  }

  return String(value);
}

/** Traduz valores enum simples (status, tipos) mantendo fallback legível. */
export function formatClinicalEnum(value?: string | null): string {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return VALUE_LABELS[normalized] ?? toTitleCase(value);
}
