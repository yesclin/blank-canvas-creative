import { OTHER_SPECIALTY_SLUG } from "@/constants/officialSpecialties";
import { supabase } from "@/integrations/supabase/client";

export type SpecialtyDisplayAliasMap = Record<string, string>;

export interface SpecialtyDisplayLike {
  slug?: string | null;
  name?: string | null;
}

export function isOtherSpecialtyLike(specialty: SpecialtyDisplayLike | null | undefined): boolean {
  const slug = specialty?.slug?.trim().toLowerCase();
  const name = specialty?.name?.trim().toLowerCase();

  return (
    slug === OTHER_SPECIALTY_SLUG ||
    name === OTHER_SPECIALTY_SLUG ||
    name === "outra especialidade / atendimento geral" ||
    name === "outra especialidade" ||
    name === "atendimento geral"
  );
}

export function getSpecialtyDisplayName(
  specialty: SpecialtyDisplayLike | null | undefined,
  aliases: SpecialtyDisplayAliasMap | null | undefined,
): string {
  if (isOtherSpecialtyLike(specialty)) {
    const alias = aliases?.[OTHER_SPECIALTY_SLUG]?.trim();
    if (alias) return alias;
  }

  return specialty?.name ?? "";
}

/**
 * Cache de deduplicação para os apelidos de especialidade.
 *
 * `fetchClinicSpecialtyAliases` é chamado dentro de MUITAS queryFn diferentes
 * (agenda, prontuário, relatórios, profissionais, especialidades habilitadas).
 * Cada chamada gerava um request próprio a `clinic_specialty_aliases` — dezenas
 * por navegação, todos com o mesmo resultado. Aqui centralizamos:
 *  - chamadas concorrentes compartilham a MESMA promise (in-flight dedupe);
 *  - o resultado fica em memória por `ALIAS_TTL_MS` (revalida depois disso).
 *
 * A tabela é minúscula e muda apenas em Configurações, por isso o TTL longo.
 */
const ALIAS_TTL_MS = 5 * 60_000;

interface AliasCacheEntry {
  value?: SpecialtyDisplayAliasMap;
  fetchedAt?: number;
  inFlight?: Promise<SpecialtyDisplayAliasMap>;
}

const aliasCache = new Map<string, AliasCacheEntry>();

/** Invalida o cache local (usar após salvar apelidos em Configurações). */
export function invalidateClinicSpecialtyAliases(clinicId?: string | null) {
  if (clinicId) aliasCache.delete(clinicId);
  else aliasCache.clear();
}

async function loadClinicSpecialtyAliases(clinicId: string): Promise<SpecialtyDisplayAliasMap> {
  const { data, error } = await supabase
    .from("clinic_specialty_aliases")
    .select("base_specialty_key, display_name")
    .eq("clinic_id", clinicId);

  if (error) {
    console.error("Error fetching clinic specialty aliases:", error);
    return {};
  }

  return Object.fromEntries(
    (data ?? [])
      .map((alias) => [alias.base_specialty_key, alias.display_name?.trim()])
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
  );
}

export async function fetchClinicSpecialtyAliases(
  clinicId: string | null | undefined,
): Promise<SpecialtyDisplayAliasMap> {
  if (!clinicId) return {};

  const entry = aliasCache.get(clinicId) ?? {};

  if (entry.value && entry.fetchedAt && Date.now() - entry.fetchedAt < ALIAS_TTL_MS) {
    return entry.value;
  }
  if (entry.inFlight) return entry.inFlight;

  const inFlight = loadClinicSpecialtyAliases(clinicId)
    .then((value) => {
      aliasCache.set(clinicId, { value, fetchedAt: Date.now() });
      return value;
    })
    .catch((error) => {
      aliasCache.delete(clinicId);
      throw error;
    });

  aliasCache.set(clinicId, { ...entry, inFlight });
  return inFlight;
}