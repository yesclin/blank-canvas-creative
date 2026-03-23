import { lazy, Suspense, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, MessageSquare, Zap, Megaphone,
  History, MessageCircle, Wifi, WifiOff, Settings, Loader2,
} from "lucide-react";
import { useWhatsAppIntegration } from "@/hooks/useWhatsAppIntegration";
import { cn } from "@/lib/utils";

// Lazy-loaded tab content — only loads when tab is activated
const MarketingDashboard = lazy(() => import("./MarketingDashboard"));
const MarketingTemplates = lazy(() => import("./MarketingTemplates"));
const MarketingAutomacoes = lazy(() => import("./MarketingAutomacoes"));
const MarketingCampanhas = lazy(() => import("./MarketingCampanhas"));
const MarketingHistorico = lazy(() => import("./MarketingHistorico"));
const MarketingConfigWhatsApp = lazy(() => import("./MarketingConfigWhatsApp"));

const TABS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "templates", label: "Templates", icon: MessageSquare },
  { value: "automacoes", label: "Automações", icon: Zap },
  { value: "campanhas", label: "Campanhas", icon: Megaphone },
  { value: "historico", label: "Histórico", icon: History },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const TAB_COMPONENTS: Record<TabValue, React.LazyExoticComponent<() => JSX.Element>> = {
  dashboard: MarketingDashboard,
  templates: MarketingTemplates,
  automacoes: MarketingAutomacoes,
  campanhas: MarketingCampanhas,
  historico: MarketingHistorico,
  whatsapp: MarketingConfigWhatsApp,
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
  const tabFromUrl = (searchParams.get("tab") as TabValue) || "dashboard";
  const activeTab: TabValue = TABS.some((t) => t.value === tabFromUrl) ? tabFromUrl : "dashboard";

  const { isConfigured, loading: whatsappLoading } = useWhatsAppIntegration();

  const handleTabChange = useCallback((value: TabValue) => {
    if (value === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  }, [setSearchParams]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-0">
      {/* ── Premium Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Marketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">CRM clínico, automações e campanhas</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WhatsApp Status Indicator */}
          {!whatsappLoading && (
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1.5 text-xs font-medium gap-1.5 border transition-colors cursor-default",
                isConfigured
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                  : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              )}
            >
              {isConfigured ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <Wifi className="h-3 w-3" />
                  Conectado
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <WifiOff className="h-3 w-3" />
                  Desconectado
                </>
              )}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleTabChange("whatsapp")}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Configurar WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* ── Animated Tab Bar ── */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-none" aria-label="Abas do Marketing">
          {TABS.map(({ value, label, icon: Icon }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="hidden sm:inline">{label}</span>
                {/* Active indicator line */}
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

      {/* ── Tab Content with Fade ── */}
      <div key={activeTab} className="animate-fade-in">
        <Suspense fallback={<TabFallback />}>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}
