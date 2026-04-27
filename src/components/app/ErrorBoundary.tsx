import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  /** Nome do escopo para logs (ex: "Prontuário", "Agenda"). */
  scope?: string;
  /** Quando true, renderiza um fallback compacto (para seções/partes de tela). */
  compact?: boolean;
  /** Mostrar botão "Voltar para o Dashboard" (default true para boundary global). */
  showHome?: boolean;
  /** Fallback customizado opcional. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  route: string;
  lastEvent: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    lastEvent: typeof window !== "undefined" ? window.__ycLastEvent ?? null : null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      lastEvent: typeof window !== "undefined" ? window.__ycLastEvent ?? null : null,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const route = typeof window !== "undefined" ? window.location.pathname : "unknown";
    const lastEvent = typeof window !== "undefined" ? window.__ycLastEvent ?? null : null;
    const componentName = info.componentStack?.split("\n").find(Boolean)?.trim() ?? this.props.scope ?? "unknown";

    console.groupCollapsed(`[ErrorBoundary] ${this.props.scope || "global"}: ${error.message}`);
    console.error("[APP_ERROR]", error);
    console.error("Stack trace", error.stack);
    console.error("Component", componentName);
    console.error("Route", route);
    console.error("Last event", lastEvent);
    console.error("Component stack", info.componentStack);
    console.groupEnd();
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      lastEvent: typeof window !== "undefined" ? window.__ycLastEvent ?? null : null,
    });
  };

  goHome = () => {
    window.location.href = "/app";
  };

  reload = () => {
    window.location.reload();
  };

  goLogin = () => {
    window.location.href = "/login";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, route, lastEvent } = this.state;
    const { fallback, compact, scope, showHome = true } = this.props;

    if (fallback && error) return fallback(error, this.reset);

    if (compact) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">
                Não foi possível carregar esta seção.
              </p>
              {scope && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Módulo: {scope}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={this.reset}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">
                Algo deu errado ao carregar esta tela.
              </h2>
              <p className="text-sm text-muted-foreground">
                {scope
                  ? `Ocorreu um erro inesperado no módulo "${scope}". Você pode tentar novamente sem perder seu progresso em outras áreas.`
                  : "Ocorreu um erro inesperado. Você pode tentar novamente."}
              </p>
              {error?.message && (
                <div className="text-xs text-muted-foreground/80 font-mono mt-2 p-2 bg-muted rounded break-words text-left space-y-1">
                  <p>{error.message}</p>
                  <p>Rota: {route}</p>
                  <p>Último evento: {lastEvent ?? "indisponível"}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={this.reset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
              {showHome && (
                <Button onClick={this.goHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              )}
              <Button onClick={this.reload} variant="ghost" className="flex-1">
                <RotateCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={this.goLogin} variant="ghost" className="flex-1">
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

/** HOC opcional para envolver páginas/seções rapidamente. */
export function withErrorBoundary<P extends object>(
  Wrapped: React.ComponentType<P>,
  scope?: string,
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary scope={scope}>
        <Wrapped {...props} />
      </ErrorBoundary>
    );
  };
}
