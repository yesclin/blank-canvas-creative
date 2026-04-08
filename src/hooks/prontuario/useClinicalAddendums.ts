import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";

export interface ClinicalAddendum {
  id: string;
  clinic_id: string;
  patient_id: string;
  record_type: string;
  record_id: string;
  specialty_id: string | null;
  professional_id: string;
  content: string;
  reason: string | null;
  module_origin: string | null;
  created_at: string;
  // Joined
  professional_name?: string;
}

export interface AddendumInput {
  patient_id: string;
  record_type: string;
  record_id: string;
  specialty_id?: string | null;
  professional_id: string;
  content: string;
  reason?: string;
  module_origin?: string;
}

/**
 * Hook to manage clinical addendums (adendos) for a specific record.
 */
export function useClinicalAddendums(recordType: string, recordId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ["clinical-addendums", recordType, recordId];

  const { data: addendums = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!recordId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from("clinical_addendums")
        .select("*, professionals(full_name)")
        .eq("record_type", recordType)
        .eq("record_id", recordId)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching addendums:", error);
        return [];
      }

      return (data || []).map((a: any) => ({
        ...a,
        professional_name: a.professionals?.full_name || "Profissional",
      }));
    },
    enabled: !!recordId && !!clinic?.id,
  });

  const createAddendum = useMutation({
    mutationFn: async (input: AddendumInput) => {
      if (!clinic?.id) throw new Error("Clínica não identificada");

      const { data, error } = await supabase
        .from("clinical_addendums")
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          record_type: input.record_type,
          record_id: input.record_id,
          specialty_id: input.specialty_id || null,
          professional_id: input.professional_id,
          content: input.content,
          reason: input.reason || null,
          module_origin: input.module_origin || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await logAudit({
        clinicId: clinic.id,
        action: "addendum_created",
        entityType: "clinical_addendums",
        entityId: data.id,
        metadata: {
          record_type: input.record_type,
          record_id: input.record_id,
          patient_id: input.patient_id,
          professional_id: input.professional_id,
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Adendo adicionado com sucesso");
    },
    onError: (err: any) => {
      console.error("Error creating addendum:", err);
      toast.error("Erro ao criar adendo");
    },
  });

  return {
    addendums: addendums as ClinicalAddendum[],
    isLoading,
    createAddendum: createAddendum.mutateAsync,
    isCreating: createAddendum.isPending,
  };
}
