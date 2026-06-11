import { ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SupportSessionBanner } from './SupportSessionBanner';
import { Button } from '@/components/ui/button';
import { LogOut, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { markUserLogout } from '@/lib/authIntent';
import { clearAuthenticatedTab, clearSupabaseAuthStorage } from '@/lib/authSessionIsolation';
import { useQueryClient } from '@tanstack/react-query';
import { clearReactQueryCache } from '@/lib/queryClientDiagnostics';

interface Props {
  children?: ReactNode;
}

export function SuperAdminLayout({ children }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email } = usePlatformAdmin();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as typeof window & { __ycSuperAdminLayoutMountCount?: number };
      w.__ycSuperAdminLayoutMountCount = (w.__ycSuperAdminLayoutMountCount ?? 0) + 1;
    }
    if (!import.meta.env.DEV) return;
    console.log('SUPER ADMIN LAYOUT MOUNT');
    return () => console.warn('SUPER ADMIN LAYOUT UNMOUNT', { route: window.location.pathname });
  }, []);

  const handleLogout = async () => {
    markUserLogout("super-admin-logout");
    clearAuthenticatedTab();
    clearSupabaseAuthStorage();
    try { clearReactQueryCache(queryClient, "super-admin-logout"); } catch { /* ignore */ }
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };


  return (
    <SidebarProvider>
      <SupportSessionBanner />
      <div className="flex min-h-screen w-full bg-muted/30">
        <SuperAdminSidebar />

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-medium text-muted-foreground">
                Painel administrativo da plataforma
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
              <Button variant="outline" size="sm" onClick={() => window.open('/app', '_blank')}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Ir para o app
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children ?? <Outlet />}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
