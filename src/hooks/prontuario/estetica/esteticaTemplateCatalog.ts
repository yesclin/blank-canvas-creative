/**
 * Catálogo oficial dos 10 modelos de anamnese/planejamento da especialidade Estética.
 *
 * Este catálogo é a fonte de verdade para:
 * - ordem de exibição no seletor
 * - agrupamento por categoria
 * - classificação de tipo de renderização
 *
 * Os modelos reais vivem no banco (anamnesis_templates).
 * Este catálogo mapeia template_type → metadados de apresentação.
 */

import { ADVANCED_TEMPLATE_MAP } from './esteticaAdvancedTemplates';

// ─── Types ──────────────────────────────────────────────────────────

export type TemplateCategory = 'avaliacao_base' | 'procedural';
export type RendererKind = 'dynamic' | 'standard';

export interface CatalogEntry {
  /** Matches anamnesis_templates.template_type or a known legacy key */
  templateType: string;
  /** Fallback name if DB name is missing */
  displayName: string;
  /** Category for grouping in selector */
  category: TemplateCategory;
  /** Which renderer to use */
  rendererKind: RendererKind;
  /** Display order within category */
  displayOrder: number;
}

// ─── Catalog ────────────────────────────────────────────────────────

export const ESTETICA_TEMPLATE_CATALOG: CatalogEntry[] = [
  // ── GRUPO 1: Avaliação Base ──────────────────────────────────────
  {
    templateType: 'anamnese_geral_estetica',
    displayName: 'Anamnese Geral Estética',
    category: 'avaliacao_base',
    rendererKind: 'standard',
    displayOrder: 1,
  },
  {
    templateType: 'anamnese_estetica_facial',
    displayName: 'Anamnese Estética Facial - YesClin',
    category: 'avaliacao_base',
    rendererKind: 'dynamic',
    displayOrder: 2,
  },
  {
    templateType: 'anamnese_pele_avaliacao',
    displayName: 'Anamnese Pele e Avaliação Facial - YesClin',
    category: 'avaliacao_base',
    rendererKind: 'dynamic',
    displayOrder: 3,
  },
  {
    templateType: 'anamnese_capilar',
    displayName: 'Anamnese Capilar - YesClin',
    category: 'avaliacao_base',
    rendererKind: 'dynamic',
    displayOrder: 4,
  },
  {
    templateType: 'anamnese_corporal_avancada',
    displayName: 'Anamnese Corporal - YesClin',
    category: 'avaliacao_base',
    rendererKind: 'dynamic',
    displayOrder: 5,
  },
  // ── GRUPO 2: Modelos Procedurais ─────────────────────────────────
  {
    templateType: 'anamnese_toxina',
    displayName: 'Plano de Toxina Botulínica',
    category: 'procedural',
    rendererKind: 'standard',
    displayOrder: 6,
  },
  {
    templateType: 'anamnese_preenchimento',
    displayName: 'Plano de Preenchimento com Ácido Hialurônico',
    category: 'procedural',
    rendererKind: 'standard',
    displayOrder: 7,
  },
  {
    templateType: 'anamnese_bioestimulador',
    displayName: 'Plano de Bioestimulador',
    category: 'procedural',
    rendererKind: 'standard',
    displayOrder: 8,
  },
  {
    templateType: 'anamnese_skinbooster',
    displayName: 'Anamnese Skinbooster',
    category: 'procedural',
    rendererKind: 'standard',
    displayOrder: 9,
  },
  {
    templateType: 'anamnese_combinados',
    displayName: 'Anamnese de Combinados',
    category: 'procedural',
    rendererKind: 'standard',
    displayOrder: 10,
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────

const catalogByType = new Map(ESTETICA_TEMPLATE_CATALOG.map(e => [e.templateType, e]));

/**
 * Known legacy template_type values in the DB that map to catalog entries.
 * Legacy templates provisioned with template_type='anamnese' are matched by name.
 */
const LEGACY_NAME_TO_TYPE: Record<string, string> = {
  'Anamnese Estética Facial Geral': 'anamnese_geral_estetica',
  'Plano de Aplicação de Toxina Botulínica': 'anamnese_toxina',
  'Plano de Preenchimento com Ácido Hialurônico': 'anamnese_preenchimento',
  'Anamnese para Bioestimulador de Colágeno': 'anamnese_bioestimulador',
  'Anamnese para Microagulhamento / Skinbooster / Revitalização': 'anamnese_skinbooster',
  'Anamnese para Procedimentos Estéticos Combinados': 'anamnese_combinados',
  'Avaliação Corporal Estética': 'anamnese_corporal_avancada', // duplicate of advanced corporal
};

/**
 * Resolve catalog entry for a given DB template.
 * Returns null if the template doesn't belong to the official catalog.
 */
export function getCatalogEntry(template: {
  template_type: string | null;
  name: string;
}): CatalogEntry | null {
  // Direct match by template_type
  if (template.template_type && catalogByType.has(template.template_type)) {
    return catalogByType.get(template.template_type)!;
  }
  // Fallback: match by name for legacy templates with generic template_type
  const mappedType = LEGACY_NAME_TO_TYPE[template.name];
  if (mappedType && catalogByType.has(mappedType)) {
    return catalogByType.get(mappedType)!;
  }
  return null;
}

/**
 * Determine renderer kind for a template.
 * Uses catalog first, falls back to ADVANCED_TEMPLATE_MAP check.
 */
export function getRendererKind(template: {
  template_type: string | null;
  name: string;
}): RendererKind {
  const entry = getCatalogEntry(template);
  if (entry) return entry.rendererKind;
  // Fallback: check if it's an advanced template
  if (template.template_type && ADVANCED_TEMPLATE_MAP[template.template_type]) return 'dynamic';
  return 'standard';
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  avaliacao_base: 'Avaliação Base',
  procedural: 'Modelos Procedurais',
};
