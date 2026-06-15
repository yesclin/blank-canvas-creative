import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  /** Tempo (ms) para exibir o aviso "está demorando mais que o normal". */
  slowAfterMs?: number;
}

/**
 * Skeleton genérico e leve usado como fallback de Suspense em rotas internas.
 *
 * Substitui o antigo loading central com logo grande. O AppLayout (sidebar +
 * header) continua visível enquanto este skeleton ocupa apenas a área de
 * conteúdo.
 *
 * Após `slowAfterMs` mostra um aviso discreto + botão "Tentar novamente"
 * (recarrega a tela atual).
 */
export function PageSkeleton({ slowAfterMs = 8000 }: PageSkeletonProps) {
  void slowAfterMs;

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200" aria-busy="true" aria-live="polite">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
