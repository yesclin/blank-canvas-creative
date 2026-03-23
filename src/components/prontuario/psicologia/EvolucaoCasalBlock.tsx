/**
 * EvolucaoCasalBlock
 * 
 * Block for couple therapy session evolutions.
 * Uses the dynamic template system (anamnesis_records) with partner linking.
 * Auto-numbers sessions per couple pair.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Users, Hash, Calendar, Eye, FileText, ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { useDynamicAnamnesisRecords, type DynamicAnamnesisRecord } from "@/hooks/prontuario/psicologia/useDynamicAnamnesisRecords";
import { DynamicAnamnesisFormRenderer } from "./DynamicAnamnesisFormRenderer";
import { PartnerPatientSelector } from "./PartnerPatientSelector";
import type { Json } from "@/integrations/supabase/types";

interface EvolucaoCasalBlockProps {
  patientId: string | null;
  patientName?: string;
  canEdit?: boolean;
}

const EVOLUCAO_CASAL_TEMPLATE_TYPE = "evolucao";
const EVOLUCAO_CASAL_NAME = "Evolução – Terapia de Casal";

export function EvolucaoCasalBlock({
  patientId,
  patientName,
  canEdit = false,
}: EvolucaoCasalBlockProps) {
  const { clinic } = useClinicData();
  const dynamicRecords = useDynamicAnamnesisRecords(patientId);

  const [template, setTemplate] = useState<{
    id: string;
    name: string;
    versionId: string;
    structure: Json;
  } | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; full_name: string } | null>(null);

  // History dialog
  const [showHistory, setShowHistory] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<DynamicAnamnesisRecord | null>(null);

  // Load the couple evolution template
  useEffect(() => {
    async function loadTemplate() {
      if (!clinic?.id) return;
      setLoadingTemplate(true);
      try {
        // Find the evolucao casal template for this clinic's specialty
        const { data: templates } = await supabase
          .from("anamnesis_templates")
          .select("id, name, current_version_id, specialty_id")
          .eq("template_type", EVOLUCAO_CASAL_TEMPLATE_TYPE)
          .eq("is_active", true)
          .ilike("name", `%${EVOLUCAO_CASAL_NAME}%`)
          .limit(2);

        if (!templates || templates.length === 0) {
          setTemplate(null);
          return;
        }

        const tmpl = templates[0];
        if (!tmpl.current_version_id) return;

        const { data: version } = await supabase
          .from("anamnesis_template_versions")
          .select("id, structure")
          .eq("id", tmpl.current_version_id)
          .single();

        if (version) {
          setTemplate({
            id: tmpl.id,
            name: tmpl.name,
            versionId: version.id,
            structure: version.structure,
          });
        }
      } catch (err) {
        console.error("Error loading couple evolution template:", err);
      } finally {
        setLoadingTemplate(false);
      }
    }
    loadTemplate();
  }, [clinic?.id]);

  // Fetch records on mount
  useEffect(() => {
    dynamicRecords.fetchRecords();
  }, [dynamicRecords.fetchRecords]);

  // Filter couple evolution records
  const coupleRecords = useMemo(() => {
    if (!template) return [];
    return dynamicRecords.records.filter(
      (r) => r.template_id === template.id && r.linked_patients && r.linked_patients.length > 1
    );
  }, [dynamicRecords.records, template]);

  // Next session number
  const nextSessionNumber = coupleRecords.length + 1;

  const handleStartNew = () => {
    setResponses({});
    setSelectedPartner(null);
    setIsEditing(true);
    setViewingRecord(null);
  };

  const handleSave = async () => {
    if (!template || !patientId || !selectedPartner) return;

    // Add auto-fields to responses
    const finalResponses = {
      ...responses,
      _numero_sessao: nextSessionNumber,
      _data_sessao: new Date().toISOString(),
    };

    await dynamicRecords.saveRecord({
      templateId: template.id,
      templateVersionId: template.versionId,
      responses: finalResponses,
      structureSnapshot: template.structure,
      partnerPatientId: selectedPartner.id,
    });

    setIsEditing(false);
    setResponses({});
    setSelectedPartner(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setResponses({});
    setSelectedPartner(null);
  };

  const handleViewRecord = (record: DynamicAnamnesisRecord) => {
    setViewingRecord(record);
    setShowHistory(false);
  };

  if (loadingTemplate) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!template) return null; // Template not available

  // Viewing a specific record
  if (viewingRecord) {
    const recordStructure = (viewingRecord.structure_snapshot || template.structure) as Json;
    const sessionNum = (viewingRecord.responses as any)?._numero_sessao;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setViewingRecord(null)}>
              ← Voltar
            </Button>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Sessão de Casal {sessionNum ? `#${sessionNum}` : ""}
            </h3>
          </div>
          {viewingRecord.linked_patients && viewingRecord.linked_patients.length > 1 && (
            <div className="flex items-center gap-2">
              {viewingRecord.linked_patients.map((lp) => (
                <Badge key={lp.patient_id} variant="outline" className="text-xs">
                  {lp.full_name || "Paciente"} ({lp.role === "titular" ? "Titular" : "Parceiro(a)"})
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DynamicAnamnesisFormRenderer
          structure={recordStructure}
          templateName={template.name}
          responses={viewingRecord.responses as Record<string, any>}
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

  // Editing mode (new session)
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Nova Sessão de Casal #{nextSessionNumber}</h3>
        </div>

        {/* Partner selector */}
        {patientId && (
          <PartnerPatientSelector
            currentPatientId={patientId}
            currentPatientName={patientName}
            selectedPartner={selectedPartner}
            onSelectPartner={(p) =>
              setSelectedPartner(p ? { id: p.id, full_name: p.full_name } : null)
            }
          />
        )}

        {!selectedPartner && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Selecione o(a) parceiro(a) acima para iniciar o preenchimento da sessão.
            </CardContent>
          </Card>
        )}

        {selectedPartner && (
          <DynamicAnamnesisFormRenderer
            structure={template.structure}
            templateName={template.name}
            responses={responses}
            isEditing={true}
            saving={dynamicRecords.saving}
            canEdit={true}
            onResponseChange={(fieldId, value) =>
              setResponses((prev) => ({ ...prev, [fieldId]: value }))
            }
            onSave={handleSave}
            onCancel={handleCancel}
            onStartEdit={() => {}}
          />
        )}
      </div>
    );
  }

  // Default view: list of couple sessions
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Evoluções de Casal
        </h3>
        <div className="flex gap-2">
          {coupleRecords.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <FileText className="h-4 w-4 mr-1" /> Histórico ({coupleRecords.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartNew}>
              <Plus className="h-4 w-4 mr-1" /> Nova Sessão
            </Button>
          )}
        </div>
      </div>

      {dynamicRecords.loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : coupleRecords.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground opacity-40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma evolução de casal registrada.
            </p>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={handleStartNew}>
                <Plus className="h-4 w-4 mr-1" /> Registrar primeira sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {coupleRecords.slice(0, 5).map((record) => {
            const sessionNum = (record.responses as any)?._numero_sessao;
            const partners = record.linked_patients || [];

            return (
              <Card
                key={record.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleViewRecord(record)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {sessionNum || "–"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Sessão de Casal {sessionNum ? `#${sessionNum}` : ""}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {EVOLUCAO_CASAL_NAME}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(record.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {partners.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {partners.map((p) => p.full_name || "Paciente").join(" e ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Histórico – Evoluções de Casal
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {coupleRecords.map((record) => {
                const sessionNum = (record.responses as any)?._numero_sessao;
                const partners = record.linked_patients || [];

                return (
                  <Card
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleViewRecord(record)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">
                            Sessão #{sessionNum || "–"}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                          {partners.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Users className="h-3 w-3" />
                              {partners.map((p) => p.full_name).join(" e ")}
                            </div>
                          )}
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
