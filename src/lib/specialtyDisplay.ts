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

export async function fetchClinicSpecialtyAliases(
  clinicId: string | null | undefined,
): Promise<SpecialtyDisplayAliasMap> {
  if (!clinicId) return {};

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