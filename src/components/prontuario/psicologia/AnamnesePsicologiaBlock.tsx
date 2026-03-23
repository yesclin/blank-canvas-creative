import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, Edit3, Save, X, Clock, History, MessageCircle, Heart,
  Users, Briefcase, ClipboardList, Target, ShieldAlert, ShieldCheck,
  FileText, AlertTriangle, Pill, Bed, Moon, Apple, Eye, EyeOff,
  Monitor, Video, Dumbbell, Frown, Zap, Focus, ThumbsUp, Sparkles,
  Route, Settings,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import type { 
  AnamnesePsicologiaData, 
  AnamnesePsicologiaFormData 
} from "@/hooks/prontuario/psicologia/useAnamnesePsicologiaData";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { useAnamnesisModels } from "@/hooks/prontuario/useAnamnesisModels";
import { AnamneseModelSelector } from "@/components/prontuario/AnamneseModelSelector";
import { AnamnesisModelEditorDialog } from "@/components/config/prontuario/AnamnesisModelEditorDialog";
import { DynamicAnamnesisFormRenderer } from "./DynamicAnamnesisFormRenderer";
import { useDynamicAnamnesisRecords, type DynamicAnamnesisRecord } from "@/hooks/prontuario/psicologia/useDynamicAnamnesisRecords";
import { PartnerPatientSelector } from "./PartnerPatientSelector";
import type { Json } from "@/integrations/supabase/types";

interface AnamnesePsicologiaBlockProps {
  currentAnamnese: AnamnesePsicologiaData | null;
  anamneseHistory: AnamnesePsicologiaData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: AnamnesePsicologiaFormData) => Promise<void>;
  onUpdate?: (id: string, data: AnamnesePsicologiaFormData) => Promise<void>;
  specialtyId?: string | null;
  procedureId?: string | null;
  patientId?: string | null;
  appointmentId?: string | null;
}

const EMPTY_FORM: AnamnesePsicologiaFormData = {
  queixa_principal: '',
  expectativas_terapia: '',
  quem_sugeriu_terapia: '',
  historico_emocional_comportamental: '',
  quando_comecou: '',
  situacoes_associadas: '',
  frequencia_sintomas: '',
  intensidade_subjetiva: '',
  impacto_vida: '',
  estrategias_tentadas: '',
  ja_fez_terapia: false,
  ja_fez_terapia_obs: '',
  uso_medicacao: false,
  uso_medicacao_qual: '',
  diagnostico_previo: '',
  internacoes: false,
  internacoes_obs: '',
  infancia: '',
  adolescencia: '',
  eventos_marcantes: '',
  experiencias_traumaticas: '',
  relacionamento_pais_cuidadores: '',
  contexto_familiar: '',
  contexto_trabalho: '',
  contexto_relacionamentos: '',
  contexto_vida_social: '',
  contexto_rede_apoio: '',
  contexto_rotina: '',
  contexto_sono: '',
  contexto_alimentacao: '',
  contexto_atividade_fisica: '',
  humor_predominante: '',
  ansiedade: '',
  irritabilidade: '',
  concentracao: '',
  autoestima: '',
  pensamentos_recorrentes: '',
  ideacao_suicida: false,
  ideacao_suicida_obs: '',
  comportamentos_risco: '',
  fatores_risco: '',
  fatores_protecao: '',
  observacao_postura: '',
  observacao_afeto: '',
  observacao_linguagem: '',
  observacao_insight: '',
  observacao_coerencia_discurso: '',
  impressoes_clinicas: '',
  formulacao_inicial: '',
  hipoteses: '',
  ocultar_avaliacao_relatorio: false,
  objetivo_1: '',
  objetivo_2: '',
  objetivo_3: '',
  observacoes_objetivos: '',
  abordagem_terapeutica: '',
  frequencia_sessoes: '',
  encaminhamentos: '',
  intervencoes_previstas: '',
  modalidade: 'presencial',
  observacoes: '',
  contexto_social: '',
  historico_tratamentos: '',
};

export function AnamnesePsicologiaBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onUpdate,
  specialtyId,
  procedureId,
  patientId,
  appointmentId,
}: AnamnesePsicologiaBlockProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamnesePsicologiaData | null>(null);
  const [formData, setFormData] = useState<AnamnesePsicologiaFormData>(EMPTY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Dynamic template state
  const [activeStructure, setActiveStructure] = useState<Json | null>(null);
  const [dynamicResponses, setDynamicResponses] = useState<Record<string, any>>({});
  const [isDynamicEditing, setIsDynamicEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showDynamicHistory, setShowDynamicHistory] = useState(false);
  const [viewingDynamicRecord, setViewingDynamicRecord] = useState<DynamicAnamnesisRecord | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; full_name: string } | null>(null);

  // Dynamic records persistence
  const dynamicRecords = useDynamicAnamnesisRecords(patientId || null);

  const {
    data: resolvedTemplate,
    allTemplates,
    hasMultipleTemplates,
    isLoading: templateLoading,
    loadTemplateById,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const {
    models: anamnesisModels,
    updateModel,
    saving: savingModel,
  } = useAnamnesisModels(specialtyId);

  const hasTemplate = !!resolvedTemplate;

  const currentEditorModel = anamnesisModels.find(
    m => m.id === (selectedTemplateId || resolvedTemplate?.id)
  ) || anamnesisModels[0] || null;

  // Determine if the selected template is the default (hardcoded adult) or a structured one
  const isDefaultAdultTemplate = !selectedTemplateId || 
    selectedTemplateId === resolvedTemplate?.id;

  // Fetch dynamic records on mount
  useEffect(() => {
    if (patientId) {
      dynamicRecords.fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Load structure when template changes
  const handleTemplateChange = useCallback(async (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Reset states
    setIsEditing(false);
    setIsDynamicEditing(false);
    setEditingRecordId(null);
    setFormData(EMPTY_FORM);
    setDynamicResponses({});
    setActiveStructure(null);
    setSelectedPartner(null);

    // Check if this is a template with structure (non-default)
    const template = await loadTemplateById(templateId);
    if (template?.structure && Array.isArray(template.structure) && (template.structure as any[]).length > 0) {
      setActiveStructure(template.structure);
    } else {
      setActiveStructure(null);
    }
  }, [loadTemplateById]);

  // Load structure for initially resolved template if it has one
  useEffect(() => {
    if (resolvedTemplate?.id && !selectedTemplateId) {
      if (resolvedTemplate.structure && Array.isArray(resolvedTemplate.structure) && (resolvedTemplate.structure as any[]).length > 0) {
        setActiveStructure(resolvedTemplate.structure);
      }
    }
  }, [resolvedTemplate?.id, selectedTemplateId, resolvedTemplate?.structure]);

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({ ...currentAnamnese });
      setIsEditingExisting(true);
    }
    setIsEditing(true);
  };

  const handleStartNewVersion = () => {
    if (currentAnamnese) {
      setFormData({ ...currentAnamnese });
    }
    setIsEditingExisting(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingExisting(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (isEditingExisting && currentAnamnese && onUpdate) {
      await onUpdate(currentAnamnese.id, formData);
    } else {
      await onSave(formData);
    }
    setIsEditing(false);
    setIsEditingExisting(false);
  };

  const updateField = (field: keyof AnamnesePsicologiaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Check if there are dynamic records for the currently selected template
  const effectiveTemplateIdForCheck = selectedTemplateId || resolvedTemplate?.id || "";
  const hasDynamicRecordsForTemplate = dynamicRecords.records.some(r => r.template_id === effectiveTemplateIdForCheck);
  const hasDynamicStructure = activeStructure && Array.isArray(activeStructure) && (activeStructure as any[]).length > 0;

  // Empty state — show selector (but not when dynamic editing/records exist)
  if (!currentAnamnese && !isEditing && !isDynamicEditing && !(hasDynamicStructure && hasDynamicRecordsForTemplate)) {
    return (
      <>
        <AnamneseModelSelector
          icon={<Brain className="h-10 w-10 text-muted-foreground opacity-50" />}
          emptyTitle="Nenhuma avaliação inicial registrada"
          emptyDescription="Registre a avaliação inicial para iniciar o acompanhamento terapêutico."
          registerLabel="Registrar Avaliação Inicial"
          resolvedTemplate={resolvedTemplate}
          allTemplates={allTemplates}
          isLoading={templateLoading}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={handleTemplateChange}
          canEdit={canEdit}
          canManageTemplates={canEdit}
          onRegister={() => {
            if (activeStructure) {
              setIsDynamicEditing(true);
            } else {
              setIsEditing(true);
            }
          }}
          onOpenTemplateEditor={() => setShowTemplateEditor(true)}
          onConfigureTemplate={() => navigate('/configuracoes/modelos-anamnese')}
          specialtyLabel="Psicologia"
        />
        <AnamnesisModelEditorDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          model={currentEditorModel}
          onSave={async (id, data) => {
            const result = await updateModel(id, data);
            return !!result;
          }}
          saving={savingModel}
          specialtySlug="psicologia"
        />
      </>
    );
  }

  // ═══════════════════════════════════════════
  // DYNAMIC TEMPLATE MODE (e.g., Infantil)
  // ═══════════════════════════════════════════
  if (activeStructure && Array.isArray(activeStructure) && (activeStructure as any[]).length > 0) {
    const effectiveTemplateId = selectedTemplateId || resolvedTemplate?.id || "";
    const selectedName = allTemplates.find(t => t.id === effectiveTemplateId)?.name || resolvedTemplate?.name || "Anamnese";
    const isCoupleTemplate = selectedName.toLowerCase().includes("casal");

    // Filter records for this specific template
    const templateRecords = dynamicRecords.records.filter(r => r.template_id === effectiveTemplateId);
    const latestRecord = templateRecords[0] || null;

    // If viewing a specific record from history
    if (viewingDynamicRecord) {
      const viewStructure = viewingDynamicRecord.structure_snapshot || activeStructure;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{viewingDynamicRecord.template_name || selectedName}</h2>
              <Badge variant="outline" className="text-xs">
                {format(parseISO(viewingDynamicRecord.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingDynamicRecord(null)}>
                <X className="h-4 w-4 mr-1" /> Voltar
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => {
                  setDynamicResponses(viewingDynamicRecord.responses as Record<string, any>);
                  setEditingRecordId(viewingDynamicRecord.id);
                  setIsDynamicEditing(true);
                  setViewingDynamicRecord(null);
                }}>
                  <Edit3 className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
            </div>
          </div>
          {viewingDynamicRecord.created_by_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>
                Registrada em {format(parseISO(viewingDynamicRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {` por ${viewingDynamicRecord.created_by_name}`}
              </span>
            </div>
          )}
          <DynamicAnamnesisFormRenderer
            key={`view-${viewingDynamicRecord.id}`}
            structure={viewStructure as Json}
            templateName={viewingDynamicRecord.template_name || selectedName}
            responses={viewingDynamicRecord.responses as Record<string, any>}
            isEditing={false}
            canEdit={false}
            onResponseChange={() => {}}
            onSave={() => {}}
            onCancel={() => {}}
            onStartEdit={() => {}}
          />
        </div>
      );
    }

    return (
      <>
        {/* History button for dynamic records */}
        {templateRecords.length > 0 && !isDynamicEditing && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {templateRecords.length} registro{templateRecords.length > 1 ? 's' : ''} salvo{templateRecords.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDynamicHistory(true)}>
              <History className="h-4 w-4 mr-1" /> Histórico ({templateRecords.length})
            </Button>
          </div>
        )}

        {/* Partner selector for couple therapy */}
        {isCoupleTemplate && isDynamicEditing && !editingRecordId && patientId && (
          <div className="mb-4">
            <PartnerPatientSelector
              currentPatientId={patientId}
              selectedPartner={selectedPartner}
              onSelectPartner={(p) => setSelectedPartner(p ? { id: p.id, full_name: p.full_name } : null)}
            />
          </div>
        )}

        {/* Couple indicator on existing records */}
        {isCoupleTemplate && !isDynamicEditing && latestRecord?.linked_patients && latestRecord.linked_patients.length > 1 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Atendimento de Casal</span>
            <span className="text-sm text-muted-foreground">—</span>
            {latestRecord.linked_patients.map((lp, i) => (
              <span key={lp.patient_id} className="text-sm">
                {lp.full_name || "Paciente"}
                {lp.role === 'parceiro' && <Badge variant="outline" className="ml-1 text-[10px]">Parceiro(a)</Badge>}
                {i < latestRecord.linked_patients!.length - 1 && " e "}
              </span>
            ))}
          </div>
        )}

        <DynamicAnamnesisFormRenderer
          key={selectedTemplateId || "default"}
          structure={activeStructure}
          templateName={selectedName}
          responses={isDynamicEditing ? dynamicResponses : (latestRecord?.responses as Record<string, any> || {})}
          isEditing={isDynamicEditing}
          saving={dynamicRecords.saving}
          canEdit={canEdit}
          onResponseChange={(fieldId, value) => {
            setDynamicResponses(prev => ({ ...prev, [fieldId]: value }));
          }}
          onSave={async () => {
            const templateVersionId = resolvedTemplate?.current_version_id
              || allTemplates.find(t => t.id === effectiveTemplateId)?.current_version_id
              || effectiveTemplateId;

            if (editingRecordId) {
              // Update existing record
              await dynamicRecords.updateRecord(editingRecordId, dynamicResponses);
            } else {
              // Create new record
              await dynamicRecords.saveRecord({
                templateId: effectiveTemplateId,
                templateVersionId: templateVersionId,
                specialtyId: specialtyId,
                procedureId: procedureId,
                appointmentId: appointmentId,
                responses: dynamicResponses,
                structureSnapshot: activeStructure,
                partnerPatientId: isCoupleTemplate ? selectedPartner?.id : undefined,
              });
            }
            setIsDynamicEditing(false);
            setEditingRecordId(null);
            setSelectedPartner(null);
          }}
          onCancel={() => {
            setIsDynamicEditing(false);
            setEditingRecordId(null);
            setDynamicResponses({});
            setSelectedPartner(null);
          }}
          onStartEdit={() => {
            if (latestRecord) {
              setDynamicResponses(latestRecord.responses as Record<string, any>);
              setEditingRecordId(latestRecord.id);
            }
            setIsDynamicEditing(true);
          }}
        />

        {/* Dynamic History Dialog */}
        <Dialog open={showDynamicHistory} onOpenChange={setShowDynamicHistory}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Histórico — {selectedName}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {templateRecords.map((record, idx) => (
                  <button
                    key={record.id}
                    onClick={() => {
                      setViewingDynamicRecord(record);
                      setShowDynamicHistory(false);
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={idx === 0 ? "default" : "outline"}>
                        {idx === 0 ? 'Mais recente' : `Registro ${templateRecords.length - idx}`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {record.created_by_name && <p className="text-xs text-muted-foreground mt-1">por {record.created_by_name}</p>}
                    {record.template_name && <p className="text-xs text-muted-foreground">{record.template_name}</p>}
                    {record.linked_patients && record.linked_patients.length > 1 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">Atendimento de Casal</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <AnamnesisModelEditorDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          model={currentEditorModel}
          onSave={async (id, data) => {
            const result = await updateModel(id, data);
            return !!result;
          }}
          saving={savingModel}
          specialtySlug="psicologia"
        />
      </>
    );

  }

  // ═══════════════════════════════════════════
  // EDITING MODE — Hardcoded Adult Form (9 Sections)
  // ═══════════════════════════════════════════
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {isEditingExisting ? 'Editar Avaliação Inicial' : currentAnamnese ? 'Nova Versão da Avaliação' : 'Nova Avaliação Inicial — Psicologia'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {isEditingExisting ? (
            <p className="text-sm text-muted-foreground">Editando a versão atual. As alterações serão salvas diretamente.</p>
          ) : currentAnamnese ? (
            <p className="text-sm text-muted-foreground">Uma nova versão será criada. O histórico anterior será preservado.</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-6">
              {/* Modalidade */}
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2">
                  {formData.modalidade === 'online' ? <Video className="h-4 w-4 text-blue-500" /> : <Monitor className="h-4 w-4 text-primary" />}
                  Modalidade
                </Label>
                <Select value={formData.modalidade} onValueChange={(v) => updateField('modalidade', v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* ═══ 1. DEMANDA INICIAL ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  1. Demanda Inicial
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Motivo da procura</Label>
                    <Textarea
                      placeholder="O que trouxe o paciente à terapia? Qual é a principal dificuldade relatada?"
                      value={formData.queixa_principal}
                      onChange={(e) => updateField('queixa_principal', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Expectativa em relação à terapia</Label>
                    <Textarea
                      placeholder="O que espera alcançar com o processo terapêutico?"
                      value={formData.expectativas_terapia}
                      onChange={(e) => updateField('expectativas_terapia', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Quem sugeriu a terapia? (opcional)</Label>
                    <Input
                      placeholder="Ex: próprio paciente, familiar, médico..."
                      value={formData.quem_sugeriu_terapia}
                      onChange={(e) => updateField('quem_sugeriu_terapia', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ 2. HISTÓRIA DO PROBLEMA ATUAL ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Heart className="h-4 w-4 text-pink-500" />
                  2. História do Problema Atual
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Quando começou</Label>
                    <Input placeholder="Ex: há 6 meses, desde a infância..." value={formData.quando_comecou} onChange={e => updateField('quando_comecou', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Frequência</Label>
                    <Input placeholder="Ex: diário, semanal, esporádico..." value={formData.frequencia_sintomas} onChange={e => updateField('frequencia_sintomas', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Intensidade subjetiva</Label>
                    <Input placeholder="Como o paciente classifica a intensidade?" value={formData.intensidade_subjetiva} onChange={e => updateField('intensidade_subjetiva', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Impacto na vida pessoal/profissional</Label>
                    <Input placeholder="Como afeta o dia a dia?" value={formData.impacto_vida} onChange={e => updateField('impacto_vida', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Situações associadas</Label>
                  <Textarea placeholder="Em quais contextos os sintomas aparecem ou se intensificam?" value={formData.situacoes_associadas} onChange={e => updateField('situacoes_associadas', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Estratégias já tentadas</Label>
                  <Textarea placeholder="O que já tentou para lidar com o problema?" value={formData.estrategias_tentadas} onChange={e => updateField('estrategias_tentadas', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Narrativa estruturada</Label>
                  <Textarea placeholder="Descrição narrativa do histórico emocional e comportamental..." value={formData.historico_emocional_comportamental} onChange={e => updateField('historico_emocional_comportamental', e.target.value)} rows={4} />
                </div>
              </div>

              <Separator />

              {/* ═══ 3. HISTÓRICO PSICOLÓGICO/PSIQUIÁTRICO ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  3. Histórico Psicológico / Psiquiátrico
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.ja_fez_terapia} onCheckedChange={v => updateField('ja_fez_terapia', v)} />
                      <Label className="text-sm">Já fez terapia anteriormente?</Label>
                    </div>
                    {formData.ja_fez_terapia && (
                      <Textarea placeholder="Detalhes: duração, abordagem, motivo de encerramento..." value={formData.ja_fez_terapia_obs} onChange={e => updateField('ja_fez_terapia_obs', e.target.value)} rows={2} className="mt-2" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.uso_medicacao} onCheckedChange={v => updateField('uso_medicacao', v)} />
                      <Label className="text-sm flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> Uso de medicação psiquiátrica?</Label>
                    </div>
                    {formData.uso_medicacao && (
                      <Textarea placeholder="Qual medicação? Dosagem? Há quanto tempo?" value={formData.uso_medicacao_qual} onChange={e => updateField('uso_medicacao_qual', e.target.value)} rows={2} className="mt-2" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Diagnóstico prévio (opcional)</Label>
                    <Input placeholder="Ex: Transtorno de Ansiedade Generalizada" value={formData.diagnostico_previo} onChange={e => updateField('diagnostico_previo', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.internacoes} onCheckedChange={v => updateField('internacoes', v)} />
                      <Label className="text-sm flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> Internações psiquiátricas?</Label>
                    </div>
                    {formData.internacoes && (
                      <Textarea placeholder="Detalhes das internações..." value={formData.internacoes_obs} onChange={e => updateField('internacoes_obs', e.target.value)} rows={2} className="mt-2" />
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ 4. HISTÓRICO DE VIDA ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-purple-500" />
                  4. Histórico de Vida
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Infância</Label>
                    <Textarea placeholder="Como foi a infância do paciente?" value={formData.infancia} onChange={e => updateField('infancia', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Adolescência</Label>
                    <Textarea placeholder="Como foi a adolescência?" value={formData.adolescencia} onChange={e => updateField('adolescencia', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Eventos marcantes</Label>
                    <Textarea placeholder="Eventos significativos na história de vida..." value={formData.eventos_marcantes} onChange={e => updateField('eventos_marcantes', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Experiências traumáticas</Label>
                    <Textarea placeholder="Traumas, perdas significativas, situações de violência..." value={formData.experiencias_traumaticas} onChange={e => updateField('experiencias_traumaticas', e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Relacionamento com pais/cuidadores</Label>
                  <Textarea placeholder="Dinâmica com figuras parentais, vínculos de apego..." value={formData.relacionamento_pais_cuidadores} onChange={e => updateField('relacionamento_pais_cuidadores', e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Contexto familiar</Label>
                  <Textarea placeholder="Composição familiar atual, dinâmica, histórico de saúde mental na família..." value={formData.contexto_familiar} onChange={e => updateField('contexto_familiar', e.target.value)} rows={3} />
                </div>
              </div>

              <Separator />

              {/* ═══ 5. CONTEXTO ATUAL ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  5. Contexto Atual
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Situação familiar</Label>
                    <Textarea placeholder="Situação familiar atual, com quem mora..." value={formData.contexto_familiar} onChange={e => updateField('contexto_familiar', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Relacionamento afetivo</Label>
                    <Textarea placeholder="Situação amorosa, conflitos..." value={formData.contexto_relacionamentos} onChange={e => updateField('contexto_relacionamentos', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Vida profissional/acadêmica</Label>
                    <Textarea placeholder="Trabalho, estudos, satisfação..." value={formData.contexto_trabalho} onChange={e => updateField('contexto_trabalho', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Rede de apoio</Label>
                    <Textarea placeholder="Amigos, família, grupos de suporte..." value={formData.contexto_rede_apoio} onChange={e => updateField('contexto_rede_apoio', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Rotina diária</Label>
                    <Textarea placeholder="Organização do dia a dia..." value={formData.contexto_rotina} onChange={e => updateField('contexto_rotina', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Moon className="h-3.5 w-3.5" /> Qualidade do sono</Label>
                    <Textarea placeholder="Insônia, pesadelos, horários..." value={formData.contexto_sono} onChange={e => updateField('contexto_sono', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Apple className="h-3.5 w-3.5" /> Alimentação</Label>
                    <Textarea placeholder="Padrão alimentar, apetite, compulsões..." value={formData.contexto_alimentacao} onChange={e => updateField('contexto_alimentacao', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5" /> Atividade física</Label>
                    <Textarea placeholder="Exercícios, frequência, motivação..." value={formData.contexto_atividade_fisica} onChange={e => updateField('contexto_atividade_fisica', e.target.value)} rows={2} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ 6. FUNCIONAMENTO PSÍQUICO ATUAL ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  6. Funcionamento Psíquico Atual
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Frown className="h-3.5 w-3.5" /> Humor predominante</Label>
                    <Input placeholder="Ex: deprimido, eutímico, irritável..." value={formData.humor_predominante} onChange={e => updateField('humor_predominante', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Ansiedade</Label>
                    <Input placeholder="Nível, gatilhos, manifestações..." value={formData.ansiedade} onChange={e => updateField('ansiedade', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Irritabilidade</Label>
                    <Input placeholder="Frequência, gatilhos..." value={formData.irritabilidade} onChange={e => updateField('irritabilidade', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Focus className="h-3.5 w-3.5" /> Concentração</Label>
                    <Input placeholder="Dificuldades de foco, atenção..." value={formData.concentracao} onChange={e => updateField('concentracao', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Autoestima</Label>
                    <Input placeholder="Percepção de si mesmo..." value={formData.autoestima} onChange={e => updateField('autoestima', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Pensamentos recorrentes</Label>
                    <Input placeholder="Temas que se repetem no discurso..." value={formData.pensamentos_recorrentes} onChange={e => updateField('pensamentos_recorrentes', e.target.value)} />
                  </div>
                </div>

                {/* Ideação Suicida — campo sensível */}
                <div className="space-y-2 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.ideacao_suicida} onCheckedChange={v => updateField('ideacao_suicida', v)} />
                    <Label className="text-sm font-medium flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Ideação suicida
                    </Label>
                  </div>
                  {formData.ideacao_suicida && (
                    <div className="mt-2 space-y-2">
                      <div className="p-2 bg-destructive/10 rounded text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        ⚠️ ALERTA: Ideação suicida identificada. Este campo é de acesso restrito.
                      </div>
                      <Textarea
                        placeholder="Observações internas (não exportável)..."
                        value={formData.ideacao_suicida_obs}
                        onChange={e => updateField('ideacao_suicida_obs', e.target.value)}
                        rows={2}
                        className="border-destructive/30"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Comportamentos de risco (opcional)</Label>
                  <Textarea placeholder="Autolesão, uso de substâncias, comportamentos impulsivos..." value={formData.comportamentos_risco} onChange={e => updateField('comportamentos_risco', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* ═══ 7. OBSERVAÇÃO CLÍNICA DO PSICÓLOGO ═══ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Brain className="h-4 w-4 text-purple-600" />
                    7. Observação Clínica do Psicólogo
                  </Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch checked={formData.ocultar_avaliacao_relatorio} onCheckedChange={v => updateField('ocultar_avaliacao_relatorio', v)} />
                    <span className="flex items-center gap-1">
                      {formData.ocultar_avaliacao_relatorio ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      Ocultar no relatório
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Postura</Label>
                    <Input placeholder="Postura corporal, comportamento motor..." value={formData.observacao_postura} onChange={e => updateField('observacao_postura', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Afeto</Label>
                    <Input placeholder="Expressão afetiva, congruência..." value={formData.observacao_afeto} onChange={e => updateField('observacao_afeto', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Linguagem</Label>
                    <Input placeholder="Fluência, coerência verbal..." value={formData.observacao_linguagem} onChange={e => updateField('observacao_linguagem', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Insight</Label>
                    <Input placeholder="Grau de consciência sobre a própria situação..." value={formData.observacao_insight} onChange={e => updateField('observacao_insight', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Coerência do discurso</Label>
                  <Textarea placeholder="Organização do pensamento, lógica narrativa..." value={formData.observacao_coerencia_discurso} onChange={e => updateField('observacao_coerencia_discurso', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Impressões clínicas iniciais</Label>
                  <Textarea placeholder="Impressões gerais sobre o paciente..." value={formData.impressoes_clinicas} onChange={e => updateField('impressoes_clinicas', e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Formulação inicial</Label>
                  <Textarea placeholder="Formulação de caso, compreensão dinâmica..." value={formData.formulacao_inicial} onChange={e => updateField('formulacao_inicial', e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Hipóteses (não obrigatório)</Label>
                  <Textarea placeholder="Hipóteses diagnósticas iniciais..." value={formData.hipoteses} onChange={e => updateField('hipoteses', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* ═══ 8. OBJETIVOS TERAPÊUTICOS ═══ */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Target className="h-4 w-4 text-green-600" />
                  8. Objetivos Terapêuticos
                </Label>
                <div className="space-y-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">{n}</Badge>
                      <Input
                        placeholder={`Objetivo terapêutico ${n}`}
                        value={(formData as any)[`objetivo_${n}`]}
                        onChange={e => updateField(`objetivo_${n}` as keyof AnamnesePsicologiaFormData, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Observações sobre objetivos</Label>
                  <Textarea placeholder="Considerações adicionais sobre os objetivos..." value={formData.observacoes_objetivos} onChange={e => updateField('observacoes_objetivos', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* ═══ 9. PLANO TERAPÊUTICO INICIAL ═══ */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Route className="h-4 w-4 text-teal-600" />
                  9. Plano Terapêutico Inicial
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Abordagem terapêutica</Label>
                    <Input placeholder="Ex: TCC, Psicanálise, Humanista..." value={formData.abordagem_terapeutica} onChange={e => updateField('abordagem_terapeutica', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Frequência das sessões</Label>
                    <Input placeholder="Ex: semanal, quinzenal..." value={formData.frequencia_sessoes} onChange={e => updateField('frequencia_sessoes', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Encaminhamentos (se houver)</Label>
                  <Textarea placeholder="Psiquiatria, neurologia, avaliação neuropsicológica..." value={formData.encaminhamentos} onChange={e => updateField('encaminhamentos', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Intervenções previstas</Label>
                  <Textarea placeholder="Técnicas e estratégias planejadas para o processo..." value={formData.intervencoes_previstas} onChange={e => updateField('intervencoes_previstas', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações Adicionais
                </Label>
                <Textarea placeholder="Outras informações relevantes..." value={formData.observacoes} onChange={e => updateField('observacoes', e.target.value)} rows={3} />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════
  const renderField = (label: string, value: string | undefined, icon?: React.ReactNode) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          {label}
        </div>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  const a = currentAnamnese;

  return (
    <div className="space-y-4">
      {/* Ideation alert banner */}
      {a?.ideacao_suicida && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-sm text-destructive font-medium">
          <AlertTriangle className="h-5 w-5" />
          ⚠️ ALERTA: Ideação suicida identificada nesta avaliação. Verificar protocolo de risco.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Avaliação Inicial — Psicologia</h2>
          <Badge variant="outline" className="text-xs">Versão {a?.version || 1}</Badge>
          <Badge variant="secondary" className="text-xs">
            {a?.modalidade === 'online' ? '🟢 Online' : '🏥 Presencial'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" /> Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && onUpdate && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartNewVersion}>
              <Save className="h-4 w-4 mr-1" /> Nova Versão
            </Button>
          )}
        </div>
      </div>

      {a && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Registrada em {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {a.created_by_name && ` por ${a.created_by_name}`}
          </span>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['demanda', 'hda', 'historico_psiq', 'historico_vida', 'contexto_atual', 'funcionamento', 'observacao_clinica', 'objetivos', 'plano']} className="w-full">
            
            <AccordionItem value="demanda" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /><span>1. Demanda Inicial</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                {renderField('Motivo da procura', a?.queixa_principal)}
                {renderField('Expectativas', a?.expectativas_terapia)}
                {renderField('Quem sugeriu', a?.quem_sugeriu_terapia)}
                {!a?.queixa_principal && !a?.expectativas_terapia && <p className="text-sm italic text-muted-foreground">Não informado</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="hda" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" /><span>2. História do Problema Atual</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {renderField('Início', a?.quando_comecou)}
                  {renderField('Frequência', a?.frequencia_sintomas)}
                  {renderField('Intensidade', a?.intensidade_subjetiva)}
                  {renderField('Impacto', a?.impacto_vida)}
                </div>
                {renderField('Situações associadas', a?.situacoes_associadas)}
                {renderField('Estratégias tentadas', a?.estrategias_tentadas)}
                {renderField('Narrativa', a?.historico_emocional_comportamental)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="historico_psiq" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-orange-500" /><span>3. Histórico Psicológico / Psiquiátrico</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 p-3 rounded-lg"><span className="font-medium">Terapia anterior:</span> {a?.ja_fez_terapia ? `Sim — ${a.ja_fez_terapia_obs || 'sem detalhes'}` : 'Não'}</div>
                  <div className="bg-muted/40 p-3 rounded-lg"><span className="font-medium">Medicação:</span> {a?.uso_medicacao ? `Sim — ${a.uso_medicacao_qual || 'sem detalhes'}` : 'Não'}</div>
                  {a?.diagnostico_previo && <div className="bg-muted/40 p-3 rounded-lg"><span className="font-medium">Diagnóstico prévio:</span> {a.diagnostico_previo}</div>}
                  <div className="bg-muted/40 p-3 rounded-lg"><span className="font-medium">Internações:</span> {a?.internacoes ? `Sim — ${a.internacoes_obs || 'sem detalhes'}` : 'Não'}</div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="historico_vida" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /><span>4. Histórico de Vida</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Infância', a?.infancia)}
                  {renderField('Adolescência', a?.adolescencia)}
                  {renderField('Eventos marcantes', a?.eventos_marcantes)}
                  {renderField('Experiências traumáticas', a?.experiencias_traumaticas)}
                </div>
                {renderField('Relacionamento com pais/cuidadores', a?.relacionamento_pais_cuidadores)}
                {renderField('Contexto familiar', a?.contexto_familiar)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contexto_atual" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-500" /><span>5. Contexto Atual</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Trabalho/Acadêmico', a?.contexto_trabalho)}
                  {renderField('Relacionamento afetivo', a?.contexto_relacionamentos)}
                  {renderField('Rede de apoio', a?.contexto_rede_apoio)}
                  {renderField('Rotina', a?.contexto_rotina)}
                  {renderField('Sono', a?.contexto_sono)}
                  {renderField('Alimentação', a?.contexto_alimentacao)}
                  {renderField('Atividade física', a?.contexto_atividade_fisica)}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="funcionamento" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-indigo-500" /><span>6. Funcionamento Psíquico Atual</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderField('Humor', a?.humor_predominante)}
                  {renderField('Ansiedade', a?.ansiedade)}
                  {renderField('Irritabilidade', a?.irritabilidade)}
                  {renderField('Concentração', a?.concentracao)}
                  {renderField('Autoestima', a?.autoestima)}
                  {renderField('Pensamentos recorrentes', a?.pensamentos_recorrentes)}
                </div>
                {a?.ideacao_suicida && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                    <span className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Ideação suicida: Sim</span>
                    {a.ideacao_suicida_obs && <p className="mt-1 text-muted-foreground">{a.ideacao_suicida_obs}</p>}
                  </div>
                )}
                {renderField('Comportamentos de risco', a?.comportamentos_risco)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="observacao_clinica" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span>7. Observação Clínica</span>
                  {a?.ocultar_avaliacao_relatorio && <Badge variant="outline" className="text-[10px] ml-1"><EyeOff className="h-3 w-3 mr-1" />Oculto no relatório</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderField('Postura', a?.observacao_postura)}
                  {renderField('Afeto', a?.observacao_afeto)}
                  {renderField('Linguagem', a?.observacao_linguagem)}
                  {renderField('Insight', a?.observacao_insight)}
                </div>
                {renderField('Coerência do discurso', a?.observacao_coerencia_discurso)}
                {renderField('Impressões clínicas', a?.impressoes_clinicas)}
                {renderField('Formulação inicial', a?.formulacao_inicial)}
                {renderField('Hipóteses', a?.hipoteses)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="objetivos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-green-600" /><span>8. Objetivos Terapêuticos</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                {[a?.objetivo_1, a?.objetivo_2, a?.objetivo_3].filter(Boolean).map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{i + 1}</Badge>
                    <p className="text-sm">{obj}</p>
                  </div>
                ))}
                {!a?.objetivo_1 && !a?.objetivo_2 && !a?.objetivo_3 && <p className="text-sm italic text-muted-foreground">Nenhum objetivo definido</p>}
                {renderField('Observações sobre objetivos', a?.observacoes_objetivos)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="plano">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2"><Route className="h-4 w-4 text-teal-600" /><span>9. Plano Terapêutico Inicial</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderField('Abordagem', a?.abordagem_terapeutica)}
                  {renderField('Frequência', a?.frequencia_sessoes)}
                </div>
                {renderField('Encaminhamentos', a?.encaminhamentos)}
                {renderField('Intervenções previstas', a?.intervencoes_previstas)}
                {!a?.abordagem_terapeutica && !a?.frequencia_sessoes && <p className="text-sm italic text-muted-foreground">Não informado</p>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Observações gerais */}
      {a?.observacoes && (
        <Card>
          <CardContent className="p-4">
            {renderField('Observações adicionais', a.observacoes, <FileText className="h-3 w-3" />)}
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Histórico de Versões</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map(version => (
                <button
                  key={version.id}
                  onClick={() => { setSelectedVersion(version); setShowHistory(false); }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={version.is_current ? "default" : "outline"}>
                      Versão {version.version} {version.is_current && '(atual)'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {version.created_by_name && <p className="text-xs text-muted-foreground mt-1">por {version.created_by_name}</p>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version View Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Versão {selectedVersion?.version}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {renderField('Motivo da procura', selectedVersion?.queixa_principal)}
              {renderField('Expectativas', selectedVersion?.expectativas_terapia)}
              {renderField('História do Problema Atual', selectedVersion?.historico_emocional_comportamental)}
              {renderField('Histórico Familiar', selectedVersion?.contexto_familiar)}
              {renderField('Impressões Clínicas', selectedVersion?.impressoes_clinicas)}
              {renderField('Formulação Inicial', selectedVersion?.formulacao_inicial)}
              {renderField('Abordagem', selectedVersion?.abordagem_terapeutica)}
              {renderField('Observações', selectedVersion?.observacoes)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Template Editor Modal */}
      <AnamnesisModelEditorDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        model={currentEditorModel}
        onSave={async (id, data) => {
          const result = await updateModel(id, data);
          return !!result;
        }}
        saving={savingModel}
        specialtySlug="psicologia"
      />
    </div>
  );
}
