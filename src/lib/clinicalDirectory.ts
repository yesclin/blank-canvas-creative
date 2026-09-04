/**
 * Diretório clínico com cache compartilhado.
 *
 * Motivo: cada hook de bloco do prontuário (anamnese, evolução, conduta,
 * diagnósticos, exame físico, prescrições, documentos, alertas, psicologia,
 * nutrição...) fazia por conta própria:
 *   1. "quem sou eu" -> `profiles` + `professionals` por `user_id`;
 *   2. "nome dos autores" -> `professionals` (+ `profiles`) por lista de ids.
 *
 * Com ~15 hooks montados na mesma tela, isso gerava dezenas de requests
 * idênticos por navegação (principal causa dos tempos altos em "Stalled").
 *
 * Aqui centralizamos as duas consultas com:
 *  - deduplicação de chamadas concorrentes (mesma promise em vôo);
 *  - cache em memória com TTL (dados praticamente estáveis na sessão).
 *
 * Nenhuma regra de negócio muda: as funções retornam exatamente o mesmo
 * formato que os blocos originais montavam.
 */
import { supabase } from "@/integrations/supabase/client";

const IDENTITY_TTL_MS = 5 * 60_000;
const NAMES_TTL_MS = 5 * 60_000;

export interface ClinicalIdentity {
  userId: string | null;
  profileName: string | null;
  professionalId: string | null;
}

const EMPTY_IDENTITY: ClinicalIdentity = { userId: null, profileName: null, professionalId: null };

interface CacheEntry<T> {
  value?: T;
  fetchedAt?: number;
  inFlight?: Promise<T>;
}

const identityCache = new Map<string, CacheEntry<ClinicalIdentity>>();
const namesCache = new Map<string, { name: string; fetchedAt: number }>();
const namesInFlight = new Map<string, Promise<Record<string, string>>>();

/** Limpa os caches (usar em logout / troca de identidade). */
export function clearClinicalDirectoryCache() {
  identityCache.clear();
  namesCache.clear();
  namesInFlight.clear();
}

async function loadIdentity(clinicId: string): Promise<ClinicalIdentity> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return EMPTY_IDENTITY;

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
  ]);

  return {
    userId: user.id,
    profileName: profile?.full_name ?? null,
    professionalId: professional?.id ?? null,
  };
}

/**
 * Identidade clínica do usuário logado na clínica ativa.
 * Compartilhada por todos os blocos do prontuário.
 */
export async function fetchClinicalIdentity(
  clinicId: string | null | undefined,
): Promise<ClinicalIdentity> {
  if (!clinicId) return EMPTY_IDENTITY;

  const entry = identityCache.get(clinicId) ?? {};
  if (entry.value && entry.fetchedAt && Date.now() - entry.fetchedAt < IDENTITY_TTL_MS) {
    return entry.value;
  }
  if (entry.inFlight) return entry.inFlight;

  const inFlight = loadIdentity(clinicId)
    .then((value) => {
      identityCache.set(clinicId, { value, fetchedAt: Date.now() });
      return value;
    })
    .catch((error) => {
      identityCache.delete(clinicId);
      throw error;
    });

  identityCache.set(clinicId, { ...entry, inFlight });
  return inFlight;
}

async function loadProfessionalNames(ids: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (ids.length === 0) return result;

  const { data: professionals, error } = await supabase
    .from("professionals")
    .select("id, user_id, full_name")
    .in("id", ids);

  if (error) {
    console.error("[clinicalDirectory] erro ao buscar nomes de profissionais:", error);
    return result;
  }

  const missingUserIds: string[] = [];
  for (const prof of professionals ?? []) {
    const name = prof.full_name?.trim();
    if (name) {
      result[prof.id] = name;
    } else if (prof.user_id) {
      missingUserIds.push(prof.user_id);
    }
  }

  // Fallback: profissionais sem `full_name` preenchido usam o nome do perfil.
  if (missingUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", missingUserIds);

    const byUser = new Map<string, string | null>((profiles ?? []).map((p) => [p.user_id as string, p.full_name]));
    for (const prof of professionals ?? []) {
      if (result[prof.id]) continue;
      const fallback = prof.user_id ? byUser.get(prof.user_id) : null;
      if (fallback) result[prof.id] = fallback;
    }
  }

  return result;
}

/**
 * Mapa `professional_id -> nome` com cache por id.
 * Só busca no servidor os ids ainda não conhecidos (ou já expirados).
 */
export async function resolveProfessionalNames(
  professionalIds: readonly unknown[],
): Promise<Record<string, string>> {
  const ids = Array.from(
    new Set(professionalIds.filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
  if (ids.length === 0) return {};

  const now = Date.now();
  const result: Record<string, string> = {};
  const pending: Promise<Record<string, string>>[] = [];
  const missing: string[] = [];

  for (const id of ids) {
    const cached = namesCache.get(id);
    if (cached && now - cached.fetchedAt < NAMES_TTL_MS) {
      result[id] = cached.name;
      continue;
    }
    const inFlight = namesInFlight.get(id);
    if (inFlight) {
      pending.push(inFlight);
      continue;
    }
    missing.push(id);
  }

  if (missing.length > 0) {
    const request = loadProfessionalNames(missing)
      .then((names) => {
        const fetchedAt = Date.now();
        for (const [id, name] of Object.entries(names)) {
          namesCache.set(id, { name, fetchedAt });
        }
        return names;
      })
      .finally(() => {
        for (const id of missing) namesInFlight.delete(id);
      });

    for (const id of missing) namesInFlight.set(id, request);
    pending.push(request);
  }

  const resolved = await Promise.all(pending);
  for (const names of resolved) {
    for (const [id, name] of Object.entries(names)) {
      if (ids.includes(id)) result[id] = name;
    }
  }

  return result;
}
