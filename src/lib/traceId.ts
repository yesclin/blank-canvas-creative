/**
 * Pequeno utilitário para gerar IDs de correlação (trace_id) usados
 * para amarrar múltiplos logs de um mesmo fluxo (assinatura, aceite,
 * geração de PDF, etc.). Curto, opaco, seguro para exibir em console.
 *
 * Formato: `<prefix>_<timestamp36>_<random8>` — ex: `sig_lr3k2_a91f4c2e`.
 */
export function newTraceId(prefix: string = "trace"): string {
  const ts = Date.now().toString(36);
  let rand = "";
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      rand = (crypto as Crypto).randomUUID().replace(/-/g, "").slice(0, 8);
    } else if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const arr = new Uint8Array(4);
      (crypto as Crypto).getRandomValues(arr);
      rand = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fallback below */
  }
  if (!rand) {
    rand = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  }
  return `${prefix}_${ts}_${rand}`;
}
