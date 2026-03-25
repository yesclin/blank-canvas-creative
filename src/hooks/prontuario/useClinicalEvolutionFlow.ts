/**
 * useClinicalEvolutionFlow
 * 
 * End-to-end flow for clinical evolutions:
 * - Create draft evolution
 * - Sign evolution (sets status = 'assinado', becomes immutable via DB trigger)
 * - List evolutions for a patient
 * - Check if evolution is signed/editable
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";

export interface ClinicalEvolution {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  appointment_id: string | null;
  specialty_id: string | null;
  content: Record<string, unknown>;
  notes: string | null;
  status: "rascunho" | "assinado" | "cancelado";
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateEvolutionInput {
  patientId: string;
  specialtyId?: string;
  appointmentId?: string;
  content: Record<string, unknown>;
  notes?: string;
  signImmediately?: boolean;
}

interface UpdateEvolutionInput {
  id: string;
  content?: Record<string, unknown>;
  notes?: string;
}

export function useClinicalEvolutionFlow(patientId: string | null) {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const queryClient = useQueryClient();

  // Fetch evolutions for a patient
  const { data: evolutions = [], isLoading } = useQuery({
    queryKey: ["clinical-evolutions", clinic?.id, patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_evolutions")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClinicalEvolution[];
    },
    enabled: !!clinic?.id && !!patientId,
  });

  // Create evolution
  const createEvolution = useMutation({
    mutationFn: async (input: CreateEvolutionInput) => {
      if (!clinic?.id || !professionalId) throw new Error("Dados de sessão incompletos");

      const status = input.signImmediately ? "assinado" : "rascunho";
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("clinical_evolutions")
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patientId,
          professional_id: professionalId,
          specialty_id: input.specialtyId || null,
          appointment_id: input.appointmentId || null,
          content: input.content,
          notes: input.notes || null,
          status,
          signed_at: input.signImmediately ? now : null,
          signed_by: input.signImmediately ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // If signed immediately, create signature record
      if (input.signImmediately && data) {
        const user = (await supabase.auth.getUser()).data.user;
        await supabase.from("medical_record_signatures").insert({
          clinic_id: clinic.id,
          record_type: "clinical_evolution",
          record_id: data.id,
          signed_by: user?.id,
          signature_hash: await hashContent(input.content),
          ip_address: null,
          user_agent: navigator.userAgent,
        });

        await logAudit({
          clinicId: clinic.id,
          action: "evolution_signed",
          entityType: "clinical_evolution",
          entityId: data.id,
          metadata: { patient_id: input.patientId },
        });
      }

      return data;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", clinic?.id, input.patientId] });
      toast.success(_.id ? "Evolução registrada com sucesso" : "Evolução salva");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao registrar evolução");
    },
  });

  // Update draft evolution
  const updateEvolution = useMutation({
    mutationFn: async (input: UpdateEvolutionInput) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");

      const updateData: Record<string, unknown> = {};
      if (input.content !== undefined) updateData.content = input.content;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { error } = await supabase
        .from("clinical_evolutions")
        .update(updateData)
        .eq("id", input.id)
        .eq("status", "rascunho"); // RLS + status check: only drafts

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", clinic?.id, patientId] });
      toast.success("Evolução atualizada");
    },
    onError: (err: Error) => {
      if (err.message?.includes("imutáveis")) {
        toast.error("Esta evolução já foi assinada e não pode ser editada");
      } else {
        toast.error(err.message || "Erro ao atualizar evolução");
      }
    },
  });

  // Sign an existing draft evolution
  const signEvolution = useMutation({
    mutationFn: async (evolutionId: string) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      // Update status to 'assinado' — DB trigger sets signed_at/signed_by
      const { error } = await supabase
        .from("clinical_evolutions")
        .update({ status: "assinado" as any, signed_by: user.id })
        .eq("id", evolutionId)
        .eq("status", "rascunho");

      if (error) throw error;

      // Get the evolution content for hash
      const evolution = evolutions.find(e => e.id === evolutionId);

      // Create signature record
      await supabase.from("medical_record_signatures").insert({
        clinic_id: clinic.id,
        record_type: "clinical_evolution",
        record_id: evolutionId,
        signed_by: user.id,
        signature_hash: evolution ? await hashContent(evolution.content) : null,
        user_agent: navigator.userAgent,
      });

      // Audit log
      await logAudit({
        clinicId: clinic.id,
        action: "evolution_signed",
        entityType: "clinical_evolution",
        entityId: evolutionId,
        metadata: { patient_id: patientId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", clinic?.id, patientId] });
      toast.success("Evolução assinada digitalmente. Registro agora é imutável.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao assinar evolução");
    },
  });

  return {
    evolutions,
    isLoading,
    drafts: evolutions.filter(e => e.status === "rascunho"),
    signed: evolutions.filter(e => e.status === "assinado"),
    createEvolution,
    updateEvolution,
    signEvolution,
    isEditable: (evolution: ClinicalEvolution) => evolution.status === "rascunho",
  };
}

async function hashContent(content: Record<string, unknown>): Promise<string> {
  try {
    const json = JSON.stringify(content);
    const data = new TextEncoder().encode(json);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "hash-error";
  }
}
