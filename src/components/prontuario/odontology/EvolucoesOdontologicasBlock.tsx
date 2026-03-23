import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ClipboardList,
  Plus,
  Calendar,
  User,
  Search,
  X,
  Save,
  Edit2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Stethoscope,
  FileWarning,
  BookOpen,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de uma evolução odontológica
 */
export interface EvolucaoOdontologica {
  id: string;
  patient_id: string;
  appointment_id?: string;
  // Dados clínicos
  data_atendimento: string;
  procedimento_realizado: string;
  dentes_tratados?: string[];
  resposta_paciente: string;
  intercorrencias?: string;
  orientacoes_pos?: string;
  observacoes?: string;
  // Metadata
  status: 'rascunho' | 'finalizado' | 'assinado';
  professional_id: string;
  professional_name?: string;
  created_at: string;
  signed_at?: string;
}

interface EvolucoesOdontologicasBlockProps {
  evolucoes: EvolucaoOdontologica[];
  loading?: boolean;
  canEdit?: boolean;
  canSign?: boolean;
  onAdd: (data: Omit<EvolucaoOdontologica, 'id' | 'patient_id' | 'professional_id' | 'created_at' | 'status'>) => Promise<void>;
  onEdit?: (id: string, data: Partial<EvolucaoOdontologica>) => Promise<void>;
  onSign?: (id: string) => Promise<void>;
  onNavigateToOdontograma?: (dente: string) => void;
}

type FormDataType = {
  data_atendimento: string;
  procedimento_realizado: string;
  dentes_tratados: string;
  resposta_paciente: string;
  intercorrencias: string;
  orientacoes_pos: string;
  observacoes: string;
};

const getEmptyFormData = (): FormDataType => ({
  data_atendimento: format(new Date(), 'yyyy-MM-dd'),
  procedimento_realizado: '',
  dentes_tratados: '',
  resposta_paciente: '',
  intercorrencias: '',
  orientacoes_pos: '',
  observacoes: '',
});

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Edit2 },
  finalizado: { label: 'Finalizado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle2 },
  assinado: { label: 'Assinado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
};

/**
 * EVOLUÇÕES ODONTOLÓGICAS
 * 
 * Registro de sessões clínicas:
 * - Procedimento do dia
 * - Resposta do paciente
 * - Intercorrências
 * - Orientações pós-atendimento
 */
export function EvolucoesOdontologicasBlock({
  evolucoes,
  loading = false,
  canEdit = false,
  canSign = false,
  onAdd,
  onEdit,
  onSign,
  onNavigateToOdontograma,
}: EvolucoesOdontologicasBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartAdd = () => {
    setFormData(getEmptyFormData());
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (evolucao: EvolucaoOdontologica) => {
    setFormData({
      data_atendimento: evolucao.data_atendimento,
      procedimento_realizado: evolucao.procedimento_realizado,
      dentes_tratados: evolucao.dentes_tratados?.join(', ') || '',
      resposta_paciente: evolucao.resposta_paciente,
      intercorrencias: evolucao.intercorrencias || '',
      orientacoes_pos: evolucao.orientacoes_pos || '',
      observacoes: evolucao.observacoes || '',
    });
    setEditingId(evolucao.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    if (!formData.procedimento_realizado.trim() || !formData.resposta_paciente.trim()) return;
    
    setSaving(true);
    try {
      const dentesArray = formData.dentes_tratados
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const data = {
        data_atendimento: formData.data_atendimento,
        procedimento_realizado: formData.procedimento_realizado,
        dentes_tratados: dentesArray.length > 0 ? dentesArray : undefined,
        resposta_paciente: formData.resposta_paciente,
        intercorrencias: formData.intercorrencias || undefined,
        orientacoes_pos: formData.orientacoes_pos || undefined,
        observacoes: formData.observacoes || undefined,
      };

      if (editingId && onEdit) {
        await onEdit(editingId, data);
      } else {
        await onAdd(data);
      }
      handleCancel();
    } finally {
      setSaving(false);
    }
  };

  // Filter evolucoes
  const filteredEvolucoes = evolucoes.filter(e => {
    if (searchTerm === '') return true;
    const term = searchTerm.toLowerCase();
    return (
      e.procedimento_realizado.toLowerCase().includes(term) ||
      e.resposta_paciente.toLowerCase().includes(term) ||
      e.dentes_tratados?.some(d => d.includes(searchTerm)) ||
      e.intercorrencias?.toLowerCase().includes(term)
    );
  });

  // Sort by date descending
  const sortedEvolucoes = [...filteredEvolucoes].sort((a, b) => 
    new Date(b.data_atendimento).getTime() - new Date(a.data_atendimento).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evoluções Odontológicas</h2>
          <Badge variant="secondary" className="text-xs">
            {evolucoes.length} registros
          </Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Evolução
          </Button>
        )}
      </div>

      {/* Search */}
      {evolucoes.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por procedimento, dente ou intercorrência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Empty state */}
      {evolucoes.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma evolução registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre o progresso do tratamento odontológico do paciente.
            </p>
            {canEdit && (
              <Button onClick={handleStartAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolutions Timeline */}
      {sortedEvolucoes.length > 0 && (
        <div className="space-y-4">
          {sortedEvolucoes.map((evolucao, index) => {
            const statusConfig = STATUS_CONFIG[evolucao.status];
            const StatusIcon = statusConfig.icon;
            const canEditThis = canEdit && evolucao.status !== 'assinado';
            const canSignThis = canSign && evolucao.status === 'finalizado';

            return (
              <Card key={evolucao.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(evolucao.data_atendimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {canEditThis && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(evolucao)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canSignThis && onSign && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onSign(evolucao.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Assinar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    {/* Procedimento */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        Procedimento Realizado
                      </div>
                      <p className="text-sm pl-6">{evolucao.procedimento_realizado}</p>
                    </div>

                    {/* Dentes tratados */}
                    {evolucao.dentes_tratados && evolucao.dentes_tratados.length > 0 && (
                      <div className="pl-6">
                        <div className="flex flex-wrap gap-1">
                          {evolucao.dentes_tratados.map((dente) => (
                            <Badge
                              key={dente}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => onNavigateToOdontograma?.(dente)}
                            >
                              Dente {dente}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resposta do paciente */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Resposta do Paciente
                      </div>
                      <p className="text-sm pl-6">{evolucao.resposta_paciente}</p>
                    </div>

                    {/* Intercorrências */}
                    {evolucao.intercorrencias && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileWarning className="h-4 w-4 text-destructive" />
                          Intercorrências
                        </div>
                        <p className="text-sm pl-6 text-destructive">
                          {evolucao.intercorrencias}
                        </p>
                      </div>
                    )}

                    {/* Orientações */}
                    {evolucao.orientacoes_pos && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <BookOpen className="h-4 w-4 text-accent-foreground" />
                          Orientações Pós-Atendimento
                        </div>
                        <p className="text-sm pl-6">{evolucao.orientacoes_pos}</p>
                      </div>
                    )}

                    {/* Observações */}
                    {evolucao.observacoes && (
                      <div className="text-sm text-muted-foreground pl-6 pt-2 border-t">
                        <span className="font-medium">Obs:</span> {evolucao.observacoes}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {evolucao.professional_name || 'Profissional'}
                    </div>
                    {evolucao.signed_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Assinado em {format(parseISO(evolucao.signed_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No results */}
      {evolucoes.length > 0 && sortedEvolucoes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma evolução encontrada com o termo buscado.</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingId ? 'Editar Evolução' : 'Nova Evolução Odontológica'}
            </DialogTitle>
            <DialogDescription>
              Registre os detalhes do atendimento realizado.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-5 pr-2">
              {/* Data */}
              <div className="space-y-2">
                <Label>Data do Atendimento *</Label>
                <Input
                  type="date"
                  value={formData.data_atendimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_atendimento: e.target.value }))}
                />
              </div>

              {/* Procedimento */}
              <div className="space-y-2">
                <Label>Procedimento Realizado *</Label>
                <Textarea
                  placeholder="Descreva o procedimento executado..."
                  value={formData.procedimento_realizado}
                  onChange={(e) => setFormData(prev => ({ ...prev, procedimento_realizado: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Dentes tratados */}
              <div className="space-y-2">
                <Label>Dentes Tratados</Label>
                <Input
                  placeholder="Ex: 16, 17, 26 (separados por vírgula)"
                  value={formData.dentes_tratados}
                  onChange={(e) => setFormData(prev => ({ ...prev, dentes_tratados: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use notação FDI. Separe múltiplos dentes por vírgula.
                </p>
              </div>

              {/* Resposta do paciente */}
              <div className="space-y-2">
                <Label>Resposta do Paciente *</Label>
                <Textarea
                  placeholder="Como o paciente respondeu ao tratamento..."
                  value={formData.resposta_paciente}
                  onChange={(e) => setFormData(prev => ({ ...prev, resposta_paciente: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Intercorrências */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Intercorrências
                </Label>
                <Textarea
                  placeholder="Registre qualquer intercorrência durante o atendimento..."
                  value={formData.intercorrencias}
                  onChange={(e) => setFormData(prev => ({ ...prev, intercorrencias: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Orientações pós */}
              <div className="space-y-2">
                <Label>Orientações Pós-Atendimento</Label>
                <Textarea
                  placeholder="Orientações passadas ao paciente..."
                  value={formData.orientacoes_pos}
                  onChange={(e) => setFormData(prev => ({ ...prev, orientacoes_pos: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações Gerais</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.procedimento_realizado.trim() || !formData.resposta_paciente.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
