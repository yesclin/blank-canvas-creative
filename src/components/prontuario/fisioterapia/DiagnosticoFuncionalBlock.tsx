/**
 * FISIOTERAPIA - Bloco de Diagnóstico Funcional
 * 
 * Permite registro de diagnósticos funcionais fisioterapêuticos.
 * Não exige diagnóstico médico - foco na funcionalidade.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Stethoscope, 
  Plus, 
  User,
  Calendar,
  Edit,
  X,
  FileText,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useDiagnosticoFuncionalData, 
  getEmptyDiagnosticoForm,
  STATUS_DIAGNOSTICO_OPTIONS,
  type DiagnosticoFuncionalFormData,
  type DiagnosticoFuncionalData
} from '@/hooks/prontuario/fisioterapia/useDiagnosticoFuncionalData';

interface DiagnosticoFuncionalBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Retorna a cor e ícone do status
 */
function getStatusConfig(status: string) {
  switch (status) {
    case 'ativo':
      return { variant: 'destructive' as const, bg: 'bg-destructive/10', icon: AlertCircle, label: 'Ativo' };
    case 'em_tratamento':
      return { variant: 'secondary' as const, bg: 'bg-secondary/50', icon: Clock, label: 'Em Tratamento' };
    case 'resolvido':
      return { variant: 'default' as const, bg: 'bg-primary/10', icon: CheckCircle, label: 'Resolvido' };
    case 'estavel':
      return { variant: 'outline' as const, bg: 'bg-muted/50', icon: CheckCircle, label: 'Estável' };
    default:
      return { variant: 'outline' as const, bg: 'bg-muted', icon: FileText, label: status };
  }
}

/**
 * Formulário de Diagnóstico Funcional
 */
function DiagnosticoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}: {
  initialData: DiagnosticoFuncionalFormData;
  onSubmit: (data: DiagnosticoFuncionalFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<DiagnosticoFuncionalFormData>(initialData);
  const [novoAssociado, setNovoAssociado] = useState('');

  const handleChange = (field: keyof DiagnosticoFuncionalFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAssociado = () => {
    if (novoAssociado.trim()) {
      handleChange('diagnosticos_associados', [...formData.diagnosticos_associados, novoAssociado.trim()]);
      setNovoAssociado('');
    }
  };

  const handleRemoveAssociado = (index: number) => {
    handleChange('diagnosticos_associados', formData.diagnosticos_associados.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.diagnostico_principal.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Diagnóstico Principal */}
      <div className="space-y-2">
        <Label htmlFor="diagnostico_principal" className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Diagnóstico Funcional Principal *
        </Label>
        <Textarea
          id="diagnostico_principal"
          placeholder="Ex: Limitação funcional de ombro direito com déficit de ADM em abdução e rotação externa..."
          value={formData.diagnostico_principal}
          onChange={(e) => handleChange('diagnostico_principal', e.target.value)}
          rows={3}
          required
        />
        <p className="text-xs text-muted-foreground">
          Descreva a disfunção ou limitação funcional identificada, não o diagnóstico médico.
        </p>
      </div>

      {/* Diagnósticos Associados */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Diagnósticos Funcionais Associados
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar diagnóstico associado..."
            value={novoAssociado}
            onChange={(e) => setNovoAssociado(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAssociado();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddAssociado}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.diagnosticos_associados.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
            {formData.diagnosticos_associados.map((diag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {diag}
                <button
                  type="button"
                  onClick={() => handleRemoveAssociado(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Justificativa Clínica */}
      <div className="space-y-2">
        <Label htmlFor="justificativa_clinica" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Justificativa Clínica
        </Label>
        <Textarea
          id="justificativa_clinica"
          placeholder="Correlação entre achados clínicos, avaliação funcional e o diagnóstico proposto..."
          value={formData.justificativa_clinica}
          onChange={(e) => handleChange('justificativa_clinica', e.target.value)}
          rows={3}
        />
      </div>

      {/* CID (Opcional) */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <p className="text-sm font-medium mb-3 text-muted-foreground">
          CID (Opcional - apenas para referência)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cid_codigo">Código CID</Label>
            <Input
              id="cid_codigo"
              placeholder="Ex: M54.5"
              value={formData.cid_codigo}
              onChange={(e) => handleChange('cid_codigo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cid_descricao">Descrição</Label>
            <Input
              id="cid_descricao"
              placeholder="Ex: Dor lombar baixa"
              value={formData.cid_descricao}
              onChange={(e) => handleChange('cid_descricao', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status do Diagnóstico</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status..." />
          </SelectTrigger>
          <SelectContent>
            {STATUS_DIAGNOSTICO_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Outras observações relevantes..."
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.diagnostico_principal.trim()}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar Diagnóstico'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de um diagnóstico
 */
function DiagnosticoCard({
  diagnostico,
  onEdit,
  canEdit,
}: {
  diagnostico: DiagnosticoFuncionalData;
  onEdit?: (diag: DiagnosticoFuncionalData) => void;
  canEdit: boolean;
}) {
  const statusConfig = getStatusConfig(diagnostico.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`${statusConfig.bg} border-l-4 border-l-${statusConfig.variant === 'destructive' ? 'destructive' : statusConfig.variant === 'default' ? 'primary' : 'muted-foreground'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {diagnostico.diagnostico_principal}
            </CardTitle>
            <CardDescription className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(diagnostico.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {diagnostico.professional_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {diagnostico.professional_name}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
            {canEdit && onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(diagnostico)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Diagnósticos Associados */}
        {diagnostico.diagnosticos_associados.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {diagnostico.diagnosticos_associados.map((diag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {diag}
              </Badge>
            ))}
          </div>
        )}

        {/* Justificativa */}
        {diagnostico.justificativa_clinica && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Justificativa Clínica</p>
            <p className="text-sm">{diagnostico.justificativa_clinica}</p>
          </div>
        )}

        {/* CID */}
        {diagnostico.cid_codigo && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              CID: {diagnostico.cid_codigo}
            </Badge>
            {diagnostico.cid_descricao && (
              <span className="text-xs text-muted-foreground">{diagnostico.cid_descricao}</span>
            )}
          </div>
        )}

        {/* Observações */}
        {diagnostico.observacoes && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Observações</p>
            <p className="text-sm text-muted-foreground">{diagnostico.observacoes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DiagnosticoFuncionalBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: DiagnosticoFuncionalBlockProps) {
  const {
    diagnosticos,
    diagnosticosAtivos,
    loading,
    isFormOpen,
    setIsFormOpen,
    editingDiagnostico,
    setEditingDiagnostico,
    saveDiagnostico,
    updateDiagnostico,
    isSaving,
  } = useDiagnosticoFuncionalData({ patientId, clinicId, professionalId });

  const [viewMode, setViewMode] = useState<'ativos' | 'todos'>('ativos');

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar os diagnósticos funcionais.</p>
        </CardContent>
      </Card>
    );
  }

  const handleOpenForm = (diag?: DiagnosticoFuncionalData) => {
    if (diag) {
      setEditingDiagnostico(diag);
    } else {
      setEditingDiagnostico(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDiagnostico(null);
  };

  const handleSubmit = (formData: DiagnosticoFuncionalFormData) => {
    if (editingDiagnostico) {
      updateDiagnostico({ id: editingDiagnostico.id, formData });
    } else {
      saveDiagnostico(formData);
    }
  };

  const getInitialFormData = (): DiagnosticoFuncionalFormData => {
    if (editingDiagnostico) {
      return {
        diagnostico_principal: editingDiagnostico.diagnostico_principal,
        diagnosticos_associados: editingDiagnostico.diagnosticos_associados,
        justificativa_clinica: editingDiagnostico.justificativa_clinica || '',
        cid_codigo: editingDiagnostico.cid_codigo || '',
        cid_descricao: editingDiagnostico.cid_descricao || '',
        status: editingDiagnostico.status,
        observacoes: editingDiagnostico.observacoes || '',
      };
    }
    return getEmptyDiagnosticoForm();
  };

  const displayDiagnosticos = viewMode === 'ativos' ? diagnosticosAtivos : diagnosticos;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagnóstico Funcional</h2>
            <p className="text-sm text-muted-foreground">
              {diagnosticosAtivos.length > 0 
                ? `${diagnosticosAtivos.length} diagnóstico(s) ativo(s)` 
                : 'Nenhum diagnóstico ativo'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diagnosticos.length > diagnosticosAtivos.length && (
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'ativos' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('ativos')}
              >
                Ativos ({diagnosticosAtivos.length})
              </Button>
              <Button
                variant={viewMode === 'todos' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('todos')}
              >
                Todos ({diagnosticos.length})
              </Button>
            </div>
          )}
          {canEdit && (
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Diagnóstico
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {diagnosticos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum diagnóstico funcional registrado.</p>
            {canEdit && (
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Diagnóstico
              </Button>
            )}
          </CardContent>
        </Card>
      ) : displayDiagnosticos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Todos os diagnósticos foram resolvidos.</p>
            <Button variant="link" onClick={() => setViewMode('todos')}>
              Ver histórico completo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {displayDiagnosticos.map((diagnostico) => (
              <DiagnosticoCard
                key={diagnostico.id}
                diagnostico={diagnostico}
                onEdit={handleOpenForm}
                canEdit={canEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiagnostico ? 'Editar Diagnóstico Funcional' : 'Novo Diagnóstico Funcional'}
            </DialogTitle>
            <DialogDescription>
              Registre o diagnóstico funcional fisioterapêutico. O CID é opcional e serve apenas como referência.
            </DialogDescription>
          </DialogHeader>
          <DiagnosticoForm
            initialData={getInitialFormData()}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isSubmitting={isSaving}
            isEditing={!!editingDiagnostico}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
