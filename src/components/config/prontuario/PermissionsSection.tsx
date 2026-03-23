import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Shield, Eye, Pencil, Download, PenTool, RotateCcw, Save, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMedicalRecordPermissions,
  MEDICAL_RECORD_TABS,
  MEDICAL_RECORD_ACTIONS,
  TabPermission,
  ActionPermission,
  TabKey,
  ActionKey,
} from '@/hooks/prontuario/useMedicalRecordPermissions';

const ROLES = [
  { value: 'owner', label: 'Proprietário', description: 'Acesso total' },
  { value: 'admin', label: 'Administrador', description: 'Acesso total' },
  { value: 'profissional', label: 'Profissional', description: 'Acesso clínico' },
  { value: 'recepcionista', label: 'Recepcionista', description: 'Acesso limitado' },
];

export function PermissionsSection() {
  const {
    loading,
    saving,
    getTabPermissionsForRole,
    getActionPermissionsForRole,
    saveTabPermissions,
    saveActionPermissions,
    initializeDefaultsForRole,
  } = useMedicalRecordPermissions();

  const [selectedRole, setSelectedRole] = useState('profissional');
  const [editedTabPerms, setEditedTabPerms] = useState<TabPermission[]>([]);
  const [editedActionPerms, setEditedActionPerms] = useState<ActionPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load permissions when role changes
  useEffect(() => {
    if (!loading) {
      setEditedTabPerms(getTabPermissionsForRole(selectedRole));
      setEditedActionPerms(getActionPermissionsForRole(selectedRole));
      setHasChanges(false);
    }
  }, [selectedRole, loading, getTabPermissionsForRole, getActionPermissionsForRole]);

  const handleTabPermChange = (tabKey: TabKey, field: 'can_view' | 'can_edit' | 'can_export' | 'can_sign', value: boolean) => {
    setEditedTabPerms(prev => prev.map(p => {
      if (p.tab_key !== tabKey) return p;
      
      // If disabling view, disable all others
      if (field === 'can_view' && !value) {
        return { ...p, can_view: false, can_edit: false, can_export: false, can_sign: false };
      }
      
      // Can't enable edit/export/sign without view
      if (field !== 'can_view' && value && !p.can_view) {
        return { ...p, can_view: true, [field]: value };
      }
      
      return { ...p, [field]: value };
    }));
    setHasChanges(true);
  };

  const handleActionPermChange = (actionKey: ActionKey, allowed: boolean) => {
    setEditedActionPerms(prev => prev.map(p => 
      p.action_key === actionKey ? { ...p, allowed } : p
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const tabResult = await saveTabPermissions(selectedRole, editedTabPerms);
    const actionResult = await saveActionPermissions(selectedRole, editedActionPerms);
    
    if (tabResult && actionResult) {
      setHasChanges(false);
    }
  };

  const handleResetToDefaults = async () => {
    const confirmed = window.confirm('Deseja restaurar as permissões padrão para este perfil?');
    if (confirmed) {
      await initializeDefaultsForRole(selectedRole);
      setEditedTabPerms(getTabPermissionsForRole(selectedRole));
      setEditedActionPerms(getActionPermissionsForRole(selectedRole));
      setHasChanges(false);
    }
  };

  const isRoleProtected = selectedRole === 'owner' || selectedRole === 'admin';

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Permissões do Prontuário</CardTitle>
        </div>
        <CardDescription>
          Configure o que cada perfil pode visualizar, editar e executar no prontuário eletrônico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Label>Perfil:</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <span>{role.label}</span>
                      <span className="text-xs text-muted-foreground">({role.description})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              disabled={saving || isRoleProtected}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar Padrões
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving || isRoleProtected}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        {isRoleProtected && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Este perfil possui acesso total e não pode ser modificado.
            </span>
          </div>
        )}

        {hasChanges && !isRoleProtected && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-400">
              Há alterações não salvas. Clique em "Salvar" para aplicar.
            </span>
          </div>
        )}

        <Tabs defaultValue="tabs" className="w-full">
          <TabsList>
            <TabsTrigger value="tabs">Permissões por Aba</TabsTrigger>
            <TabsTrigger value="actions">Permissões de Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="tabs" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px]">Aba</TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Eye className="h-4 w-4" />
                            <span>Visualizar</span>
                          </TooltipTrigger>
                          <TooltipContent>Permite ver o conteúdo da aba</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Pencil className="h-4 w-4" />
                            <span>Editar</span>
                          </TooltipTrigger>
                          <TooltipContent>Permite criar e editar registros</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Download className="h-4 w-4" />
                            <span>Exportar</span>
                          </TooltipTrigger>
                          <TooltipContent>Permite exportar para PDF</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <PenTool className="h-4 w-4" />
                            <span>Assinar</span>
                          </TooltipTrigger>
                          <TooltipContent>Permite assinar registros digitalmente</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MEDICAL_RECORD_TABS.map(tab => {
                    const perm = editedTabPerms.find(p => p.tab_key === tab.key);
                    return (
                      <TableRow key={tab.key}>
                        <TableCell className="font-medium">{tab.label}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={perm?.can_view ?? false}
                            onCheckedChange={(v) => handleTabPermChange(tab.key, 'can_view', v)}
                            disabled={isRoleProtected}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={perm?.can_edit ?? false}
                            onCheckedChange={(v) => handleTabPermChange(tab.key, 'can_edit', v)}
                            disabled={isRoleProtected || !perm?.can_view}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={perm?.can_export ?? false}
                            onCheckedChange={(v) => handleTabPermChange(tab.key, 'can_export', v)}
                            disabled={isRoleProtected || !perm?.can_view}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={perm?.can_sign ?? false}
                            onCheckedChange={(v) => handleTabPermChange(tab.key, 'can_sign', v)}
                            disabled={isRoleProtected || !perm?.can_view}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Ação</TableHead>
                    <TableHead className="text-center">Permitido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MEDICAL_RECORD_ACTIONS.map(action => {
                    const perm = editedActionPerms.find(p => p.action_key === action.key);
                    return (
                      <TableRow key={action.key}>
                        <TableCell className="font-medium">{action.label}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={perm?.allowed ?? false}
                            onCheckedChange={(v) => handleActionPermChange(action.key, v)}
                            disabled={isRoleProtected}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">Visualizar</Badge>
            <span>Acesso somente leitura</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Editar</Badge>
            <span>Criar e modificar registros</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">Exportar</Badge>
            <span>Gerar PDF e relatórios</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Assinar</Badge>
            <span>Assinatura digital de registros</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
