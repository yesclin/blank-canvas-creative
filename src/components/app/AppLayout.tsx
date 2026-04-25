import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { GuidedTour } from "./GuidedTour";
import { useClinicData } from "@/hooks/useClinicData";
import { Building2, ChevronDown } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { ActiveSpecialtiesBadge } from "./ActiveSpecialtiesBadge";
import { GlobalSpecialtyProvider } from "@/hooks/useGlobalSpecialty";
import { GlobalActiveAppointmentProvider } from "@/contexts/GlobalActiveAppointmentContext";
import { FloatingActiveAppointmentButton } from "./FloatingActiveAppointmentButton";
import { ActiveAppointmentDrawer } from "./ActiveAppointmentDrawer";
import { ErrorBoundary } from "./ErrorBoundary";
import { useLocation as useRouteLocation } from "react-router-dom";

function getModuleScope(pathname: string): string {
  if (pathname.startsWith("/app/prontuario")) return "Prontuário";
  if (pathname.startsWith("/app/atendimento")) return "Atendimento";
  if (pathname.startsWith("/app/agenda")) return "Agenda";
  if (pathname.startsWith("/app/marketing")) return "Marketing";
  if (pathname.startsWith("/app/gestao/financas") || pathname.startsWith("/app/meu-financeiro")) return "Financeiro";
  if (pathname.startsWith("/app/gestao/estoque")) return "Estoque";
  if (pathname.startsWith("/app/config")) return "Configurações";
  if (pathname.startsWith("/app/comercial")) return "Comercial";
  if (pathname.startsWith("/app/teleconsulta")) return "Teleconsulta";
  return "App";
}

export function AppLayout() {
  const location = useLocation();
  const { clinic, isLoading } = useClinicData();

  return (
    <GlobalSpecialtyProvider>
    <GlobalActiveAppointmentProvider>
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2.5">
              <img src={logoFull} alt="Yesclin" className="h-7 w-auto object-contain" />
              <div className="h-5 w-px bg-border" />
              {isLoading ? (
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              ) : clinic ? (
                <button className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {clinic.logo_url ? (
                    <img src={clinic.logo_url} alt={clinic.name} className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-[200px]">{clinic.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ) : (
                <span className="text-sm font-semibold text-foreground">Yesclin</span>
              )}
            </div>
            <ActiveSpecialtiesBadge />
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <ErrorBoundary key={location.pathname} scope={getModuleScope(location.pathname)}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
    </SidebarProvider>
    
    {/* Global Active Appointment Widget - must be inside GlobalActiveAppointmentProvider */}
    <FloatingActiveAppointmentButton />
    <ActiveAppointmentDrawer />
    
    {/* Onboarding Wizard */}
    <OnboardingWizard />
    
    {/* Guided Tour for first-time users */}
    {location.pathname === "/app" && <GuidedTour />}
    </GlobalActiveAppointmentProvider>
    </GlobalSpecialtyProvider>
  );
}
