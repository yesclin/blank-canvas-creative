import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Edit3,
  Save,
  X,
  Clock,
  History,
  Plus,
  Trash2,
  Pill,
  FileText,
  Printer,
  Send,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Copy
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formas farmacêuticas comuns em dermatologia
 */
export const PHARMACEUTICAL_FORMS = [
  { value: 'comprimido', label: 'Comprimido' },
  { value: 'capsula', label: 'Cápsula' },
  { value: 'creme', label: 'Creme' },
  { value: 'pomada', label: 'Pomada' },
  { value: 'gel', label: 'Gel' },
  { value: 'locao', label: 'Loção' },
  { value: 'solucao', label: 'Solução' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'spray', label: 'Spray' },
  { value: 'espuma', label: 'Espuma' },
  { value: 'oleo', label: 'Óleo' },
  { value: 'esmalte', label: 'Esmalte' },
  { value: 'adesivo', label: 'Adesivo/Patch' },
  { value: 'injetavel', label: 'Injetável' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'emulsao', label: 'Emulsão' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Frequências de uso comuns
 */
export const FREQUENCY_OPTIONS = [
  { value: '1x_dia', label: '1x ao dia' },
  { value: '2x_dia', label: '2x ao dia' },
  { value: '3x_dia', label: '3x ao dia' },
  { value: '4x_dia', label: '4x ao dia' },
  { value: '6_6h', label: 'De 6 em 6 horas' },
  { value: '8_8h', label: 'De 8 em 8 horas' },
  { value: '12_12h', label: 'De 12 em 12 horas' },
  { value: 'noite', label: 'À noite' },
  { value: 'manha', label: 'Pela manhã' },
  { value: 'semana_1x', label: '1x por semana' },
  { value: 'semana_2x', label: '2x por semana' },
  { value: 'semana_3x', label: '3x por semana' },
  { value: 'dias_alternados', label: 'Em dias alternados' },
  { value: 'sos', label: 'Se necessário (SOS)' },
  { value: 'uso_continuo', label: 'Uso contínuo' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Duração do tratamento
 */
export const DURATION_OPTIONS = [
  { value: '3_dias', label: '3 dias' },
  { value: '5_dias', label: '5 dias' },
  { value: '7_dias', label: '7 dias' },
  { value: '10_dias', label: '10 dias' },
  { value: '14_dias', label: '14 dias' },
  { value: '21_dias', label: '21 dias' },
  { value: '30_dias', label: '30 dias' },
  { value: '60_dias', label: '60 dias' },
  { value: '90_dias', label: '90 dias' },
  { value: '6_meses', label: '6 meses' },
  { value: 'uso_continuo', label: 'Uso contínuo' },
  { value: 'ate_acabar', label: 'Até acabar' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Item de prescrição individual
 */
export interface PrescriptionItem {
  id: string;
  medicamento: string;
  forma_farmaceutica: string;
  forma_farmaceutica_custom?: string;
  dosagem: string;
  frequencia: string;
  frequencia_custom?: string;
  duracao: string;
  duracao_custom?: string;
  orientacoes?: string;
  is_controlled?: boolean; // Medicamento controlado
  via_administracao?: string;
}

/**
 * Estrutura de dados de uma Prescrição
 */
export interface PrescricaoDermatoData {
  id: string;
  patient_id: string;
  appointment_id?: string;
  version: number;
  items: PrescriptionItem[];
  observacoes_gerais?: string;
  
  // Campos para integração com receita digital
  digital_prescription_id?: string;
  digital_prescription_status?: 'draft' | 'pending' | 'signed' | 'sent' | 'cancelled';
  digital_prescription_url?: string;
  signed_at?: string;
  sent_at?: string;
  
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface PrescricoesDermatoBlockProps {
  currentPrescricao: PrescricaoDermatoData | null;
  prescricaoHistory: PrescricaoDermatoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<PrescricaoDermatoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  /** Callback para gerar receita digital (futuro) */
  onGenerateDigitalPrescription?: (prescriptionId: string) => Promise<void>;
  /** Callback para imprimir receita */
  onPrint?: (prescription: PrescricaoDermatoData) => void;
}

const createEmptyItem = (): PrescriptionItem => ({
  id: crypto.randomUUID(),
  medicamento: '',
  forma_farmaceutica: '',
  dosagem: '',
  frequencia: '',
  duracao: '',
  orientacoes: '',
});

const getOptionLabel = (value: string, options: readonly { value: string; label: string }[]) => {
  return options.find(o => o.value === value)?.label || value || '—';
};

/**
 * PRESCRIÇÕES DERMATOLÓGICAS
 * 
 * Permite registrar:
 * - Múltiplos medicamentos
 * - Forma farmacêutica, dosagem, frequência, duração
 * - Orientações específicas por item
 * - Observações gerais
 * 
 * Preparado para integração com receita digital
 */
export function PrescricoesDermatoBlock({
  currentPrescricao,
  prescricaoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onGenerateDigitalPrescription,
  onPrint,
}: PrescricoesDermatoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PrescricaoDermatoData | null>(null);
  
  // Form state
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState('');

  const handleStartEdit = () => {
    if (currentPrescricao) {
      setItems(currentPrescricao.items || []);
      setObservacoesGerais(currentPrescricao.observacoes_gerais || '');
    } else {
      setItems([createEmptyItem()]);
      setObservacoesGerais('');
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setItems([]);
    setObservacoesGerais('');
  };

  const handleSave = async () => {
    const validItems = items.filter(i => i.medicamento.trim());
    if (validItems.length === 0) return;
    
    await onSave({
      items: validItems,
      observacoes_gerais: observacoesGerais.trim() || undefined,
    });
    setIsEditing(false);
  };

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof PrescriptionItem, value: string | boolean) => {
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatPrescriptionText = (prescription: PrescricaoDermatoData): string => {
    let text = 'PRESCRIÇÃO MÉDICA\n\n';
    prescription.items.forEach((item, index) => {
      text += `${index + 1}. ${item.medicamento}\n`;
      text += `   Forma: ${getOptionLabel(item.forma_farmaceutica, PHARMACEUTICAL_FORMS)}\n`;
      text += `   Dosagem: ${item.dosagem}\n`;
      text += `   Frequência: ${getOptionLabel(item.frequencia, FREQUENCY_OPTIONS)}\n`;
      text += `   Duração: ${getOptionLabel(item.duracao, DURATION_OPTIONS)}\n`;
      if (item.orientacoes) {
        text += `   Orientações: ${item.orientacoes}\n`;
      }
      text += '\n';
    });
    if (prescription.observacoes_gerais) {
      text += `Observações: ${prescription.observacoes_gerais}\n`;
    }
    return text;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentPrescricao && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Pill className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma prescrição registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione medicamentos e orientações para o tratamento dermatológico.
          </p>
          {canEdit && (
            <Button onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Nova Prescrição
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {currentPrescricao ? 'Nova Prescrição' : 'Prescrição'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving || items.filter(i => i.medicamento.trim()).length === 0}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Cada prescrição gera um novo registro. Histórico preservado.
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Medicamentos</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <Accordion type="multiple" defaultValue={items.map(i => i.id)} className="space-y-2">
                  {items.map((item, index) => (
                    <AccordionItem key={item.id} value={item.id} className="border rounded-lg bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="outline" className="shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="font-medium truncate">
                            {item.medicamento || 'Novo medicamento'}
                          </span>
                          {item.is_controlled && (
                            <Badge variant="destructive" className="text-xs">
                              Controlado
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {/* Medicamento */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Medicamento *</Label>
                              <Input
                                placeholder="Nome do medicamento"
                                value={item.medicamento}
                                onChange={(e) => updateItem(item.id, 'medicamento', e.target.value)}
                              />
                            </div>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-6 text-destructive hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Forma Farmacêutica */}
                            <div className="space-y-2">
                              <Label className="text-xs">Forma Farmacêutica</Label>
                              <Select
                                value={item.forma_farmaceutica}
                                onValueChange={(v) => updateItem(item.id, 'forma_farmaceutica', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {PHARMACEUTICAL_FORMS.map(form => (
                                    <SelectItem key={form.value} value={form.value}>
                                      {form.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Dosagem */}
                            <div className="space-y-2">
                              <Label className="text-xs">Dosagem</Label>
                              <Input
                                placeholder="Ex: 500mg, 0.05%, 10ml"
                                value={item.dosagem}
                                onChange={(e) => updateItem(item.id, 'dosagem', e.target.value)}
                              />
                            </div>

                            {/* Frequência */}
                            <div className="space-y-2">
                              <Label className="text-xs">Frequência</Label>
                              <Select
                                value={item.frequencia}
                                onValueChange={(v) => updateItem(item.id, 'frequencia', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {FREQUENCY_OPTIONS.map(freq => (
                                    <SelectItem key={freq.value} value={freq.value}>
                                      {freq.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Duração */}
                            <div className="space-y-2">
                              <Label className="text-xs">Duração</Label>
                              <Select
                                value={item.duracao}
                                onValueChange={(v) => updateItem(item.id, 'duracao', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {DURATION_OPTIONS.map(dur => (
                                    <SelectItem key={dur.value} value={dur.value}>
                                      {dur.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Orientações */}
                          <div className="space-y-2">
                            <Label className="text-xs">Orientações de uso</Label>
                            <Textarea
                              placeholder="Ex: Aplicar em camada fina na área afetada. Evitar exposição solar."
                              value={item.orientacoes || ''}
                              onChange={(e) => updateItem(item.id, 'orientacoes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <Separator />

              {/* Observações Gerais */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações Gerais
                </Label>
                <Textarea
                  placeholder="Orientações gerais, cuidados especiais, retorno..."
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Info sobre receita digital */}
              <div className="bg-muted rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Receita Digital</p>
                  <p className="text-muted-foreground">
                    A integração com receita digital estará disponível em breve. 
                    Por enquanto, você pode imprimir ou copiar a prescrição.
                  </p>
                </div>
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Prescrição</h2>
          {currentPrescricao?.digital_prescription_status && (
            <Badge 
              variant={currentPrescricao.digital_prescription_status === 'signed' ? 'default' : 'outline'}
              className="text-xs"
            >
              {currentPrescricao.digital_prescription_status === 'signed' && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {currentPrescricao.digital_prescription_status === 'draft' && 'Rascunho'}
              {currentPrescricao.digital_prescription_status === 'pending' && 'Pendente'}
              {currentPrescricao.digital_prescription_status === 'signed' && 'Assinada'}
              {currentPrescricao.digital_prescription_status === 'sent' && 'Enviada'}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentPrescricao && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(formatPrescriptionText(currentPrescricao))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              {onPrint && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPrint(currentPrescricao)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
                </Button>
              )}
            </>
          )}
          {prescricaoHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({prescricaoHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Prescrição
            </Button>
          )}
        </div>
      </div>

      {/* Prescription items */}
      {currentPrescricao && (
        <div className="space-y-3">
          {currentPrescricao.items.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="shrink-0 mt-0.5">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{item.medicamento}</h4>
                      {item.is_controlled && (
                        <Badge variant="destructive" className="text-xs">
                          Controlado
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block">Forma</span>
                        <span>{getOptionLabel(item.forma_farmaceutica, PHARMACEUTICAL_FORMS)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Dosagem</span>
                        <span>{item.dosagem || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Frequência</span>
                        <span>{getOptionLabel(item.frequencia, FREQUENCY_OPTIONS)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Duração</span>
                        <span>{getOptionLabel(item.duracao, DURATION_OPTIONS)}</span>
                      </div>
                    </div>
                    {item.orientacoes && (
                      <div className="pt-2 border-t mt-2">
                        <span className="text-muted-foreground text-xs">Orientações:</span>
                        <p className="text-sm">{item.orientacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Observações gerais */}
          {currentPrescricao.observacoes_gerais && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <span className="text-sm font-medium text-muted-foreground">Observações Gerais</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {currentPrescricao.observacoes_gerais}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Criada em {format(parseISO(currentPrescricao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {currentPrescricao.created_by_name && ` por ${currentPrescricao.created_by_name}`}
            </span>
          </div>
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Prescrições
            </DialogTitle>
            <DialogDescription>
              Todas as prescrições registradas para este paciente.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {prescricaoHistory.map((version) => (
                <Card 
                  key={version.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    version.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedVersion(version);
                    setShowHistory(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {format(parseISO(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {version.is_current && (
                            <Badge variant="secondary" className="text-xs">Mais recente</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {version.items.length} {version.items.length === 1 ? 'medicamento' : 'medicamentos'}
                        </p>
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescrição
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` por ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-3">
                {selectedVersion.items.map((item, index) => (
                  <Card key={item.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{item.medicamento}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Forma:</span> {getOptionLabel(item.forma_farmaceutica, PHARMACEUTICAL_FORMS)}</div>
                        <div><span className="text-muted-foreground">Dosagem:</span> {item.dosagem || '—'}</div>
                        <div><span className="text-muted-foreground">Frequência:</span> {getOptionLabel(item.frequencia, FREQUENCY_OPTIONS)}</div>
                        <div><span className="text-muted-foreground">Duração:</span> {getOptionLabel(item.duracao, DURATION_OPTIONS)}</div>
                      </div>
                      {item.orientacoes && (
                        <p className="text-sm mt-2 pt-2 border-t">
                          <span className="text-muted-foreground">Orientações:</span> {item.orientacoes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {selectedVersion.observacoes_gerais && (
                  <div className="pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Observações Gerais</span>
                    <p className="text-sm whitespace-pre-wrap">{selectedVersion.observacoes_gerais}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PrescricoesDermatoBlock;
