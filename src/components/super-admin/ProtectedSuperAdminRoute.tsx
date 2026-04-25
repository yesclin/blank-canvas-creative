import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

/**
 * Protege todo o subtree de /super-admin.
 * - Não autenticado → /login
 * - Autenticado mas não é Platform Admin → redireciona para /app (perfil cliente)
 *   EXCETO quando ainda não existe nenhum admin (libera /super-admin/setup).
 */
export function ProtectedSuperAdminRoute({ children }: Props) {
  const { isPlatformAdmin, loading, totalAdmins, userId } = usePlatformAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Tela de seed: liberada APENAS se ainda não há nenhum super admin
  const isSetupRoute = location.pathname.startsWith('/super-admin/setup');
  if (isSetupRoute) {
    if ((totalAdmins ?? 0) > 0 && !isPlatformAdmin) {
      return <Navigate to="/app" replace />;
    }
    return <>{children}</>;
  }

  if (!isPlatformAdmin) {
    if ((totalAdmins ?? 0) === 0) {
      return <Navigate to="/super-admin/setup" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
