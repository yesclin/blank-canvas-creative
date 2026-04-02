import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

export interface PipelineStage {
  id: string;
  clinic_id: string;
  name: string;
  sort_order: number;
  color: string | null;
  is_active: boolean;
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ["crm-pipeline-stages"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
  });
}

export interface LossReason {
  id: string;
  name: string;
}

export function useLossReasons() {
  return useQuery({
    queryKey: ["crm-loss-reasons"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("crm_loss_reasons")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as LossReason[];
    },
  });
}
