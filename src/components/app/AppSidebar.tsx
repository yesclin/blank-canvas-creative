import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Building2,
  Megaphone,
  Settings,
  DollarSign,
  Package,
  BarChart3,
  ShieldAlert,
  Building,
  UserCog,
  ListChecks,
  CalendarCog,
  Shield,
  ChevronDown,
  Wallet,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserProfileFooter } from "./UserProfileFooter";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useMemo } from "react";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  tourId?: string;
}

// =====================================================
// MENU DEFINITIONS BY USER TYPE
// =====================================================

// Proprietário/Administrador - ALL MENUS
const ownerAdminMainMenu: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, tourId: "dashboard" },
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda" },
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients" },
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, tourId: "medical-record" },
  { title: "Marketing", url: "/app/marketing", icon: Megaphone, tourId: "communication" },
];

const ownerAdminGestaoMenu: MenuItem[] = [
  { title: "Controle de Estoque", url: "/app/gestao/estoque", icon: Package },
  { title: "Finanças", url: "/app/gestao/financas", icon: DollarSign },
  { title: "Convênios", url: "/app/gestao/convenios", icon: Building2 },
  { title: "Relatórios", url: "/app/gestao/relatorios", icon: BarChart3 },
  { title: "Auditoria", url: "/app/gestao/auditoria", icon: ShieldAlert },
];

const ownerAdminConfigMenu: MenuItem[] = [
  { title: "Procedimentos", url: "/app/config/procedimentos", icon: ListChecks },
  { title: "Clínica", url: "/app/config/clinica", icon: Building },
  { title: "Usuários & Permissões", url: "/app/config/usuarios", icon: UserCog },
  { title: "Cadastros Clínicos", url: "/app/config/materiais", icon: Package },
  { title: "Regras de Agenda", url: "/app/config/agenda", icon: CalendarCog },
  
  { title: "Modelos de Prontuário", url: "/app/config/prontuario", icon: FileText },
  { title: "LGPD & Segurança", url: "/app/config/seguranca", icon: Shield },
  { title: "Integrações", url: "/app/config/integracoes", icon: Plug },
  { title: "Documentos Institucionais", url: "/app/config/documentos-institucionais", icon: FileText },
];

// Profissional de Saúde - Limited menus (own data only)
const professionalMainMenu: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, tourId: "dashboard" }, // Own data
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda" }, // Own schedule
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients" }, // Own patients
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, tourId: "medical-record" },
  { title: "Meu Financeiro", url: "/app/meu-financeiro", icon: Wallet }, // Own financial
];

// Recepcionista - No clinical content, no configurations
const receptionistMainMenu: MenuItem[] = [
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda" }, // All professionals
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients" }, // Registration data only
  
];

const receptionistGestaoMenu: MenuItem[] = [
  { title: "Convênios", url: "/app/gestao/convenios", icon: Building2 },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin, isOwner, isRecepcionista, role, isLoading: permissionsLoading } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === path;
    // Handle query param-based tabs (e.g., /app/marketing?tab=templates)
    if (path.includes("?")) {
      const [basePath, queryString] = path.split("?");
      if (currentPath !== basePath) return false;
      const params = new URLSearchParams(queryString);
      const tabParam = params.get("tab");
      const currentTab = new URLSearchParams(location.search).get("tab");
      return tabParam === currentTab;
    }
    // For /app/marketing, active when on any marketing route
    if (path === "/app/marketing") {
      return currentPath.startsWith("/app/marketing");
    }
    return currentPath.startsWith(path);
  };

  // Determine menus based on user type
  const { mainItems, gestaoItems, configItems } = useMemo(() => {
    // Owner/Admin - full access
    if (isOwner || isAdmin) {
      return {
        mainItems: ownerAdminMainMenu,
        gestaoItems: ownerAdminGestaoMenu,
        configItems: ownerAdminConfigMenu,
      };
    }
    
    // Receptionist - limited access, no clinical, no config
    if (isRecepcionista) {
      return {
        mainItems: receptionistMainMenu,
        gestaoItems: receptionistGestaoMenu,
        configItems: [],
      };
    }
    
    // Professional - clinical access, own data, no config
    if (role === 'profissional') {
      return {
        mainItems: professionalMainMenu,
        gestaoItems: [],
        configItems: [],
      };
    }
    
    // Default fallback
    return {
      mainItems: [],
      gestaoItems: [],
      configItems: [],
    };
  }, [isOwner, isAdmin, isRecepcionista, role]);

  const isGestaoActive = gestaoItems.some((item) => isActive(item.url));
  const isConfigActive = configItems.some((item) => isActive(item.url));

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className={cn(
          "border-b border-sidebar-border transition-all duration-200",
          isCollapsed ? "p-2 flex justify-center" : "p-4"
        )}>
          <div className={cn(
            "flex items-center min-w-0",
            isCollapsed ? "justify-center" : "gap-2"
          )}>
            {isCollapsed ? (
              <img src={logoIcon} alt="Yesclin" className="w-8 h-8 shrink-0 object-contain" />
            ) : (
              <img src={logoFull} alt="Yesclin" className="h-8 object-contain" />
            )}
          </div>
        </div>

        {/* Menu Principal */}
        {mainItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center" : "gap-2"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gestão - Only rendered if user has access */}
        {gestaoItems.length > 0 && (
          <SidebarGroup data-tour="management">
            {isCollapsed ? (
              // Collapsed: show only icons without grouping
              <SidebarGroupContent>
                <SidebarMenu>
                  {gestaoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center justify-center">
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              // Expanded: show collapsible group with labels
              <Collapsible defaultOpen={isGestaoActive}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                    <span>Gestão</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {gestaoItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive(item.url)}
                          >
                            <NavLink to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        )}

        {/* Configurações - Only rendered for Owner/Admin */}
        {configItems.length > 0 && (
          <SidebarGroup data-tour="settings">
            {isCollapsed ? (
              // Collapsed: show only icons without grouping
              <SidebarGroupContent>
                <SidebarMenu>
                  {configItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center justify-center">
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              // Expanded: show collapsible group with labels
              <Collapsible defaultOpen={isConfigActive}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Settings className="h-4 w-4 shrink-0" />
                      <span className="truncate">Configurações</span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {configItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive(item.url)}
                          >
                            <NavLink to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-0 border-t border-sidebar-border" data-tour="user-profile">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  );
}