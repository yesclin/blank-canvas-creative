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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package,
  Plus,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  X,
  Save,
  Factory,
  Hash,
  Clock
} from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de um material utilizado
 */
export interface MaterialUtilizado {
  id: string;
  patient_id: string;
  appointment_id?: string;
  procedimento_id?: string;
  // Material
  material: string;
  fabricante?: string;
  lote: string;
  validade: string;
  quantidade: number;
  unidade: string;
  // Procedimento relacionado
  procedimento_nome?: string;
  dente?: string;
  // Metadata
  data_uso: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

interface MateriaisUtilizadosBlockProps {
  materiais: MaterialUtilizado[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  procedimentosDisponiveis?: { id: string; nome: string; dente?: string }[];
  onSave: (data: Omit<MaterialUtilizado, 'id' | 'patient_id' | 'created_at' | 'created_by' | 'created_by_name' | 'procedimento_nome'>) => Promise<void>;
}

// Unidades comuns
const UNIDADES = [
  { value: 'un', label: 'Unidade(s)' },
  { value: 'ml', label: 'mL' },
  { value: 'g', label: 'Gramas' },
  { value: 'mg', label: 'mg' },
  { value: 'amp', label: 'Ampola(s)' },
  { value: 'cap', label: 'Cápsula(s)' },
  { value: 'tubo', label: 'Tubo(s)' },
  { value: 'seringa', label: 'Seringa(s)' },
  { value: 'frasco', label: 'Frasco(s)' },
];

type FormDataType = {
  material: string;
  fabricante: string;
  lote: string;
  validade: string;
  quantidade: number;
  unidade: string;
  procedimento_id: string;
  dente: string;
  observacoes: string;
};

const getEmptyFormData = (): FormDataType => ({
  material: '',
  fabricante: '',
  lote: '',
  validade: '',
  quantidade: 1,
  unidade: 'un',
  procedimento_id: '',
  dente: '',
  observacoes: '',
});

/**
 * Check if material is expired or near expiration
 */
const getValidadeStatus = (validade: string): { status: 'ok' | 'warning' | 'expired'; label: string } => {
  const hoje = new Date();
  const dataValidade = parseISO(validade);
  
  if (isBefore(dataValidade, hoje)) {
    return { status: 'expired', label: 'Vencido' };
  }
  
  if (isBefore(dataValidade, addDays(hoje, 30))) {
    return { status: 'warning', label: 'Vence em breve' };
  }
  
  return { status: 'ok', label: 'Válido' };
};

/**
 * MATERIAIS UTILIZADOS
 * 
 * Registra:
 * - Material utilizado
 * - Fabricante
 * - Lote e validade
 * - Quantidade e unidade
 * - Procedimento relacionado
 * 
 * Essencial para rastreabilidade e conformidade
 */
export function MateriaisUtilizadosBlock({
  materiais,
  loading = false,
  saving = false,
  canEdit = false,
  procedimentosDisponiveis = [],
  onSave,
}: MateriaisUtilizadosBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLote, setFilterLote] = useState('');

  const handleStartAdd = () => {
    setFormData(getEmptyFormData());
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    if (!formData.material.trim() || !formData.lote.trim() || !formData.validade) return;
    
    await onSave({
      material: formData.material,
      fabricante: formData.fabricante || undefined,
      lote: formData.lote,
      validade: formData.validade,
      quantidade: formData.quantidade,
      unidade: formData.unidade,
      procedimento_id: formData.procedimento_id || undefined,
      dente: formData.dente || undefined,
      data_uso: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsAdding(false);
    setFormData(getEmptyFormData());
  };

  // Filter materiais
  const filteredMateriais = materiais.filter(m => {
    const matchesSearch = searchTerm === '' || 
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.fabricante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lote.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLote = filterLote === '' || m.lote === filterLote;
    return matchesSearch && matchesLote;
  });

  // Get unique lotes for filter
  const uniqueLotes = [...new Set(materiais.map(m => m.lote))].sort();

  // Count warnings
  const materiaisComAlerta = materiais.filter(m => {
    const status = getValidadeStatus(m.validade);
    return status.status === 'expired' || status.status === 'warning';
  });

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
          <h2 className="text-lg font-semibold">Materiais Utilizados</h2>
          <Badge variant="secondary" className="text-xs">
            {materiais.length} registros
          </Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        )}
      </div>

      {/* Alerts */}
      {materiaisComAlerta.length > 0 && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {materiaisComAlerta.length} material(is) com validade vencida ou próxima do vencimento
          </div>
        </div>
      )}

      {/* Filters */}
      {materiais.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar material, fabricante ou lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterLote} onValueChange={setFilterLote}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Lote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os lotes</SelectItem>
              {uniqueLotes.map(lote => (
                <SelectItem key={lote} value={lote}>{lote}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {materiais.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum material registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre os materiais utilizados para garantir a rastreabilidade.
            </p>
            {canEdit && (
              <Button onClick={handleStartAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Material
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Materials Table */}
      {filteredMateriais.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Data Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMateriais.map((mat) => {
                    const validadeStatus = getValidadeStatus(mat.validade);
                    return (
                      <TableRow key={mat.id}>
                        <TableCell className="font-medium">{mat.material}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mat.fabricante || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {mat.lote}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={
                              validadeStatus.status === 'expired' ? 'text-destructive' :
                              validadeStatus.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : ''
                            }>
                              {format(parseISO(mat.validade), 'dd/MM/yyyy')}
                            </span>
                            {validadeStatus.status !== 'ok' && (
                              <Badge 
                                variant={validadeStatus.status === 'expired' ? 'destructive' : 'outline'}
                                className={validadeStatus.status === 'warning' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'text-xs'}
                              >
                                {validadeStatus.label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {mat.quantidade} {mat.unidade}
                        </TableCell>
                        <TableCell>
                          {mat.procedimento_nome ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{mat.procedimento_nome}</span>
                              {mat.dente && (
                                <Badge variant="secondary" className="text-xs">
                                  {mat.dente}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(mat.data_uso), 'dd/MM/yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {materiais.length > 0 && filteredMateriais.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum material encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Registrar Material
            </DialogTitle>
            <DialogDescription>
              Registre o material utilizado para garantir a rastreabilidade.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5 pr-2">
              {/* Material */}
              <div className="space-y-2">
                <Label>Material *</Label>
                <Input
                  placeholder="Nome do material..."
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                />
              </div>

              {/* Fabricante */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Factory className="h-3.5 w-3.5" />
                  Fabricante
                </Label>
                <Input
                  placeholder="Nome do fabricante..."
                  value={formData.fabricante}
                  onChange={(e) => setFormData(prev => ({ ...prev, fabricante: e.target.value }))}
                />
              </div>

              {/* Lote e Validade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" />
                    Lote *
                  </Label>
                  <Input
                    placeholder="Número do lote"
                    value={formData.lote}
                    onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Validade *
                  </Label>
                  <Input
                    type="date"
                    value={formData.validade}
                    onChange={(e) => setFormData(prev => ({ ...prev, validade: e.target.value }))}
                  />
                </div>
              </div>

              {/* Quantidade e Unidade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, unidade: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Procedimento Relacionado */}
              {procedimentosDisponiveis.length > 0 && (
                <div className="space-y-2">
                  <Label>Procedimento Relacionado</Label>
                  <Select
                    value={formData.procedimento_id}
                    onValueChange={(v) => {
                      const proc = procedimentosDisponiveis.find(p => p.id === v);
                      setFormData(prev => ({ 
                        ...prev, 
                        procedimento_id: v,
                        dente: proc?.dente || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedimentosDisponiveis.map(proc => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.nome} {proc.dente && `(${proc.dente})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dente (if not from procedimento) */}
              {!formData.procedimento_id && (
                <div className="space-y-2">
                  <Label>Dente (opcional)</Label>
                  <Input
                    placeholder="Ex: 16, 26..."
                    value={formData.dente}
                    onChange={(e) => setFormData(prev => ({ ...prev, dente: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.material.trim() || !formData.lote.trim() || !formData.validade}
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
