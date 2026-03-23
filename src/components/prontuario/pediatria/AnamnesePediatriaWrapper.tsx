/**
 * PEDIATRIA - Anamnese Pediátrica (Dynamic Templates)
 * 
 * Uses AnamneseModelSelector + DynamicAnamnesisFormRenderer
 * to render the 12 pediatric anamnesis models dynamically.
 * Same pattern as Dermatologia / Psicologia.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  History,
  Copy,
  User,
  Calendar,
  Baby,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { useDynamicAnamnesisRecords, type DynamicAnamnesisRecord } from "@/hooks/prontuario/psicologia/useDynamicAnamnesisRecords";
import { DynamicAnamnesisFormRenderer } from "@/components/prontuario/psicologia/DynamicAnamnesisFormRenderer";
import { AnamneseModelSelector } from "@/components/prontuario/AnamneseModelSelector";
import { useAutosave } from "@/hooks/prontuario/useAutosave";
import { AutosaveIndicator } from "@/components/prontuario/AutosaveIndicator";
import type { Json } from "@/integrations/supabase/types";

interface AnamnesePediatriaWrapperProps {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
  professionalId?: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
}

export function AnamnesePediatriaWrapper({
  patientId,
  clinicId,
  appointmentId,
  professionalId,
  canEdit = false,
  specialtyId,
  procedureId,
}: AnamnesePediatriaWrapperProps) {
  const dynamicRecords = useDynamicAnamnesisRecords(patientId);

  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<DynamicAnamnesisRecord | null>(null);

  useEffect(() => {
    dynamicRecords.fetchRecords();
  }, [patientId]);

  useEffect(() => {
    if (resolvedTemplate && !selectedTemplateId) {
      setSelectedTemplateId(resolvedTemplate.id);
    }
  }, [resolvedTemplate, selectedTemplateId]);

  const activeStructure = resolvedTemplate?.structure || resolvedTemplate?.campos;
  const activeTemplateName = resolvedTemplate?.name || "Anamnese Pediátrica Geral";
  const activeVersionId = resolvedTemplate?.current_version_id;

  const currentRecord = dynamicRecords.records[0] || null;

  // Autosave
  const autosave = useAutosave({
    enabled: isEditing,
    debounceMs: 10_000,
    onSave: useCallback(async () => {
      if (!resolvedTemplate) return;
      const hasData = Object.values(responses).some(
        v => v !== null && v !== undefined && v !== "" && v !== false
      );
      if (!hasData) return;

      if (editingRecordId) {
        await dynamicRecords.updateRecord(editingRecordId, responses);
      } else {
        const newId = await dynamicRecords.saveRecord({
          templateId: resolvedTemplate.id,
          templateVersionId: activeVersionId || resolvedTemplate.id,
          structureSnapshot: activeStructure,
          responses,
          specialtyId: specialtyId || null,
          procedureId: procedureId || null,
          appointmentId: appointmentId || null,
        });
        if (newId) setEditingRecordId(newId);
      }
    }, [responses, editingRecordId, resolvedTemplate, activeStructure, activeVersionId, specialtyId, procedureId, appointmentId, dynamicRecords]),
  });

  const handleResponseChange = useCallback((fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    autosave.markDirty();
  }, [autosave]);

  const handleStartNew = useCallback(() => {
    setResponses({
      data_hora_anamnese: format(new Date(), "dd/MM/yyyy HH:mm"),
    });
    setEditingRecordId(null);
    setIsEditing(true);
    autosave.resetStatus();
  }, []);

  const handleStartEdit = useCallback(() => {
    if (currentRecord) {
      setResponses(currentRecord.responses as Record<string, any>);
      setEditingRecordId(currentRecord.id);
      setIsEditing(true);
      autosave.resetStatus();
    }
  }, [currentRecord]);

  const handleDuplicate = useCallback(() => {
    if (currentRecord) {
      const duped = { ...(currentRecord.responses as Record<string, any>) };
      duped.data_hora_anamnese = format(new Date(), "dd/MM/yyyy HH:mm");
      setResponses(duped);
      setEditingRecordId(null);
      setIsEditing(true);
      autosave.resetStatus();
      toast.info("Anamnese duplicada. Edite e salve como nova versão.");
    }
  }, [currentRecord]);

  const handleSave = useCallback(async () => {
    if (!resolvedTemplate) return;

    try {
      if (editingRecordId) {
        await dynamicRecords.updateRecord(editingRecordId, responses);
      } else {
        await dynamicRecords.saveRecord({
          templateId: resolvedTemplate.id,
          templateVersionId: activeVersionId || resolvedTemplate.id,
          structureSnapshot: activeStructure,
          responses,
          specialtyId: specialtyId || null,
          procedureId: procedureId || null,
          appointmentId: appointmentId || null,
        });
      }
      setIsEditing(false);
      setEditingRecordId(null);
      autosave.resetStatus();
      await dynamicRecords.fetchRecords();
      toast.success("Anamnese pediátrica salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar anamnese.");
    }
  }, [responses, editingRecordId, resolvedTemplate, activeStructure, activeVersionId, specialtyId, procedureId, appointmentId, dynamicRecords]);

  const handleCancel = useCallback(() => {
    autosave.resetStatus();
    setIsEditing(false);
    setEditingRecordId(null);
    setResponses({});
  }, [autosave]);

  // Loading
  if (dynamicRecords.loading || templateLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No template
  if (!resolvedTemplate || !activeStructure) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Baby className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Modelo de anamnese não encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Nenhum modelo de anamnese pediátrica está disponível para esta especialidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{activeTemplateName}</h2>
            <AutosaveIndicator status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
          </div>
        </div>

        <DynamicAnamnesisFormRenderer
          structure={activeStructure as Json}
          templateName={activeTemplateName}
          responses={responses}
          isEditing={true}
          saving={dynamicRecords.saving}
          canEdit={canEdit}
          onResponseChange={handleResponseChange}
          onSave={handleSave}
          onCancel={handleCancel}
          onStartEdit={handleStartEdit}
        />
      </div>
    );
  }

  // View mode with existing record
  if (currentRecord) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Anamnese Pediátrica</h2>
            <Badge variant="outline" className="text-xs">
              {format(parseISO(currentRecord.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            {dynamicRecords.records.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4 mr-1" /> Histórico ({dynamicRecords.records.length})
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartNew}>
                  <Plus className="h-4 w-4 mr-1" /> Nova
                </Button>
              </>
            )}
          </div>
        </div>

        <DynamicAnamnesisFormRenderer
          structure={(currentRecord.structure_snapshot || activeStructure) as Json}
          templateName={currentRecord.template_name || activeTemplateName}
          responses={currentRecord.responses as Record<string, any>}
          isEditing={false}
          canEdit={canEdit}
          onResponseChange={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
          onStartEdit={handleStartEdit}
        />

        {/* History dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>Histórico de Anamneses Pediátricas</DialogTitle>
              <DialogDescription>
                Versões anteriores da anamnese deste paciente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
              {dynamicRecords.records.map((rec) => (
                <Card
                  key={rec.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setViewingRecord(rec);
                    setShowHistory(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(parseISO(rec.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {rec.created_by_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {rec.created_by_name}
                        </div>
                      )}
                    </div>
                    {rec.template_name && (
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        {rec.template_name}
                      </p>
                    )}
                    {(rec.responses as any)?.motivo_consulta && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {(rec.responses as any).motivo_consulta}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Viewing a specific historical record */}
        <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                Anamnese - {viewingRecord && format(parseISO(viewingRecord.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              {viewingRecord && (
                <DynamicAnamnesisFormRenderer
                  structure={(viewingRecord.structure_snapshot || activeStructure) as Json}
                  templateName={viewingRecord.template_name || "Anamnese Pediátrica"}
                  responses={viewingRecord.responses as Record<string, any>}
                  isEditing={false}
                  canEdit={false}
                  onResponseChange={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onStartEdit={() => {}}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Empty state
  return (
    <AnamneseModelSelector
      icon={<Baby className="h-10 w-10 text-muted-foreground opacity-50" />}
      emptyTitle="Nenhuma avaliação inicial registrada"
      emptyDescription="Registre a avaliação inicial para iniciar o acompanhamento pediátrico."
      registerLabel="Registrar Avaliação Inicial"
      resolvedTemplate={resolvedTemplate}
      allTemplates={allTemplates || []}
      isLoading={templateLoading}
      selectedTemplateId={selectedTemplateId}
      onTemplateChange={setSelectedTemplateId}
      canEdit={canEdit}
      onRegister={handleStartNew}
      specialtyLabel="Pediatria"
    />
  );
}

export default AnamnesePediatriaWrapper;
