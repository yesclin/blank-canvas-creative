import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * usePageResumeRecovery
 *
 * Quando a aba do navegador fica em segundo plano por muito tempo (ex.: o
 * usuário troca para outra aba no Lovable), o browser suspende timers,
 * conexões e o Supabase pode perder o evento de refresh de token. Ao voltar,
 * o app pode parecer travado em loading enquanto queries antigas nunca
 * resolvem.
 *
 * Este hook escuta o `visibilitychange` e, ao retornar à aba:
 *   - revalida a sessão Supabase (sem await bloqueante no listener),
 *   - usa debounce + ref para evitar disparos duplicados,
 *   - sempre captura erros — nunca propaga exceções.
 *
 * Não força reload da página, não invalida/refaz queries e não derruba sessão.
 */
export function usePageResumeRecovery(options?: { debounceMs?: number; minHiddenMs?: number }) {
  const runningRef = useRef(false);
  const lastRunRef = useRef(0);
  const hiddenSinceRef = useRef<number | null>(null);
  const debounceMs = options?.debounceMs ?? 500;
  const minHiddenMs = options?.minHiddenMs ?? 5_000;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const recover = async (reason: string) => {
      const now = Date.now();
      if (runningRef.current) return;
      if (now - lastRunRef.current < debounceMs) return;
      runningRef.current = true;
      lastRunRef.current = now;

      try {
        // Revalidar sessão sem disparar refetch de dados sensíveis. O refresh
        // do JWT não pode trocar profile/clinic/permissions nem piscar a UI.
        try {
          await supabase.auth.getSession();
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[RESUME] getSession falhou", err);
        }

        if (import.meta.env.DEV) {
          console.log("[RESUME] recuperação concluída", { reason });
        }
      } finally {
        runningRef.current = false;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSinceRef.current = Date.now();
        return;
      }
      if (document.visibilityState === "visible") {
        const since = hiddenSinceRef.current;
        hiddenSinceRef.current = null;
        // Só executamos a recuperação se a aba ficou escondida por
        // tempo suficiente — evita custo em alt-tab rápidos.
        if (since && Date.now() - since >= minHiddenMs) {
          void recover("visibilitychange");
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [debounceMs, minHiddenMs]);
}
