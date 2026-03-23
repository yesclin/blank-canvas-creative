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
  History,
  Plus,
  Trash2,
  Stethoscope,
  FileText,
  CalendarIcon,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * Estrutura de dados do Diagnóstico Dermatológico
 */
export interface DiagnosticoDermatoData {
  id: string;
  patient_id: string;
  version: number;
  diagnostico_principal: string;
  diagnosticos_diferenciais: string[];
  cid10_code?: string;
  cid10_description?: string;
  observacoes_clinicas?: string;
  data_diagnostico: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface DiagnosticoDermatoBlockProps {
  currentDiagnostico: DiagnosticoDermatoData | null;
  diagnosticoHistory: DiagnosticoDermatoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<DiagnosticoDermatoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

/**
 * DIAGNÓSTICO DERMATOLÓGICO - Bloco exclusivo para Dermatologia
 * 
 * Permite registrar:
 * - Diagnóstico principal
 * - Diagnósticos diferenciais (lista)
 * - Código CID-10 com descrição
 * - Observações clínicas
 * - Data do diagnóstico
 * 
 * Com histórico e versionamento
 */
export function DiagnosticoDermatoBlock({
  currentDiagnostico,
  diagnosticoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: DiagnosticoDermatoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DiagnosticoDermatoData | null>(null);
  
  // Form state
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState('');
  const [diagnosticosDiferenciais, setDiagnosticosDiferenciais] = useState<string[]>([]);
  const [novoDiferencial, setNovoDiferencial] = useState('');
  const [cid10Code, setCid10Code] = useState('');
  const [cid10Description, setCid10Description] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');
  const [dataDiagnostico, setDataDiagnostico] = useState<Date | undefined>(new Date());

  const handleStartEdit = () => {
    if (currentDiagnostico) {
      setDiagnosticoPrincipal(currentDiagnostico.diagnostico_principal);
      setDiagnosticosDiferenciais(currentDiagnostico.diagnosticos_diferenciais || []);
      setCid10Code(currentDiagnostico.cid10_code || '');
      setCid10Description(currentDiagnostico.cid10_description || '');
      setObservacoesClinicas(currentDiagnostico.observacoes_clinicas || '');
      setDataDiagnostico(parseISO(currentDiagnostico.data_diagnostico));
    } else {
      setDiagnosticoPrincipal('');
      setDiagnosticosDiferenciais([]);
      setCid10Code('');
      setCid10Description('');
      setObservacoesClinicas('');
      setDataDiagnostico(new Date());
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNovoDiferencial('');
  };

  const handleSave = async () => {
    if (!diagnosticoPrincipal.trim() || !dataDiagnostico) return;
    
    await onSave({
      diagnostico_principal: diagnosticoPrincipal.trim(),
      diagnosticos_diferenciais: diagnosticosDiferenciais.filter(d => d.trim()),
      cid10_code: cid10Code.trim() || undefined,
      cid10_description: cid10Description.trim() || undefined,
      observacoes_clinicas: observacoesClinicas.trim() || undefined,
      data_diagnostico: format(dataDiagnostico, 'yyyy-MM-dd'),
    });
    setIsEditing(false);
  };

  const addDiferencial = () => {
    if (novoDiferencial.trim()) {
      setDiagnosticosDiferenciais(prev => [...prev, novoDiferencial.trim()]);
      setNovoDiferencial('');
    }
  };

  const removeDiferencial = (index: number) => {
    setDiagnosticosDiferenciais(prev => prev.filter((_, i) => i !== index));
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
  if (!currentDiagnostico && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Stethoscope className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum diagnóstico registrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre o diagnóstico dermatológico principal e diferenciais.
          </p>
          {canEdit && (
            <Button onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Diagnóstico
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
              <Stethoscope className="h-5 w-5 text-primary" />
              {currentDiagnostico ? 'Atualizar Diagnóstico' : 'Novo Diagnóstico'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving || !diagnosticoPrincipal.trim()}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentDiagnostico && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Diagnóstico Principal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Diagnóstico Principal *
              </Label>
              <Textarea
                placeholder="Ex: Dermatite atópica, Psoríase vulgar, Melanoma..."
                value={diagnosticoPrincipal}
                onChange={(e) => setDiagnosticoPrincipal(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* CID-10 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Código CID-10
                </Label>
                <Input
                  placeholder="Ex: L20.0, L40.0, C43.9"
                  value={cid10Code}
                  onChange={(e) => setCid10Code(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição CID-10</Label>
                <Input
                  placeholder="Descrição do código CID-10"
                  value={cid10Description}
                  onChange={(e) => setCid10Description(e.target.value)}
                />
              </div>
            </div>

            {/* Data do Diagnóstico */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Data do Diagnóstico
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full md:w-[280px] justify-start text-left font-normal",
                      !dataDiagnostico && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataDiagnostico 
                      ? format(dataDiagnostico, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecione a data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataDiagnostico}
                    onSelect={setDataDiagnostico}
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Diagnósticos Diferenciais */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                Diagnósticos Diferenciais
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar diagnóstico diferencial..."
                  value={novoDiferencial}
                  onChange={(e) => setNovoDiferencial(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDiferencial();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addDiferencial}
                  disabled={!novoDiferencial.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {diagnosticosDiferenciais.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {diagnosticosDiferenciais.map((diag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                    >
                      {diag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => removeDiferencial(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Observações Clínicas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-muted-foreground" />
                Observações Clínicas
              </Label>
              <Textarea
                placeholder="Observações adicionais sobre o diagnóstico, evolução esperada, prognóstico..."
                value={observacoesClinicas}
                onChange={(e) => setObservacoesClinicas(e.target.value)}
                rows={4}
              />
            </div>
          </div>
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
          <h2 className="text-lg font-semibold">Diagnóstico Dermatológico</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentDiagnostico?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {diagnosticoHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({diagnosticoHistory.length})
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

      {/* Main diagnosis card */}
      {currentDiagnostico && (
        <Card>
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Diagnóstico Principal */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Diagnóstico Principal</span>
                </div>
                <p className="text-lg font-semibold">{currentDiagnostico.diagnostico_principal}</p>
              </div>

              {/* CID-10 e Data */}
              <div className="flex flex-wrap gap-4">
                {currentDiagnostico.cid10_code && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {currentDiagnostico.cid10_code}
                    </Badge>
                    {currentDiagnostico.cid10_description && (
                      <span className="text-sm text-muted-foreground">
                        {currentDiagnostico.cid10_description}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {format(parseISO(currentDiagnostico.data_diagnostico), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>

              {/* Diagnósticos Diferenciais */}
              {currentDiagnostico.diagnosticos_diferenciais && currentDiagnostico.diagnosticos_diferenciais.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground mb-2 block">
                    Diagnósticos Diferenciais
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentDiagnostico.diagnosticos_diferenciais.map((diag, index) => (
                      <Badge key={index} variant="secondary">
                        {diag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {currentDiagnostico.observacoes_clinicas && (
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium text-muted-foreground mb-2 block">
                    Observações Clínicas
                  </span>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentDiagnostico.observacoes_clinicas}
                  </p>
                </div>
              )}

              {/* Metadados */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                <Clock className="h-3 w-3" />
                <span>
                  Registrado em {format(parseISO(currentDiagnostico.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {currentDiagnostico.created_by_name && ` por ${currentDiagnostico.created_by_name}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Diagnósticos
            </DialogTitle>
            <DialogDescription>
              Versões anteriores do diagnóstico dermatológico deste paciente.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {diagnosticoHistory.map((version) => (
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
                      <div className="flex items-center gap-3">
                        <Badge variant={version.is_current ? 'default' : 'outline'}>
                          v{version.version}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {version.diagnostico_principal}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {version.is_current && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Versão Atual
                      </Badge>
                    )}
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
              <Stethoscope className="h-5 w-5" />
              Diagnóstico - Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` por ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Diagnóstico Principal</span>
                  <p className="font-semibold">{selectedVersion.diagnostico_principal}</p>
                </div>
                
                {selectedVersion.cid10_code && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {selectedVersion.cid10_code}
                    </Badge>
                    {selectedVersion.cid10_description && (
                      <span className="text-sm">{selectedVersion.cid10_description}</span>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-sm text-muted-foreground">Data do Diagnóstico</span>
                  <p>{format(parseISO(selectedVersion.data_diagnostico), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>

                {selectedVersion.diagnosticos_diferenciais && selectedVersion.diagnosticos_diferenciais.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Diagnósticos Diferenciais</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedVersion.diagnosticos_diferenciais.map((diag, i) => (
                        <Badge key={i} variant="secondary">{diag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVersion.observacoes_clinicas && (
                  <div>
                    <span className="text-sm text-muted-foreground">Observações Clínicas</span>
                    <p className="text-sm whitespace-pre-wrap">{selectedVersion.observacoes_clinicas}</p>
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

export default DiagnosticoDermatoBlock;
