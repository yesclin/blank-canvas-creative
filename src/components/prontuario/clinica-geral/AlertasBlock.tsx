import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { 
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  Syringe,
  HeartPulse,
  ShieldAlert,
  Save,
  X,
  Check,
  RotateCcw,
  Bell,
  Clock,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Tipos de alerta
 */
export type TipoAlerta = 'allergy' | 'disease' | 'risk' | 'other';
export type SeveridadeAlerta = 'critical' | 'warning' | 'info';

export const tipoAlertaLabels: Record<TipoAlerta, string> = {
  allergy: 'Alergia',
  disease: 'Doença Crônica',
  risk: 'Risco Clínico',
  other: 'Outro',
};

export const tipoAlertaIcons: Record<TipoAlerta, React.ReactNode> = {
  allergy: <Syringe className="h-4 w-4" />,
  disease: <HeartPulse className="h-4 w-4" />,
  risk: <ShieldAlert className="h-4 w-4" />,
  other: <Bell className="h-4 w-4" />,
};

export const severidadeConfig: Record<SeveridadeAlerta, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  critical: { 
    label: 'Crítico', 
    color: 'text-red-700 dark:text-red-400', 
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  warning: { 
    label: 'Atenção', 
    color: 'text-yellow-700 dark:text-yellow-400', 
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  info: { 
    label: 'Informativo', 
    color: 'text-blue-700 dark:text-blue-400', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <Info className="h-4 w-4" />,
  },
};

/**
 * Estrutura de um Alerta Clínico
 */
export interface AlertaClinico {
  id: string;
  patient_id: string;
  clinic_id: string;
  created_by?: string;
  created_by_nome?: string;
  alert_type: TipoAlerta;
  severity: SeveridadeAlerta;
  title: string;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface AlertasBlockProps {
  alertas: AlertaClinico[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: {
    alert_type: TipoAlerta;
    severity: SeveridadeAlerta;
    title: string;
    description?: string;
  }) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
}

/**
 * ALERTAS CLÍNICOS - Bloco exclusivo para Clínica Geral
 * 
 * Destaca:
 * - Alergias graves
 * - Doenças crônicas relevantes
 * - Riscos clínicos importantes
 * 
 * Exibido no topo do prontuário e em consultas futuras.
 */
export function AlertasBlock({
  alertas,
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
  onDeactivate,
  onReactivate,
}: AlertasBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deactivateAlerta, setDeactivateAlerta] = useState<AlertaClinico | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    alert_type: 'allergy' as TipoAlerta,
    severity: 'warning' as SeveridadeAlerta,
    title: '',
    description: '',
  });

  // Separate active and inactive alerts
  const activeAlertas = alertas.filter(a => a.is_active);
  const inactiveAlertas = alertas.filter(a => !a.is_active);

  // Group active alerts by severity
  const criticalAlertas = activeAlertas.filter(a => a.severity === 'critical');
  const warningAlertas = activeAlertas.filter(a => a.severity === 'warning');
  const infoAlertas = activeAlertas.filter(a => a.severity === 'info');

  const handleOpenForm = () => {
    setFormData({
      alert_type: 'allergy',
      severity: 'warning',
      title: '',
      description: '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async () => {
    await onSave({
      alert_type: formData.alert_type,
      severity: formData.severity,
      title: formData.title,
      description: formData.description || undefined,
    });
    handleCloseForm();
  };

  const handleConfirmDeactivate = async () => {
    if (deactivateAlerta) {
      await onDeactivate(deactivateAlerta.id);
      setDeactivateAlerta(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const renderAlertCard = (alerta: AlertaClinico, showActions = true) => {
    const config = severidadeConfig[alerta.severity];
    const typeIcon = tipoAlertaIcons[alerta.alert_type];
    
    return (
      <div
        key={alerta.id}
        className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${!alerta.is_active ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${config.color}`}>
              {typeIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium ${config.color}`}>
                  {alerta.title}
                </span>
                <Badge variant="outline" className="text-xs">
                  {tipoAlertaLabels[alerta.alert_type]}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${config.color}`}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              </div>
              {alerta.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {alerta.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {format(parseISO(alerta.created_at), "dd/MM/yyyy", { locale: ptBR })}
                {alerta.created_by_nome && (
                  <>
                    <span>•</span>
                    <User className="h-3 w-3" />
                    {alerta.created_by_nome}
                  </>
                )}
              </p>
            </div>
          </div>
          
          {showActions && canEdit && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {alerta.is_active ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDeactivateAlerta(alerta)}
                  title="Desativar alerta"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onReactivate(alerta.id)}
                  title="Reativar alerta"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Alertas Clínicos</h2>
          {activeAlertas.length > 0 && (
            <div className="flex items-center gap-2">
              {criticalAlertas.length > 0 && (
                <Badge variant="destructive">{criticalAlertas.length} crítico{criticalAlertas.length > 1 ? 's' : ''}</Badge>
              )}
              {warningAlertas.length > 0 && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">{warningAlertas.length}</Badge>
              )}
              {infoAlertas.length > 0 && (
                <Badge variant="secondary">{infoAlertas.length}</Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inactiveAlertas.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Ver Ativos' : 'Ver Inativos'}
              <Badge variant="secondary" className="ml-2">{inactiveAlertas.length}</Badge>
            </Button>
          )}
          {canEdit && (
            <Button onClick={handleOpenForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {!showInactive && (
        <>
          {activeAlertas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum alerta clínico ativo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Registre alergias, doenças crônicas ou riscos clínicos importantes.
                </p>
                {canEdit && (
                  <Button onClick={handleOpenForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Alerta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Critical alerts first */}
              {criticalAlertas.length > 0 && (
                <div className="space-y-2">
                  {criticalAlertas.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
              
              {/* Warning alerts */}
              {warningAlertas.length > 0 && (
                <div className="space-y-2">
                  {warningAlertas.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
              
              {/* Info alerts */}
              {infoAlertas.length > 0 && (
                <div className="space-y-2">
                  {infoAlertas.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Inactive Alerts */}
      {showInactive && (
        <div className="space-y-2">
          {inactiveAlertas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum alerta inativo
              </CardContent>
            </Card>
          ) : (
            inactiveAlertas.map(alerta => renderAlertCard(alerta))
          )}
        </div>
      )}

      {/* New Alert Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Novo Alerta Clínico
            </DialogTitle>
            <DialogDescription>
              Registre informações importantes sobre o paciente.
            </DialogDescription>
          </DialogHeader>

          {/* Current professional info */}
          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Profissional: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <div className="space-y-4">
            {/* Tipo do Alerta */}
            <div className="space-y-2">
              <Label>Tipo do Alerta *</Label>
              <Select 
                value={formData.alert_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, alert_type: v as TipoAlerta }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allergy">
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4" />
                      Alergia
                    </div>
                  </SelectItem>
                  <SelectItem value="disease">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" />
                      Doença Crônica
                    </div>
                  </SelectItem>
                  <SelectItem value="risk">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Risco Clínico
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Outro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severidade */}
            <div className="space-y-2">
              <Label>Severidade *</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, severity: v as SeveridadeAlerta }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Crítico
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      Atenção
                    </div>
                  </SelectItem>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Info className="h-4 w-4" />
                      Informativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Alergia a Dipirona"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes adicionais sobre o alerta..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.title}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateAlerta} onOpenChange={() => setDeactivateAlerta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              O alerta "{deactivateAlerta?.title}" será desativado mas poderá ser reativado posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Componente compacto para exibir alertas no topo do prontuário
 */
export function AlertasBanner({ alertas }: { alertas: AlertaClinico[] }) {
  const activeAlertas = alertas.filter(a => a.is_active);
  const criticalAlertas = activeAlertas.filter(a => a.severity === 'critical');
  const warningAlertas = activeAlertas.filter(a => a.severity === 'warning');

  if (activeAlertas.length === 0) return null;

  // Show only critical and warning alerts in banner
  const bannerAlertas = [...criticalAlertas, ...warningAlertas].slice(0, 3);

  return (
    <div className="space-y-2 mb-4">
      {bannerAlertas.map(alerta => {
        const config = severidadeConfig[alerta.severity];
        return (
          <div
            key={alerta.id}
            className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${config.bgColor} ${config.borderColor}`}
          >
            <div className={config.color}>
              {config.icon}
            </div>
            <div className="flex-1">
              <span className={`font-medium ${config.color}`}>{alerta.title}</span>
              {alerta.description && (
                <span className="text-muted-foreground ml-2 text-sm">— {alerta.description}</span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {tipoAlertaLabels[alerta.alert_type]}
            </Badge>
          </div>
        );
      })}
      {activeAlertas.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          + {activeAlertas.length - 3} alerta(s) adicional(is)
        </p>
      )}
    </div>
  );
}
