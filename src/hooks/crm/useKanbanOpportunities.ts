import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CrmOpportunity } from "@/types/crm";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data, error } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar clínica: ${error.message}`);
  if (!data?.clinic_id) throw new Error("Clínica não encontrada para o usuário");
  return data.clinic_id;
}

export function useKanbanOpportunities() {
  return useQuery({
    queryKey: ["crm-kanban-opportunities"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("crm_opportunities")
        .select(`
          *,
          lead:crm_leads!crm_opportunities_lead_id_fkey(id, name, phone),
          specialty:specialties!crm_opportunities_specialty_id_fkey(id, name),
          procedure:procedures!crm_opportunities_procedure_id_fkey(id, name),
          professional:professionals!crm_opportunities_professional_id_fkey(id, name)
        `)
        .eq("clinic_id", clinicId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[Kanban] Erro ao carregar oportunidades:", error.message);
        throw error;
      }

      console.info("[Kanban] Oportunidades carregadas:", data?.length ?? 0);
      return (data || []) as (CrmOpportunity & { lead?: { id: string; name: string; phone?: string } | null })[];
    },
    retry: 1,
  });
}

export function useMoveOpportunityStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opportunityId,
      fromStageId,
      toStageId,
      toStageName,
    }: {
      opportunityId: string;
      fromStageId: string | null;
      toStageId: string;
      toStageName: string;
      notes?: string;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      let fromStageName: string | null = null;
      if (fromStageId) {
        const { data: fromStage } = await supabase
          .from("crm_pipeline_stages")
          .select("name")
          .eq("id", fromStageId)
          .maybeSingle();
        fromStageName = fromStage?.name || null;
      }

      const { error } = await supabase
        .from("crm_opportunities")
        .update({ pipeline_stage_id: toStageId, updated_at: new Date().toISOString() })
        .eq("id", opportunityId);
      if (error) throw error;

      await supabase.from("crm_opportunity_history").insert({
        clinic_id: clinicId,
        opportunity_id: opportunityId,
        field_changed: "pipeline_stage",
        old_value: fromStageName,
        new_value: toStageName,
        changed_by: user?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-kanban-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity-history"] });
      toast.success("Etapa atualizada");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mover oportunidade: ${error.message}`);
    },
  });
}

export function useWinOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, stageId }: { opportunityId: string; stageId: string }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("crm_opportunities")
        .update({
          status: "ganha",
          is_won: true,
          is_lost: false,
          pipeline_stage_id: stageId,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId);
      if (error) throw error;

      await supabase.from("crm_opportunity_history").insert({
        clinic_id: clinicId,
        opportunity_id: opportunityId,
        field_changed: "status",
        old_value: "aberta",
        new_value: "ganha",
        changed_by: user?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-kanban-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity-history"] });
      toast.success("Oportunidade marcada como ganha! 🎉");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useLoseOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opportunityId,
      stageId,
      lossReasonId,
      lossReasonText,
    }: {
      opportunityId: string;
      stageId: string;
      lossReasonId: string;
      lossReasonText: string;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("crm_opportunities")
        .update({
          status: "perdida",
          is_won: false,
          is_lost: true,
          pipeline_stage_id: stageId,
          loss_reason_id: lossReasonId,
          loss_reason: lossReasonText,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId);
      if (error) throw error;

      await supabase.from("crm_opportunity_history").insert({
        clinic_id: clinicId,
        opportunity_id: opportunityId,
        field_changed: "status",
        old_value: "aberta",
        new_value: `perdida (${lossReasonText})`,
        changed_by: user?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-kanban-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity-history"] });
      toast.success("Oportunidade marcada como perdida");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
