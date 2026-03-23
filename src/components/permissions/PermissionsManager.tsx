import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Save, Users, RotateCcw, ShieldX, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppModule, AppAction, usePermissions } from "@/hooks/usePermissions";

interface User {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  clinic_id: string;
}

interface ModuleConfig {
  module: AppModule;
  label: string;
  description: string;
  actions: { action: AppAction; label: string }[];
}

const MODULES_CONFIG: ModuleConfig[] = [
  {
    module: "dashboard",
    label: "Dashboard",
    description: "Painel inicial e indicadores",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "agenda",
    label: "Agenda",
    description: "Agendamentos e sala de espera",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Cancelar" },
    ],
  },
  {
    module: "pacientes",
    label: "Pacientes",
    description: "Cadastro e perfil de pacientes",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Inativar" },
    ],
  },
  {
    module: "prontuario",
    label: "Prontuário",
    description: "Evoluções clínicas e anexos",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar evolução" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
    ],
  },
  {
    module: "comunicacao",
    label: "Comunicação & Marketing",
    description: "Campanhas e mensagens",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar campanha" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
    ],
  },
  {
    module: "financeiro",
    label: "Financeiro",
    description: "Transações e fluxo de caixa",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Registrar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "convenios",
    label: "Convênios",
    description: "Gestão de convênios e guias TISS",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar guia" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
    ],
  },
  {
    module: "estoque",
    label: "Estoque",
    description: "Controle de materiais",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Entrada/Saída" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
    ],
  },
  {
    module: "relatorios",
    label: "Relatórios",
    description: "Relatórios gerenciais",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "export", label: "Exportar" },
    ],
  },
  {
    module: "configuracoes",
    label: "Configurações",
    description: "Configurações do sistema",
    actions: [
      { action: "view", label: "Visualizar" },
      { action: "create", label: "Criar" },
      { action: "edit", label: "Editar" },
      { action: "delete", label: "Excluir" },
    ],
  },
];

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  profissional: "Profissional",
  recepcionista: "Recepcionista",
};

export function PermissionsManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<AppModule, AppAction[]>>({} as any);
  const [templatePermissions, setTemplatePermissions] = useState<Record<AppModule, AppAction[]>>({} as any);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Only OWNER can manage permissions
  const { isOwner, canManageUsers } = usePermissions();

  // Load users
  useEffect(() => {
    async function loadUsers() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      // Get all users in the clinic with their roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, clinic_id")
        .eq("clinic_id", profile.clinic_id);

      if (!profiles) return;

      // Get roles for each user
      const usersWithRoles: User[] = [];
      for (const p of profiles) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", p.user_id)
          .eq("clinic_id", p.clinic_id)
          .single();

        usersWithRoles.push({
          ...p,
          role: roleData?.role || "recepcionista",
        });
      }

      setUsers(usersWithRoles);
    }

    loadUsers();
  }, []);

  // Load permissions when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setPermissions({} as any);
      return;
    }

    async function loadPermissions() {
      setIsLoading(true);
      const selectedUser = users.find(u => u.user_id === selectedUserId);
      if (!selectedUser) return;

      // Get template permissions for the role - cast role to match enum type
      const { data: templates } = await supabase
        .from("permission_templates")
        .select("module, actions")
        .eq("role", selectedUser.role as any);

      const templatePerms: Record<AppModule, AppAction[]> = {} as any;
      templates?.forEach(t => {
        templatePerms[t.module as AppModule] = (t.actions || []) as AppAction[];
      });
      setTemplatePermissions(templatePerms);

      // Get custom permissions
      const { data: customPerms } = await supabase
        .from("module_permissions")
        .select("module, actions")
        .eq("user_id", selectedUserId)
        .eq("clinic_id", selectedUser.clinic_id);

      if (customPerms && customPerms.length > 0) {
        const perms: Record<AppModule, AppAction[]> = {} as any;
        customPerms.forEach(p => {
          perms[p.module as AppModule] = (p.actions || []) as AppAction[];
        });
        setPermissions(perms);
      } else {
        // Use template as starting point
        setPermissions(templatePerms);
      }

      setIsLoading(false);
    }

    loadPermissions();
  }, [selectedUserId, users]);

  const selectedUser = users.find(u => u.user_id === selectedUserId);
  const isOwnerOrAdmin = selectedUser && ["owner", "admin"].includes(selectedUser.role);
  // Only owner can edit, and cannot edit owner users
  const canEdit = canManageUsers && selectedUser && selectedUser.role !== "owner";

  const toggleAction = (module: AppModule, action: AppAction) => {
    setPermissions(prev => {
      const current = prev[module] || [];
      const hasAction = current.includes(action);
      return {
        ...prev,
        [module]: hasAction
          ? current.filter(a => a !== action)
          : [...current, action],
      };
    });
  };

  const resetToDefault = () => {
    setPermissions(templatePermissions);
    toast({
      title: "Permissões restauradas",
      description: "As permissões foram restauradas ao padrão do perfil.",
    });
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setIsSaving(true);

    // Delete existing custom permissions
    await supabase
      .from("module_permissions")
      .delete()
      .eq("user_id", selectedUserId)
      .eq("clinic_id", selectedUser.clinic_id);

      // Insert new permissions - cast module to string for database compatibility
      const inserts = Object.entries(permissions).map(([module, actions]) => ({
        user_id: selectedUserId!,
        clinic_id: selectedUser.clinic_id,
        module: module,
        actions: actions,
      }));

      const { error } = await supabase
        .from("module_permissions")
        .insert(inserts as any);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as permissões.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Permissões salvas!",
      description: `As permissões de ${selectedUser.full_name} foram atualizadas.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Permissões por Módulo
        </CardTitle>
        <CardDescription>
          Configure o acesso de cada usuário aos módulos do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Denied for non-owners */}
        {!canManageUsers && (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              Apenas o proprietário do sistema pode gerenciar permissões de usuários.
            </AlertDescription>
          </Alert>
        )}

        {canManageUsers && (
          <>
            {/* User selector */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Selecione o usuário</Label>
            <Select
              value={selectedUserId || ""}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {user.full_name}
                      <Badge variant="outline" className="ml-2">
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

            {selectedUser && (
              <>
                <Separator />

                {selectedUser.role === "owner" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-700 font-medium">
                        O proprietário tem acesso total e irrestrito ao sistema. Suas permissões não podem ser alteradas.
                      </p>
                    </div>
                  </div>
                )}

                {isOwnerOrAdmin && selectedUser.role !== "owner" && (
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning-foreground">
                      <strong>Nota:</strong> Usuários com perfil {roleLabels[selectedUser.role]} têm acesso 
                      elevado ao sistema por padrão.
                    </p>
                  </div>
                )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {MODULES_CONFIG.map(config => {
                  const modulePerms = permissions[config.module] || [];
                  
                  return (
                    <div 
                      key={config.module} 
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{config.label}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {config.actions.map(({ action, label }) => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${config.module}-${action}`}
                              checked={modulePerms.includes(action)}
                              onCheckedChange={() => toggleAction(config.module, action)}
                              disabled={!canEdit}
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
                  );
                })}
              </div>
            )}

                <Separator />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetToDefault} disabled={!canEdit}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar Padrão
                  </Button>
                  <Button onClick={savePermissions} disabled={isSaving || !canEdit}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar Permissões"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
