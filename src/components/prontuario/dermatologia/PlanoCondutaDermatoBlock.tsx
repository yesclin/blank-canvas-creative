import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
  Edit3,
  Save,
  X,
  Clock,
  History,
  Target,
  Pill,
  FileText,
  CalendarDays,
  Stethoscope,
  ArrowRight,
  AlertCircle,
  ClipboardList,
  Plus,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";

export interface PlanoCondutaDermatoData {
  id: string;
  patient_id: string;
  hipotese_diagnostica?: string;
  hipoteses_diferenciais?: string;
  plano_terapeutico?: string;
  conduta_clinica?: string;
  medicamentos_prescritos?: string;
  exames_solicitados?: string;
  orientacoes_paciente?: string;
  necessidade_retorno?: boolean;
  prazo_retorno?: string;
  encaminhamento?: string;
  observacoes?: string;
  status: 'draft' | 'signed';
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  updated_at?: string;
  source?: 'clinical_evolutions' | 'patient_condutas';
}

interface PlanoCondutaDermatoBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
}

export function PlanoCondutaDermatoBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
  specialtyId,
}: PlanoCondutaDermatoBlockProps) {
  const [planos, setPlanos] = useState<PlanoCondutaDermatoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoCondutaDermatoData | null>(null);
  const [selectedPlano, setSelectedPlano] = useState<PlanoCondutaDermatoData | null>(null);

  // Form state
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('');
  const [hipotesesDiferenciais, setHipotesesDiferenciais] = useState('');
  const [planoTerapeutico, setPlanoTerapeutico] = useState('');
  const [condutaClinica, setCondutaClinica] = useState('');
  const [medicamentosPrescritos, setMedicamentosPrescritos] = useState('');
  const [examesSolicitados, setExamesSolicitados] = useState('');
  const [orientacoesPaciente, setOrientacoesPaciente] = useState('');
  const [necessidadeRetorno, setNecessidadeRetorno] = useState(false);
  const [prazoRetorno, setPrazoRetorno] = useState('');
  const [encaminhamento, setEncaminhamento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const fetchPlanos = useCallback(async () => {
    if (!patientId || !clinicId) {
      setPlanos([]);
      return;
    }

    setLoading(true);
    try {
      const [evolutionRes, legacyRes] = await Promise.all([
        supabase
          .from('clinical_evolutions')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .eq('evolution_type', 'conduct_dermato')
          .order('created_at', { ascending: false }),
        supabase
          .from('patient_condutas')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .order('data_hora', { ascending: false }),
      ]);

      if (evolutionRes.error) throw evolutionRes.error;
      if (legacyRes.error) throw legacyRes.error;

      const mappedEvolutions: PlanoCondutaDermatoData[] = (evolutionRes.data || []).map((row: any) => {
        const content = (row.content as Record<string, any>) || {};
        return {
          id: row.id,
          patient_id: row.patient_id,
          hipotese_diagnostica: content.hipotese_diagnostica || '',
          hipoteses_diferenciais: content.hipoteses_diferenciais || '',
          plano_terapeutico: content.plano_terapeutico || '',
          conduta_clinica: content.conduta_clinica || '',
          medicamentos_prescritos: content.medicamentos_prescritos || '',
          exames_solicitados: content.exames_solicitados || '',
          orientacoes_paciente: content.orientacoes_paciente || '',
          necessidade_retorno: content.necessidade_retorno || false,
          prazo_retorno: content.prazo_retorno || '',
          encaminhamento: content.encaminhamento || '',
          observacoes: content.observacoes || '',
          status: row.status || 'draft',
          created_at: row.created_at,
          created_by: row.professional_id,
          created_by_name: content.professional_name || '',
          updated_at: row.updated_at,
          source: 'clinical_evolutions',
        };
      });

      const mappedLegacy: PlanoCondutaDermatoData[] = (legacyRes.data || []).map((row: any) => ({
        id: row.id,
        patient_id: row.patient_id,
        hipotese_diagnostica: '',
        hipoteses_diferenciais: '',
        plano_terapeutico: '',
        conduta_clinica: row.retorno_observacoes || '',
        medicamentos_prescritos: row.prescricoes || '',
        exames_solicitados: row.solicitacao_exames || '',
        orientacoes_paciente: row.orientacoes || '',
        necessidade_retorno: !!row.retorno_agendado,
        prazo_retorno: row.retorno_agendado || '',
        encaminhamento: row.encaminhamentos || '',
        observacoes: row.retorno_observacoes || '',
        status: 'draft',
        created_at: row.data_hora || row.created_at,
        created_by: row.profissional_id,
        created_by_name: '',
        updated_at: row.created_at,
        source: 'patient_condutas',
      }));

      const merged = [...mappedEvolutions, ...mappedLegacy].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setPlanos(merged);
    } catch (err) {
      console.error('Error fetching planos dermatologia:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinicId]);

  useEffect(() => {
    fetchPlanos();
  }, [fetchPlanos]);

  const resetForm = () => {
    setHipoteseDiagnostica('');
    setHipotesesDiferenciais('');
    setPlanoTerapeutico('');
    setCondutaClinica('');
    setMedicamentosPrescritos('');
    setExamesSolicitados('');
    setOrientacoesPaciente('');
    setNecessidadeRetorno(false);
    setPrazoRetorno('');
    setEncaminhamento('');
    setObservacoes('');
    setEditingPlano(null);
  };

  const handleStartNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleEdit = (plano: PlanoCondutaDermatoData) => {
    setHipoteseDiagnostica(plano.hipotese_diagnostica || '');
    setHipotesesDiferenciais(plano.hipoteses_diferenciais || '');
    setPlanoTerapeutico(plano.plano_terapeutico || '');
    setCondutaClinica(plano.conduta_clinica || '');
    setMedicamentosPrescritos(plano.medicamentos_prescritos || '');
    setExamesSolicitados(plano.exames_solicitados || '');
    setOrientacoesPaciente(plano.orientacoes_paciente || '');
    setNecessidadeRetorno(plano.necessidade_retorno || false);
    setPrazoRetorno(plano.prazo_retorno || '');
    setEncaminhamento(plano.encaminhamento || '');
    setObservacoes(plano.observacoes || '');
    setEditingPlano(plano);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!patientId || !clinicId || !professionalId) return;
    setSaving(true);
    try {
      const content = {
        hipotese_diagnostica: hipoteseDiagnostica,
        hipoteses_diferenciais: hipotesesDiferenciais,
        plano_terapeutico: planoTerapeutico,
        conduta_clinica: condutaClinica,
        medicamentos_prescritos: medicamentosPrescritos,
        exames_solicitados: examesSolicitados,
        orientacoes_paciente: orientacoesPaciente,
        necessidade_retorno: necessidadeRetorno,
        prazo_retorno: prazoRetorno,
        encaminhamento: encaminhamento,
        observacoes: observacoes,
      };

      if (editingPlano) {
        const { error } = await supabase
          .from('clinical_evolutions')
          .update({
            content: content as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlano.id);

        if (error) throw error;
        toast.success('Plano/Conduta atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('clinical_evolutions')
          .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            professional_id: professionalId,
            evolution_type: 'conduct_dermato',
            specialty_id: specialtyId || null,
            content: content as any,
            status: 'draft',
          });

        if (error) throw error;
        toast.success('Plano/Conduta registrado com sucesso');
      }

      setIsEditing(false);
      resetForm();
      fetchPlanos();
    } catch (err) {
      console.error('Error saving plano:', err);
      toast.error('Erro ao salvar Plano/Conduta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasContent = (value?: string) => value && value.trim().length > 0;

  const formatPlanoDate = (value?: string) => {
    if (!value) return 'Data não informada';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data não informada';
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const renderViewField = (label: string, value?: string, icon?: React.ReactNode) => {
    if (!hasContent(value)) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="text-sm whitespace-pre-wrap pl-6">{value}</p>
      </div>
    );
  };

  const renderPlanoCard = (plano: PlanoCondutaDermatoData) => {
    return (
      <Card key={plano.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedPlano(plano)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                {hasContent(plano.hipotese_diagnostica)
                  ? plano.hipotese_diagnostica!.substring(0, 80) + (plano.hipotese_diagnostica!.length > 80 ? '...' : '')
                  : 'Plano / Conduta'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={plano.status === 'signed' ? 'default' : 'secondary'} className="text-xs">
                {plano.status === 'signed' ? 'Assinado' : 'Rascunho'}
              </Badge>
              {canEdit && plano.status !== 'signed' && plano.source !== 'patient_condutas' && (
                <Button size="sm" variant="ghost" className="h-7" onClick={(e) => { e.stopPropagation(); handleEdit(plano); }}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatPlanoDate(plano.created_at)}
          </div>
          {hasContent(plano.plano_terapeutico) && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{plano.plano_terapeutico}</p>
          )}
          {plano.necessidade_retorno && hasContent(plano.prazo_retorno) && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
              <CalendarDays className="h-3 w-3" />
              Retorno: {plano.prazo_retorno}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Plano / Conduta Dermatológica
          </h2>
          <Badge variant="secondary">{planos.length}</Badge>
        </div>
        {canEdit && !isEditing && (
          <Button size="sm" onClick={handleStartNew}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Plano
          </Button>
        )}
      </div>

      {/* Form */}
      {isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingPlano ? 'Editar Plano / Conduta' : 'Novo Plano / Conduta'}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Hipótese Diagnóstica Principal</Label>
                  <Textarea value={hipoteseDiagnostica} onChange={e => setHipoteseDiagnostica(e.target.value)} placeholder="Ex: Dermatite atópica moderada..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Hipóteses Diferenciais</Label>
                  <Textarea value={hipotesesDiferenciais} onChange={e => setHipotesesDiferenciais(e.target.value)} placeholder="Ex: Psoríase, Dermatite de contato..." rows={2} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Plano Terapêutico</Label>
                  <Textarea value={planoTerapeutico} onChange={e => setPlanoTerapeutico(e.target.value)} placeholder="Descreva o plano terapêutico..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Conduta Clínica</Label>
                  <Textarea value={condutaClinica} onChange={e => setCondutaClinica(e.target.value)} placeholder="Conduta adotada..." rows={2} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Pill className="h-4 w-4" /> Medicamentos Prescritos</Label>
                  <Textarea value={medicamentosPrescritos} onChange={e => setMedicamentosPrescritos(e.target.value)} placeholder="Medicamentos, posologia..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Exames Solicitados</Label>
                  <Textarea value={examesSolicitados} onChange={e => setExamesSolicitados(e.target.value)} placeholder="Exames complementares..." rows={2} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Orientações ao Paciente</Label>
                  <Textarea value={orientacoesPaciente} onChange={e => setOrientacoesPaciente(e.target.value)} placeholder="Orientações gerais..." rows={3} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={necessidadeRetorno} onCheckedChange={setNecessidadeRetorno} />
                    <Label>Necessidade de retorno</Label>
                  </div>
                  {necessidadeRetorno && (
                    <div className="flex-1">
                      <Input value={prazoRetorno} onChange={e => setPrazoRetorno(e.target.value)} placeholder="Ex: 15 dias, 1 mês..." />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Encaminhamento</Label>
                  <Textarea value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)} placeholder="Encaminhamento para outro especialista..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais..." rows={2} />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {planos.length === 0 && !isEditing ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum plano/conduta registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum plano ou conduta registrado até o momento.
            </p>
            {canEdit && (
              <Button onClick={handleStartNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Plano / Conduta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {planos.map(renderPlanoCard)}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPlano} onOpenChange={() => setSelectedPlano(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Plano / Conduta Dermatológica
            </DialogTitle>
            <DialogDescription>
              {selectedPlano && formatPlanoDate(selectedPlano.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedPlano && (
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-4">
                {renderViewField('Hipótese Diagnóstica Principal', selectedPlano.hipotese_diagnostica, <Stethoscope className="h-4 w-4" />)}
                {renderViewField('Hipóteses Diferenciais', selectedPlano.hipoteses_diferenciais)}
                {(hasContent(selectedPlano.hipotese_diagnostica) || hasContent(selectedPlano.hipoteses_diferenciais)) && <Separator />}
                {renderViewField('Plano Terapêutico', selectedPlano.plano_terapeutico, <ClipboardList className="h-4 w-4" />)}
                {renderViewField('Conduta Clínica', selectedPlano.conduta_clinica)}
                {(hasContent(selectedPlano.plano_terapeutico) || hasContent(selectedPlano.conduta_clinica)) && <Separator />}
                {renderViewField('Medicamentos Prescritos', selectedPlano.medicamentos_prescritos, <Pill className="h-4 w-4" />)}
                {renderViewField('Exames Solicitados', selectedPlano.exames_solicitados)}
                {(hasContent(selectedPlano.medicamentos_prescritos) || hasContent(selectedPlano.exames_solicitados)) && <Separator />}
                {renderViewField('Orientações ao Paciente', selectedPlano.orientacoes_paciente, <FileText className="h-4 w-4" />)}
                {selectedPlano.necessidade_retorno && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-medium">Retorno:</span>
                    <span>{selectedPlano.prazo_retorno || 'A definir'}</span>
                  </div>
                )}
                {renderViewField('Encaminhamento', selectedPlano.encaminhamento, <ArrowRight className="h-4 w-4" />)}
                {renderViewField('Observações', selectedPlano.observacoes)}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlanoCondutaDermatoBlock;
