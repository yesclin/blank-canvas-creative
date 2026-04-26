import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Shield, Stethoscope, ClipboardList, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentViewRole, ViewableRole } from "@/contexts/UserViewModeContext";
import { toast } from "sonner";

interface RoleSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleCards: Array<{
  role: ViewableRole;
  title: string;
  icon: React.ElementType;
  description: string;
  highlights: string[];
  accent: string;
}> = [
  {
    role: "owner",
    title: "Proprietário",
    icon: Crown,
    description: "Acesso total ao sistema, incluindo gestão de usuários e plano.",
    highlights: ["Gestão de usuários", "Configurações da clínica", "Financeiro completo"],
    accent: "amber",
  },
  {
    role: "admin",
    title: "Administrador",
    icon: Shield,
    description: "Acesso administrativo amplo, sem gestão exclusiva de proprietário.",
    highlights: ["Gerenciar clínica", "Procedimentos e templates", "Relatórios"],
    accent: "primary",
  },
  {
    role: "profissional",
    title: "Profissional",
    icon: Stethoscope,
    description: "Foco no cuidado clínico: agenda própria, pacientes e prontuário.",
    highlights: ["Agenda e pacientes", "Prontuário clínico", "Meu financeiro"],
    accent: "emerald",
  },
  {
    role: "recepcionista",
    title: "Recepcionista",
    icon: ClipboardList,
    description: "Atendimento e suporte: agenda, cadastros e convênios. Sem dados clínicos.",
    highlights: ["Agenda completa", "Cadastros e convênios", "Sem prontuário"],
    accent: "blue",
  },
];

const accentClasses: Record<string, { ring: string; icon: string; chip: string }> = {
  amber:   { ring: "ring-amber-500/40 border-amber-500/40 bg-amber-500/5",   icon: "text-amber-600 bg-amber-500/10",   chip: "bg-amber-500/10 text-amber-700" },
  primary: { ring: "ring-primary/40 border-primary/40 bg-primary/5",         icon: "text-primary bg-primary/10",       chip: "bg-primary/10 text-primary" },
  emerald: { ring: "ring-emerald-500/40 border-emerald-500/40 bg-emerald-500/5", icon: "text-emerald-600 bg-emerald-500/10", chip: "bg-emerald-500/10 text-emerald-700" },
  blue:    { ring: "ring-blue-500/40 border-blue-500/40 bg-blue-500/5",      icon: "text-blue-600 bg-blue-500/10",     chip: "bg-blue-500/10 text-blue-700" },
};

export function RoleSwitcherDialog({ open, onOpenChange }: RoleSwitcherDialogProps) {
  const { realRole, viewedRole, canSwitchView, setViewedRole } = useCurrentViewRole();

  if (!canSwitchView) return null;

  const handleSelect = (role: ViewableRole) => {
    setViewedRole(role);
    if (role === "owner" || role === realRole) {
      toast.success("Voltando para o seu perfil de Proprietário");
    } else {
      toast.success(`Visualizando como ${roleCards.find(c => c.role === role)?.title}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Trocar Perfil de Acesso</DialogTitle>
          <DialogDescription>
            Simule a experiência do sistema com outros perfis. Sua conta e dados continuam intactos —
            apenas a visualização e as permissões da interface são alteradas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {roleCards.map(({ role, title, icon: Icon, description, highlights, accent }) => {
            const isCurrent = (viewedRole ?? realRole) === role;
            const tone = accentClasses[accent];
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSelect(role)}
                className={cn(
                  "group text-left rounded-xl border-2 p-4 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30",
                  isCurrent
                    ? cn("ring-2", tone.ring)
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={cn("p-2 rounded-lg", tone.icon)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isCurrent && (
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", tone.chip)}>
                      <Check className="h-3 w-3" /> Atual
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
                <ul className="mt-3 space-y-1">
                  {highlights.map((h) => (
                    <li key={h} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                      {h}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Sessão real: <strong className="text-foreground">Proprietário</strong>. Esta troca afeta apenas a interface.
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
