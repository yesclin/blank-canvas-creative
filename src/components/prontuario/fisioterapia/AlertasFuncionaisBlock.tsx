/**
 * FISIOTERAPIA - Bloco de Alertas Funcionais
 * 
 * Permite registrar restrições de movimento, contraindicações
 * e riscos funcionais do paciente.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertTriangle, 
  Plus, 
  User,
  Calendar,
  Edit,
  Trash2,
  ShieldAlert,
  Ban,
  Activity,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAlertasFuncionaisData,
  getEmptyAlertaForm,
  alertaToFormData,
  TIPO_ALERTA_OPTIONS,
  SEVERIDADE_ALERTA_OPTIONS,
  type AlertaFormData,
  type AlertaFuncional
} from '@/hooks/prontuario/fisioterapia/useAlertasFuncionaisData';

interface AlertasFuncionaisBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Retorna ícone baseado no tipo
 */
function getTipoIcon(tipo: string) {
  switch (tipo) {
    case 'restricao_movimento':
      return <Ban className="h-4 w-4" />;
    case 'contraindicacao':
      return <ShieldAlert className="h-4 w-4" />;
    case 'risco_funcional':
      return <Activity className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

/**
 * Retorna configuração da severidade
 */
function getSeveridadeConfig(severidade: string) {
  const option = SEVERIDADE_ALERTA_OPTIONS.find(o => o.value === severidade);
  return {
    label: option?.label || severidade,
    variant: option?.color || 'outline' as const,
  };
}

/**
 * Retorna label do tipo
 */
function getTipoLabel(tipo: string) {
  return TIPO_ALERTA_OPTIONS.find(o => o.value === tipo)?.label || tipo;
}

/**
 * Formulário de Alerta
 */
function AlertaForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}: {
  initialData: AlertaFormData;
  onSubmit: (data: AlertaFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<AlertaFormData>(initialData);

  const handleChange = (field: keyof AlertaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo e Severidade */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Alerta *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => handleChange('tipo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TIPO_ALERTA_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severidade">Severidade *</Label>
          <Select
            value={formData.severidade}
            onValueChange={(value) => handleChange('severidade', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {SEVERIDADE_ALERTA_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          placeholder="Ex: Evitar rotação externa de ombro"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Detalhes sobre a restrição ou alerta..."
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          rows={3}
        />
      </div>

      {/* Datas */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data de Início</Label>
          <Input
            id="data_inicio"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => handleChange('data_inicio', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data de Término (previsão)</Label>
          <Input
            id="data_fim"
            type="date"
            value={formData.data_fim}
            onChange={(e) => handleChange('data_fim', e.target.value)}
          />
        </div>
      </div>

      {/* Status Ativo */}
      <div className="flex items-center gap-3">
        <Switch
          id="is_ativo"
          checked={formData.is_ativo}
          onCheckedChange={(checked) => handleChange('is_ativo', checked)}
        />
        <Label htmlFor="is_ativo" className="cursor-pointer">
          Alerta ativo
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.titulo.trim()}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Registrar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de alerta
 */
function AlertaCard({
  alerta,
  onEdit,
  onToggle,
  onDelete,
  canEdit,
}: {
  alerta: AlertaFuncional;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const severidadeConfig = getSeveridadeConfig(alerta.severidade);
  const isCritico = alerta.severidade === 'critico' || alerta.severidade === 'alto';

  return (
    <Card className={`${!alerta.is_ativo ? 'opacity-60' : ''} ${isCritico && alerta.is_ativo ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isCritico && alerta.is_ativo ? 'bg-destructive/20' : 'bg-muted'}`}>
            {getTipoIcon(alerta.tipo)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium">{alerta.titulo}</h4>
              <Badge variant={severidadeConfig.variant} className="text-xs">
                {severidadeConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTipoLabel(alerta.tipo)}
              </Badge>
              {!alerta.is_ativo && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolvido
                </Badge>
              )}
            </div>
            {alerta.descricao && (
              <p className="text-sm text-muted-foreground mb-2">
                {alerta.descricao}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {alerta.data_inicio && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Início: {format(new Date(alerta.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {alerta.data_fim && (
                <span>
                  Fim: {format(new Date(alerta.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {alerta.created_by_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {alerta.created_by_name}
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onToggle} title={alerta.is_ativo ? 'Marcar como resolvido' : 'Reativar'}>
                {alerta.is_ativo ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} title="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente compacto para exibir alertas na Visão Geral
 */
export function AlertasFuncionaisBanner({
  alertas,
}: {
  alertas: AlertaFuncional[];
}) {
  const alertasAtivos = alertas.filter(a => a.is_ativo);
  const alertasCriticos = alertasAtivos.filter(a => 
    a.severidade === 'critico' || a.severidade === 'alto'
  );

  if (alertasAtivos.length === 0) return null;

  const hasCritico = alertasCriticos.length > 0;

  return (
    <div className={`p-3 rounded-lg border ${hasCritico ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/50 border-muted'}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`h-4 w-4 ${hasCritico ? 'text-destructive' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-medium ${hasCritico ? 'text-destructive' : ''}`}>
          {alertasAtivos.length} alerta(s) ativo(s)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {alertasAtivos.slice(0, 5).map(alerta => {
          const isCritico = alerta.severidade === 'critico' || alerta.severidade === 'alto';
          return (
            <Badge 
              key={alerta.id} 
              variant={isCritico ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {getTipoIcon(alerta.tipo)}
              <span className="ml-1">{alerta.titulo}</span>
            </Badge>
          );
        })}
        {alertasAtivos.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{alertasAtivos.length - 5} mais
          </Badge>
        )}
      </div>
    </div>
  );
}

export function AlertasFuncionaisBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AlertasFuncionaisBlockProps) {
  const {
    alertas,
    alertasAtivos,
    loading,
    isFormOpen,
    setIsFormOpen,
    editingAlerta,
    setEditingAlerta,
    saveAlerta,
    isSaving,
    toggleAtivo,
    deleteAlerta,
  } = useAlertasFuncionaisData({ patientId, clinicId, professionalId });

  const [deleteTarget, setDeleteTarget] = useState<AlertaFuncional | null>(null);
  const [showResolvidos, setShowResolvidos] = useState(false);

  const handleEdit = (alerta: AlertaFuncional) => {
    setEditingAlerta(alerta);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAlerta(null);
  };

  const alertasResolvidos = alertas.filter(a => !a.is_ativo);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar os alertas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/20 rounded-full">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alertas Funcionais</h2>
            <p className="text-sm text-muted-foreground">
              {alertasAtivos.length > 0 
                ? `${alertasAtivos.length} alerta(s) ativo(s)` 
                : 'Nenhum alerta ativo'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alertasResolvidos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolvidos(!showResolvidos)}
            >
              {showResolvidos ? 'Ocultar Resolvidos' : `Ver Resolvidos (${alertasResolvidos.length})`}
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          )}
        </div>
      </div>

      {/* Lista de alertas */}
      {alertas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum alerta funcional registrado.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Alerta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {/* Ativos */}
            {alertasAtivos.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onEdit={() => handleEdit(alerta)}
                onToggle={() => toggleAtivo({ id: alerta.id, isAtivo: false })}
                onDelete={() => setDeleteTarget(alerta)}
                canEdit={canEdit}
              />
            ))}

            {/* Resolvidos */}
            {showResolvidos && alertasResolvidos.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onEdit={() => handleEdit(alerta)}
                onToggle={() => toggleAtivo({ id: alerta.id, isAtivo: true })}
                onDelete={() => setDeleteTarget(alerta)}
                canEdit={canEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAlerta ? 'Editar Alerta' : 'Novo Alerta Funcional'}
            </DialogTitle>
            <DialogDescription>
              Registre restrições, contraindicações ou riscos funcionais.
            </DialogDescription>
          </DialogHeader>
          <AlertaForm
            initialData={editingAlerta ? alertaToFormData(editingAlerta) : getEmptyAlertaForm()}
            onSubmit={saveAlerta}
            onCancel={handleCloseForm}
            isSubmitting={isSaving}
            isEditing={!!editingAlerta}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o alerta "{deleteTarget?.titulo}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTarget) {
                deleteAlerta(deleteTarget.id);
                setDeleteTarget(null);
              }
            }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
