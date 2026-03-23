import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Plus,
  Clock,
  User,
  Save,
  X,
  ChevronRight,
  ClipboardList,
  FileText,
  Pill,
  MessageSquare,
  ArrowUpRight,
  CalendarCheck,
  Link2,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EvolucaoClinica } from "./EvolucoesBlock";

/**
 * Estrutura de um Plano/Conduta
 */
export interface Conduta {
  id: string;
  patient_id: string;
  clinic_id: string;
  evolucao_id?: string;
  profissional_id: string;
  profissional_nome: string;
  data_hora: string;
  solicitacao_exames?: string;
  prescricoes?: string;
  orientacoes?: string;
  encaminhamentos?: string;
  retorno_agendado?: string;
  retorno_observacoes?: string;
  created_at: string;
}

interface CondutaBlockProps {
  condutas: Conduta[];
  evolucoes?: EvolucaoClinica[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: {
    evolucao_id?: string;
    solicitacao_exames?: string;
    prescricoes?: string;
    orientacoes?: string;
    encaminhamentos?: string;
    retorno_agendado?: string;
    retorno_observacoes?: string;
  }) => Promise<void>;
}

/**
 * PLANO / CONDUTA - Bloco exclusivo para Clínica Geral
 * 
 * Permite registrar:
 * - Solicitação de exames
 * - Prescrições
 * - Orientações ao paciente
 * - Encaminhamentos
 * - Retorno agendado
 * 
 * Pode ser associado a uma evolução clínica.
 */
export function CondutaBlock({
  condutas,
  evolucoes = [],
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
}: CondutaBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConduta, setSelectedConduta] = useState<Conduta | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    evolucao_id: '',
    solicitacao_exames: '',
    prescricoes: '',
    orientacoes: '',
    encaminhamentos: '',
    retorno_agendado: '',
    retorno_observacoes: '',
  });

  // Sort by date descending
  const sortedCondutas = [...condutas].sort((a, b) => 
    new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
  );

  // Get evolutions without linked condutas for the selector
  const availableEvolucoes = evolucoes.filter(e => 
    !condutas.some(c => c.evolucao_id === e.id)
  );

  const handleOpenForm = () => {
    setFormData({
      evolucao_id: '',
      solicitacao_exames: '',
      prescricoes: '',
      orientacoes: '',
      encaminhamentos: '',
      retorno_agendado: '',
      retorno_observacoes: '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async () => {
    await onSave({
      evolucao_id: formData.evolucao_id || undefined,
      solicitacao_exames: formData.solicitacao_exames || undefined,
      prescricoes: formData.prescricoes || undefined,
      orientacoes: formData.orientacoes || undefined,
      encaminhamentos: formData.encaminhamentos || undefined,
      retorno_agendado: formData.retorno_agendado || undefined,
      retorno_observacoes: formData.retorno_observacoes || undefined,
    });
    handleCloseForm();
  };

  const handleViewConduta = (conduta: Conduta) => {
    setSelectedConduta(conduta);
  };

  // Check if any field is filled
  const hasAnyData = 
    formData.solicitacao_exames || 
    formData.prescricoes || 
    formData.orientacoes || 
    formData.encaminhamentos ||
    formData.retorno_agendado;

  // Get summary of a conduta
  const getCondutaSummary = (conduta: Conduta): string[] => {
    const items: string[] = [];
    if (conduta.solicitacao_exames) items.push('Exames');
    if (conduta.prescricoes) items.push('Prescrições');
    if (conduta.orientacoes) items.push('Orientações');
    if (conduta.encaminhamentos) items.push('Encaminhamentos');
    if (conduta.retorno_agendado) items.push('Retorno');
    return items;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Plano / Conduta</h2>
          <Badge variant="secondary">{condutas.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conduta
          </Button>
        )}
      </div>

      {/* Condutas List */}
      {sortedCondutas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum plano registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre exames, prescrições, orientações e encaminhamentos.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conduta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedCondutas.map((conduta) => (
            <Card 
              key={conduta.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewConduta(conduta)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Date and professional */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(parseISO(conduta.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {conduta.evolucao_id && (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Vinculado
                        </Badge>
                      )}
                    </div>
                    
                    {/* Summary badges */}
                    <div className="flex flex-wrap gap-1">
                      {getCondutaSummary(conduta).map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>

                    {/* Return date if set */}
                    {conduta.retorno_agendado && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                        <CalendarCheck className="h-4 w-4" />
                        <span>Retorno: {format(parseISO(conduta.retorno_agendado), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Conduta Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Nova Conduta
            </DialogTitle>
            <DialogDescription>
              Registre o plano terapêutico do paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
          {/* Current professional info */}
          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Profissional: <strong>{currentProfessionalName}</strong></span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4" />
              <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}
              {/* Vincular a evolução */}
              {availableEvolucoes.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    Vincular a uma Evolução (opcional)
                  </Label>
                  <Select 
                    value={formData.evolucao_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, evolucao_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma evolução..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {availableEvolucoes.map((evo) => (
                        <SelectItem key={evo.id} value={evo.id}>
                          {format(parseISO(evo.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {evo.profissional_nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Solicitação de Exames */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Solicitação de Exames
                </Label>
                <Textarea
                  placeholder="Hemograma completo, Glicemia em jejum, TSH..."
                  value={formData.solicitacao_exames}
                  onChange={(e) => setFormData(prev => ({ ...prev, solicitacao_exames: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Prescrições */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-green-500" />
                  Prescrições
                </Label>
                <Textarea
                  placeholder="Medicamentos, dosagem, posologia..."
                  value={formData.prescricoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescricoes: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Orientações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  Orientações ao Paciente
                </Label>
                <Textarea
                  placeholder="Recomendações, cuidados, orientações gerais..."
                  value={formData.orientacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, orientacoes: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Encaminhamentos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-purple-500" />
                  Encaminhamentos
                </Label>
                <Textarea
                  placeholder="Especialidades, exames especializados..."
                  value={formData.encaminhamentos}
                  onChange={(e) => setFormData(prev => ({ ...prev, encaminhamentos: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Retorno */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Retorno Agendado
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Data do Retorno</Label>
                    <Input
                      type="date"
                      value={formData.retorno_agendado}
                      onChange={(e) => setFormData(prev => ({ ...prev, retorno_agendado: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Observações do Retorno</Label>
                    <Input
                      placeholder="Com exames, em jejum..."
                      value={formData.retorno_observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, retorno_observacoes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4 gap-2 bg-background">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasAnyData}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Conduta Dialog */}
      <Dialog open={!!selectedConduta} onOpenChange={() => setSelectedConduta(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Conduta
            </DialogTitle>
            {selectedConduta && (
              <DialogDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(parseISO(selectedConduta.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedConduta.profissional_nome}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedConduta && (
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Linked evolution badge */}
                {selectedConduta.evolucao_id && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Link2 className="h-3 w-3" />
                    Vinculado a uma evolução clínica
                  </Badge>
                )}

                {/* Solicitação de Exames */}
                {selectedConduta.solicitacao_exames && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Solicitação de Exames
                    </h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedConduta.solicitacao_exames}
                    </p>
                  </div>
                )}

                {/* Prescrições */}
                {selectedConduta.prescricoes && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                      <Pill className="h-4 w-4 text-green-500" />
                      Prescrições
                    </h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedConduta.prescricoes}
                    </p>
                  </div>
                )}

                {/* Orientações */}
                {selectedConduta.orientacoes && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      Orientações ao Paciente
                    </h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedConduta.orientacoes}
                    </p>
                  </div>
                )}

                {/* Encaminhamentos */}
                {selectedConduta.encaminhamentos && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                      <ArrowUpRight className="h-4 w-4 text-purple-500" />
                      Encaminhamentos
                    </h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedConduta.encaminhamentos}
                    </p>
                  </div>
                )}

                {/* Retorno */}
                {selectedConduta.retorno_agendado && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      Retorno Agendado
                    </h3>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium">
                        {format(parseISO(selectedConduta.retorno_agendado), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {selectedConduta.retorno_observacoes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedConduta.retorno_observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConduta(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
