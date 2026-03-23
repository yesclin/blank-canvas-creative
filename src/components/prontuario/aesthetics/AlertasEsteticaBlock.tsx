/**
 * ESTÉTICA - Alertas Clínicos
 * 
 * Bloco especializado para alertas em estética:
 * - Alergias a produtos/substâncias
 * - Riscos específicos
 * - Contraindicações
 * - Histórico de intercorrências
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Plus,
  X,
  Syringe,
  Ban,
  Pill,
  HeartPulse,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Power,
  PowerOff,
  Trash2,
  History,
  Calendar,
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useAestheticAlerts,
  AESTHETIC_ALERT_TYPES,
  COMMON_AESTHETIC_ALERTS,
  type AlertInput,
} from '@/hooks/aesthetics/useAestheticAlerts';
import type { AlertSeverity, AlertType } from '@/types/prontuario';
import { alertSeverityConfig, alertTypeLabels } from '@/types/prontuario';

interface AlertasEsteticaBlockProps {
  patientId: string;
  canEdit?: boolean;
}

const alertTypeIcons: Record<AlertType, React.ReactNode> = {
  allergy: <Syringe className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  disease: <HeartPulse className="h-4 w-4" />,
  exam: <Calendar className="h-4 w-4" />,
  return: <History className="h-4 w-4" />,
  contraindication: <Ban className="h-4 w-4" />,
  other: <Bell className="h-4 w-4" />,
};

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

export function AlertasEsteticaBlock({ patientId, canEdit = false }: AlertasEsteticaBlockProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'allergy' | 'contraindication' | 'risk' | null>(null);
  const [formData, setFormData] = useState<AlertInput>({
    alert_type: 'allergy',
    severity: 'warning',
    title: '',
    description: '',
  });

  const {
    activeAlerts,
    inactiveAlerts,
    criticalAlerts,
    isLoading,
    createAlert,
    dismissAlert,
    reactivateAlert,
    deleteAlert,
    hasAlertForTitle,
    isCreating,
  } = useAestheticAlerts(patientId);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    await createAlert(formData);
    setDialogOpen(false);
    resetForm();
  };

  const handleQuickAdd = async (title: string, type: AlertType, severity: AlertSeverity = 'warning') => {
    if (hasAlertForTitle(title)) {
      return; // Already exists
    }
    await createAlert({
      alert_type: type,
      severity,
      title,
    });
  };

  const resetForm = () => {
    setFormData({
      alert_type: 'allergy',
      severity: 'warning',
      title: '',
      description: '',
    });
  };

  const openDialog = (type?: AlertType) => {
    if (type) {
      setFormData(prev => ({ ...prev, alert_type: type }));
    }
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com contagem */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold">Alertas Clínicos</h2>
          {activeAlerts.length > 0 && (
            <Badge variant="destructive">{activeAlerts.length} ativo(s)</Badge>
          )}
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {criticalAlerts.length} crítico(s)
            </Badge>
          )}
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Alerta
          </Button>
        )}
      </div>

      {/* Alertas Críticos em Destaque */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-destructive/20 rounded-lg border border-destructive/30"
                >
                  <div className="text-destructive mt-0.5">
                    {alertTypeIcons[alert.alert_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-destructive">
                        {alert.title}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        CRÍTICO
                      </Badge>
                    </div>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Categorias */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="active" className="gap-1">
            <Power className="h-3.5 w-3.5" />
            Ativos ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Adicionar Rápido
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="h-3.5 w-3.5" />
            Histórico ({inactiveAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Alertas Ativos */}
        <TabsContent value="active" className="mt-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                <p className="text-muted-foreground">Nenhum alerta ativo</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => openDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Alerta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {activeAlerts
                .filter(a => a.severity !== 'critical')
                .map((alert) => {
                  const config = alertSeverityConfig[alert.severity];
                  return (
                    <Card key={alert.id} className={config.bgColor}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <div className={config.color}>
                            {alertTypeIcons[alert.alert_type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${config.color}`}>
                                {alert.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {alertTypeLabels[alert.alert_type]}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {config.label}
                              </Badge>
                            </div>
                            {alert.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Criado em {format(parseISO(alert.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              {alert.expires_at && isAfter(new Date(), parseISO(alert.expires_at)) && (
                                <span className="text-destructive ml-2">• Expirado</span>
                              )}
                            </p>
                          </div>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => dismissAlert(alert.id)}
                              title="Desativar alerta"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* Adicionar Rápido */}
        <TabsContent value="quick" className="mt-4 space-y-4">
          {!canEdit ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Ban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Você não tem permissão para adicionar alertas
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Alergias Comuns */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-destructive" />
                    Alergias Comuns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AESTHETIC_ALERTS.allergies.map((allergy) => {
                      const exists = hasAlertForTitle(allergy);
                      return (
                        <Badge
                          key={allergy}
                          variant={exists ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            exists 
                              ? 'bg-destructive hover:bg-destructive/80' 
                              : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive'
                          }`}
                          onClick={() => !exists && handleQuickAdd(allergy, 'allergy', 'critical')}
                        >
                          {exists && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {allergy}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Contraindicações */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ban className="h-4 w-4 text-yellow-600" />
                    Contraindicações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AESTHETIC_ALERTS.contraindications.map((item) => {
                      const exists = hasAlertForTitle(item);
                      return (
                        <Badge
                          key={item}
                          variant={exists ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            exists 
                              ? 'bg-yellow-600 hover:bg-yellow-600/80' 
                              : 'hover:bg-muted hover:text-yellow-700 hover:border-yellow-500'
                          }`}
                          onClick={() => !exists && handleQuickAdd(item, 'contraindication', 'warning')}
                        >
                          {exists && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {item}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Fatores de Risco */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    Fatores de Risco
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AESTHETIC_ALERTS.risks.map((risk) => {
                      const exists = hasAlertForTitle(risk);
                      return (
                        <Badge
                          key={risk}
                          variant={exists ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            exists 
                              ? 'bg-primary hover:bg-primary/80' 
                              : 'hover:bg-primary/10 hover:text-primary hover:border-primary'
                          }`}
                          onClick={() => !exists && handleQuickAdd(risk, 'disease', 'info')}
                        >
                          {exists && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {risk}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="outline" onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Alerta Personalizado
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="mt-4">
          {inactiveAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum alerta no histórico</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {inactiveAlerts.map((alert) => (
                  <Card key={alert.id} className="opacity-60 hover:opacity-100 transition-opacity">
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="text-muted-foreground">
                          {alertTypeIcons[alert.alert_type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-muted-foreground line-through">
                              {alert.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Desativado
                            </Badge>
                          </div>
                          {alert.acknowledged_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Desativado em {format(parseISO(alert.acknowledged_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => reactivateAlert(alert.id)}
                              title="Reativar"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => deleteAlert(alert.id)}
                              title="Excluir permanentemente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Novo Alerta Clínico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Alerta</Label>
                <Select
                  value={formData.alert_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, alert_type: v as AlertType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AESTHETIC_ALERT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {alertTypeIcons[type.value]}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gravidade</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, severity: v as AlertSeverity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(alertSeverityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className={`flex items-center gap-2 ${config.color}`}>
                          {severityIcons[value as AlertSeverity]}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Alerta *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Alergia a Lidocaína"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes adicionais sobre o alerta..."
                rows={3}
              />
            </div>

            {/* Preview */}
            {formData.title && (
              <div className={`p-3 rounded-lg border ${alertSeverityConfig[formData.severity].bgColor}`}>
                <div className="flex items-center gap-2">
                  <span className={alertSeverityConfig[formData.severity].color}>
                    {alertTypeIcons[formData.alert_type]}
                  </span>
                  <span className={`font-medium ${alertSeverityConfig[formData.severity].color}`}>
                    {formData.title}
                  </span>
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    {formData.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title.trim() || isCreating}>
              <Plus className="h-4 w-4 mr-1" />
              {isCreating ? 'Adicionando...' : 'Adicionar Alerta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
