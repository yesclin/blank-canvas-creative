import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Edit3,
  Save,
  X,
  Clock,
  Plus,
  Trash2,
  Scissors,
  CalendarIcon,
  MapPin,
  Wrench,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BODY_LOCATIONS } from "./ExameDermatoBlock";

/**
 * Tipos de procedimentos dermatológicos
 */
export const DERMATOLOGY_PROCEDURE_TYPES = [
  // Procedimentos diagnósticos
  { value: 'biopsia_punch', label: 'Biópsia por Punch', category: 'diagnostico' },
  { value: 'biopsia_incisional', label: 'Biópsia Incisional', category: 'diagnostico' },
  { value: 'biopsia_excisional', label: 'Biópsia Excisional', category: 'diagnostico' },
  { value: 'dermatoscopia', label: 'Dermatoscopia', category: 'diagnostico' },
  { value: 'mapeamento_corporal', label: 'Mapeamento Corporal', category: 'diagnostico' },
  { value: 'teste_contato', label: 'Teste de Contato', category: 'diagnostico' },
  { value: 'teste_prick', label: 'Teste Prick', category: 'diagnostico' },
  { value: 'raspado_cutaneo', label: 'Raspado Cutâneo', category: 'diagnostico' },
  { value: 'luz_wood', label: 'Exame com Luz de Wood', category: 'diagnostico' },
  
  // Procedimentos terapêuticos
  { value: 'crioterapia', label: 'Crioterapia', category: 'terapeutico' },
  { value: 'eletrocoagulacao', label: 'Eletrocoagulação', category: 'terapeutico' },
  { value: 'curetagem', label: 'Curetagem', category: 'terapeutico' },
  { value: 'shaving', label: 'Shaving', category: 'terapeutico' },
  { value: 'exerese', label: 'Exérese Cirúrgica', category: 'terapeutico' },
  { value: 'cauterizacao', label: 'Cauterização Química', category: 'terapeutico' },
  { value: 'infiltracao', label: 'Infiltração Intralesional', category: 'terapeutico' },
  { value: 'drenagem', label: 'Drenagem de Abscesso/Cisto', category: 'terapeutico' },
  { value: 'laser_terapeutico', label: 'Laser Terapêutico', category: 'terapeutico' },
  { value: 'fototerapia', label: 'Fototerapia (UVB/PUVA)', category: 'terapeutico' },
  { value: 'terapia_fotodinamica', label: 'Terapia Fotodinâmica', category: 'terapeutico' },
  { value: 'microagulhamento', label: 'Microagulhamento', category: 'terapeutico' },
  
  // Procedimentos estéticos
  { value: 'peeling_quimico', label: 'Peeling Químico', category: 'estetico' },
  { value: 'toxina_botulinica', label: 'Toxina Botulínica', category: 'estetico' },
  { value: 'preenchimento', label: 'Preenchimento', category: 'estetico' },
  { value: 'laser_estetico', label: 'Laser Estético', category: 'estetico' },
  { value: 'luz_intensa_pulsada', label: 'Luz Intensa Pulsada', category: 'estetico' },
  { value: 'radiofrequencia', label: 'Radiofrequência', category: 'estetico' },
  { value: 'bioestimulador', label: 'Bioestimulador de Colágeno', category: 'estetico' },
  
  // Outros
  { value: 'curativo', label: 'Curativo Especial', category: 'outro' },
  { value: 'retirada_pontos', label: 'Retirada de Pontos', category: 'outro' },
  { value: 'outro', label: 'Outro', category: 'outro' },
] as const;

/**
 * Técnicas comuns em dermatologia
 */
export const DERMATOLOGY_TECHNIQUES = [
  { value: 'anestesia_local', label: 'Anestesia Local' },
  { value: 'anestesia_topica', label: 'Anestesia Tópica' },
  { value: 'assepsia_antissepsia', label: 'Assepsia e Antissepsia' },
  { value: 'sutura_simples', label: 'Sutura Simples' },
  { value: 'sutura_intradermico', label: 'Sutura Intradérmica' },
  { value: 'fechamento_segunda', label: 'Fechamento por Segunda Intenção' },
  { value: 'nitrogenio_liquido', label: 'Nitrogênio Líquido' },
  { value: 'eletrobisturi', label: 'Eletrobisturi' },
  { value: 'punch_3mm', label: 'Punch 3mm' },
  { value: 'punch_4mm', label: 'Punch 4mm' },
  { value: 'punch_5mm', label: 'Punch 5mm' },
  { value: 'punch_6mm', label: 'Punch 6mm' },
  { value: 'bisturi_15', label: 'Bisturi Lâmina 15' },
  { value: 'bisturi_11', label: 'Bisturi Lâmina 11' },
  { value: 'cureta_pequena', label: 'Cureta Pequena' },
  { value: 'cureta_media', label: 'Cureta Média' },
  { value: 'cureta_grande', label: 'Cureta Grande' },
  { value: 'agulha_30g', label: 'Agulha 30G' },
  { value: 'canula', label: 'Cânula' },
  { value: 'outro', label: 'Outra Técnica' },
] as const;

/**
 * Registro de um procedimento individual
 */
export interface ProcedimentoDermatoItem {
  id: string;
  tipo_procedimento: string;
  tipo_procedimento_custom?: string;
  regiao_tratada: string;
  regiao_tratada_detalhe?: string;
  tecnica_utilizada: string[];
  tecnica_custom?: string;
  data_procedimento: string;
  observacoes?: string;
  complicacoes?: string;
  material_utilizado?: string;
}

/**
 * Props do bloco de Procedimentos
 */
interface ProcedimentosDermatoBlockProps {
  procedimentos: ProcedimentoDermatoItem[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onAdd: (data: Omit<ProcedimentoDermatoItem, 'id'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<ProcedimentoDermatoItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const createEmptyProcedimento = (): Omit<ProcedimentoDermatoItem, 'id'> => ({
  tipo_procedimento: '',
  regiao_tratada: '',
  tecnica_utilizada: [],
  data_procedimento: format(new Date(), 'yyyy-MM-dd'),
  observacoes: '',
});

const getOptionLabel = (value: string, options: readonly { value: string; label: string }[]) => {
  return options.find(o => o.value === value)?.label || value || '—';
};

const getProcedureCategory = (value: string) => {
  const proc = DERMATOLOGY_PROCEDURE_TYPES.find(p => p.value === value);
  if (!proc) return null;
  
  const categories: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    diagnostico: { label: 'Diagnóstico', variant: 'outline' },
    terapeutico: { label: 'Terapêutico', variant: 'default' },
    estetico: { label: 'Estético', variant: 'secondary' },
    outro: { label: 'Outro', variant: 'outline' },
  };
  
  return categories[proc.category] || null;
};

/**
 * PROCEDIMENTOS DERMATOLÓGICOS
 * 
 * Registra procedimentos realizados:
 * - Tipo de procedimento (diagnóstico, terapêutico, estético)
 * - Região tratada
 * - Técnicas utilizadas
 * - Data e observações
 * 
 * Lista cronológica com filtros e busca
 */
export function ProcedimentosDermatoBlock({
  procedimentos,
  loading = false,
  saving = false,
  canEdit = false,
  onAdd,
  onUpdate,
  onDelete,
}: ProcedimentosDermatoBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedDetail, setSelectedDetail] = useState<ProcedimentoDermatoItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Omit<ProcedimentoDermatoItem, 'id'>>(createEmptyProcedimento());
  const [dataProcedimento, setDataProcedimento] = useState<Date>(new Date());

  const handleStartAdd = () => {
    setFormData(createEmptyProcedimento());
    setDataProcedimento(new Date());
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData(createEmptyProcedimento());
  };

  const handleSave = async () => {
    if (!formData.tipo_procedimento.trim()) return;
    
    await onAdd({
      ...formData,
      data_procedimento: format(dataProcedimento, 'yyyy-MM-dd'),
    });
    setIsAdding(false);
    setFormData(createEmptyProcedimento());
  };

  const updateFormField = (field: keyof Omit<ProcedimentoDermatoItem, 'id'>, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTecnica = (tecnica: string) => {
    setFormData(prev => {
      const current = prev.tecnica_utilizada || [];
      if (current.includes(tecnica)) {
        return { ...prev, tecnica_utilizada: current.filter(t => t !== tecnica) };
      }
      return { ...prev, tecnica_utilizada: [...current, tecnica] };
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sort by date descending
  const sortedProcedimentos = [...procedimentos].sort((a, b) => 
    new Date(b.data_procedimento).getTime() - new Date(a.data_procedimento).getTime()
  );

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
          <h2 className="text-lg font-semibold">Procedimentos Realizados</h2>
          {procedimentos.length > 0 && (
            <Badge variant="secondary">{procedimentos.length}</Badge>
          )}
        </div>
        {canEdit && !isAdding && (
          <Button size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" />
                Novo Procedimento
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saving || !formData.tipo_procedimento}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Procedimento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Scissors className="h-3 w-3" />
                  Tipo de Procedimento *
                </Label>
                <Select
                  value={formData.tipo_procedimento}
                  onValueChange={(v) => updateFormField('tipo_procedimento', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                      Diagnósticos
                    </div>
                    {DERMATOLOGY_PROCEDURE_TYPES.filter(p => p.category === 'diagnostico').map(proc => (
                      <SelectItem key={proc.value} value={proc.value}>
                        {proc.label}
                      </SelectItem>
                    ))}
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium mt-2">
                      Terapêuticos
                    </div>
                    {DERMATOLOGY_PROCEDURE_TYPES.filter(p => p.category === 'terapeutico').map(proc => (
                      <SelectItem key={proc.value} value={proc.value}>
                        {proc.label}
                      </SelectItem>
                    ))}
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium mt-2">
                      Estéticos
                    </div>
                    {DERMATOLOGY_PROCEDURE_TYPES.filter(p => p.category === 'estetico').map(proc => (
                      <SelectItem key={proc.value} value={proc.value}>
                        {proc.label}
                      </SelectItem>
                    ))}
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium mt-2">
                      Outros
                    </div>
                    {DERMATOLOGY_PROCEDURE_TYPES.filter(p => p.category === 'outro').map(proc => (
                      <SelectItem key={proc.value} value={proc.value}>
                        {proc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-3 w-3" />
                  Data do Procedimento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataProcedimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataProcedimento 
                        ? format(dataProcedimento, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataProcedimento}
                      onSelect={(d) => d && setDataProcedimento(d)}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Região Tratada */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3" />
                  Região Tratada
                </Label>
                <Select
                  value={formData.regiao_tratada}
                  onValueChange={(v) => updateFormField('regiao_tratada', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_LOCATIONS.map(loc => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Detalhe da Região */}
              <div className="space-y-2">
                <Label className="text-sm">Detalhe da Região</Label>
                <Input
                  placeholder="Ex: Dorso do nariz, Região periorbital direita"
                  value={formData.regiao_tratada_detalhe || ''}
                  onChange={(e) => updateFormField('regiao_tratada_detalhe', e.target.value)}
                />
              </div>
            </div>

            {/* Técnicas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Wrench className="h-3 w-3" />
                Técnicas Utilizadas
              </Label>
              <div className="flex flex-wrap gap-2">
                {DERMATOLOGY_TECHNIQUES.map(tec => (
                  <Badge
                    key={tec.value}
                    variant={formData.tecnica_utilizada?.includes(tec.value) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTecnica(tec.value)}
                  >
                    {tec.label}
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Outra técnica não listada..."
                value={formData.tecnica_custom || ''}
                onChange={(e) => updateFormField('tecnica_custom', e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Material Utilizado */}
            <div className="space-y-2">
              <Label className="text-sm">Material Utilizado</Label>
              <Input
                placeholder="Ex: Fio Nylon 5-0, Gaze estéril, Lidocaína 2%"
                value={formData.material_utilizado || ''}
                onChange={(e) => updateFormField('material_utilizado', e.target.value)}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <FileText className="h-3 w-3" />
                Observações
              </Label>
              <Textarea
                placeholder="Detalhes do procedimento, intercorrências, orientações pós-procedimento..."
                value={formData.observacoes || ''}
                onChange={(e) => updateFormField('observacoes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {procedimentos.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Scissors className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum procedimento registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre os procedimentos dermatológicos realizados.
            </p>
            {canEdit && (
              <Button onClick={handleStartAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Procedimento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de procedimentos */}
      {sortedProcedimentos.length > 0 && (
        <div className="space-y-2">
          {sortedProcedimentos.map((proc) => {
            const isExpanded = expandedItems.has(proc.id);
            const category = getProcedureCategory(proc.tipo_procedimento);
            
            return (
              <Card 
                key={proc.id} 
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => toggleExpanded(proc.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">
                          {getOptionLabel(proc.tipo_procedimento, DERMATOLOGY_PROCEDURE_TYPES)}
                        </span>
                        {category && (
                          <Badge variant={category.variant} className="text-xs">
                            {category.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(proc.data_procedimento), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {proc.regiao_tratada && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getOptionLabel(proc.regiao_tratada, BODY_LOCATIONS)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {proc.regiao_tratada_detalhe && (
                        <div>
                          <span className="text-xs text-muted-foreground">Detalhe da região</span>
                          <p className="text-sm">{proc.regiao_tratada_detalhe}</p>
                        </div>
                      )}
                      
                      {proc.tecnica_utilizada && proc.tecnica_utilizada.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground mb-1 block">Técnicas</span>
                          <div className="flex flex-wrap gap-1">
                            {proc.tecnica_utilizada.map((tec, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {getOptionLabel(tec, DERMATOLOGY_TECHNIQUES)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {proc.tecnica_custom && (
                        <div>
                          <span className="text-xs text-muted-foreground">Outra técnica</span>
                          <p className="text-sm">{proc.tecnica_custom}</p>
                        </div>
                      )}

                      {proc.material_utilizado && (
                        <div>
                          <span className="text-xs text-muted-foreground">Material utilizado</span>
                          <p className="text-sm">{proc.material_utilizado}</p>
                        </div>
                      )}

                      {proc.observacoes && (
                        <div>
                          <span className="text-xs text-muted-foreground">Observações</span>
                          <p className="text-sm whitespace-pre-wrap">{proc.observacoes}</p>
                        </div>
                      )}

                      {canEdit && onDelete && (
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(proc.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProcedimentosDermatoBlock;
