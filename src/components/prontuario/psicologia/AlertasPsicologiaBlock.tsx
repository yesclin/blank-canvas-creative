import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  Save,
  X,
  RotateCcw,
  Clock,
  User,
  Heart,
  Users,
  Eye,
  Shield,
  Skull,
  Lock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Tipos de alerta específicos para Psicologia
 */
export type TipoAlertaPsicologia = 
  | 'risco_autoagressao'  // Risco de autoagressão / ideação suicida
  | 'risco_social'        // Risco social relevante (violência doméstica, abuso, etc.)
  | 'atencao_especial'    // Situações que exigem atenção especial
  | 'medicacao'           // Medicações em uso (interação com psicofármacos)
  | 'outro';

export type SeveridadeAlerta = 'critical' | 'warning' | 'info';

export const tipoAlertaPsicoLabels: Record<TipoAlertaPsicologia, string> = {
  risco_autoagressao: 'Risco de Autoagressão',
  risco_social: 'Risco Social',
  atencao_especial: 'Atenção Especial',
  medicacao: 'Medicação em Uso',
  outro: 'Outro',
};

export const tipoAlertaPsicoIcons: Record<TipoAlertaPsicologia, React.ReactNode> = {
  risco_autoagressao: <Skull className="h-4 w-4" />,
  risco_social: <Users className="h-4 w-4" />,
  atencao_especial: <Eye className="h-4 w-4" />,
  medicacao: <Heart className="h-4 w-4" />,
  outro: <Shield className="h-4 w-4" />,
};

export const tipoAlertaPsicoDescricoes: Record<TipoAlertaPsicologia, string> = {
  risco_autoagressao: 'Ideação suicida, automutilação ou comportamentos de risco',
  risco_social: 'Violência doméstica, abuso, negligência ou vulnerabilidade social',
  atencao_especial: 'Condições clínicas, transtornos ou situações que exigem monitoramento',
  medicacao: 'Psicofármacos ou medicações que afetam o tratamento',
  outro: 'Outras informações relevantes para o acompanhamento',
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
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
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
 * Estrutura de um Alerta Clínico Psicológico
 */
export interface AlertaPsicologia {
  id: string;
  patient_id: string;
  clinic_id: string;
  created_by?: string;
  created_by_nome?: string;
  alert_type: TipoAlertaPsicologia;
  severity: SeveridadeAlerta;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface AlertasPsicologiaBlockProps {
  alertas: AlertaPsicologia[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: {
    alert_type: TipoAlertaPsicologia;
    severity: SeveridadeAlerta;
    title: string;
    description?: string;
  }) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
}

/**
 * ALERTAS CLÍNICOS - Bloco exclusivo para Psicologia
 * 
 * Destaca situações sensíveis:
 * - Risco de autoagressão (ideação suicida, automutilação)
 * - Risco social relevante (violência doméstica, abuso)
 * - Situações que exigem atenção especial
 * 
 * Acesso restrito e exibido no topo do prontuário.
 */
export function AlertasPsicologiaBlock({
  alertas,
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
  onDeactivate,
  onReactivate,
}: AlertasPsicologiaBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deactivateAlerta, setDeactivateAlerta] = useState<AlertaPsicologia | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    alert_type: 'atencao_especial' as TipoAlertaPsicologia,
    severity: 'warning' as SeveridadeAlerta,
    title: '',
    description: '',
  });

  // Separate active and inactive alerts
  const activeAlertas = alertas.filter(a => a.is_active);
  const inactiveAlertas = alertas.filter(a => !a.is_active);

  // Group active alerts by type (risk alerts first)
  const riscoAutoagressao = activeAlertas.filter(a => a.alert_type === 'risco_autoagressao');
  const riscoSocial = activeAlertas.filter(a => a.alert_type === 'risco_social');
  const atencaoEspecial = activeAlertas.filter(a => a.alert_type === 'atencao_especial');
  const outrosAlertas = activeAlertas.filter(a => 
    a.alert_type === 'medicacao' || a.alert_type === 'outro'
  );

  const hasRiscoGrave = riscoAutoagressao.length > 0 || 
    riscoSocial.some(a => a.severity === 'critical');

  const handleOpenForm = () => {
    setFormData({
      alert_type: 'atencao_especial',
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

  const renderAlertCard = (alerta: AlertaPsicologia, showActions = true) => {
    const config = severidadeConfig[alerta.severity];
    const typeIcon = tipoAlertaPsicoIcons[alerta.alert_type];
    const isSensitive = alerta.alert_type === 'risco_autoagressao' || alerta.alert_type === 'risco_social';
    
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
                  {tipoAlertaPsicoLabels[alerta.alert_type]}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${config.color}`}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
                {isSensitive && (
                  <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Sensível
                  </Badge>
                )}
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
              {hasRiscoGrave && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Risco
                </Badge>
              )}
              <Badge variant="secondary">{activeAlertas.length} ativo(s)</Badge>
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

      {/* Psychology-specific info */}
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3 rounded-lg">
        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Os alertas clínicos são visíveis apenas para profissionais autorizados. 
            Informações sensíveis são protegidas conforme o Código de Ética do Psicólogo.
          </p>
        </div>
      </div>

      {/* Active Alerts */}
      {!showInactive && (
        <>
          {activeAlertas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum alerta clínico ativo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Registre situações de risco ou informações importantes para o acompanhamento.
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
              {/* Risco de Autoagressão - highest priority */}
              {riscoAutoagressao.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                    <Skull className="h-4 w-4" />
                    Risco de Autoagressão
                  </h3>
                  {riscoAutoagressao.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
              
              {/* Risco Social */}
              {riscoSocial.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Risco Social
                  </h3>
                  {riscoSocial.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
              
              {/* Atenção Especial */}
              {atencaoEspecial.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Atenção Especial
                  </h3>
                  {atencaoEspecial.map(alerta => renderAlertCard(alerta))}
                </div>
              )}
              
              {/* Outros alertas */}
              {outrosAlertas.length > 0 && (
                <div className="space-y-2">
                  {outrosAlertas.map(alerta => renderAlertCard(alerta))}
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
              <Shield className="h-5 w-5 text-purple-600" />
              Novo Alerta Clínico
            </DialogTitle>
            <DialogDescription>
              Registre situações de risco ou informações importantes para o acompanhamento psicológico.
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
                onValueChange={(v) => setFormData(prev => ({ ...prev, alert_type: v as TipoAlertaPsicologia }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risco_autoagressao">
                    <div className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-red-600" />
                      <span>Risco de Autoagressão</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="risco_social">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span>Risco Social</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="atencao_especial">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span>Atenção Especial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medicacao">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span>Medicação em Uso</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="outro">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Outro</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {tipoAlertaPsicoDescricoes[formData.alert_type]}
              </p>
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
                    <div className="flex items-center gap-2 text-amber-600">
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
                placeholder="Ex: Ideação suicida relatada na última sessão"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição Detalhada</Label>
              <Textarea
                placeholder="Detalhes adicionais, contexto, histórico..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar Alerta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateAlerta} onOpenChange={() => setDeactivateAlerta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              O alerta "{deactivateAlerta?.title}" será desativado e não aparecerá mais no topo do prontuário. 
              Você poderá reativá-lo posteriormente se necessário.
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
