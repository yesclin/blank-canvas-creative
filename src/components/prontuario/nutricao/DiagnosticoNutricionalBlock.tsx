/**
 * NUTRIÇÃO - Bloco de Diagnóstico Nutricional
 * 
 * Permite registrar diagnósticos nutricionais principal e associados.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Plus, 
  Save,
  History,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useDiagnosticoNutricionalData, 
  DIAGNOSTICOS_NUTRICIONAIS_COMUNS,
  STATUS_DIAGNOSTICO_LABELS,
  type DiagnosticoFormData,
  type StatusDiagnostico,
} from '@/hooks/prontuario/nutricao/useDiagnosticoNutricionalData';

interface DiagnosticoNutricionalBlockProps {
  patientId: string;
  canEdit?: boolean;
}

const initialFormData: DiagnosticoFormData = {
  diagnostico_principal: '',
  cid_principal: '',
  diagnosticos_associados: [],
  justificativa: '',
  data_diagnostico: new Date().toISOString().split('T')[0],
  status: 'ativo',
};

function StatusIcon({ status }: { status: StatusDiagnostico }) {
  if (status === 'ativo') return <Clock className="h-4 w-4 text-primary" />;
  if (status === 'resolvido') return <CheckCircle2 className="h-4 w-4 text-accent-foreground" />;
  return <XCircle className="h-4 w-4 text-muted-foreground" />;
}

function StatusBadge({ status }: { status: StatusDiagnostico }) {
  const variants: Record<StatusDiagnostico, string> = {
    ativo: 'bg-primary/10 text-primary border-primary/30',
    resolvido: 'bg-accent text-accent-foreground border-accent',
    em_acompanhamento: 'bg-secondary text-secondary-foreground border-secondary',
  };
  
  return (
    <Badge variant="outline" className={variants[status]}>
      {STATUS_DIAGNOSTICO_LABELS[status]}
    </Badge>
  );
}

export function DiagnosticoNutricionalBlock({ patientId, canEdit = true }: DiagnosticoNutricionalBlockProps) {
  const { diagnosticos, isLoading, saveDiagnostico, updateStatus, isSaving } = useDiagnosticoNutricionalData(patientId);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DiagnosticoFormData>(initialFormData);
  const [showHistory, setShowHistory] = useState(false);

  const addDiagnosticoAssociado = () => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: [...prev.diagnosticos_associados, { descricao: '', cid: '' }]
    }));
  };

  const updateDiagnosticoAssociado = (index: number, field: 'descricao' | 'cid', value: string) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: prev.diagnosticos_associados.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const removeDiagnosticoAssociado = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos_associados: prev.diagnosticos_associados.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.diagnostico_principal.trim()) return;
    
    await saveDiagnostico(formData);
    setFormData(initialFormData);
    setShowForm(false);
  };

  const handleStatusChange = async (id: string, status: StatusDiagnostico) => {
    await updateStatus({ id, status });
  };

  const diagnosticosAtivos = diagnosticos.filter(d => d.status === 'ativo');
  const ultimoDiagnostico = diagnosticos[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Diagnóstico Nutricional</h2>
          {diagnosticosAtivos.length > 0 && (
            <Badge variant="secondary">{diagnosticosAtivos.length} ativo(s)</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {diagnosticos.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({diagnosticos.length})
            </Button>
          )}
          {canEdit && (
            <Button 
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Diagnóstico
            </Button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Registrar Diagnóstico Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Diagnóstico Principal */}
            <div className="space-y-2">
              <Label htmlFor="diag-principal">Diagnóstico Principal *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.diagnostico_principal}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, diagnostico_principal: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione ou digite..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[250px]">
                      {DIAGNOSTICOS_NUTRICIONAIS_COMUNS.map(diag => (
                        <SelectItem key={diag} value={diag}>{diag}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <Input
                  className="w-32"
                  value={formData.cid_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, cid_principal: e.target.value }))}
                  placeholder="CID (opcional)"
                />
              </div>
              {!DIAGNOSTICOS_NUTRICIONAIS_COMUNS.includes(formData.diagnostico_principal) && formData.diagnostico_principal && (
                <Input
                  value={formData.diagnostico_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_principal: e.target.value }))}
                  placeholder="Digite o diagnóstico personalizado"
                />
              )}
            </div>

            {/* Diagnósticos Associados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Diagnósticos Associados</Label>
                <Button variant="outline" size="sm" onClick={addDiagnosticoAssociado}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {formData.diagnosticos_associados.length > 0 && (
                <div className="space-y-2">
                  {formData.diagnosticos_associados.map((diag, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select 
                        value={diag.descricao}
                        onValueChange={(value) => updateDiagnosticoAssociado(index, 'descricao', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {DIAGNOSTICOS_NUTRICIONAIS_COMUNS.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <Input
                        className="w-28"
                        value={diag.cid || ''}
                        onChange={(e) => updateDiagnosticoAssociado(index, 'cid', e.target.value)}
                        placeholder="CID"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeDiagnosticoAssociado(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa Clínica</Label>
              <Textarea
                id="justificativa"
                value={formData.justificativa}
                onChange={(e) => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                placeholder="Descreva a justificativa clínica para o diagnóstico..."
                rows={3}
              />
            </div>

            {/* Data e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-diag">Data do Diagnóstico</Label>
                <Input
                  id="data-diag"
                  type="date"
                  value={formData.data_diagnostico}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_diagnostico: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as StatusDiagnostico }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_DIAGNOSTICO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !formData.diagnostico_principal.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Diagnóstico'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnósticos Ativos */}
      {!showForm && diagnosticosAtivos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diagnósticos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosticosAtivos.map(diag => (
              <div key={diag.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diag.status} />
                    <span className="font-medium">{diag.diagnostico_principal}</span>
                    {diag.cid_principal && (
                      <Badge variant="outline" className="text-xs">{diag.cid_principal}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={diag.status}
                      onValueChange={(value) => handleStatusChange(diag.id, value as StatusDiagnostico)}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_DIAGNOSTICO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {diag.diagnosticos_associados.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {diag.diagnosticos_associados.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {d.descricao}
                        {d.cid && ` (${d.cid})`}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {diag.justificativa && (
                  <p className="text-sm text-muted-foreground pl-6">{diag.justificativa}</p>
                )}
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-6">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(diag.data_diagnostico), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {showHistory && diagnosticos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Histórico de Diagnósticos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {diagnosticos.map(diag => (
                  <div key={diag.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{diag.diagnostico_principal}</span>
                        <StatusBadge status={diag.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(diag.data_diagnostico), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {diag.diagnosticos_associados.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {diag.diagnosticos_associados.map((d, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{d.descricao}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!showForm && diagnosticos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum diagnóstico nutricional registrado</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeiro Diagnóstico
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
