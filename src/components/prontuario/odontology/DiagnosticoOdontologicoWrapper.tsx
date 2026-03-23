import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { DiagnosticoOdontologicoBlock, DiagnosticoOdontologicoData } from "./DiagnosticoOdontologicoBlock";
import { toast } from "sonner";

interface DiagnosticoOdontologicoWrapperProps {
  patientId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
  professionalId?: string | null;
  professionalName?: string | null;
}

/**
 * Self-contained wrapper that fetches diagnostic data from clinical_evolutions
 * (evolution_type = 'diagnostico_odonto') and passes it to DiagnosticoOdontologicoBlock.
 */
export function DiagnosticoOdontologicoWrapper({
  patientId,
  appointmentId,
  canEdit = false,
  professionalId,
  professionalName,
}: DiagnosticoOdontologicoWrapperProps) {
  const { clinic } = useClinicData();
  const [currentDiagnostico, setCurrentDiagnostico] = useState<DiagnosticoOdontologicoData | null>(null);
  const [diagnosticoHistory, setDiagnosticoHistory] = useState<DiagnosticoOdontologicoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mapRowToData = (row: any): DiagnosticoOdontologicoData => {
    const content = (row.content || {}) as Record<string, any>;
    return {
      id: row.id,
      patient_id: row.patient_id,
      version: content.version || 1,
      diagnostico_principal: content.diagnostico_principal || "",
      diagnostico_principal_cid: content.diagnostico_principal_cid || "",
      dentes_envolvidos_principal: content.dentes_envolvidos_principal || "",
      diagnosticos_associados: content.diagnosticos_associados || [],
      justificativa_clinica: content.justificativa_clinica || "",
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
        .eq("evolution_type", "diagnostico_odonto")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(mapRowToData);
      const current = mapped.find((d) => d.is_current) || mapped[0] || null;
      setCurrentDiagnostico(current);
      setDiagnosticoHistory(mapped.filter((d) => d !== current));
    } catch (err) {
      console.error("Error fetching odontology diagnostics:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (
    data: Omit<DiagnosticoOdontologicoData, "id" | "patient_id" | "version" | "created_at" | "created_by" | "created_by_name" | "is_current">
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
        evolution_type: "diagnostico_odonto",
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
      toast.success("Diagnóstico odontológico salvo com sucesso.");
      await fetchData();
    } catch (err) {
      console.error("Error saving odontology diagnostic:", err);
      toast.error("Erro ao salvar diagnóstico odontológico.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DiagnosticoOdontologicoBlock
      currentDiagnostico={currentDiagnostico}
      diagnosticoHistory={diagnosticoHistory}
      loading={loading}
      saving={saving}
      canEdit={canEdit}
      onSave={handleSave}
    />
  );
}

export default DiagnosticoOdontologicoWrapper;
