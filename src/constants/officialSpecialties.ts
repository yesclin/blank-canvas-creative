/**
 * YESCLIN OFFICIAL SPECIALTY WHITELIST
 * 
 * This is the SINGLE SOURCE OF TRUTH for all officially supported specialties.
 * NO other specialty should appear anywhere in the system.
 * 
 * This list is CLOSED and IMMUTABLE at the code level.
 * Any specialty not in this list must be blocked from:
 * - Activation in Configurações > Clínica
 * - Display in the header badge
 * - Agenda, Prontuário, Modelos, Procedimentos, Relatórios, Marketing
 * 
 * RULE: Yesclin is NOT an unlimited-specialty system.
 * It is a closed modular system with officially supported specialties.
 */

/**
 * The ONLY valid specialty names in Yesclin.
 * Used as a whitelist filter across the entire application.
 */
export interface OfficialSpecialtyDef {
  name: string;
  slug: string;
}

export const OFFICIAL_SPECIALTIES: readonly OfficialSpecialtyDef[] = [
  { name: "Clínica Geral", slug: "clinica-geral" },
  { name: "Psicologia", slug: "psicologia" },
  { name: "Nutrição", slug: "nutricao" },
  { name: "Fisioterapia", slug: "fisioterapia" },
  { name: "Pilates", slug: "pilates" },
  { name: "Estética / Harmonização Facial", slug: "estetica-harmonizacao" },
  { name: "Odontologia", slug: "odontologia" },
  { name: "Dermatologia", slug: "dermatologia" },
  { name: "Pediatria", slug: "pediatria" },
] as const;

/** Flat array of names for backward compatibility */
export const OFFICIAL_SPECIALTY_NAMES: readonly string[] = OFFICIAL_SPECIALTIES.map(s => s.name);

/** Get the slug for an official specialty name */
export function getSpecialtySlug(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  const match = OFFICIAL_SPECIALTIES.find(s => s.name.toLowerCase() === normalized);
  return match?.slug ?? null;
}

/**
 * Check if a specialty name is in the official whitelist.
 * Case-insensitive comparison with trimming.
 */
export function isOfficialSpecialty(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return OFFICIAL_SPECIALTY_NAMES.some(
    (official) => official.toLowerCase() === normalized
  );
}

/**
 * Filter an array of specialties to only include official ones.
 * Generic to work with any object that has a `name` property.
 */
export function filterOfficialSpecialties<T extends { name: string }>(
  specialties: T[]
): T[] {
  return specialties.filter((s) => isOfficialSpecialty(s.name));
}
