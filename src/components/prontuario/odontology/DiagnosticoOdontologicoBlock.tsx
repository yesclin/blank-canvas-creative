import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  History,
  Plus,
  Trash2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de dados do Diagnóstico Odontológico
 */
export interface DiagnosticoOdontologicoData {
  id: string;
  patient_id: string;
  version: number;
  // Diagnóstico Principal
  diagnostico_principal: string;
  diagnostico_principal_cid?: string;
  dentes_envolvidos_principal: string;
  // Diagnósticos Associados
  diagnosticos_associados: {
    descricao: string;
    cid?: string;
    dentes_envolvidos?: string;
  }[];
  // Justificativa
  justificativa_clinica: string;
  // Metadata
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface DiagnosticoOdontologicoBlockProps {
  currentDiagnostico: DiagnosticoOdontologicoData | null;
  diagnosticoHistory: DiagnosticoOdontologicoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<DiagnosticoOdontologicoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

type DiagnosticoAssociado = {
  descricao: string;
  cid: string;
  dentes_envolvidos: string;
};

type FormDataType = {
  diagnostico_principal: string;
  diagnostico_principal_cid: string;
  dentes_envolvidos_principal: string;
  diagnosticos_associados: DiagnosticoAssociado[];
  justificativa_clinica: string;
};

const getEmptyFormData = (): FormDataType => ({
  diagnostico_principal: '',
  diagnostico_principal_cid: '',
  dentes_envolvidos_principal: '',
  diagnosticos_associados: [],
  justificativa_clinica: '',
});

const getEmptyDiagnosticoAssociado = (): DiagnosticoAssociado => ({
  descricao: '',
  cid: '',
  dentes_envolvidos: '',
});

/**
 * DIAGNÓSTICO ODONTOLÓGICO
 * 
 * Registra:
 * - Diagnóstico principal com CID opcional
 * - Diagnósticos associados
 * - Dentes envolvidos
 * - Justificativa clínica
 * 
 * Mantém histórico/versionamento completo
 */
export function DiagnosticoOdontologicoBlock({
  currentDiagnostico,
  diagnosticoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: DiagnosticoOdontologicoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DiagnosticoOdontologicoData | null>(null);
  
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());

  const handleStartEdit = () => {
    if (currentDiagnostico) {
      setFormData({
        diagnostico_principal: currentDiagnostico.diagnostico_principal || '',
        diagnostico_principal_cid: currentDiagnostico.diagnostico_principal_cid || '',
        dentes_envolvidos_principal: currentDiagnostico.dentes_envolvidos_principal || '',
        diagnosticos_associados: (currentDiagnostico.diagnosticos_associados || []).map(d => ({
          descricao: d.descricao || '',
          cid: d.cid || '',
          dentes_envolvidos: d.dentes_envolvidos || '',
        })),
        justificativa_clinica: currentDiagnostico.justificativa_clinica || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    if (!formData.diagnostico_principal.trim()) return;
    
    await onSave({
      diagnostico_principal: formData.diagnostico_principal,
      diagnostico_principal_cid: formData.diagnostico_principal_cid || undefined,
      dentes_envolvidos_principal: formData.dentes_envolvidos_principal,
      diagnosticos_associados: formData.diagnosticos_associados.filter(d => d.descricao.trim()),
      justificativa_clinica: formData.justificativa_clinica,
    });
    setIsEditing(false);
  };

  const addDiagnosticoAssociado = () => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: [...prev.diagnosticos_associados, getEmptyDiagnosticoAssociado()],
    }));
  };

  const removeDiagnosticoAssociado = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: prev.diagnosticos_associados.filter((_, i) => i !== index),
    }));
  };

  const updateDiagnosticoAssociado = (index: number, field: keyof DiagnosticoAssociado, value: string) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: prev.diagnosticos_associados.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      ),
    }));
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
  if (!currentDiagnostico && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum diagnóstico registrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre o diagnóstico odontológico do paciente.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
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
              <Edit3 className="h-5 w-5 text-primary" />
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
                disabled={saving || !formData.diagnostico_principal.trim()}
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
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {/* Diagnóstico Principal */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Diagnóstico Principal *
                </Label>
                <Textarea
                  placeholder="Descreva o diagnóstico principal..."
                  value={formData.diagnostico_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_principal: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">CID (opcional)</Label>
                    <Input
                      placeholder="Ex: K02.1"
                      value={formData.diagnostico_principal_cid}
                      onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_principal_cid: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Dentes Envolvidos</Label>
                    <Input
                      placeholder="Ex: 16, 17, 26"
                      value={formData.dentes_envolvidos_principal}
                      onChange={(e) => setFormData(prev => ({ ...prev, dentes_envolvidos_principal: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Diagnósticos Associados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Diagnósticos Associados
                  </Label>
                  <Button variant="outline" size="sm" onClick={addDiagnosticoAssociado}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {formData.diagnosticos_associados.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Nenhum diagnóstico associado. Clique em "Adicionar" para incluir.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.diagnosticos_associados.map((diag, index) => (
                      <div key={index} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeDiagnosticoAssociado(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Descrição do diagnóstico..."
                          value={diag.descricao}
                          onChange={(e) => updateDiagnosticoAssociado(index, 'descricao', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="CID (opcional)"
                            value={diag.cid}
                            onChange={(e) => updateDiagnosticoAssociado(index, 'cid', e.target.value)}
                          />
                          <Input
                            placeholder="Dentes envolvidos"
                            value={diag.dentes_envolvidos}
                            onChange={(e) => updateDiagnosticoAssociado(index, 'dentes_envolvidos', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Justificativa Clínica */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  Justificativa Clínica
                </Label>
                <Textarea
                  placeholder="Justificativa baseada nos achados clínicos, exames complementares, histórico do paciente..."
                  value={formData.justificativa_clinica}
                  onChange={(e) => setFormData(prev => ({ ...prev, justificativa_clinica: e.target.value }))}
                  rows={4}
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
          <h2 className="text-lg font-semibold">Diagnóstico Odontológico</h2>
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

      {/* Last update info */}
      {currentDiagnostico && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentDiagnostico.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentDiagnostico.created_by_name && ` por ${currentDiagnostico.created_by_name}`}
          </span>
        </div>
      )}

      {/* Diagnóstico Principal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Diagnóstico Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{currentDiagnostico?.diagnostico_principal}</p>
          <div className="flex flex-wrap gap-2">
            {currentDiagnostico?.diagnostico_principal_cid && (
              <Badge variant="secondary">
                CID: {currentDiagnostico.diagnostico_principal_cid}
              </Badge>
            )}
            {currentDiagnostico?.dentes_envolvidos_principal && (
              <Badge variant="outline">
                Dentes: {currentDiagnostico.dentes_envolvidos_principal}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos Associados */}
      {currentDiagnostico?.diagnosticos_associados && currentDiagnostico.diagnosticos_associados.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Diagnósticos Associados ({currentDiagnostico.diagnosticos_associados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentDiagnostico.diagnosticos_associados.map((diag, index) => (
              <div key={index} className="p-3 rounded-lg border bg-muted/20">
                <p className="text-sm whitespace-pre-wrap">{diag.descricao}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {diag.cid && (
                    <Badge variant="secondary" className="text-xs">
                      CID: {diag.cid}
                    </Badge>
                  )}
                  {diag.dentes_envolvidos && (
                    <Badge variant="outline" className="text-xs">
                      Dentes: {diag.dentes_envolvidos}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Justificativa */}
      {currentDiagnostico?.justificativa_clinica && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Justificativa Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {currentDiagnostico.justificativa_clinica}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Diagnósticos
            </DialogTitle>
            <DialogDescription>
              Todas as versões do diagnóstico odontológico
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {diagnosticoHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    item.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedVersion(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.is_current ? "default" : "outline"}>
                        Versão {item.version}
                      </Badge>
                      {item.is_current && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {item.diagnostico_principal}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {item.created_by_name && ` • ${item.created_by_name}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Versão {selectedVersion?.version}
              {selectedVersion?.is_current && (
                <Badge variant="default" className="text-xs">Atual</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Registrada em{' '}
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Diagnóstico Principal</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.diagnostico_principal}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedVersion?.diagnostico_principal_cid && (
                    <Badge variant="secondary" className="text-xs">
                      CID: {selectedVersion.diagnostico_principal_cid}
                    </Badge>
                  )}
                  {selectedVersion?.dentes_envolvidos_principal && (
                    <Badge variant="outline" className="text-xs">
                      Dentes: {selectedVersion.dentes_envolvidos_principal}
                    </Badge>
                  )}
                </div>
              </div>
              
              {selectedVersion?.diagnosticos_associados && selectedVersion.diagnosticos_associados.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Diagnósticos Associados</p>
                  {selectedVersion.diagnosticos_associados.map((d, i) => (
                    <div key={i} className="p-2 rounded border bg-muted/20 mt-2">
                      <p className="text-sm">{d.descricao}</p>
                      {(d.cid || d.dentes_envolvidos) && (
                        <div className="flex gap-2 mt-1">
                          {d.cid && <Badge variant="secondary" className="text-xs">CID: {d.cid}</Badge>}
                          {d.dentes_envolvidos && <Badge variant="outline" className="text-xs">Dentes: {d.dentes_envolvidos}</Badge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedVersion?.justificativa_clinica && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Justificativa</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedVersion.justificativa_clinica}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
