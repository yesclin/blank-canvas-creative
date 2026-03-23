/**
 * SPECIALTY CAPABILITIES — Single Source of Truth
 * 
 * Central mapping: specialty_slug → clinical blocks + functional modules + anamnesis slug
 * 
 * This file REPLACES scattered config across yesclinSpecialties.ts and clinical-modules.ts
 * as the authoritative source for "what does each specialty get in the prontuário?"
 * 
 * Two layers:
 * 1. Clinical Blocks (ClinicalBlockKey) — tabs/sections visible in the prontuário UI
 * 2. Functional Modules (ClinicalModuleKey) — feature toggles (odontogram, scales, etc.)
 */

import type { SpecialtyKey } from './useActiveSpecialty';
import type { ClinicalBlockKey } from './yesclinSpecialties';
import type { ClinicalModuleKey } from '@/types/clinical-modules';
import { CORE_MODULES } from '@/types/clinical-modules';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpecialtyCapability {
  /** Display name */
  label: string;
  /** Slug used for matching anamnesis templates in DB */
  anamnesisSlug: string;
  /** Clinical blocks (prontuário tabs) enabled for this specialty */
  enabledBlocks: ClinicalBlockKey[];
  /** Functional modules enabled by default (can be overridden per clinic) */
  defaultModules: ClinicalModuleKey[];
  /** Lucide icon name */
  icon: string;
}

// ---------------------------------------------------------------------------
// Capability Matrix
// ---------------------------------------------------------------------------

export const SPECIALTY_CAPABILITIES: Record<SpecialtyKey, SpecialtyCapability> = {
  geral: {
    label: 'Clínica Geral',
    anamnesisSlug: 'clinica-geral',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'exame_fisico', 'diagnostico',
      'conduta', 'documentos_clinicos', 'prescricoes', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'procedures_module'],
    icon: 'Stethoscope',
  },

  psicologia: {
    label: 'Psicologia',
    anamnesisSlug: 'psicologia',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'diagnostico', 'conduta',
      'instrumentos', 'timeline', 'alertas', 'historico', 'termos_consentimentos',
    ],
    defaultModules: [...CORE_MODULES, 'recurring_sessions', 'therapeutic_plan'],
    icon: 'Brain',
  },

  nutricao: {
    label: 'Nutrição',
    anamnesisSlug: 'nutricao',
    enabledBlocks: [
      'resumo', 'anamnese', 'avaliacao_nutricional', 'avaliacao_clinica',
      'diagnostico_nutricional', 'plano_alimentar', 'evolucao',
      'exames', 'timeline', 'alertas',
    ],
    defaultModules: [...CORE_MODULES, 'body_measurements', 'therapeutic_plan'],
    icon: 'Apple',
  },

  fisioterapia: {
    label: 'Fisioterapia',
    anamnesisSlug: 'fisioterapia',
    enabledBlocks: [
      'resumo', 'anamnese', 'avaliacao_funcional', 'avaliacao_dor',
      'diagnostico', 'conduta', 'evolucao', 'exercicios_prescritos',
      'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
    icon: 'Activity',
  },

  pilates: {
    label: 'Pilates',
    anamnesisSlug: 'pilates',
    enabledBlocks: [
      'resumo', 'anamnese', 'avaliacao_funcional', 'conduta',
      'evolucao', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
    icon: 'Dumbbell',
  },

  estetica: {
    label: 'Estética / Harmonização Facial',
    anamnesisSlug: 'estetica-harmonizacao',
    enabledBlocks: [
      'resumo', 'anamnese', 'exame_fisico', 'evolucao',
      'procedimentos_realizados', 'produtos_utilizados', 'before_after_photos',
      'termos_consentimentos', 'facial_map', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
    icon: 'Sparkles',
  },

  odontologia: {
    label: 'Odontologia',
    anamnesisSlug: 'odontologia',
    enabledBlocks: [
      'resumo', 'anamnese', 'exame_fisico', 'odontograma', 'diagnostico',
      'conduta', 'evolucao', 'procedimentos_realizados', 'produtos_utilizados',
      'exames', 'before_after_photos', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'odontogram', 'procedures_module', 'before_after'],
    icon: 'Smile',
  },

  dermatologia: {
    label: 'Dermatologia',
    anamnesisSlug: 'dermatologia',
    enabledBlocks: [
      'resumo', 'anamnese', 'exame_fisico', 'diagnostico', 'prescricoes',
      'conduta', 'evolucao', 'exames', 'before_after_photos', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'before_after', 'procedures_module', 'advanced_uploads', 'interactive_map'],
    icon: 'Scan',
  },

  pediatria: {
    label: 'Pediatria',
    anamnesisSlug: 'pediatria',
    enabledBlocks: [
      'resumo', 'anamnese_pediatrica', 'crescimento_desenvolvimento',
      'avaliacao_clinica_pediatrica', 'diagnostico_pediatrico',
      'prescricoes_pediatricas', 'vacinacao', 'evolucao',
      'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'body_measurements'],
    icon: 'Baby',
  },

  // Unsupported but typed for safety — fallback to geral
  psiquiatria: {
    label: 'Psiquiatria',
    anamnesisSlug: 'psiquiatria',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'exame_fisico', 'diagnostico',
      'conduta', 'prescricoes', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'recurring_sessions', 'therapeutic_plan'],
    icon: 'Stethoscope',
  },
  ginecologia: {
    label: 'Ginecologia',
    anamnesisSlug: 'ginecologia',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'exame_fisico', 'diagnostico',
      'conduta', 'prescricoes', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'procedures_module'],
    icon: 'Stethoscope',
  },
  oftalmologia: {
    label: 'Oftalmologia',
    anamnesisSlug: 'oftalmologia',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'exame_fisico', 'diagnostico',
      'conduta', 'prescricoes', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES, 'procedures_module'],
    icon: 'Stethoscope',
  },
  custom: {
    label: 'Personalizado',
    anamnesisSlug: 'custom',
    enabledBlocks: [
      'resumo', 'anamnese', 'evolucao', 'exame_fisico', 'diagnostico',
      'conduta', 'prescricoes', 'exames', 'alertas', 'timeline',
    ],
    defaultModules: [...CORE_MODULES],
    icon: 'Stethoscope',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the full capability definition for a specialty key.
 * Falls back to 'geral' if key is unknown.
 */
export function getCapabilities(key: SpecialtyKey): SpecialtyCapability {
  return SPECIALTY_CAPABILITIES[key] ?? SPECIALTY_CAPABILITIES.geral;
}

/**
 * Check if a clinical block is enabled for a given specialty.
 */
export function isBlockEnabled(blockKey: ClinicalBlockKey, specialtyKey: SpecialtyKey): boolean {
  return getCapabilities(specialtyKey).enabledBlocks.includes(blockKey);
}

/**
 * Get the anamnesis template slug for the active specialty.
 * Used to filter anamnesis_templates by specialty.
 */
export function getAnamnesisSlug(specialtyKey: SpecialtyKey): string {
  return getCapabilities(specialtyKey).anamnesisSlug;
}

/**
 * Get the default functional modules for a specialty.
 */
export function getDefaultModules(specialtyKey: SpecialtyKey): ClinicalModuleKey[] {
  return getCapabilities(specialtyKey).defaultModules;
}
