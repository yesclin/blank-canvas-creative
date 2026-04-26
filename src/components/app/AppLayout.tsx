import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { GuidedTour } from "./GuidedTour";
import { useClinicData } from "@/hooks/useClinicData";
import { Building2, ChevronDown, Settings, Users, CreditCard, Image as ImageIcon, ExternalLink } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActiveSpecialtiesBadge } from "./ActiveSpecialtiesBadge";
import { GlobalSpecialtyProvider } from "@/hooks/useGlobalSpecialty";
import { GlobalActiveAppointmentProvider } from "@/contexts/GlobalActiveAppointmentContext";
import { FloatingActiveAppointmentButton } from "./FloatingActiveAppointmentButton";
import { ActiveAppointmentDrawer } from "./ActiveAppointmentDrawer";
import { ErrorBoundary } from "./ErrorBoundary";
import { SubscriptionGate } from "./SubscriptionGate";

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
  const navigate = useNavigate();
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors rounded-md px-1.5 py-1 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring">
                      {clinic.logo_url ? (
                        <img src={clinic.logo_url} alt={clinic.name} className="h-6 w-6 rounded object-cover" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="truncate max-w-[200px]">{clinic.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      {clinic.logo_url ? (
                        <img src={clinic.logo_url} alt={clinic.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-semibold">{clinic.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">Clínica ativa</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/app/config/clinica")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Dados da clínica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/config/clinica?tab=identidade")}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Identidade visual
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/config/equipe")}>
                      <Users className="mr-2 h-4 w-4" />
                      Equipe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/config/plano")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Plano e assinatura
                    </DropdownMenuItem>
                    {clinic.slug && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.open(`/agendar/${clinic.slug}`, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Página pública de agendamento
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-sm font-semibold text-foreground">Yesclin</span>
              )}
            </div>
            <ActiveSpecialtiesBadge />
          </header>
          <div className="flex-1 overflow-auto">
            <SubscriptionGate>
              <div className="p-6">
                <ErrorBoundary key={location.pathname} scope={getModuleScope(location.pathname)}>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </SubscriptionGate>
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
