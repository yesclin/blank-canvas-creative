import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SupportSessionBanner } from './SupportSessionBanner';
import { Button } from '@/components/ui/button';
import { LogOut, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

interface Props {
  children?: ReactNode;
}

export function SuperAdminLayout({ children }: Props) {
  const navigate = useNavigate();
  const { email } = usePlatformAdmin();

  const handleLogout = async () => {
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
