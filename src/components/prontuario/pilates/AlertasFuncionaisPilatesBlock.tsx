/**
 * PILATES - Bloco de Alertas Funcionais
 * 
 * Registro e exibição de restrições de movimento,
 * cuidados especiais e limitações importantes.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertTriangle, 
  Plus, 
  User,
  Calendar,
  Edit,
  ShieldAlert,
  Ban,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAlertasFuncionaisPilatesData, 
  getEmptyAlertaForm,
  alertaToFormData,
  TIPO_ALERTA_OPTIONS,
  SEVERIDADE_OPTIONS,
  type AlertaFuncionalFormData,
  type AlertaFuncionalPilates,
} from '@/hooks/prontuario/pilates/useAlertasFuncionaisPilatesData';

interface AlertasFuncionaisPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
  compact?: boolean; // Para exibição no topo do prontuário
}

const severityIcons: Record<string, React.ReactNode> = {
  critical: <ShieldAlert className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

/**
 * Banner de alertas para exibição no topo do prontuário
 */
export function AlertasFuncionaisBanner({
  patientId,
  clinicId,
  professionalId,
}: {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}) {
  const { alertasAtivos, loading } = useAlertasFuncionaisPilatesData({ 
    patientId, 
    clinicId, 
    professionalId 
  });

  if (loading || alertasAtivos.length === 0) return null;

  const criticalCount = alertasAtivos.filter(a => a.severidade === 'critical').length;
  const warningCount = alertasAtivos.filter(a => a.severidade === 'warning').length;

  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-destructive/5 border-destructive/20">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <span className="text-destructive">Alertas Funcionais:</span>
      </div>
      {alertasAtivos.slice(0, 3).map((alerta) => {
        const severityConfig = SEVERIDADE_OPTIONS.find(s => s.value === alerta.severidade);
        return (
          <Badge 
            key={alerta.id} 
            variant="outline" 
            className={`text-xs ${severityConfig?.className || ''}`}
          >
            {severityIcons[alerta.severidade]}
            <span className="ml-1">{alerta.titulo}</span>
          </Badge>
        );
      })}
      {alertasAtivos.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{alertasAtivos.length - 3} mais
        </Badge>
      )}
      {criticalCount > 0 && (
        <Badge variant="destructive" className="text-xs ml-auto">
          {criticalCount} crítico(s)
        </Badge>
      )}
    </div>
  );
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
  initialData: AlertaFuncionalFormData;
  onSubmit: (data: AlertaFuncionalFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<AlertaFuncionalFormData>(initialData);
  const [exercicioInput, setExercicioInput] = useState('');

  const handleChange = (field: keyof AlertaFuncionalFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddExercicio = () => {
    if (exercicioInput.trim()) {
      handleChange('exercicios_evitar', [...formData.exercicios_evitar, exercicioInput.trim()]);
      setExercicioInput('');
    }
  };

  const handleRemoveExercicio = (index: number) => {
    handleChange('exercicios_evitar', formData.exercicios_evitar.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo de Alerta</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => {
              handleChange('tipo', value);
              const tipoConfig = TIPO_ALERTA_OPTIONS.find(t => t.value === value);
              if (tipoConfig) {
                handleChange('severidade', tipoConfig.severity);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPO_ALERTA_OPTIONS.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Severidade */}
        <div className="space-y-2">
          <Label>Severidade</Label>
          <Select
            value={formData.severidade}
            onValueChange={(value) => handleChange('severidade', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERIDADE_OPTIONS.map((sev) => (
                <SelectItem key={sev.value} value={sev.value}>
                  <span className="flex items-center gap-2">
                    {severityIcons[sev.value]}
                    {sev.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do Alerta *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ex: Hérnia discal L4-L5, Lesão no ombro direito..."
          required
        />
      </div>

      {/* Região Afetada */}
      <div className="space-y-2">
        <Label htmlFor="regiao_afetada">Região Afetada</Label>
        <Input
          id="regiao_afetada"
          value={formData.regiao_afetada}
          onChange={(e) => handleChange('regiao_afetada', e.target.value)}
          placeholder="Ex: Coluna lombar, Ombro direito, Joelho esquerdo..."
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Detalhes sobre a condição..."
          rows={2}
        />
      </div>

      {/* Exercícios a Evitar */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Ban className="h-4 w-4" />
          Exercícios a Evitar
        </Label>
        <div className="flex gap-2">
          <Input
            value={exercicioInput}
            onChange={(e) => setExercicioInput(e.target.value)}
            placeholder="Digite e pressione Enter..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddExercicio();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddExercicio}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.exercicios_evitar.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.exercicios_evitar.map((ex, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => handleRemoveExercicio(i)}
              >
                {ex} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="space-y-2">
        <Label htmlFor="recomendacoes">Recomendações</Label>
        <Textarea
          id="recomendacoes"
          value={formData.recomendacoes}
          onChange={(e) => handleChange('recomendacoes', e.target.value)}
          placeholder="Cuidados especiais, adaptações sugeridas..."
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.titulo.trim()}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Alerta'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de alerta individual
 */
function AlertaCard({
  alerta,
  onEdit,
  onToggle,
  canEdit,
}: {
  alerta: AlertaFuncionalPilates;
  onEdit: () => void;
  onToggle: () => void;
  canEdit: boolean;
}) {
  const tipoConfig = TIPO_ALERTA_OPTIONS.find(t => t.value === alerta.tipo);
  const severityConfig = SEVERIDADE_OPTIONS.find(s => s.value === alerta.severidade);

  return (
    <Card className={`${!alerta.is_active ? 'opacity-60' : ''} ${severityConfig?.className || ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className="mt-0.5">
            {severityIcons[alerta.severidade]}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{alerta.titulo}</h4>
              <Badge variant="outline" className="text-xs">
                {tipoConfig?.label || alerta.tipo}
              </Badge>
              {!alerta.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inativo
                </Badge>
              )}
            </div>

            {alerta.regiao_afetada && (
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">Região:</span> {alerta.regiao_afetada}
              </p>
            )}

            {alerta.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
            )}

            {alerta.exercicios_evitar && alerta.exercicios_evitar.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Evitar:</p>
                <div className="flex flex-wrap gap-1">
                  {alerta.exercicios_evitar.map((ex, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" />
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {alerta.recomendacoes && (
              <p className="text-sm mt-2 p-2 bg-background/50 rounded">
                <span className="font-medium">Recomendações:</span> {alerta.recomendacoes}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(alerta.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              {alerta.professional_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {alerta.professional_name}
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onToggle} title={alerta.is_active ? 'Desativar' : 'Ativar'}>
                {alerta.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertasFuncionaisPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
  compact = false,
}: AlertasFuncionaisPilatesBlockProps) {
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
    toggleAlerta,
  } = useAlertasFuncionaisPilatesData({ patientId, clinicId, professionalId });

  const [showInactive, setShowInactive] = useState(false);

  const displayedAlertas = showInactive ? alertas : alertasAtivos;

  const handleEdit = (alerta: AlertaFuncionalPilates) => {
    setEditingAlerta(alerta);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAlerta(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar os alertas.</p>
        </CardContent>
      </Card>
    );
  }

  // Modo compacto (para exibição no topo)
  if (compact) {
    return <AlertasFuncionaisBanner patientId={patientId} clinicId={clinicId} professionalId={professionalId} />;
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/20 rounded-full">
            <ShieldAlert className="h-5 w-5 text-destructive" />
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
        <div className="flex items-center gap-3">
          {alertas.length > alertasAtivos.length && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                Mostrar inativos
              </Label>
            </div>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {alertas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum alerta funcional registrado.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Alerta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : displayedAlertas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum alerta ativo no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {displayedAlertas.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onEdit={() => handleEdit(alerta)}
                onToggle={() => toggleAlerta(alerta)}
                canEdit={canEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlerta ? 'Editar Alerta' : 'Novo Alerta Funcional'}
            </DialogTitle>
            <DialogDescription>
              Registre restrições de movimento, cuidados especiais ou limitações importantes.
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
    </div>
  );
}
