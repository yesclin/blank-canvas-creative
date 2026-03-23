import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  Stethoscope, 
  Plus, 
  Star, 
  StarOff,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  Diagnostico, 
  TipoDiagnostico, 
  StatusDiagnostico 
} from '@/hooks/prontuario/clinica-geral/useDiagnosticosData';

export type { Diagnostico, TipoDiagnostico, StatusDiagnostico };

interface DiagnosticosBlockProps {
  diagnosticos: Diagnostico[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: {
    codigo_cid10?: string;
    descricao_cid10?: string;
    descricao_personalizada?: string;
    observacoes?: string;
    tipo_diagnostico: TipoDiagnostico;
  }) => Promise<void>;
  onUpdate: (id: string, data: Partial<{
    tipo_diagnostico: TipoDiagnostico;
    status: StatusDiagnostico;
    observacoes: string;
  }>) => Promise<void>;
}

const tipoBadgeConfig: Record<TipoDiagnostico, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  principal: { label: 'Principal', variant: 'default' },
  diferencial: { label: 'Diferencial', variant: 'secondary' },
  descartado: { label: 'Descartado', variant: 'outline' },
};

const statusConfig: Record<StatusDiagnostico, { label: string; icon: React.ReactNode; className: string }> = {
  ativo: { label: 'Ativo', icon: <Clock className="h-3 w-3" />, className: 'text-blue-600' },
  resolvido: { label: 'Resolvido', icon: <CheckCircle2 className="h-3 w-3" />, className: 'text-green-600' },
  descartado: { label: 'Descartado', icon: <XCircle className="h-3 w-3" />, className: 'text-muted-foreground' },
};

export function DiagnosticosBlock({
  diagnosticos,
  loading,
  saving,
  canEdit,
  onSave,
  onUpdate,
}: DiagnosticosBlockProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchCid, setSearchCid] = useState('');
  const [formData, setFormData] = useState({
    codigo_cid10: '',
    descricao_cid10: '',
    descricao_personalizada: '',
    observacoes: '',
    tipo_diagnostico: 'diferencial' as TipoDiagnostico,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | StatusDiagnostico>('all');

  const handleSubmit = async () => {
    if (!formData.descricao_cid10 && !formData.descricao_personalizada) {
      return;
    }

    await onSave(formData);
    setDialogOpen(false);
    setFormData({
      codigo_cid10: '',
      descricao_cid10: '',
      descricao_personalizada: '',
      observacoes: '',
      tipo_diagnostico: 'diferencial',
    });
    setSearchCid('');
  };

  const handlePromoteToPrincipal = async (id: string) => {
    await onUpdate(id, { tipo_diagnostico: 'principal' });
  };

  const handleMarkResolved = async (id: string) => {
    await onUpdate(id, { status: 'resolvido' });
  };

  const handleMarkDiscarded = async (id: string) => {
    await onUpdate(id, { status: 'descartado', tipo_diagnostico: 'descartado' });
  };

  const filteredDiagnosticos = diagnosticos.filter(d => 
    filterStatus === 'all' || d.status === filterStatus
  );

  const principalDiagnostico = diagnosticos.find(
    d => d.tipo_diagnostico === 'principal' && d.status === 'ativo'
  );

  const diferenciais = filteredDiagnosticos.filter(
    d => d.tipo_diagnostico !== 'principal' || d.status !== 'ativo'
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Hipóteses Diagnósticas (CID-10)
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Diagnóstico
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            <Select 
              value={filterStatus} 
              onValueChange={(v) => setFilterStatus(v as 'all' | StatusDiagnostico)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
                <SelectItem value="descartado">Descartados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Principal Diagnosis */}
          {principalDiagnostico && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <Badge variant="default">Principal</Badge>
                      {principalDiagnostico.codigo_cid10 && (
                        <Badge variant="outline" className="font-mono">
                          {principalDiagnostico.codigo_cid10}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">
                      {principalDiagnostico.descricao_cid10 || principalDiagnostico.descricao_personalizada}
                    </p>
                    {principalDiagnostico.observacoes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {principalDiagnostico.observacoes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(principalDiagnostico.data_diagnostico), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' • '}{principalDiagnostico.profissional_nome}
                    </p>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMarkResolved(principalDiagnostico.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar como Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkDiscarded(principalDiagnostico.id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Descartar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Diagnoses */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {diferenciais.length === 0 && !principalDiagnostico && (
                <div className="text-center py-8 text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum diagnóstico registrado</p>
                </div>
              )}

              {diferenciais.map((diag) => (
                <Card 
                  key={diag.id} 
                  className={diag.status !== 'ativo' ? 'opacity-60' : ''}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={tipoBadgeConfig[diag.tipo_diagnostico].variant}>
                            {tipoBadgeConfig[diag.tipo_diagnostico].label}
                          </Badge>
                          {diag.codigo_cid10 && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {diag.codigo_cid10}
                            </Badge>
                          )}
                          <span className={`flex items-center gap-1 text-xs ${statusConfig[diag.status].className}`}>
                            {statusConfig[diag.status].icon}
                            {statusConfig[diag.status].label}
                          </span>
                        </div>
                        <p className="text-sm">
                          {diag.descricao_cid10 || diag.descricao_personalizada}
                        </p>
                        {diag.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {diag.observacoes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(diag.data_diagnostico), "dd/MM/yyyy", { locale: ptBR })}
                          {' • '}{diag.profissional_nome}
                        </p>
                      </div>
                      {canEdit && diag.status === 'ativo' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {diag.tipo_diagnostico !== 'principal' && (
                              <DropdownMenuItem onClick={() => handlePromoteToPrincipal(diag.id)}>
                                <Star className="h-4 w-4 mr-2" />
                                Promover a Principal
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleMarkResolved(diag.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Resolvido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkDiscarded(diag.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Descartar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Diagnosis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Novo Diagnóstico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* CID-10 Search */}
            <div className="space-y-2">
              <Label>Código CID-10 (opcional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: J06.9, A09, etc."
                    value={formData.codigo_cid10}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      codigo_cid10: e.target.value.toUpperCase() 
                    }))}
                    className="pl-9 font-mono"
                    maxLength={10}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o código CID-10 do diagnóstico
              </p>
            </div>

            {/* Diagnosis Description */}
            <div className="space-y-2">
              <Label>Descrição do Diagnóstico *</Label>
              <Input
                placeholder="Ex: Infecção aguda das vias aéreas superiores"
                value={formData.descricao_cid10 || formData.descricao_personalizada}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  descricao_cid10: e.target.value,
                  descricao_personalizada: e.target.value,
                }))}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo de Diagnóstico</Label>
              <Select 
                value={formData.tipo_diagnostico}
                onValueChange={(v) => setFormData(prev => ({ 
                  ...prev, 
                  tipo_diagnostico: v as TipoDiagnostico 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Principal
                    </span>
                  </SelectItem>
                  <SelectItem value="diferencial">
                    <span className="flex items-center gap-2">
                      <StarOff className="h-4 w-4" />
                      Diferencial
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label>Observações Clínicas</Label>
              <Textarea
                placeholder="Observações relevantes sobre o diagnóstico..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving || (!formData.descricao_cid10 && !formData.descricao_personalizada)}
            >
              {saving ? 'Salvando...' : 'Registrar Diagnóstico'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
