/**
 * NUTRIÇÃO - Alertas Nutricionais
 * 
 * Bloco para exibir e gerenciar alertas específicos de nutrição:
 * - Alergias alimentares
 * - Restrições alimentares
 * - Riscos nutricionais
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  Save,
  X,
  Check,
  RotateCcw,
  Wheat,
  Apple,
  ShieldAlert,
  Ban
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  type AlertaNutricional,
  type AlertaNutricionalFormData,
  type TipoAlertaNutricao,
  type SeveridadeAlerta,
  TIPO_ALERTA_NUTRICAO_LABELS,
  ALERGIAS_ALIMENTARES_COMUNS,
  RESTRICOES_COMUNS,
} from '@/hooks/prontuario/nutricao/useAlertasNutricaoData';

const tipoAlertaIcons: Record<TipoAlertaNutricao, React.ReactNode> = {
  alergia_alimentar: <Wheat className="h-4 w-4" />,
  restricao_alimentar: <Ban className="h-4 w-4" />,
  risco_nutricional: <ShieldAlert className="h-4 w-4" />,
  intolerancia: <Apple className="h-4 w-4" />,
  outro: <AlertCircle className="h-4 w-4" />,
};

const severidadeConfig: Record<SeveridadeAlerta, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'Crítico',
    className: 'bg-destructive/10 border-destructive/30 text-destructive',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  warning: {
    label: 'Atenção',
    className: 'bg-orange-100 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  info: {
    label: 'Informativo',
    className: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    icon: <Info className="h-4 w-4" />,
  },
};

interface AlertasNutricaoBlockProps {
  alertas: AlertaNutricional[];
  activeAlertas: AlertaNutricional[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: AlertaNutricionalFormData) => Promise<boolean>;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
}

const initialFormData: AlertaNutricionalFormData = {
  alert_type: 'alergia_alimentar',
  severity: 'warning',
  title: '',
  description: '',
};

export function AlertasNutricaoBlock({
  alertas,
  activeAlertas,
  loading,
  saving,
  canEdit,
  onSave,
  onDeactivate,
  onReactivate,
}: AlertasNutricaoBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AlertaNutricionalFormData>(initialFormData);
  const [deactivateAlerta, setDeactivateAlerta] = useState<AlertaNutricional | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const inactiveAlertas = alertas.filter(a => !a.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const success = await onSave(formData);
    if (success) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (deactivateAlerta) {
      await onDeactivate(deactivateAlerta.id);
      setDeactivateAlerta(null);
    }
  };

  // Sugestões baseadas no tipo selecionado
  const getSuggestions = () => {
    if (formData.alert_type === 'alergia_alimentar') {
      return ALERGIAS_ALIMENTARES_COMUNS;
    }
    if (formData.alert_type === 'restricao_alimentar') {
      return RESTRICOES_COMUNS;
    }
    return [];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold">Alertas Nutricionais</h2>
          {activeAlertas.length > 0 && (
            <Badge variant="destructive">{activeAlertas.length}</Badge>
          )}
        </div>
        {canEdit && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </Button>
        )}
      </div>

      {/* Formulário */}
      {showForm && canEdit && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Alerta Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <Label>Tipo de Alerta</Label>
                  <Select
                    value={formData.alert_type}
                    onValueChange={(value: TipoAlertaNutricao) => 
                      setFormData(prev => ({ ...prev, alert_type: value, title: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_ALERTA_NUTRICAO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {tipoAlertaIcons[key as TipoAlertaNutricao]}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Severidade */}
                <div>
                  <Label>Severidade</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: SeveridadeAlerta) => 
                      setFormData(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Crítico
                        </div>
                      </SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2 text-accent-foreground">
                          <AlertCircle className="h-4 w-4" />
                          Atenção
                        </div>
                      </SelectItem>
                      <SelectItem value="info">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Info className="h-4 w-4" />
                          Informativo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Título com sugestões */}
              <div>
                <Label>Alerta *</Label>
                <Input
                  placeholder="Ex: Alergia a amendoim"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                {getSuggestions().length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getSuggestions().slice(0, 8).map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setFormData(prev => ({ ...prev, title: suggestion }))}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Detalhes adicionais sobre o alerta..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !formData.title.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alerta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Alertas Ativos */}
      {activeAlertas.length > 0 && (
        <div className="space-y-2">
          {activeAlertas.map((alerta) => {
            const config = severidadeConfig[alerta.severity];
            return (
              <Card key={alerta.id} className={`border ${config.className}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{alerta.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {tipoAlertaIcons[alerta.alert_type]}
                            <span className="ml-1">{TIPO_ALERTA_NUTRICAO_LABELS[alerta.alert_type]}</span>
                          </Badge>
                        </div>
                        {alerta.description && (
                          <p className="text-sm mt-1 opacity-80">{alerta.description}</p>
                        )}
                        <p className="text-xs opacity-60 mt-2">
                          Registrado em {format(parseISO(alerta.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          {alerta.created_by_nome && ` por ${alerta.created_by_nome}`}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeactivateAlerta(alerta)}
                        className="shrink-0"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {activeAlertas.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-2">Nenhum alerta nutricional ativo</p>
            <p className="text-xs text-muted-foreground mb-4">
              Registre alergias alimentares, restrições e riscos nutricionais importantes.
            </p>
            {canEdit && (
              <Button variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Alerta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas Inativos */}
      {inactiveAlertas.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="text-muted-foreground"
          >
            {showInactive ? 'Ocultar' : 'Mostrar'} alertas resolvidos ({inactiveAlertas.length})
          </Button>
          
          {showInactive && (
            <div className="space-y-2 mt-2">
              {inactiveAlertas.map((alerta) => (
                <Card key={alerta.id} className="opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-sm">{alerta.title}</span>
                        <Badge variant="secondary" className="text-xs">Resolvido</Badge>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReactivate(alerta.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reativar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diálogo de confirmação para desativar */}
      <AlertDialog open={!!deactivateAlerta} onOpenChange={() => setDeactivateAlerta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolver Alerta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar "{deactivateAlerta?.title}" como resolvido?
              Você poderá reativá-lo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Banner de alertas para exibir no topo do prontuário
 */
interface AlertasBannerNutricaoProps {
  alertas: AlertaNutricional[];
  onViewAlerts?: () => void;
}

export function AlertasBannerNutricao({ alertas, onViewAlerts }: AlertasBannerNutricaoProps) {
  const activeAlertas = alertas.filter(a => a.is_active);
  
  if (activeAlertas.length === 0) return null;

  const criticalAlertas = activeAlertas.filter(a => a.severity === 'critical');
  const warningAlertas = activeAlertas.filter(a => a.severity === 'warning');

  return (
    <div 
      className={cn(
        "flex flex-wrap gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-4",
        onViewAlerts && "cursor-pointer hover:bg-destructive/15 transition-colors"
      )}
      onClick={onViewAlerts}
      role={onViewAlerts ? "button" : undefined}
      tabIndex={onViewAlerts ? 0 : undefined}
      onKeyDown={onViewAlerts ? (e) => e.key === 'Enter' && onViewAlerts() : undefined}
    >
      <div className="flex items-center gap-2 text-destructive font-medium">
        <AlertTriangle className="h-4 w-4" />
        <span>Alertas Nutricionais:</span>
      </div>
      {criticalAlertas.map((alerta) => (
        <Badge key={alerta.id} variant="destructive" className="gap-1">
          {tipoAlertaIcons[alerta.alert_type]}
          {alerta.title}
        </Badge>
      ))}
      {warningAlertas.map((alerta) => (
        <Badge key={alerta.id} variant="outline" className="gap-1 border-accent text-accent-foreground">
          {tipoAlertaIcons[alerta.alert_type]}
          {alerta.title}
        </Badge>
      ))}
      {activeAlertas.filter(a => a.severity === 'info').map((alerta) => (
        <Badge key={alerta.id} variant="secondary" className="gap-1">
          {tipoAlertaIcons[alerta.alert_type]}
          {alerta.title}
        </Badge>
      ))}
      {onViewAlerts && (
        <span className="text-xs text-muted-foreground ml-auto self-center">
          Clique para ver detalhes
        </span>
      )}
    </div>
  );
}
