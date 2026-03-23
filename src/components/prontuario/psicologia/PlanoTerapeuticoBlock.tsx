import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Target,
  Edit3,
  Save,
  X,
  Clock,
  History,
  Lightbulb,
  Calendar,
  CheckSquare,
  RotateCcw,
  FileText,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  PlanoTerapeuticoData, 
  PlanoTerapeuticoFormData 
} from "@/hooks/prontuario/psicologia/usePlanoTerapeuticoData";

interface PlanoTerapeuticoBlockProps {
  currentPlano: PlanoTerapeuticoData | null;
  planoHistory: PlanoTerapeuticoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: PlanoTerapeuticoFormData) => Promise<void>;
}

const EMPTY_FORM: PlanoTerapeuticoFormData = {
  objetivos_terapeuticos: '',
  estrategias_intervencao: '',
  metas_curto_prazo: '',
  metas_medio_prazo: '',
  metas_longo_prazo: '',
  frequencia_recomendada: '',
  criterios_reavaliacao: '',
  observacoes: '',
};

/**
 * PLANO TERAPÊUTICO - Bloco exclusivo para Psicologia
 * 
 * Contém:
 * - Objetivos terapêuticos
 * - Estratégias de intervenção
 * - Metas de curto, médio e longo prazo
 * - Frequência recomendada das sessões
 * - Critérios de reavaliação
 * 
 * Regras:
 * - Pode ser ajustado ao longo do processo terapêutico
 * - Mantém histórico das versões anteriores
 */
export function PlanoTerapeuticoBlock({
  currentPlano,
  planoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: PlanoTerapeuticoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PlanoTerapeuticoData | null>(null);
  const [formData, setFormData] = useState<PlanoTerapeuticoFormData>(EMPTY_FORM);

  const handleStartEdit = () => {
    if (currentPlano) {
      setFormData({
        objetivos_terapeuticos: currentPlano.objetivos_terapeuticos || '',
        estrategias_intervencao: currentPlano.estrategias_intervencao || '',
        metas_curto_prazo: currentPlano.metas_curto_prazo || '',
        metas_medio_prazo: currentPlano.metas_medio_prazo || '',
        metas_longo_prazo: currentPlano.metas_longo_prazo || '',
        frequencia_recomendada: currentPlano.frequencia_recomendada || '',
        criterios_reavaliacao: currentPlano.criterios_reavaliacao || '',
        observacoes: currentPlano.observacoes || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentPlano && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum plano terapêutico registrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Defina os objetivos e metas do tratamento para este paciente.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Criar Plano Terapêutico
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {currentPlano ? 'Atualizar Plano Terapêutico' : 'Novo Plano Terapêutico'}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentPlano && (
            <p className="text-sm text-muted-foreground mt-1">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </div>
        <CardContent className="p-4">
          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-6">
              {/* Objetivos Terapêuticos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Objetivos Terapêuticos
                </Label>
                <p className="text-xs text-muted-foreground">
                  O que se pretende alcançar com o tratamento
                </p>
                <Textarea
                  placeholder="Objetivos gerais do processo terapêutico..."
                  value={formData.objetivos_terapeuticos}
                  onChange={(e) => setFormData(prev => ({ ...prev, objetivos_terapeuticos: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Estratégias de Intervenção */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Estratégias de Intervenção
                </Label>
                <p className="text-xs text-muted-foreground">
                  Abordagens e técnicas terapêuticas a serem utilizadas
                </p>
                <Textarea
                  placeholder="TCC, Psicodinâmica, técnicas de relaxamento, reestruturação cognitiva..."
                  value={formData.estrategias_intervencao}
                  onChange={(e) => setFormData(prev => ({ ...prev, estrategias_intervencao: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Metas */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Metas por Prazo
                </h4>

                {/* Curto Prazo */}
                <div className="space-y-2 pl-4 border-l-2 border-green-200">
                  <Label className="text-sm">Curto Prazo (4-6 semanas)</Label>
                  <Textarea
                    placeholder="Metas para as próximas semanas..."
                    value={formData.metas_curto_prazo}
                    onChange={(e) => setFormData(prev => ({ ...prev, metas_curto_prazo: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Médio Prazo */}
                <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                  <Label className="text-sm">Médio Prazo (3-6 meses)</Label>
                  <Textarea
                    placeholder="Metas para os próximos meses..."
                    value={formData.metas_medio_prazo}
                    onChange={(e) => setFormData(prev => ({ ...prev, metas_medio_prazo: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Longo Prazo */}
                <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                  <Label className="text-sm">Longo Prazo (tratamento completo)</Label>
                  <Textarea
                    placeholder="Metas para o tratamento como um todo..."
                    value={formData.metas_longo_prazo}
                    onChange={(e) => setFormData(prev => ({ ...prev, metas_longo_prazo: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Frequência Recomendada */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Frequência Recomendada
                </Label>
                <Input
                  placeholder="Ex: Semanal, Quinzenal, 2x por semana"
                  value={formData.frequencia_recomendada}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequencia_recomendada: e.target.value }))}
                />
              </div>

              {/* Critérios de Reavaliação */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  Critérios de Reavaliação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando e como o plano será reavaliado
                </p>
                <Textarea
                  placeholder="Reavaliar após 8 sessões, ou quando houver mudança significativa..."
                  value={formData.criterios_reavaliacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, criterios_reavaliacao: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações
                </Label>
                <Textarea
                  placeholder="Notas adicionais sobre o plano..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Plano Terapêutico</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentPlano?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {planoHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({planoHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Last update info */}
      {currentPlano && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentPlano.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentPlano.created_by_name && ` por ${currentPlano.created_by_name}`}
          </span>
        </div>
      )}

      {/* Plano Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['objetivos', 'metas']} className="w-full">
            {/* Objetivos */}
            <AccordionItem value="objetivos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Objetivos Terapêuticos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentPlano?.objetivos_terapeuticos || <span className="italic text-muted-foreground">Não definido</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Estratégias */}
            <AccordionItem value="estrategias" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Estratégias de Intervenção</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentPlano?.estrategias_intervencao || <span className="italic text-muted-foreground">Não definido</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Metas */}
            <AccordionItem value="metas" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  <span>Metas por Prazo</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <MetaSection 
                    label="Curto Prazo" 
                    sublabel="4-6 semanas"
                    content={currentPlano?.metas_curto_prazo} 
                    borderColor="border-green-300"
                  />
                  <MetaSection 
                    label="Médio Prazo" 
                    sublabel="3-6 meses"
                    content={currentPlano?.metas_medio_prazo} 
                    borderColor="border-blue-300"
                  />
                  <MetaSection 
                    label="Longo Prazo" 
                    sublabel="tratamento completo"
                    content={currentPlano?.metas_longo_prazo} 
                    borderColor="border-purple-300"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Frequência */}
            <AccordionItem value="frequencia" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Frequência Recomendada</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm font-medium">
                  {currentPlano?.frequencia_recomendada || <span className="italic text-muted-foreground font-normal">Não definido</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Critérios de Reavaliação */}
            <AccordionItem value="reavaliacao">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  <span>Critérios de Reavaliação</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentPlano?.criterios_reavaliacao || <span className="italic text-muted-foreground">Não definido</span>}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico do Plano Terapêutico
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {planoHistory.map((plano) => (
                <Card
                  key={plano.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    plano.is_current ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedVersion(plano)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={plano.is_current ? 'default' : 'secondary'}>
                          v{plano.version}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {format(parseISO(plano.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {plano.created_by_name && (
                            <p className="text-xs text-muted-foreground">
                              por {plano.created_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Plano Terapêutico - Versão {selectedVersion?.version}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-4 pr-4">
                <div className="text-sm text-muted-foreground">
                  Registrado em{' '}
                  {format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {selectedVersion.created_by_name && ` por ${selectedVersion.created_by_name}`}
                </div>

                <div className="space-y-4">
                  <Section title="Objetivos Terapêuticos" content={selectedVersion.objetivos_terapeuticos} />
                  <Section title="Estratégias de Intervenção" content={selectedVersion.estrategias_intervencao} />
                  <Separator />
                  <Section title="Metas de Curto Prazo" content={selectedVersion.metas_curto_prazo} />
                  <Section title="Metas de Médio Prazo" content={selectedVersion.metas_medio_prazo} />
                  <Section title="Metas de Longo Prazo" content={selectedVersion.metas_longo_prazo} />
                  <Separator />
                  <Section title="Frequência Recomendada" content={selectedVersion.frequencia_recomendada} />
                  <Section title="Critérios de Reavaliação" content={selectedVersion.criterios_reavaliacao} />
                  {selectedVersion.observacoes && (
                    <Section title="Observações" content={selectedVersion.observacoes} />
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaSection({ label, sublabel, content, borderColor }: { 
  label: string; 
  sublabel: string;
  content?: string; 
  borderColor: string;
}) {
  return (
    <div className={`pl-4 border-l-2 ${borderColor}`}>
      <p className="text-xs text-muted-foreground mb-1">{label} ({sublabel})</p>
      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="italic text-muted-foreground">Não definido</span>}
      </p>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="italic text-muted-foreground">Não informado</span>}
      </p>
    </div>
  );
}
