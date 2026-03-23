import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserType } from "./UserTypeSelector";

export type ModuleAction = "view" | "create" | "edit" | "delete" | "export";

export interface ModulePermissionConfig {
  module: string;
  label: string;
  description: string;
  category: "clinical" | "management" | "shared";
  actions: { action: ModuleAction; label: string }[];
}

export const PERMISSION_MODULES: ModulePermissionConfig[] = [
  // Dashboard
  {
    module: "dashboard",
    label: "Dashboard",
    description: "Visão geral e estatísticas",
    category: "shared",
    actions: [
      { action: "view", label: "Visualizar" },
    ],
  },
  // Clinical modules
  {
    module: "agenda",
    label: "Agenda",
    description: "Gerenciar agendamentos",
    category: "clinical",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Bloquear/Cancelar" },
    ],
  },
  {
    module: "prontuario",
    label: "Prontuário",
    description: "Evoluções clínicas",
    category: "clinical",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar evolução" },
      { action: "edit", label: "Editar" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "pacientes",
    label: "Pacientes",
    description: "Cadastro de pacientes",
    category: "shared",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Inativar" },
    ],
  },
  // Management modules
  {
    module: "financeiro",
    label: "Financeiro",
    description: "Controle financeiro geral",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Registrar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "meu_financeiro",
    label: "Meu Financeiro",
    description: "Visualizar atendimentos e repasses próprios",
    category: "clinical",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "estoque",
    label: "Estoque",
    description: "Controle de materiais",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Entrada/Saída" },
      { action: "edit", label: "Editar" },
    ],
  },
  {
    module: "relatorios",
    label: "Relatórios",
    description: "Relatórios gerenciais",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "convenios",
    label: "Convênios",
    description: "Gestão de convênios",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar guia" },
      { action: "edit", label: "Editar" },
    ],
  },
  {
    module: "comunicacao",
    label: "Marketing",
    description: "Campanhas e comunicação",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar campanha" },
      { action: "edit", label: "Editar" },
    ],
  },
  {
    module: "configuracoes",
    label: "Configurações",
    description: "Cadastros e regras da clínica",
    category: "management",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "edit", label: "Editar" },
    ],
  },
];

interface GranularPermissionsProps {
  userType: UserType;
  userRole: string;
  permissions: Record<string, ModuleAction[]>;
  onToggleAction: (module: string, action: ModuleAction) => void;
  onToggleModule: (module: string, enabled: boolean) => void;
}

export function GranularPermissions({
  userType,
  userRole,
  permissions,
  onToggleAction,
  onToggleModule,
}: GranularPermissionsProps) {
  const isAdmin = userRole === "admin";

  // Filter modules based on user type
  const getVisibleModules = () => {
    if (userType === "administrative") {
      return PERMISSION_MODULES.filter((m) => m.category === "management" || m.category === "shared");
    }
    if (userType === "professional") {
      return PERMISSION_MODULES.filter((m) => m.category === "clinical" || m.category === "shared");
    }
    // hybrid shows all
    return PERMISSION_MODULES;
  };

  const visibleModules = getVisibleModules();
  const clinicalModules = visibleModules.filter((m) => m.category === "clinical");
  const managementModules = visibleModules.filter((m) => m.category === "management");
  const sharedModules = visibleModules.filter((m) => m.category === "shared");

  const renderModuleCard = (config: ModulePermissionConfig) => {
    const modulePerms = permissions[config.module] || [];
    const hasAnyPermission = modulePerms.length > 0;
    const hasAllPermissions = config.actions.every((a) => modulePerms.includes(a.action));

    return (
      <Collapsible key={config.module} defaultOpen={hasAnyPermission}>
        <div
          className={cn(
            "border rounded-lg transition-colors",
            hasAnyPermission ? "border-primary/30 bg-primary/5" : "border-border"
          )}
        >
          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={hasAnyPermission}
                onCheckedChange={(checked) => onToggleModule(config.module, !!checked)}
                onClick={(e) => e.stopPropagation()}
                disabled={isAdmin}
              />
              <div className="text-left">
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasAllPermissions && (
                <Badge variant="secondary" className="text-xs">
                  Acesso Total
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-1 border-t">
              <div className="flex flex-wrap gap-3 mt-2">
                {config.actions.map(({ action, label }) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${config.module}-${action}`}
                      checked={modulePerms.includes(action)}
                      onCheckedChange={() => onToggleAction(config.module, action)}
                      disabled={isAdmin}
                    />
                    <Label
                      htmlFor={`${config.module}-${action}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  if (isAdmin) {
    return (
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Permissões
        </Label>
        <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
          Administradores têm acesso total a todos os módulos do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Permissões Detalhadas
      </Label>

      {clinicalModules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Área Clínica</p>
          <div className="space-y-2">
            {clinicalModules.map(renderModuleCard)}
          </div>
        </div>
      )}

      {sharedModules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Compartilhado</p>
          <div className="space-y-2">
            {sharedModules.map(renderModuleCard)}
          </div>
        </div>
      )}

      {managementModules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Gestão</p>
          <div className="space-y-2">
            {managementModules.map(renderModuleCard)}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get default permissions based on user type
export function getDefaultPermissions(userType: UserType): Record<string, ModuleAction[]> {
  const perms: Record<string, ModuleAction[]> = {};

  // Professional: clinical modules only
  if (userType === "professional") {
    perms.dashboard = ["view"];
    perms.agenda = ["view", "create", "edit"];
    perms.prontuario = ["view", "create", "edit"];
    perms.atendimento = ["view", "create", "edit"];
    perms.pacientes = ["view", "create", "edit"];
    perms.meu_financeiro = ["view"];
  }

  // Administrative (receptionist): front-desk operations
  if (userType === "administrative") {
    perms.dashboard = ["view"];
    perms.agenda = ["view", "create", "edit"];
    perms.atendimento = ["view", "create"];
    perms.pacientes = ["view", "create", "edit"];
    perms.convenios = ["view"];
    // Explicitly NO prontuario, financeiro, estoque, relatorios, configuracoes
  }

  // Hybrid: both clinical and administrative
  if (userType === "hybrid") {
    perms.dashboard = ["view"];
    perms.agenda = ["view", "create", "edit", "delete"];
    perms.prontuario = ["view", "create", "edit"];
    perms.atendimento = ["view", "create", "edit"];
    perms.pacientes = ["view", "create", "edit"];
    perms.meu_financeiro = ["view", "export"];
    perms.financeiro = ["view"];
    perms.estoque = ["view"];
    perms.relatorios = ["view"];
    perms.convenios = ["view", "create", "edit"];
  }

  return perms;
}
