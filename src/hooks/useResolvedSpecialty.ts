/**
 * RESOLVED SPECIALTY — Single Source of Truth
 * 
 * This is the ONLY place where the active specialty object is computed.
 * Every consumer in the system (prontuário, agenda, templates, etc.)
 * MUST use this resolved object.
 * 
 * Resolution priority:
 * 1. Specialty from active appointment (locked)
 * 2. User's manual selection
 * 3. First enabled official specialty in the clinic
 * 4. null — only when no specialty is active in the clinic
 * 
 * RULES:
 * - No hardcoded fallback to 'geral' or 'Clínica Geral'
 * - id, key, name, slug always come from the SAME object
 * - Consumers must not render clinical context until isResolved === true
 */

import { OFFICIAL_SPECIALTIES, type OfficialSpecialtyDef } from '@/constants/officialSpecialties';

// ---------------------------------------------------------------------------
// Core resolved type — used system-wide
// ---------------------------------------------------------------------------

export interface ResolvedSpecialty {
  /** Database UUID */
  id: string;
  /** Official slug key (e.g. 'psicologia', 'nutricao') */
  key: string;
  /** Display name from DB (e.g. 'Psicologia', 'Nutrição') */
  name: string;
  /** Same as key for official specialties */
  slug: string;
  /** Clinic that owns this specialty record */
  clinicId: string | null;
  /** Whether it's active */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Slug resolution — maps DB name to official slug
// ---------------------------------------------------------------------------

const NAME_TO_SLUG_MAP: Record<string, string> = {};

// Build from official list
for (const spec of OFFICIAL_SPECIALTIES) {
  NAME_TO_SLUG_MAP[spec.name.toLowerCase().trim()] = spec.slug;
}

// Additional aliases
const ALIASES: Record<string, string> = {
  'clinica geral': 'geral',
  'clínica geral': 'geral',
  'clínica médica': 'geral',
  'clinica medica': 'geral',
  'medicina geral': 'geral',
  'dentista': 'odontologia',
  'psicólogo': 'psicologia',
  'psicologo': 'psicologia',
  'nutricao': 'nutricao',
  'nutricionista': 'nutricao',
  'estética': 'estetica',
  'estetica': 'estetica',
  'harmonização facial': 'estetica',
  'harmonizacao facial': 'estetica',
  'estética / harmonização facial': 'estetica',
  'dermatologista': 'dermatologia',
  'dermato': 'dermatologia',
  'fisioterapeuta': 'fisioterapia',
  'pilates clínico': 'pilates',
  'studio pilates': 'pilates',
  'pediatra': 'pediatria',
};

Object.assign(NAME_TO_SLUG_MAP, ALIASES);

/**
 * Resolve a name or slug string to an official specialty slug.
 * Returns null if no match found — NEVER returns 'geral' as fallback.
 */
export function resolveOfficialSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  // Direct slug match
  const directMatch = OFFICIAL_SPECIALTIES.find(s => s.slug === normalized);
  if (directMatch) return directMatch.slug;

  // Name/alias match
  if (NAME_TO_SLUG_MAP[normalized]) return NAME_TO_SLUG_MAP[normalized];

  // Partial match
  for (const [pattern, slug] of Object.entries(NAME_TO_SLUG_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return slug;
    }
  }

  return null;
}

/**
 * Get the official display name for a slug.
 */
export function getOfficialName(slug: string): string | null {
  const match = OFFICIAL_SPECIALTIES.find(s => s.slug === slug);
  return match?.name ?? null;
}

/**
 * Check if a slug is an official specialty.
 */
export function isOfficialSlug(slug: string): boolean {
  return OFFICIAL_SPECIALTIES.some(s => s.slug === slug);
}
