import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Brain, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useHipotesesDiagnosticasData, type HipoteseFormData, type HipoteseDiagnostica } from '@/hooks/prontuario/psicologia/useHipotesesDiagnosticasData';

interface Props {
  patientId: string;
  canEdit: boolean;
  professionalId?: string | null;
  professionalName?: string | null;
}

const emptyForm: HipoteseFormData = {
  hipotese_principal: '',
  hipoteses_secundarias: '',
  descricao_clinica: '',
  sintomas_observados: '',
  comportamentos_observados: '',
  fatores_desencadeantes: '',
  gravidade_impacto: '',
  status: 'provisoria',
  observacoes: '',
  data_registro: new Date().toISOString().slice(0, 10),
};

export function HipotesesDiagnosticasPsicologiaBlock({ patientId, canEdit, professionalId, professionalName }: Props) {
  const { hipoteses, loading, saving, fetchHipoteses, saveHipotese, updateHipotese, deleteHipotese } = useHipotesesDiagnosticasData(patientId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HipoteseFormData>({ ...emptyForm });

  useEffect(() => { fetchHipoteses(); }, [fetchHipoteses]);

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, data_registro: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (h: HipoteseDiagnostica) => {
    setEditingId(h.id);
    setFormData({
      hipotese_principal: h.hipotese_principal || '',
      hipoteses_secundarias: h.hipoteses_secundarias || '',
      descricao_clinica: h.descricao_clinica || '',
      sintomas_observados: h.sintomas_observados || '',
      comportamentos_observados: h.comportamentos_observados || '',
      fatores_desencadeantes: h.fatores_desencadeantes || '',
      gravidade_impacto: h.gravidade_impacto || '',
      status: h.status,
      observacoes: h.observacoes || '',
      data_registro: h.data_registro ? new Date(h.data_registro).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.hipotese_principal.trim()) return;
    if (editingId) {
      const ok = await updateHipotese(editingId, formData);
      if (ok) setDialogOpen(false);
    } else {
      const id = await saveHipotese(formData, professionalId || null, professionalName || null);
      if (id) setDialogOpen(false);
    }
  };

  const updateField = (field: keyof HipoteseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando hipóteses diagnósticas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Hipóteses Diagnósticas</h3>
          <Badge variant="secondary" className="ml-1">{hipoteses.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Adicionar hipótese
          </Button>
        )}
      </div>

      {/* Empty state */}
      {hipoteses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-muted-foreground">Nenhuma hipótese diagnóstica registrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
              Registre hipóteses diagnósticas provisórias ou fechadas para acompanhar o quadro clínico do paciente.
            </p>
            {canEdit && (
              <Button onClick={openNew} className="mt-4" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Adicionar primeira hipótese
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {hipoteses.map(h => (
          <Card key={h.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{h.hipotese_principal}</CardTitle>
                    <Badge variant={h.status === 'fechada' ? 'default' : 'outline'}>
                      {h.status === 'fechada' ? 'Fechada' : 'Provisória'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(h.data_registro).toLocaleDateString('pt-BR')}
                    {h.professional_name && ` • ${h.professional_name}`}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(h)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir hipótese?</AlertDialogTitle>
                          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteHipotese(h.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              {h.hipoteses_secundarias && (
                <div><span className="font-medium text-muted-foreground">Hipóteses secundárias:</span> <span>{h.hipoteses_secundarias}</span></div>
              )}
              {h.descricao_clinica && (
                <div><span className="font-medium text-muted-foreground">Fundamentação:</span> <span>{h.descricao_clinica}</span></div>
              )}
              {h.sintomas_observados && (
                <div><span className="font-medium text-muted-foreground">Sintomas:</span> <span>{h.sintomas_observados}</span></div>
              )}
              {h.comportamentos_observados && (
                <div><span className="font-medium text-muted-foreground">Comportamentos:</span> <span>{h.comportamentos_observados}</span></div>
              )}
              {h.fatores_desencadeantes && (
                <div><span className="font-medium text-muted-foreground">Fatores desencadeantes:</span> <span>{h.fatores_desencadeantes}</span></div>
              )}
              {h.gravidade_impacto && (
                <div><span className="font-medium text-muted-foreground">Gravidade / Impacto:</span> <span>{h.gravidade_impacto}</span></div>
              )}
              {h.observacoes && (
                <div><span className="font-medium text-muted-foreground">Observações:</span> <span>{h.observacoes}</span></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nova'} Hipótese Diagnóstica</DialogTitle>
            <DialogDescription>Preencha os dados da hipótese diagnóstica. O campo principal é obrigatório.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hipótese principal <span className="text-destructive">*</span></Label>
              <Input value={formData.hipotese_principal} onChange={e => updateField('hipotese_principal', e.target.value)} placeholder="Ex: Transtorno de Ansiedade Generalizada (F41.1)" />
            </div>
            <div className="space-y-2">
              <Label>Hipóteses secundárias</Label>
              <Textarea value={formData.hipoteses_secundarias} onChange={e => updateField('hipoteses_secundarias', e.target.value)} placeholder="Outras hipóteses consideradas..." rows={2} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Descrição clínica / Fundamentação</Label>
              <Textarea value={formData.descricao_clinica} onChange={e => updateField('descricao_clinica', e.target.value)} placeholder="Fundamentação clínica da hipótese..." rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sintomas observados</Label>
                <Textarea value={formData.sintomas_observados} onChange={e => updateField('sintomas_observados', e.target.value)} placeholder="Sintomas relevantes..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Comportamentos observados</Label>
                <Textarea value={formData.comportamentos_observados} onChange={e => updateField('comportamentos_observados', e.target.value)} placeholder="Comportamentos relevantes..." rows={3} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fatores desencadeantes / mantenedores</Label>
              <Textarea value={formData.fatores_desencadeantes} onChange={e => updateField('fatores_desencadeantes', e.target.value)} placeholder="Fatores que desencadeiam ou mantêm o quadro..." rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gravidade / Impacto funcional</Label>
                <Input value={formData.gravidade_impacto} onChange={e => updateField('gravidade_impacto', e.target.value)} placeholder="Ex: Moderado" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provisoria">Provisória</SelectItem>
                    <SelectItem value="fechada">Fechada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do registro</Label>
                <Input type="date" value={formData.data_registro} onChange={e => updateField('data_registro', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações complementares</Label>
              <Textarea value={formData.observacoes} onChange={e => updateField('observacoes', e.target.value)} placeholder="Observações adicionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !formData.hipotese_principal.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? 'Salvar alterações' : 'Salvar hipótese'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
