import { useState } from "react";
import { LogOut, User, UserCog, ChevronUp, ArrowLeftRight, Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useClinicUsers";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useCurrentViewRole } from "@/contexts/UserViewModeContext";
import { RoleSwitcherDialog } from "./RoleSwitcherDialog";

type UserRole = "admin" | "owner" | "profissional" | "recepcionista";

const roleLabels: Record<UserRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  profissional: "Profissional",
  recepcionista: "Recepcionista",
};

const roleColors: Record<UserRole, string> = {
  owner: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  profissional: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  recepcionista: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function UserProfileFooter() {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const { canSwitchView, isImpersonating, viewedRole, resetViewedRole } = useCurrentViewRole();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      // Clear simulated role before signing out
      resetViewedRole();
      window.dispatchEvent(new Event("yc:signout"));
      await supabase.auth.signOut();
      toast.success("Sessão encerrada com sucesso");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao encerrar sessão");
    }
  };

  const handleViewProfile = () => {
    navigate("/app/config/usuarios");
    toast.info("Redirecionando para seu perfil...");
  };

  const handleStopImpersonating = () => {
    resetViewedRole();
    toast.success("Voltando para Proprietário");
  };

  if (isLoading) {
    return (
      <div className={cn(
        "mt-auto border-t transition-all duration-200",
        isCollapsed ? "p-2 flex justify-center" : "p-3"
      )}>
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Display role: when impersonating, show the simulated role in the footer
  const displayRole: UserRole = (isImpersonating && viewedRole ? viewedRole : user.role) as UserRole;
  const isAdminLike = displayRole === "owner" || displayRole === "admin";

  return (
    <>
      <div className={cn(
        "mt-auto border-t transition-all duration-200",
        isCollapsed ? "p-2" : "p-3"
      )}>
        {!isCollapsed && isImpersonating && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700">
            <span className="flex items-center gap-1 truncate">
              <ArrowLeftRight className="h-3 w-3 shrink-0" />
              Visualizando como: {roleLabels[displayRole]}
            </span>
            <button
              onClick={handleStopImpersonating}
              className="font-medium underline hover:no-underline shrink-0 ml-2"
            >
              Voltar
            </button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center rounded-lg transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
              isCollapsed ? "w-full justify-center p-1" : "w-full gap-3 p-2 text-left"
            )}>
              <div className="relative">
                <Avatar className={cn(
                  "border-2 border-primary/20",
                  isCollapsed ? "h-8 w-8" : "h-9 w-9"
                )}>
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {isAdminLike && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                    <Crown className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-4 ${roleColors[displayRole]}`}
                    >
                      {roleLabels[displayRole]}
                    </Badge>
                  </div>

                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="top"
            className="w-60 bg-popover border shadow-lg"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  {isAdminLike && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 w-fit mt-1 ${roleColors[displayRole]}`}
                >
                  {roleLabels[displayRole]}
                </Badge>
                {isImpersonating && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Modo de visualização ativo
                  </p>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>

            {canSwitchView && !isImpersonating && (
              <DropdownMenuItem
                onClick={() => setShowRoleSwitcher(true)}
                className="cursor-pointer"
              >
                <UserCog className="mr-2 h-4 w-4" />
                <span>Trocar de Usuário</span>
              </DropdownMenuItem>
            )}

            {canSwitchView && isImpersonating && (
              <DropdownMenuItem
                onClick={handleStopImpersonating}
                className="cursor-pointer text-amber-700 focus:text-amber-700"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Voltar para Proprietário</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowLogoutDialog(true)}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RoleSwitcherDialog open={showRoleSwitcher} onOpenChange={setShowRoleSwitcher} />

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
