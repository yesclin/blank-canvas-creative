import { lazy, Suspense, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, MessageSquare, Send, Filter,
  History, Settings, Zap, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-loaded tab content
const MarketingPainel = lazy(() => import("./MarketingPainel"));
const MarketingCentral = lazy(() => import("./MarketingCentral"));
const MarketingTemplates = lazy(() => import("./MarketingTemplates"));
const MarketingAutomacoes = lazy(() => import("./MarketingAutomacoes"));
const MarketingSegmentacoes = lazy(() => import("./MarketingSegmentacoes"));
const MarketingHistorico = lazy(() => import("./MarketingHistorico"));
const MarketingIntegracoes = lazy(() => import("./MarketingIntegracoes"));

const TABS = [
  { value: "painel", label: "Painel", icon: LayoutDashboard },
  { value: "central", label: "Central de Mensagens", icon: Send },
  { value: "templates", label: "Templates", icon: MessageSquare },
  { value: "automacoes", label: "Automações", icon: Zap },
  { value: "segmentacoes", label: "Segmentações", icon: Filter },
  { value: "historico", label: "Histórico", icon: History },
  { value: "integracoes", label: "Integrações", icon: Settings },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const TAB_COMPONENTS: Record<TabValue, React.LazyExoticComponent<() => JSX.Element>> = {
  painel: MarketingPainel,
  central: MarketingCentral,
  templates: MarketingTemplates,
  automacoes: MarketingAutomacoes,
  segmentacoes: MarketingSegmentacoes,
  historico: MarketingHistorico,
  integracoes: MarketingIntegracoes,
};

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function MarketingLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as TabValue) || "painel";
  const activeTab: TabValue = TABS.some((t) => t.value === tabFromUrl) ? tabFromUrl : "painel";

  const handleTabChange = useCallback((value: TabValue) => {
    if (value === "painel") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  }, [setSearchParams]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Comunicação & Relacionamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mensagens, segmentações e acompanhamento de pacientes
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-none" aria-label="Abas de Comunicação">
          {TABS.map(({ value, label, icon: Icon }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="hidden sm:inline">{label}</span>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ease-out",
                    isActive
                      ? "bg-primary scale-x-100"
                      : "bg-transparent scale-x-0 group-hover:scale-x-50 group-hover:bg-muted-foreground/30"
                  )}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="animate-fade-in">
        <Suspense fallback={<TabFallback />}>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}
