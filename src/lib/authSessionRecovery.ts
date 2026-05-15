import { supabase } from "@/integrations/supabase/client";

/**
 * Tenta recuperar a sessão Supabase de forma resiliente após um evento
 * SIGNED_OUT espúrio (ex.: rotação de refresh token, perda momentânea de
 * rede, suspensão da aba). Faz múltiplas tentativas com backoff e também
 * tenta um `refreshSession` antes de declarar a sessão como definitivamente
 * perdida.
 *
 * Retorna:
 *  - { recovered: true, session } se conseguiu confirmar uma sessão válida
 *  - { recovered: false, definitive: true } se confirmou ausência de sessão
 *    (todas as leituras retornaram null e refresh falhou de forma não-rede)
 *  - { recovered: false, definitive: false } se não conseguiu decidir por
 *    falha de rede — o chamador NÃO deve derrubar o usuário neste caso.
 */
export async function tryRecoverSession(opts?: {
  attempts?: number;
  delaysMs?: number[];
}): Promise<
  | { recovered: true; session: any }
  | { recovered: false; definitive: boolean }
> {
  const delays = opts?.delaysMs ?? [250, 750, 2000, 4000];
  const attempts = opts?.attempts ?? delays.length;
  let networkFailures = 0;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delays[i - 1] ?? 1000));
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        return { recovered: true, session: data.session };
      }
      if (error) {
        if (isTransientAuthError(error)) {
          networkFailures++;
          continue;
        }
        // erro definitivo (ex.: invalid refresh token)
        return { recovered: false, definitive: true };
      }
      // sem sessão e sem erro: pode ser intermediário; continua tentando
    } catch (err) {
      if (isTransientAuthError(err)) {
        networkFailures++;
        continue;
      }
      // erro inesperado: trata como transitório, não derruba usuário
      networkFailures++;
    }
  }

  // Tenta um refresh explícito como última cartada
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (data?.session) return { recovered: true, session: data.session };
    if (error && !isTransientAuthError(error)) {
      return { recovered: false, definitive: true };
    }
  } catch (err) {
    if (!isTransientAuthError(err)) {
      // ainda assim, sem certeza — manter usuário
    }
  }

  // Se só tivemos falhas de rede, NÃO é definitivo.
  return { recovered: false, definitive: networkFailures === 0 };
}

export function isTransientAuthError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as any;
  const msg = String(anyErr?.message ?? anyErr ?? "").toLowerCase();
  const status: number = Number(anyErr?.status ?? 0);
  if (status >= 500 || status === 0 || status === 408 || status === 429) return true;
  const hints = [
    "failed to fetch",
    "network",
    "timeout",
    "fetch failed",
    "offline",
    "connection",
    "load failed",
    "aborted",
    "temporarily",
    "indispon",
    "socket",
  ];
  return hints.some((h) => msg.includes(h));
}
