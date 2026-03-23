import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  FileText,
  Plus,
  Save,
  CheckCircle2,
  Clock,
  CalendarIcon,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  AlertCircle,
  Edit2,
  X
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const evolucaoItemSchema = z.object({
  id: z.string(),
  data_evolucao: z.string(),
  evolucao_quadro: z.string().min(1, 'Evolução do quadro é obrigatória').max(2000),
  resposta_tratamento: z.enum(['melhora_significativa', 'melhora_parcial', 'estavel', 'piora_leve', 'piora_significativa']),
  detalhes_resposta: z.string().max(1000).optional(),
  orientacoes_responsaveis: z.string().max(1500).optional(),
  proxima_avaliacao: z.string().optional(),
  sinais_alerta: z.string().max(500).optional(),
  status: z.enum(['draft', 'signed']),
  signed_at: z.string().optional(),
  signed_by: z.string().optional(),
  created_by: z.string().optional(),
  created_by_name: z.string().optional(),
  created_at: z.string(),
});

const evolucoesPediatriaSchema = z.object({
  evolucoes: z.array(evolucaoItemSchema).max(500),
});

// ===== TYPES =====
export type RespostaTratamento = 'melhora_significativa' | 'melhora_parcial' | 'estavel' | 'piora_leve' | 'piora_significativa';

export interface EvolucaoItem {
  id: string;
  data_evolucao: string;
  evolucao_quadro: string;
  resposta_tratamento: RespostaTratamento;
  detalhes_resposta?: string;
  orientacoes_responsaveis?: string;
  proxima_avaliacao?: string;
  sinais_alerta?: string;
  status: 'draft' | 'signed';
  signed_at?: string;
  signed_by?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export type EvolucoesPediatriaData = z.infer<typeof evolucoesPediatriaSchema>;

export interface EvolucoesPediatriaRecord {
  id: string;
  patient_id: string;
  data: EvolucoesPediatriaData;
  updated_by: string;
  updated_by_name?: string;
  updated_at: string;
}

// ===== CONSTANTS =====
export const RESPOSTA_TRATAMENTO_OPTIONS: { value: RespostaTratamento; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'melhora_significativa', label: 'Melhora Significativa', icon: <TrendingUp className="h-4 w-4" />, color: 'text-primary' },
  { value: 'melhora_parcial', label: 'Melhora Parcial', icon: <TrendingUp className="h-4 w-4" />, color: 'text-primary/70' },
  { value: 'estavel', label: 'Estável', icon: <Minus className="h-4 w-4" />, color: 'text-muted-foreground' },
  { value: 'piora_leve', label: 'Piora Leve', icon: <TrendingDown className="h-4 w-4" />, color: 'text-destructive/70' },
  { value: 'piora_significativa', label: 'Piora Significativa', icon: <TrendingDown className="h-4 w-4" />, color: 'text-destructive' },
];

// ===== PROPS =====
interface EvolucoesPediatriaBlockProps {
  patientId: string;
  record?: EvolucoesPediatriaRecord;
  onSave?: (data: EvolucoesPediatriaData) => Promise<void>;
  onSign?: (evolucaoId: string) => Promise<void>;
  isEditable?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  className?: string;
}

// ===== COMPONENT =====
export function EvolucoesPediatriaBlock({
  patientId,
  record,
  onSave,
  onSign,
  isEditable = true,
  currentProfessionalId,
  currentProfessionalName,
  className,
}: EvolucoesPediatriaBlockProps) {
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [evolucoes, setEvolucoes] = useState<EvolucaoItem[]>(
    (record?.data.evolucoes as EvolucaoItem[]) || []
  );

  const [newEvolucao, setNewEvolucao] = useState<Omit<EvolucaoItem, 'id' | 'created_at' | 'status'>>({
    data_evolucao: format(new Date(), 'yyyy-MM-dd'),
    evolucao_quadro: '',
    resposta_tratamento: 'estavel',
    detalhes_resposta: '',
    orientacoes_responsaveis: '',
    proxima_avaliacao: '',
    sinais_alerta: '',
    created_by: currentProfessionalId,
    created_by_name: currentProfessionalName,
  });

  const sortedEvolucoes = [...evolucoes].sort(
    (a, b) => new Date(b.data_evolucao).getTime() - new Date(a.data_evolucao).getTime()
  );

  const handleAddEvolucao = () => {
    if (!newEvolucao.evolucao_quadro.trim()) {
      setErrors({ evolucao_quadro: 'Evolução do quadro é obrigatória' });
      return;
    }

    const evolucao: EvolucaoItem = {
      id: crypto.randomUUID(),
      ...newEvolucao,
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    setEvolucoes(prev => [...prev, evolucao]);
    setNewEvolucao({
      data_evolucao: format(new Date(), 'yyyy-MM-dd'),
      evolucao_quadro: '',
      resposta_tratamento: 'estavel',
      detalhes_resposta: '',
      orientacoes_responsaveis: '',
      proxima_avaliacao: '',
      sinais_alerta: '',
      created_by: currentProfessionalId,
      created_by_name: currentProfessionalName,
    });
    setShowNewForm(false);
    setErrors({});
  };

  const handleRemoveEvolucao = (id: string) => {
    const evolucao = evolucoes.find(e => e.id === id);
    if (evolucao?.status === 'signed') return;
    setEvolucoes(prev => prev.filter(e => e.id !== id));
  };

  const handleSignEvolucao = async (id: string) => {
    if (onSign) {
      await onSign(id);
    }
    setEvolucoes(prev => prev.map(e => 
      e.id === id 
        ? { ...e, status: 'signed' as const, signed_at: new Date().toISOString(), signed_by: currentProfessionalId }
        : e
    ));
  };

  const handleSave = async () => {
    if (!onSave) return;

    const data: EvolucoesPediatriaData = { evolucoes };
    const result = evolucoesPediatriaSchema.safeParse(data);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave(result.data);
    } finally {
      setSaving(false);
    }
  };

  const getRespostaConfig = (resposta: RespostaTratamento) => {
    return RESPOSTA_TRATAMENTO_OPTIONS.find(o => o.value === resposta) || RESPOSTA_TRATAMENTO_OPTIONS[2];
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Evoluções Clínicas</CardTitle>
            <Badge variant="secondary">{evolucoes.length}</Badge>
          </div>
          {isEditable && !showNewForm && (
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Evolução
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* New Evolution Form */}
        {showNewForm && isEditable && (
          <div className="space-y-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Evolução Clínica
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Evolução *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setNewEvolucao({ ...newEvolucao, data_evolucao: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      disabled={(date) => isAfter(date, new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Resposta ao Tratamento *</Label>
                <Select
                  value={newEvolucao.resposta_tratamento}
                  onValueChange={(v) => setNewEvolucao({ ...newEvolucao, resposta_tratamento: v as RespostaTratamento })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPOSTA_TRATAMENTO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className={cn("flex items-center gap-2", opt.color)}>
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Evolução do Quadro Clínico *</Label>
              <Textarea
                placeholder="Descreva a evolução do quadro clínico..."
                value={newEvolucao.evolucao_quadro}
                onChange={(e) => setNewEvolucao({ ...newEvolucao, evolucao_quadro: e.target.value })}
                maxLength={2000}
                rows={4}
                className={errors.evolucao_quadro ? 'border-destructive' : ''}
              />
              {errors.evolucao_quadro && (
                <p className="text-xs text-destructive">{errors.evolucao_quadro}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Detalhes da Resposta ao Tratamento</Label>
              <Textarea
                placeholder="Detalhe a resposta às medicações, procedimentos ou intervenções..."
                value={newEvolucao.detalhes_resposta}
                onChange={(e) => setNewEvolucao({ ...newEvolucao, detalhes_resposta: e.target.value })}
                maxLength={1000}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Orientações aos Responsáveis
              </Label>
              <Textarea
                placeholder="Orientações sobre cuidados, medicação, alimentação, sinais de alerta..."
                value={newEvolucao.orientacoes_responsaveis}
                onChange={(e) => setNewEvolucao({ ...newEvolucao, orientacoes_responsaveis: e.target.value })}
                maxLength={1500}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Próxima Avaliação</Label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newEvolucao.proxima_avaliacao}
                  onChange={(e) => setNewEvolucao({ ...newEvolucao, proxima_avaliacao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Sinais de Alerta
                </Label>
                <Textarea
                  placeholder="Sinais que exigem retorno imediato..."
                  value={newEvolucao.sinais_alerta}
                  onChange={(e) => setNewEvolucao({ ...newEvolucao, sinais_alerta: e.target.value })}
                  maxLength={500}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEvolucao}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Evolução
              </Button>
            </div>
          </div>
        )}

        {/* Evolution List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {sortedEvolucoes.length === 0 && !showNewForm ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma evolução registrada</p>
                {isEditable && (
                  <Button variant="link" onClick={() => setShowNewForm(true)}>
                    Adicionar primeira evolução
                  </Button>
                )}
              </div>
            ) : (
              sortedEvolucoes.map((evolucao) => {
                const respostaConfig = getRespostaConfig(evolucao.resposta_tratamento);
                
                return (
                  <div 
                    key={evolucao.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      evolucao.status === 'signed' 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(parseISO(evolucao.data_evolucao), 'dd/MM/yyyy', { locale: ptBR })}
                          </Badge>
                          <Badge className={cn("flex items-center gap-1", respostaConfig.color, "bg-transparent border")}>
                            {respostaConfig.icon}
                            {respostaConfig.label}
                          </Badge>
                          {evolucao.status === 'signed' ? (
                            <Badge className="bg-primary/10 text-primary">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Assinada
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Edit2 className="h-3 w-3 mr-1" />
                              Rascunho
                            </Badge>
                          )}
                        </div>

                        {/* Evolução do Quadro */}
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Evolução do Quadro</h5>
                          <p className="text-sm whitespace-pre-wrap">{evolucao.evolucao_quadro}</p>
                        </div>

                        {/* Detalhes da Resposta */}
                        {evolucao.detalhes_resposta && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Detalhes da Resposta</h5>
                            <p className="text-sm text-muted-foreground">{evolucao.detalhes_resposta}</p>
                          </div>
                        )}

                        {/* Orientações */}
                        {evolucao.orientacoes_responsaveis && (
                          <div className="mb-3 p-2 rounded bg-accent/50">
                            <h5 className="text-xs font-medium flex items-center gap-1 mb-1">
                              <MessageSquare className="h-3 w-3" />
                              Orientações aos Responsáveis
                            </h5>
                            <p className="text-sm">{evolucao.orientacoes_responsaveis}</p>
                          </div>
                        )}

                        {/* Sinais de Alerta */}
                        {evolucao.sinais_alerta && (
                          <div className="mb-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                            <h5 className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                              <AlertCircle className="h-3 w-3" />
                              Sinais de Alerta
                            </h5>
                            <p className="text-sm text-destructive/80">{evolucao.sinais_alerta}</p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          {evolucao.created_by_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {evolucao.created_by_name}
                            </span>
                          )}
                          {evolucao.proxima_avaliacao && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Próxima: {format(parseISO(evolucao.proxima_avaliacao), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {evolucao.status === 'draft' && isEditable && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSignEvolucao(evolucao.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Assinar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveEvolucao(evolucao.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Save Button */}
        {evolucoes.length > 0 && isEditable && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Evoluções'}
              </Button>
            </div>
          </>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Corrija os erros:</p>
            <ul className="text-sm text-destructive list-disc list-inside mt-1">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EvolucoesPediatriaBlock;
