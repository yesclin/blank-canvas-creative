import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FileText,
  Clock,
  User,
  CheckCircle,
  Edit,
  Save,
  X,
  ChevronRight,
  Stethoscope,
  ClipboardList,
  Target,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Tipo de atendimento
 */
export type TipoAtendimento = 'consulta' | 'retorno' | 'acompanhamento' | 'procedimento' | 'urgencia';

export const tipoAtendimentoLabels: Record<TipoAtendimento, string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  acompanhamento: 'Acompanhamento',
  procedimento: 'Procedimento',
  urgencia: 'Urgência',
};

/**
 * Status da evolução
 */
export type StatusEvolucao = 'rascunho' | 'assinada';

export const statusEvolucaoConfig: Record<StatusEvolucao, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  assinada: { label: 'Assinada', color: 'bg-green-100 text-green-700 border-green-300' },
};

/**
 * Estrutura de uma Evolução Clínica
 */
export interface EvolucaoClinica {
  id: string;
  patient_id: string;
  clinic_id: string;
  data_hora: string;
  profissional_id: string;
  profissional_nome: string;
  tipo_atendimento: TipoAtendimento;
  descricao_clinica: string;
  hipoteses_diagnosticas: string;
  conduta: string;
  status: StatusEvolucao;
  assinada_em?: string;
  created_at: string;
}

interface EvolucoesBlockProps {
  evolucoes: EvolucaoClinica[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: {
    tipo_atendimento: TipoAtendimento;
    descricao_clinica: string;
    hipoteses_diagnosticas: string;
    conduta: string;
    assinar: boolean;
  }) => Promise<void>;
  onSign?: (evolucaoId: string) => Promise<void>;
}

/**
 * EVOLUÇÕES CLÍNICAS - Bloco exclusivo para Clínica Geral
 * 
 * Cada evolução registra:
 * - Data e hora
 * - Profissional responsável
 * - Descrição clínica do atendimento
 * - Hipóteses diagnósticas
 * - Conduta adotada
 * 
 * Regras:
 * - Exibidas em ordem cronológica (mais recente primeiro)
 * - Nunca podem ser apagadas automaticamente
 * - Após assinadas, não podem ser editadas
 */
export function EvolucoesBlock({
  evolucoes,
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
  onSign,
}: EvolucoesBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvolucao, setSelectedEvolucao] = useState<EvolucaoClinica | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo_atendimento: 'consulta' as TipoAtendimento,
    descricao_clinica: '',
    hipoteses_diagnosticas: '',
    conduta: '',
  });

  // Sort by date descending (most recent first)
  const sortedEvolucoes = [...evolucoes].sort((a, b) => 
    new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
  );

  const handleOpenForm = () => {
    setFormData({
      tipo_atendimento: 'consulta',
      descricao_clinica: '',
      hipoteses_diagnosticas: '',
      conduta: '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      tipo_atendimento: 'consulta',
      descricao_clinica: '',
      hipoteses_diagnosticas: '',
      conduta: '',
    });
  };

  const handleSaveDraft = async () => {
    await onSave({ ...formData, assinar: false });
    handleCloseForm();
  };

  const handleSaveAndSign = async () => {
    await onSave({ ...formData, assinar: true });
    handleCloseForm();
  };

  const handleViewEvolucao = (evolucao: EvolucaoClinica) => {
    setSelectedEvolucao(evolucao);
  };

  const handleSignEvolucao = async (evolucaoId: string) => {
    if (onSign) {
      await onSign(evolucaoId);
      setSelectedEvolucao(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evoluções Clínicas</h2>
          <Badge variant="secondary">{evolucoes.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Evolução
          </Button>
        )}
      </div>

      {/* Evoluções List */}
      {sortedEvolucoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma evolução registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a primeira evolução clínica deste paciente.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {sortedEvolucoes.map((evolucao) => (
            <div key={evolucao.id} className="relative pl-10 pb-4 last:pb-0">
              {/* Timeline dot */}
              <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                evolucao.status === 'assinada' 
                  ? 'bg-green-500 border-green-300' 
                  : 'bg-yellow-500 border-yellow-300'
              }`} />
              
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => handleViewEvolucao(evolucao)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline">
                          {tipoAtendimentoLabels[evolucao.tipo_atendimento]}
                        </Badge>
                        <Badge className={statusEvolucaoConfig[evolucao.status].color}>
                          {evolucao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {statusEvolucaoConfig[evolucao.status].label}
                        </Badge>
                      </div>
                      
                      {/* Date and professional */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(parseISO(evolucao.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{evolucao.profissional_nome}</span>
                        </div>
                      </div>
                      
                      {/* Preview of clinical description */}
                      {evolucao.descricao_clinica && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {evolucao.descricao_clinica}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* New Evolution Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Nova Evolução Clínica
            </DialogTitle>
            <DialogDescription>
              Registre os dados do atendimento. Após assinada, a evolução não poderá ser alterada.
            </DialogDescription>
            {/* Current professional info */}
            {currentProfessionalName && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg mt-3">
                <User className="h-4 w-4" />
                <span>Profissional: <strong>{currentProfessionalName}</strong></span>
                <span className="mx-1">•</span>
                <Clock className="h-4 w-4" />
                <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Tipo de Atendimento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Tipo de Atendimento
                </Label>
                <Select 
                  value={formData.tipo_atendimento} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_atendimento: v as TipoAtendimento }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoAtendimentoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Descrição Clínica */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  Descrição Clínica do Atendimento <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva o quadro clínico, queixas, exame físico, achados relevantes..."
                  value={formData.descricao_clinica}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao_clinica: e.target.value }))}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Hipóteses Diagnósticas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Hipóteses Diagnósticas
                </Label>
                <Textarea
                  placeholder="Liste as hipóteses diagnósticas consideradas..."
                  value={formData.hipoteses_diagnosticas}
                  onChange={(e) => setFormData(prev => ({ ...prev, hipoteses_diagnosticas: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Conduta */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-green-500" />
                  Conduta Adotada
                </Label>
                <Textarea
                  placeholder="Descreva a conduta terapêutica, prescrições, orientações, encaminhamentos..."
                  value={formData.conduta}
                  onChange={(e) => setFormData(prev => ({ ...prev, conduta: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4 gap-2 bg-background">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSaveDraft} 
              disabled={saving || !formData.descricao_clinica.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button 
              onClick={handleSaveAndSign} 
              disabled={saving || !formData.descricao_clinica.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Salvar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Evolution Dialog */}
      <Dialog open={!!selectedEvolucao} onOpenChange={() => setSelectedEvolucao(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Evolução
            </DialogTitle>
            {selectedEvolucao && (
              <DialogDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(parseISO(selectedEvolucao.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedEvolucao.profissional_nome}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedEvolucao && (
            <>
              {/* Status badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {tipoAtendimentoLabels[selectedEvolucao.tipo_atendimento]}
                </Badge>
                <Badge className={statusEvolucaoConfig[selectedEvolucao.status].color}>
                  {selectedEvolucao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {statusEvolucaoConfig[selectedEvolucao.status].label}
                </Badge>
                {selectedEvolucao.assinada_em && (
                  <span className="text-xs text-muted-foreground">
                    Assinada em {format(parseISO(selectedEvolucao.assinada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-6 pr-4">
                  {/* Descrição Clínica */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <ClipboardList className="h-4 w-4" />
                      Descrição Clínica
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedEvolucao.descricao_clinica || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>

                  <Separator />

                  {/* Hipóteses Diagnósticas */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" />
                      Hipóteses Diagnósticas
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedEvolucao.hipoteses_diagnosticas || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>

                  <Separator />

                  {/* Conduta */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <Edit className="h-4 w-4" />
                      Conduta Adotada
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedEvolucao.conduta || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                {/* Sign button for drafts owned by current professional */}
                {selectedEvolucao.status === 'rascunho' && 
                 selectedEvolucao.profissional_id === currentProfessionalId && 
                 onSign && (
                  <Button 
                    variant="default" 
                    onClick={() => handleSignEvolucao(selectedEvolucao.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Assinar Evolução
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedEvolucao(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
