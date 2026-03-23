import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Activity,
  Clock,
  User,
  Save,
  X,
  ChevronRight,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Eye,
  Link2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EvolucaoClinica } from "./EvolucoesBlock";

/**
 * Estrutura de um Exame Físico
 */
export interface ExameFisico {
  id: string;
  patient_id: string;
  clinic_id: string;
  evolucao_id?: string;
  profissional_id: string;
  profissional_nome: string;
  data_hora: string;
  pressao_sistolica?: number;
  pressao_diastolica?: number;
  frequencia_cardiaca?: number;
  frequencia_respiratoria?: number;
  temperatura?: number;
  peso?: number;
  altura?: number;
  imc?: number;
  observacoes?: string;
  created_at: string;
}

interface ExameFisicoBlockProps {
  exames: ExameFisico[];
  evolucoes?: EvolucaoClinica[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: {
    evolucao_id?: string;
    pressao_sistolica?: number;
    pressao_diastolica?: number;
    frequencia_cardiaca?: number;
    frequencia_respiratoria?: number;
    temperatura?: number;
    peso?: number;
    altura?: number;
    observacoes?: string;
  }) => Promise<void>;
}

/**
 * EXAME FÍSICO - Bloco exclusivo para Clínica Geral
 * 
 * Permite registrar:
 * - Pressão arterial (sistólica/diastólica)
 * - Frequência cardíaca
 * - Frequência respiratória
 * - Temperatura
 * - Peso
 * - Altura
 * - IMC (calculado automaticamente)
 * - Observações do exame geral
 * 
 * Pode ser vinculado a uma evolução clínica.
 */
export function ExameFisicoBlock({
  exames,
  evolucoes = [],
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
}: ExameFisicoBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExame, setSelectedExame] = useState<ExameFisico | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    evolucao_id: '',
    pressao_sistolica: '',
    pressao_diastolica: '',
    frequencia_cardiaca: '',
    frequencia_respiratoria: '',
    temperatura: '',
    peso: '',
    altura: '',
    observacoes: '',
  });

  // Calculate IMC
  const calculatedIMC = useMemo(() => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (peso > 0 && altura > 0) {
      return (peso / (altura * altura)).toFixed(2);
    }
    return null;
  }, [formData.peso, formData.altura]);

  // IMC classification
  const getIMCClassification = (imc: number): { label: string; color: string } => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' };
    if (imc < 25) return { label: 'Peso normal', color: 'text-green-600' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' };
    if (imc < 35) return { label: 'Obesidade I', color: 'text-orange-600' };
    if (imc < 40) return { label: 'Obesidade II', color: 'text-red-600' };
    return { label: 'Obesidade III', color: 'text-red-700' };
  };

  // Sort by date descending
  const sortedExames = [...exames].sort((a, b) => 
    new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
  );

  // Get evolutions without linked exams for the selector
  const availableEvolucoes = evolucoes.filter(e => 
    !exames.some(ex => ex.evolucao_id === e.id)
  );

  const handleOpenForm = () => {
    setFormData({
      evolucao_id: '',
      pressao_sistolica: '',
      pressao_diastolica: '',
      frequencia_cardiaca: '',
      frequencia_respiratoria: '',
      temperatura: '',
      peso: '',
      altura: '',
      observacoes: '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async () => {
    await onSave({
      evolucao_id: formData.evolucao_id || undefined,
      pressao_sistolica: formData.pressao_sistolica ? parseInt(formData.pressao_sistolica) : undefined,
      pressao_diastolica: formData.pressao_diastolica ? parseInt(formData.pressao_diastolica) : undefined,
      frequencia_cardiaca: formData.frequencia_cardiaca ? parseInt(formData.frequencia_cardiaca) : undefined,
      frequencia_respiratoria: formData.frequencia_respiratoria ? parseInt(formData.frequencia_respiratoria) : undefined,
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
      peso: formData.peso ? parseFloat(formData.peso) : undefined,
      altura: formData.altura ? parseFloat(formData.altura) : undefined,
      observacoes: formData.observacoes || undefined,
    });
    handleCloseForm();
  };

  const handleViewExame = (exame: ExameFisico) => {
    setSelectedExame(exame);
  };

  // Check if any vital is filled
  const hasAnyData = 
    formData.pressao_sistolica || 
    formData.frequencia_cardiaca || 
    formData.temperatura || 
    formData.peso;

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
          <h2 className="text-lg font-semibold">Exame Físico</h2>
          <Badge variant="secondary">{exames.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Exame
          </Button>
        )}
      </div>

      {/* Exames List */}
      {sortedExames.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum exame físico registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre os sinais vitais e medidas do paciente.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Exame Físico
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedExames.map((exame) => (
            <Card 
              key={exame.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewExame(exame)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Date and professional */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(parseISO(exame.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {exame.evolucao_id && (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Vinculado
                        </Badge>
                      )}
                    </div>
                    
                    {/* Vital signs summary */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(exame.pressao_sistolica || exame.pressao_diastolica) && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{exame.pressao_sistolica}/{exame.pressao_diastolica} mmHg</span>
                        </div>
                      )}
                      {exame.frequencia_cardiaca && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-primary" />
                          <span>{exame.frequencia_cardiaca} bpm</span>
                        </div>
                      )}
                      {exame.temperatura && (
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span>{exame.temperatura}°C</span>
                        </div>
                      )}
                      {exame.imc && (
                        <div className="flex items-center gap-1">
                          <Scale className="h-4 w-4 text-blue-500" />
                          <span>IMC {exame.imc}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Exam Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex min-h-0 flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Novo Exame Físico
            </DialogTitle>
            <DialogDescription>
              Registre os sinais vitais e medidas do paciente.
            </DialogDescription>
          </DialogHeader>

          {/* Current professional info */}
          {currentProfessionalName && (
            <div className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Profissional: <strong>{currentProfessionalName}</strong></span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4" />
              <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="space-y-6">
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

              {/* Sinais Vitais */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Sinais Vitais
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Pressão Arterial */}
                  <div className="space-y-2">
                    <Label>Pressão Arterial (mmHg)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Sistólica"
                        value={formData.pressao_sistolica}
                        onChange={(e) => setFormData(prev => ({ ...prev, pressao_sistolica: e.target.value }))}
                        className="w-24"
                      />
                      <span>/</span>
                      <Input
                        type="number"
                        placeholder="Diastólica"
                        value={formData.pressao_diastolica}
                        onChange={(e) => setFormData(prev => ({ ...prev, pressao_diastolica: e.target.value }))}
                        className="w-24"
                      />
                    </div>
                  </div>

                  {/* Frequência Cardíaca */}
                  <div className="space-y-2">
                    <Label>Frequência Cardíaca (bpm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 72"
                      value={formData.frequencia_cardiaca}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequencia_cardiaca: e.target.value }))}
                    />
                  </div>

                  {/* Frequência Respiratória */}
                  <div className="space-y-2">
                    <Label>Frequência Respiratória (irpm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 16"
                      value={formData.frequencia_respiratoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequencia_respiratoria: e.target.value }))}
                    />
                  </div>

                  {/* Temperatura */}
                  <div className="space-y-2">
                    <Label>Temperatura (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 36.5"
                      value={formData.temperatura}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperatura: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medidas Antropométricas */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-500" />
                  Medidas Antropométricas
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Peso */}
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 70.5"
                      value={formData.peso}
                      onChange={(e) => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                    />
                  </div>

                  {/* Altura */}
                  <div className="space-y-2">
                    <Label>Altura (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.75"
                      value={formData.altura}
                      onChange={(e) => setFormData(prev => ({ ...prev, altura: e.target.value }))}
                    />
                  </div>

                  {/* IMC Calculado */}
                  <div className="space-y-2">
                    <Label>IMC (calculado)</Label>
                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                      {calculatedIMC ? (
                        <span className={getIMCClassification(parseFloat(calculatedIMC)).color}>
                          {calculatedIMC} - {getIMCClassification(parseFloat(calculatedIMC)).label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Observações do Exame Geral
                </Label>
                <Textarea
                  placeholder="Estado geral, nível de consciência, hidratação, mucosas, ausculta, palpação..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="shrink-0 gap-2">
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

      {/* View Exam Dialog */}
      <Dialog open={!!selectedExame} onOpenChange={() => setSelectedExame(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Exame Físico
            </DialogTitle>
            {selectedExame && (
              <DialogDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(parseISO(selectedExame.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedExame.profissional_nome}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedExame && (
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Linked evolution badge */}
                {selectedExame.evolucao_id && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Link2 className="h-3 w-3" />
                    Vinculado a uma evolução clínica
                  </Badge>
                )}

                {/* Sinais Vitais */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    Sinais Vitais
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Pressão Arterial</p>
                      <p className="font-medium">
                        {selectedExame.pressao_sistolica && selectedExame.pressao_diastolica
                          ? `${selectedExame.pressao_sistolica}/${selectedExame.pressao_diastolica} mmHg`
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Freq. Cardíaca</p>
                      <p className="font-medium">
                        {selectedExame.frequencia_cardiaca ? `${selectedExame.frequencia_cardiaca} bpm` : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Freq. Respiratória</p>
                      <p className="font-medium">
                        {selectedExame.frequencia_respiratoria ? `${selectedExame.frequencia_respiratoria} irpm` : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
                      <p className="font-medium">
                        {selectedExame.temperatura ? `${selectedExame.temperatura}°C` : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Medidas */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                    <Scale className="h-4 w-4" />
                    Medidas Antropométricas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Peso</p>
                      <p className="font-medium">
                        {selectedExame.peso ? `${selectedExame.peso} kg` : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Altura</p>
                      <p className="font-medium">
                        {selectedExame.altura ? `${selectedExame.altura} m` : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">IMC</p>
                      {selectedExame.imc ? (
                        <p className={`font-medium ${getIMCClassification(selectedExame.imc).color}`}>
                          {selectedExame.imc} - {getIMCClassification(selectedExame.imc).label}
                        </p>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedExame.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Observações do Exame Geral
                      </h3>
                      <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                        {selectedExame.observacoes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExame(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
