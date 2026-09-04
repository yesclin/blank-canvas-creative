import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve o `specialty_id` (tabela `specialties`) a partir do slug/chave usado no
 * frontend. A coluna `clinical_evolutions.specialty` não existe — o vínculo é
 * feito exclusivamente por `specialty_id`.
 *
 * Retorna `null` quando a clínica não possui a especialidade cadastrada.
 */

// UUID inexistente: usado como filtro "não encontra nada" para evitar
// enviar valores inválidos ao PostgREST (que resultariam em 400).
export const NO_MATCH_UUID = "00000000-0000-0000-0000-000000000000";

const SLUG_ALIASES: Record<string, string[]> = {
  geral: ["geral", "clinica-geral"],
  fisioterapia: ["fisioterapia"],
  pilates: ["pilates", "fisioterapia-pilates"],
  estetica: ["estetica", "estetica-harmonizacao-facial"],
  nutricao: ["nutricao"],
  psicologia: ["psicologia"],
  odontologia: ["odontologia"],
  dermatologia: ["dermatologia"],
  pediatria: ["pediatria"],
};

const cache = new Map<string, Promise<string | null>>();

export async function resolveSpecialtyIdBySlug(
  clinicId: string | null | undefined,
  slug: string,
): Promise<string | null> {
  if (!clinicId || !slug) return null;

  const key = `${clinicId}:${slug}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const candidates = SLUG_ALIASES[slug] ?? [slug];

  const promise = (async () => {
    const { data, error } = await supabase
      .from("specialties")
      .select("id, slug")
      .eq("clinic_id", clinicId)
      .in("slug", candidates)
      .limit(1);

    if (error) {
      console.error("Erro ao resolver specialty_id:", error);
      cache.delete(key);
      return null;
    }

    return data?.[0]?.id ?? null;
  })();

  cache.set(key, promise);
  return promise;
}

/** Valor seguro para usar em `.eq('specialty_id', ...)`. */
export async function resolveSpecialtyFilterId(
  clinicId: string | null | undefined,
  slug: string,
): Promise<string> {
  return (await resolveSpecialtyIdBySlug(clinicId, slug)) ?? NO_MATCH_UUID;
}

export function clearSpecialtyIdCache() {
  cache.clear();
}
