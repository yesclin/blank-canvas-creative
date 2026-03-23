import { useState, useEffect } from "react";
import { Shield, FileText, History, Save, Plus, Edit, Eye, AlertTriangle, ScrollText, Check, X, Loader2, Power, PowerOff, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConsentTerms, useSecuritySettings, useAccessLogs, usePatientConsents, type ConsentTerm } from "@/hooks/lgpd";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConfigSeguranca() {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();
  
  // Hooks
  const { 
    terms, 
    loading: termsLoading, 
    saving: termsSaving, 
    createTerm, 
    createNewVersion,
    activateTerm, 
    deactivateTerm,
    getVersionHistory,
  } = useConsentTerms();

  const { 
    settings: securitySettings, 
    defaults: securityDefaults, 
    loading: securityLoading, 
    saving: securitySaving, 
    save: saveSecuritySettings,
  } = useSecuritySettings();

  const { 
    logs, 
    loading: logsLoading, 
    actionLabels,
    applyFilters,
    clearFilters,
    filters,
  } = useAccessLogs();

  const { consents, loading: consentsLoading } = usePatientConsents();

  // Term dialog state
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<ConsentTerm | null>(null);
  const [termForm, setTermForm] = useState({ title: "", content: "" });

  // Security form state - matches SystemSecuritySettingsInput
  const [securityForm, setSecurityForm] = useState({
    require_consent_on_registration: true,
    allow_patient_data_deletion: true,
    anonymize_reports: false,
    enforce_consent_before_care: false,
    lock_record_without_consent: false,
    enable_digital_signature: true,
    enable_access_logging: true,
    enable_tab_permissions: false,
    log_retention_days: 365,
  });

  // Log filters state
  const [logFiltersOpen, setLogFiltersOpen] = useState(false);
  const [logFilterForm, setLogFilterForm] = useState({
    action: "",
    startDate: "",
    endDate: "",
  });

  // Initialize security form when settings load
  useEffect(() => {
    if (securitySettings) {
      setSecurityForm({
        require_consent_on_registration: securitySettings.require_consent_on_registration,
        allow_patient_data_deletion: securitySettings.allow_patient_data_deletion,
        anonymize_reports: securitySettings.anonymize_reports,
        enforce_consent_before_care: securitySettings.enforce_consent_before_care,
        lock_record_without_consent: securitySettings.lock_record_without_consent,
        enable_digital_signature: securitySettings.enable_digital_signature,
        enable_access_logging: securitySettings.enable_access_logging,
        enable_tab_permissions: securitySettings.enable_tab_permissions,
        log_retention_days: securitySettings.log_retention_days,
      });
    } else if (!securityLoading) {
      setSecurityForm({
        require_consent_on_registration: securityDefaults.require_consent_on_registration,
        allow_patient_data_deletion: securityDefaults.allow_patient_data_deletion,
        anonymize_reports: securityDefaults.anonymize_reports,
        enforce_consent_before_care: securityDefaults.enforce_consent_before_care,
        lock_record_without_consent: securityDefaults.lock_record_without_consent,
        enable_digital_signature: securityDefaults.enable_digital_signature,
        enable_access_logging: securityDefaults.enable_access_logging,
        enable_tab_permissions: securityDefaults.enable_tab_permissions,
        log_retention_days: securityDefaults.log_retention_days,
      });
    }
  }, [securitySettings, securityLoading, securityDefaults]);

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  // Term handlers
  const handleCreateTerm = async () => {
    if (!termForm.title || !termForm.content) return;
    const success = await createTerm(termForm);
    if (success) {
      setIsTermDialogOpen(false);
      setTermForm({ title: "", content: "" });
    }
  };

  const handleCreateNewVersion = async () => {
    if (!selectedTerm || !termForm.title || !termForm.content) return;
    const success = await createNewVersion(selectedTerm.id, termForm);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedTerm(null);
      setTermForm({ title: "", content: "" });
    }
  };

  const handleViewTerm = (term: ConsentTerm) => {
    setSelectedTerm(term);
    setIsViewDialogOpen(true);
  };

  const handleEditTerm = (term: ConsentTerm) => {
    setSelectedTerm(term);
    setTermForm({ title: term.title, content: term.content });
    setIsEditDialogOpen(true);
  };

  const handleToggleTermStatus = async (term: ConsentTerm) => {
    if (term.is_active) {
      await deactivateTerm(term.id);
    } else {
      await activateTerm(term.id);
    }
  };

  // Security handlers
  const handleSaveSecuritySettings = async () => {
    await saveSecuritySettings(securityForm);
  };

  // Log filter handlers
  const handleApplyLogFilters = () => {
    applyFilters({
      action: logFilterForm.action || undefined,
      startDate: logFilterForm.startDate || undefined,
      endDate: logFilterForm.endDate || undefined,
    });
    setLogFiltersOpen(false);
  };

  const handleClearLogFilters = () => {
    setLogFilterForm({ action: "", startDate: "", endDate: "" });
    clearFilters();
    setLogFiltersOpen(false);
  };

  // Get version history for view dialog
  const versionHistory = selectedTerm ? getVersionHistory(selectedTerm.id) : [];

  // Loading state
  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          LGPD & Segurança
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure políticas de privacidade e monitore acessos ao sistema
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Conformidade LGPD</AlertTitle>
        <AlertDescription>
          Este módulo fornece a estrutura básica para conformidade com a LGPD. 
          Consulte um especialista jurídico para garantir conformidade completa.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="lgpd" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lgpd">
            <FileText className="h-4 w-4 mr-2" />
            LGPD
          </TabsTrigger>
          <TabsTrigger value="termos">
            <ScrollText className="h-4 w-4 mr-2" />
            Termos de Uso
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Logs de Acesso
          </TabsTrigger>
        </TabsList>

        {/* LGPD Tab - Consent Terms */}
        <TabsContent value="lgpd" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Termos de Consentimento</CardTitle>
                <CardDescription>
                  Gerencie os termos que pacientes devem aceitar
                </CardDescription>
              </div>
              <Button onClick={() => setIsTermDialogOpen(true)} disabled={!isAdmin}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Termo
              </Button>
            </CardHeader>
            <CardContent>
              {termsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : terms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum termo cadastrado. Clique em "Novo Termo" para criar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Termo</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.title}</TableCell>
                        <TableCell>v{term.version}</TableCell>
                        <TableCell>{formatDate(term.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={term.is_active ? "default" : "secondary"}>
                            {term.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Visualizar"
                              onClick={() => handleViewTerm(term)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar (Nova Versão)"
                              onClick={() => handleEditTerm(term)}
                              disabled={!isAdmin}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={term.is_active ? "Desativar" : "Ativar"}
                              onClick={() => handleToggleTermStatus(term)}
                              disabled={termsSaving || !isAdmin}
                            >
                              {term.is_active ? (
                                <PowerOff className="h-4 w-4 text-destructive" />
                              ) : (
                                <Power className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Patient Consents Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Registrados</CardTitle>
              <CardDescription>
                Histórico de consentimentos dos pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : consents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum consentimento registrado ainda.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Termo</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consents.slice(0, 10).map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell>{consent.patient_name || "—"}</TableCell>
                        <TableCell>{consent.term_title}</TableCell>
                        <TableCell>v{consent.term_version}</TableCell>
                        <TableCell>{formatDateTime(consent.granted_at)}</TableCell>
                        <TableCell>
                          <Badge variant={consent.status === 'granted' ? "default" : "destructive"}>
                            {consent.status === 'granted' ? 'Aceito' : 'Revogado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Termos de Uso - Static Legal Text */}
        <TabsContent value="termos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Termo de Uso e Responsabilidade
              </CardTitle>
              <CardDescription>
                Sistema YESCLIN – Gestão para Clínicas e Consultórios | Última atualização: Janeiro/2026
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-foreground">1️⃣ OBJETO</h3>
                  <p className="text-muted-foreground">
                    O presente Termo de Uso e Responsabilidade regula a utilização do sistema YESCLIN, plataforma SaaS de gestão para clínicas e consultórios de saúde, disponibilizada para organização administrativa, operacional, financeira e clínica, conforme os módulos contratados.
                  </p>
                </section>
                <Separator />
                <section>
                  <h3 className="text-lg font-semibold text-foreground">2️⃣ PERFIL DO USUÁRIO E RESPONSABILIDADES</h3>
                  <p className="text-muted-foreground font-medium">A clínica usuária é integralmente responsável por:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Veracidade dos dados cadastrados</li>
                    <li>Uso correto do sistema</li>
                    <li>Definição de permissões dos usuários</li>
                    <li>Operações realizadas em seu ambiente</li>
                    <li>Conformidade com normas legais e regulatórias</li>
                  </ul>
                </section>
                <Separator />
                <section>
                  <h3 className="text-lg font-semibold text-foreground">3️⃣ DADOS PESSOAIS E LGPD</h3>
                  <p className="text-muted-foreground">
                    O YESCLIN atua como <strong>OPERADOR DE DADOS</strong>, conforme a Lei nº 13.709/2018 (LGPD).
                  </p>
                  <p className="text-muted-foreground">
                    A clínica usuária atua como <strong>CONTROLADORA DOS DADOS</strong>.
                  </p>
                </section>
                <Separator />
                <section>
                  <h3 className="text-lg font-semibold text-foreground">4️⃣ PRONTUÁRIO E RESPONSABILIDADE CLÍNICA</h3>
                  <p className="text-muted-foreground">
                    O prontuário eletrônico disponibilizado pelo YESCLIN é uma <strong>ferramenta de apoio</strong>.
                    A clínica e seus profissionais são exclusivamente responsáveis pelo conteúdo clínico registrado.
                  </p>
                </section>
                <Separator />
                <section>
                  <h3 className="text-lg font-semibold text-foreground">5️⃣ CONVÊNIOS, TISS E GUIAS</h3>
                  <p className="text-muted-foreground">
                    O YESCLIN fornece estrutura compatível com o padrão TISS (ANS).
                    A clínica é responsável por conferir dados das guias e cumprir regras de cada operadora.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Privacidade e Segurança</CardTitle>
              <CardDescription>
                Defina como os dados dos pacientes são tratados e protegidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {securityLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Exigir aceite de termos no cadastro</Label>
                      <p className="text-sm text-muted-foreground">
                        Pacientes devem aceitar os termos ao se cadastrarem
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.require_consent_on_registration}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, require_consent_on_registration: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir exclusão de dados pelo paciente</Label>
                      <p className="text-sm text-muted-foreground">
                        Pacientes podem solicitar exclusão de seus dados
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.allow_patient_data_deletion}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, allow_patient_data_deletion: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Anonimizar dados em relatórios</Label>
                      <p className="text-sm text-muted-foreground">
                        Ocultar informações identificáveis em relatórios exportados
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.anonymize_reports}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, anonymize_reports: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Exigir consentimento antes do atendimento</Label>
                      <p className="text-sm text-muted-foreground">
                        Bloqueia início de atendimento sem consentimento prévio
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.enforce_consent_before_care}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, enforce_consent_before_care: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bloquear prontuário sem consentimento</Label>
                      <p className="text-sm text-muted-foreground">
                        Impede visualização do prontuário se paciente não consentiu
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.lock_record_without_consent}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, lock_record_without_consent: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  
                  {/* New Feature Toggles */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        Habilitar assinatura digital
                        <Badge variant="secondary" className="text-xs">Prontuário</Badge>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permite que profissionais assinem registros digitalmente
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.enable_digital_signature}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, enable_digital_signature: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        Habilitar permissões por aba
                        <Badge variant="secondary" className="text-xs">RBAC</Badge>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ativa controle granular de acesso às abas do prontuário por perfil
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.enable_tab_permissions}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, enable_tab_permissions: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Habilitar log de acessos</Label>
                      <p className="text-sm text-muted-foreground">
                        Registra todas as ações de usuários no sistema
                      </p>
                    </div>
                    <Switch 
                      checked={securityForm.enable_access_logging}
                      onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, enable_access_logging: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Retenção de logs (dias)</Label>
                      <p className="text-sm text-muted-foreground">
                        Período de retenção dos logs de acesso
                      </p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      value={securityForm.log_retention_days}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, log_retention_days: parseInt(e.target.value) || 365 }))}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSaveSecuritySettings}
                      disabled={securitySaving || !isAdmin}
                    >
                      {securitySaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Configurações
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Logs de Acesso</CardTitle>
                <CardDescription>
                  Monitore ações realizadas no sistema
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLogFiltersOpen(true)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(filters.action || filters.startDate || filters.endDate) && (
                    <Badge variant="secondary" className="ml-1">Ativos</Badge>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {filters.action || filters.startDate || filters.endDate
                    ? "Nenhum log encontrado com os filtros aplicados."
                    : "Nenhum log de acesso registrado ainda."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const actionInfo = actionLabels[log.action] || { label: log.action, color: 'secondary' as const };
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </TableCell>
                          <TableCell>{log.user_name}</TableCell>
                          <TableCell>
                            <Badge variant={actionInfo.color}>
                              {actionInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.resource || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {log.ip_address || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Term Dialog */}
      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Termo de Consentimento</DialogTitle>
            <DialogDescription>
              Crie um novo termo para coleta de consentimento. Será salvo como v1.0 e inativo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="term_title">Título *</Label>
              <Input 
                id="term_title" 
                placeholder="Ex: Termo de Consentimento para Tratamento" 
                value={termForm.title}
                onChange={(e) => setTermForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="term_content">Conteúdo do Termo *</Label>
              <Textarea
                id="term_content"
                placeholder="Digite o conteúdo completo do termo..."
                className="min-h-[200px]"
                value={termForm.content}
                onChange={(e) => setTermForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTermDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTerm}
              disabled={termsSaving || !termForm.title || !termForm.content}
            >
              {termsSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar Termo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Term Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedTerm?.title}
            </DialogTitle>
            <DialogDescription>
              Versão {selectedTerm?.version} • Criado em {selectedTerm && formatDate(selectedTerm.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedTerm?.is_active ? "default" : "secondary"}>
                {selectedTerm?.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <Separator />
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                {selectedTerm?.content}
              </div>
            </div>
            
            {versionHistory.length > 1 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Histórico de Versões</h4>
                  <div className="space-y-1">
                    {versionHistory.map((v) => (
                      <div 
                        key={v.id} 
                        className={`flex items-center justify-between py-2 px-3 rounded-md ${v.id === selectedTerm?.id ? 'bg-accent' : 'bg-muted/50'}`}
                      >
                        <span>v{v.version}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(v.created_at)}</span>
                        <Badge variant={v.is_active ? "default" : "secondary"} className="text-xs">
                          {v.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Term Dialog (Creates New Version) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Termo (Nova Versão)</DialogTitle>
            <DialogDescription>
              Editar criará uma nova versão. A versão atual (v{selectedTerm?.version}) permanecerá imutável.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Uma nova versão será criada automaticamente. Versões anteriores não podem ser modificadas.
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <Label htmlFor="edit_term_title">Título *</Label>
              <Input 
                id="edit_term_title" 
                value={termForm.title}
                onChange={(e) => setTermForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_term_content">Conteúdo do Termo *</Label>
              <Textarea
                id="edit_term_content"
                className="min-h-[200px]"
                value={termForm.content}
                onChange={(e) => setTermForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateNewVersion}
              disabled={termsSaving || !termForm.title || !termForm.content}
            >
              {termsSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Criar Nova Versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Filters Dialog */}
      <Dialog open={logFiltersOpen} onOpenChange={setLogFiltersOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Filtrar Logs</DialogTitle>
            <DialogDescription>
              Aplique filtros para encontrar registros específicos
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo de Ação</Label>
              <Select 
                value={logFilterForm.action} 
                onValueChange={(value) => setLogFilterForm(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  {Object.entries(actionLabels).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={logFilterForm.startDate}
                onChange={(e) => setLogFilterForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={logFilterForm.endDate}
                onChange={(e) => setLogFilterForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClearLogFilters}>
              Limpar
            </Button>
            <Button onClick={handleApplyLogFilters}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
