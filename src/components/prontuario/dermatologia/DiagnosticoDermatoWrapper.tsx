import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { DiagnosticoDermatoBlock, DiagnosticoDermatoData } from "./DiagnosticoDermatoBlock";
import { toast } from "sonner";

interface DiagnosticoDermatoWrapperProps {
  patientId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
  professionalId?: string | null;
  professionalName?: string | null;
}

/**
 * Self-contained wrapper that fetches diagnostic data from clinical_evolutions
 * (evolution_type = 'diagnostico_dermato') and passes it to DiagnosticoDermatoBlock.
 */
export function DiagnosticoDermatoWrapper({
  patientId,
  appointmentId,
  canEdit = false,
  professionalId,
  professionalName,
}: DiagnosticoDermatoWrapperProps) {
  const { clinic } = useClinicData();
  const [currentDiagnostico, setCurrentDiagnostico] = useState<DiagnosticoDermatoData | null>(null);
  const [diagnosticoHistory, setDiagnosticoHistory] = useState<DiagnosticoDermatoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mapRowToData = (row: any): DiagnosticoDermatoData => {
    const content = (row.content || {}) as Record<string, any>;
    return {
      id: row.id,
      patient_id: row.patient_id,
      version: content.version || 1,
      diagnostico_principal: content.diagnostico_principal || "",
      diagnosticos_diferenciais: content.diagnosticos_diferenciais || [],
      cid10_code: content.cid10_code || "",
      cid10_description: content.cid10_description || "",
      observacoes_clinicas: content.observacoes_clinicas || "",
      data_diagnostico: content.data_diagnostico || row.created_at,
      created_at: row.created_at,
      created_by: row.professional_id,
      created_by_name: content.created_by_name || "",
      is_current: content.is_current !== false,
    };
  };

  const fetchData = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clinical_evolutions")
        .select("*")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinic.id)
        .eq("evolution_type", "diagnostico_dermato")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(mapRowToData);
      const current = mapped.find((d) => d.is_current) || mapped[0] || null;
      setCurrentDiagnostico(current);
      setDiagnosticoHistory(mapped.filter((d) => d !== current));
    } catch (err) {
      console.error("Error fetching dermatology diagnostics:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (
    data: Omit<DiagnosticoDermatoData, "id" | "patient_id" | "version" | "created_at" | "created_by" | "created_by_name" | "is_current">
  ) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error("Dados insuficientes para salvar o diagnóstico.");
      return;
    }
    setSaving(true);
    try {
      // Mark old records as not current
      if (currentDiagnostico) {
        const oldContent = { ...(currentDiagnostico as any) };
        await supabase
          .from("clinical_evolutions")
          .update({
            content: { ...oldContent, is_current: false } as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentDiagnostico.id);
      }

      const nextVersion = (currentDiagnostico?.version || 0) + 1;

      const { error } = await supabase.from("clinical_evolutions").insert({
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        evolution_type: "diagnostico_dermato",
        appointment_id: appointmentId || null,
        status: "signed",
        content: {
          ...data,
          version: nextVersion,
          is_current: true,
          created_by_name: professionalName || "",
        } as any,
      });

      if (error) throw error;
      toast.success("Diagnóstico dermatológico salvo com sucesso.");
      await fetchData();
    } catch (err) {
      console.error("Error saving dermatology diagnostic:", err);
      toast.error("Erro ao salvar diagnóstico dermatológico.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DiagnosticoDermatoBlock
      currentDiagnostico={currentDiagnostico}
      diagnosticoHistory={diagnosticoHistory}
      loading={loading}
      saving={saving}
      canEdit={canEdit}
      onSave={handleSave}
    />
  );
}

export default DiagnosticoDermatoWrapper;
