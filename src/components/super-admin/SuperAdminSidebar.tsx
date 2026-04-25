import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Users,
  Bug,
  ScrollText,
  Plug,
  Activity,
  Wallet,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/super-admin', icon: LayoutDashboard, exact: true },
  { title: 'Clínicas', url: '/super-admin/clinicas', icon: Building2 },
  { title: 'Planos', url: '/super-admin/planos', icon: Package },
  { title: 'Assinaturas', url: '/super-admin/assinaturas', icon: CreditCard },
  { title: 'Usuários', url: '/super-admin/usuarios', icon: Users },
  { title: 'Ocorrências', url: '/super-admin/ocorrencias', icon: Bug },
  { title: 'Logs e Auditoria', url: '/super-admin/logs', icon: ScrollText },
  { title: 'Integrações', url: '/super-admin/integracoes', icon: Plug },
  { title: 'Uso da Plataforma', url: '/super-admin/uso', icon: Activity },
  { title: 'Financeiro SaaS', url: '/super-admin/financeiro', icon: Wallet },
  { title: 'Configurações', url: '/super-admin/configuracoes', icon: Settings },
];

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (url: string, exact?: boolean) =>
    exact ? location.pathname === url : location.pathname === url || location.pathname.startsWith(url + '/');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">YesClin</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Super Admin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url, item.exact);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.exact} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
