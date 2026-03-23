import type { SpecialtyKey } from './useActiveSpecialty';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  getEnabledBlocksForSpecialty,
  type ClinicalBlockKey 
} from './yesclinSpecialties';

// Re-export ClinicalBlockKey for convenience
export type { ClinicalBlockKey } from './yesclinSpecialties';

/**
 * YESCLIN CLINICAL BLOCKS - Controlled list of available tabs
 * 
 * These are the ONLY clinical blocks available in the Yesclin prontuário.
 * No other tabs should be displayed outside this list.
 */

// Tab keys mapped to their display names
export const YESCLIN_CLINICAL_BLOCKS: Record<ClinicalBlockKey, string> = {
  resumo: 'Visão Geral',
  anamnese: 'Anamnese',
  exame_fisico: 'Exame Físico',
  evolucao: 'Evoluções',
  diagnostico: 'Hipóteses Diagnósticas',
  prescricoes: 'Prescrições',
  conduta: 'Plano / Conduta',
  documentos_clinicos: 'Documentos Clínicos',
  exames: 'Exames / Documentos',
  timeline: 'Linha do Tempo',
  alertas: 'Alertas',
  historico: 'Histórico',
  procedimentos_realizados: 'Procedimentos Realizados',
  produtos_utilizados: 'Produtos Utilizados',
  before_after_photos: 'Fotos Antes / Depois',
  termos_consentimentos: 'Termos / Consentimentos',
  facial_map: 'Mapa Facial',
  odontograma: 'Odontograma Digital',
  instrumentos: 'Instrumentos / Testes',
  // Nutrition-specific blocks
  avaliacao_nutricional: 'Avaliação Nutricional Inicial',
  avaliacao_clinica: 'Avaliação Antropométrica',
  diagnostico_nutricional: 'Diagnóstico Nutricional',
  plano_alimentar: 'Plano Alimentar',
  // Fisioterapia-specific blocks
  avaliacao_funcional: 'Avaliação Funcional',
  avaliacao_dor: 'Avaliação de Dor',
  exercicios_prescritos: 'Exercícios Prescritos',
  // Pediatria-specific blocks
  anamnese_pediatrica: 'Anamnese Pediátrica',
  crescimento_desenvolvimento: 'Crescimento e Desenvolvimento',
  avaliacao_clinica_pediatrica: 'Avaliação Clínica',
  diagnostico_pediatrico: 'Diagnóstico Pediátrico',
  prescricoes_pediatricas: 'Prescrições Pediátricas',
  vacinacao: 'Vacinação',
};

// All available clinical block keys
export const ALL_CLINICAL_BLOCKS: ClinicalBlockKey[] = Object.keys(YESCLIN_CLINICAL_BLOCKS) as ClinicalBlockKey[];

// Base tabs (for reference - actual visibility is determined by specialty config)
export const BASE_TABS: ClinicalBlockKey[] = [
  'resumo',
  'evolucao',
  'conduta',
  'exames',
  'timeline',
  'alertas',
  'historico',
];

// Legacy export for backward compatibility
export const SPECIALTY_TABS: Record<SpecialtyKey, ClinicalBlockKey[]> = {
  geral: [],
  odontologia: ['odontograma', 'procedimentos_realizados', 'produtos_utilizados', 'before_after_photos'],
  psicologia: ['termos_consentimentos'],
  psiquiatria: [],
  nutricao: [],
  estetica: ['facial_map', 'procedimentos_realizados', 'produtos_utilizados', 'before_after_photos', 'termos_consentimentos'],
  dermatologia: ['before_after_photos'],
  fisioterapia: ['procedimentos_realizados'],
  pilates: ['avaliacao_funcional'],
  pediatria: [],
  ginecologia: [],
  oftalmologia: [],
  custom: [],
};

/**
 * Get all visible tabs for a given specialty.
 * Uses the enabledBlocks from YESCLIN_SUPPORTED_SPECIALTIES.
 */
export function getVisibleTabsForSpecialty(specialtyKey: SpecialtyKey): ClinicalBlockKey[] {
  return getEnabledBlocksForSpecialty(specialtyKey);
}

/**
 * Check if a tab should be visible for the given specialty.
 * Uses the specialty's enabledBlocks configuration.
 */
export function isTabVisibleForSpecialty(tabKey: string, specialtyKey: SpecialtyKey): boolean {
  const visibleTabs = getVisibleTabsForSpecialty(specialtyKey);
  return visibleTabs.includes(tabKey as ClinicalBlockKey);
}

/**
 * Specialty-specific label overrides for clinical blocks
 */
const SPECIALTY_BLOCK_LABEL_OVERRIDES: Partial<Record<SpecialtyKey, Partial<Record<ClinicalBlockKey, string>>>> = {
  nutricao: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese Nutricional',
    avaliacao_nutricional: 'Avaliação Nutricional Inicial',
    avaliacao_clinica: 'Avaliação Antropométrica',
    diagnostico_nutricional: 'Diagnóstico Nutricional',
    plano_alimentar: 'Plano Alimentar',
    evolucao: 'Evoluções Nutricionais',
    exames: 'Exames / Documentos',
    timeline: 'Linha do Tempo',
    alertas: 'Alertas',
  },
  fisioterapia: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese',
    avaliacao_funcional: 'Avaliação Funcional',
    avaliacao_dor: 'Avaliação de Dor',
    diagnostico: 'Diagnóstico Funcional',
    conduta: 'Plano Terapêutico',
    evolucao: 'Sessões',
    exercicios_prescritos: 'Exercícios Prescritos',
    exames: 'Exames / Documentos',
    alertas: 'Alertas Funcionais',
    timeline: 'Histórico / Linha do Tempo',
  },
  pilates: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese',
    avaliacao_funcional: 'Avaliação Funcional',
    conduta: 'Plano de Exercícios',
    evolucao: 'Sessões de Pilates',
    exames: 'Documentos',
    alertas: 'Alertas / Restrições',
    timeline: 'Histórico',
  },
  estetica: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese Estética',
    exame_fisico: 'Avaliação Estética',
    evolucao: 'Evoluções',
    procedimentos_realizados: 'Procedimentos',
    produtos_utilizados: 'Produtos',
    before_after_photos: 'Fotos Antes / Depois',
    termos_consentimentos: 'Termos',
    facial_map: 'Mapa Facial',
    alertas: 'Alertas Clínicos',
    timeline: 'Linha do Tempo',
    historico: 'Histórico',
  },
  odontologia: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese Odontológica',
    exame_fisico: 'Avaliação Clínica',
    odontograma: 'Odontograma Digital',
    diagnostico: 'Diagnóstico Odontológico',
    conduta: 'Plano de Tratamento',
    evolucao: 'Evoluções',
    procedimentos_realizados: 'Procedimentos Realizados',
    produtos_utilizados: 'Materiais Utilizados',
    exames: 'Exames / Documentos',
    before_after_photos: 'Fotos Antes / Depois',
    alertas: 'Alertas',
    timeline: 'Histórico / Linha do Tempo',
  },
  dermatologia: {
    resumo: 'Visão Geral',
    anamnese: 'Anamnese Dermatológica',
    exame_fisico: 'Exame Dermatológico',
    diagnostico: 'Diagnóstico Dermatológico',
    prescricoes: 'Prescrições',
    conduta: 'Plano / Conduta',
    evolucao: 'Evoluções',
    exames: 'Exames / Documentos',
    before_after_photos: 'Fotos Clínicas',
    alertas: 'Alertas Clínicos',
    timeline: 'Histórico / Linha do Tempo',
  },
  pediatria: {
    resumo: 'Visão Geral',
    anamnese_pediatrica: 'Anamnese Pediátrica',
    crescimento_desenvolvimento: 'Crescimento e Desenvolvimento',
    avaliacao_clinica_pediatrica: 'Avaliação Clínica',
    diagnostico_pediatrico: 'Diagnóstico Pediátrico',
    prescricoes_pediatricas: 'Prescrições',
    vacinacao: 'Vacinação',
    evolucao: 'Evoluções',
    exames: 'Exames / Documentos',
    alertas: 'Alertas Pediátricos',
    timeline: 'Linha do Tempo',
  },
};

/**
 * Get display label for a clinical block, with optional specialty-specific override
 */
export function getClinicalBlockLabel(key: ClinicalBlockKey, specialtyKey?: SpecialtyKey): string {
  // Check for specialty-specific override first
  if (specialtyKey && SPECIALTY_BLOCK_LABEL_OVERRIDES[specialtyKey]?.[key]) {
    return SPECIALTY_BLOCK_LABEL_OVERRIDES[specialtyKey]![key]!;
  }
  return YESCLIN_CLINICAL_BLOCKS[key] || key;
}

/**
 * Get all clinical blocks with their labels
 */
export function getAllClinicalBlocks(): Array<{ key: ClinicalBlockKey; label: string }> {
  return ALL_CLINICAL_BLOCKS.map(key => ({
    key,
    label: YESCLIN_CLINICAL_BLOCKS[key],
  }));
}

/**
 * Get a human-readable label for a specialty key.
 */
export { YESCLIN_SPECIALTY_LABELS as SPECIALTY_LABELS } from './yesclinSpecialties';
