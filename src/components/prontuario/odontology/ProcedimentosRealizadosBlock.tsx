import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Wrench,
  Plus,
  Calendar,
  User,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de um procedimento realizado
 */
export interface ProcedimentoRealizado {
  id: string;
  patient_id: string;
  appointment_id?: string;
  odontogram_record_id?: string;
  // Procedimento
  procedimento: string;
  procedimento_codigo?: string;
  // Localização
  dente: string;
  face?: string; // M, O, D, V, L ou combinações
  // Responsável
  professional_id: string;
  professional_name?: string;
  // Datas
  data_realizacao: string;
  // Observações
  observacoes?: string;
  // Metadata
  created_at: string;
  created_by: string;
}

interface ProcedimentosRealizadosBlockProps {
  procedimentos: ProcedimentoRealizado[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  professionals?: { id: string; name: string }[];
  onSave: (data: Omit<ProcedimentoRealizado, 'id' | 'patient_id' | 'created_at' | 'created_by' | 'professional_name'>) => Promise<void>;
  onNavigateToOdontograma?: (toothCode: string) => void;
}

// Faces dentárias padrão (notação MODVL)
const FACES_DENTARIAS = [
  { value: 'M', label: 'Mesial' },
  { value: 'O', label: 'Oclusal' },
  { value: 'D', label: 'Distal' },
  { value: 'V', label: 'Vestibular' },
  { value: 'L', label: 'Lingual/Palatina' },
  { value: 'I', label: 'Incisal' },
];

// Procedimentos comuns (sugestões)
const PROCEDIMENTOS_COMUNS = [
  'Restauração em resina',
  'Restauração em amálgama',
  'Extração simples',
  'Extração de siso',
  'Tratamento de canal',
  'Profilaxia',
  'Raspagem',
  'Aplicação de flúor',
  'Selante',
  'Clareamento',
  'Instalação de prótese',
  'Ajuste oclusal',
  'Gengivectomia',
  'Gengivoplastia',
  'Implante',
  'Enxerto ósseo',
];

type FormDataType = {
  procedimento: string;
  procedimento_codigo: string;
  dente: string;
  faces: string[];
  professional_id: string;
  data_realizacao: string;
  observacoes: string;
  appointment_id: string;
};

const getEmptyFormData = (): FormDataType => ({
  procedimento: '',
  procedimento_codigo: '',
  dente: '',
  faces: [],
  professional_id: '',
  data_realizacao: format(new Date(), 'yyyy-MM-dd'),
  observacoes: '',
  appointment_id: '',
});

/**
 * PROCEDIMENTOS REALIZADOS
 * 
 * Registra:
 * - Procedimento executado
 * - Data de realização
 * - Dente e face(s)
 * - Profissional responsável
 * - Observações
 * 
 * Vincula automaticamente ao odontograma
 */
export function ProcedimentosRealizadosBlock({
  procedimentos,
  loading = false,
  saving = false,
  canEdit = false,
  professionals = [],
  onSave,
  onNavigateToOdontograma,
}: ProcedimentosRealizadosBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDente, setFilterDente] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartAdd = () => {
    setFormData(getEmptyFormData());
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    if (!formData.procedimento.trim() || !formData.dente.trim() || !formData.professional_id) return;
    
    await onSave({
      procedimento: formData.procedimento,
      procedimento_codigo: formData.procedimento_codigo || undefined,
      dente: formData.dente,
      face: formData.faces.length > 0 ? formData.faces.join('') : undefined,
      professional_id: formData.professional_id,
      data_realizacao: formData.data_realizacao,
      observacoes: formData.observacoes || undefined,
      appointment_id: formData.appointment_id || undefined,
    });
    setIsAdding(false);
    setFormData(getEmptyFormData());
  };

  const toggleFace = (face: string) => {
    setFormData(prev => ({
      ...prev,
      faces: prev.faces.includes(face)
        ? prev.faces.filter(f => f !== face)
        : [...prev.faces, face],
    }));
  };

  // Filter and sort procedimentos
  const filteredProcedimentos = procedimentos
    .filter(p => {
      const matchesSearch = searchTerm === '' || 
        p.procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dente.includes(searchTerm) ||
        p.professional_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDente = filterDente === '' || p.dente === filterDente;
      return matchesSearch && matchesDente;
    })
    .sort((a, b) => {
      const dateA = new Date(a.data_realizacao).getTime();
      const dateB = new Date(b.data_realizacao).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Get unique teeth for filter
  const uniqueTeeth = [...new Set(procedimentos.map(p => p.dente))].sort();

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
          <h2 className="text-lg font-semibold">Procedimentos Realizados</h2>
          <Badge variant="secondary" className="text-xs">
            {procedimentos.length} registros
          </Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        )}
      </div>

      {/* Filters */}
      {procedimentos.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimento, dente ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterDente} onValueChange={setFilterDente}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Dente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {uniqueTeeth.map(tooth => (
                <SelectItem key={tooth} value={tooth}>Dente {tooth}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title={sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
          >
            {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {procedimentos.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum procedimento registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre os procedimentos realizados para manter o histórico do paciente.
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

      {/* Procedimentos List */}
      {filteredProcedimentos.length > 0 && (
        <div className="space-y-3">
          {filteredProcedimentos.map((proc) => (
            <Card 
              key={proc.id} 
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{proc.procedimento}</span>
                      {proc.procedimento_codigo && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {proc.procedimento_codigo}
                        </Badge>
                      )}
                    </div>

                    {/* Location & Professional */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-mono">
                          Dente {proc.dente}
                        </Badge>
                        {proc.face && (
                          <Badge variant="outline" className="text-xs">
                            Face: {proc.face}
                          </Badge>
                        )}
                        {onNavigateToOdontograma && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onNavigateToOdontograma(proc.dente)}
                            title="Ver no odontograma"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Date & Professional */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(proc.data_realizacao), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      {proc.professional_name && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {proc.professional_name}
                        </div>
                      )}
                    </div>

                    {/* Expandable observations */}
                    {proc.observacoes && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setExpandedId(expandedId === proc.id ? null : proc.id)}
                        >
                          {expandedId === proc.id ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Ocultar observações
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Ver observações
                            </>
                          )}
                        </Button>
                        {expandedId === proc.id && (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-2 rounded">
                            {proc.observacoes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(proc.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results message */}
      {procedimentos.length > 0 && filteredProcedimentos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum procedimento encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Registrar Procedimento
            </DialogTitle>
            <DialogDescription>
              O procedimento será vinculado automaticamente ao odontograma.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5 pr-2">
              {/* Procedimento */}
              <div className="space-y-2">
                <Label>Procedimento *</Label>
                <Input
                  placeholder="Digite ou selecione o procedimento..."
                  value={formData.procedimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
                  list="procedimentos-list"
                />
                <datalist id="procedimentos-list">
                  {PROCEDIMENTOS_COMUNS.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Código */}
              <div className="space-y-2">
                <Label>Código (opcional)</Label>
                <Input
                  placeholder="Ex: 81000065"
                  value={formData.procedimento_codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, procedimento_codigo: e.target.value }))}
                />
              </div>

              {/* Dente */}
              <div className="space-y-2">
                <Label>Dente *</Label>
                <Input
                  placeholder="Ex: 16, 26, 47..."
                  value={formData.dente}
                  onChange={(e) => setFormData(prev => ({ ...prev, dente: e.target.value }))}
                />
              </div>

              {/* Faces */}
              <div className="space-y-2">
                <Label>Face(s) Dentária(s)</Label>
                <div className="flex flex-wrap gap-2">
                  {FACES_DENTARIAS.map(face => (
                    <Button
                      key={face.value}
                      type="button"
                      variant={formData.faces.includes(face.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFace(face.value)}
                      className="min-w-[80px]"
                    >
                      <span className="font-mono mr-1">{face.value}</span>
                      <span className="text-xs opacity-75">({face.label})</span>
                    </Button>
                  ))}
                </div>
                {formData.faces.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selecionado: <span className="font-mono font-medium">{formData.faces.join('')}</span>
                  </p>
                )}
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <Label>Profissional Responsável *</Label>
                <Select
                  value={formData.professional_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, professional_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label>Data de Realização *</Label>
                <Input
                  type="date"
                  value={formData.data_realizacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_realizacao: e.target.value }))}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre o procedimento..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
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
              disabled={saving || !formData.procedimento.trim() || !formData.dente.trim() || !formData.professional_id}
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
