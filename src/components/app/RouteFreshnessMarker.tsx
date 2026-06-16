/**
 * Marca o instante em que a rota atual terminou de renderizar.
 *
 * O `logLateRefetch` (em `queryClientDiagnostics.ts`) usa esse timestamp para
 * avisar quando uma query refaz fetch DEPOIS que a tela já estava visível —
 * o que indica provider/efeito disparando recarga indesejada.
 *
 * Em produção, o componente não faz nada.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function RouteFreshnessMarker() {
  const location = useLocation();
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    (window as Window & { __ycRouteRenderedAt?: number }).__ycRouteRenderedAt = performance.now();
  }, [location.pathname]);
  return null;
}
