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
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
  const { isAdmin } = usePermissions();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  // UI-only gating; server-side access control must still be enforced.
  const canImpersonate = !!user && isAdmin;
  
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

  const handleImpersonate = () => {
    toast.info("Funcionalidade de troca de usuário em desenvolvimento");
  };

  const handleStopImpersonating = () => {
    setIsImpersonating(false);
    toast.success("Voltando para seu usuário original");
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

  const isAdminRole = isAdmin;

  return (
    <>
      <div className={cn(
        "mt-auto border-t transition-all duration-200",
        isCollapsed ? "p-2" : "p-3"
      )}>
        {!isCollapsed && isImpersonating && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-600">
            <span className="flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3" />
              Acessando como outro usuário
            </span>
            <button
              onClick={handleStopImpersonating}
              className="font-medium underline hover:no-underline"
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
                {isAdminRole && (
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
                      className={`text-[10px] px-1.5 py-0 h-4 ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
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
            className="w-56 bg-popover border shadow-lg"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  {isAdminRole && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 h-4 w-fit mt-1 ${roleColors[user.role]}`}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            
            {canImpersonate && !isImpersonating && (
              <DropdownMenuItem onClick={handleImpersonate} className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Trocar de Usuário</span>
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
