import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data: profile } = await supabase
    .from("profiles").select("clinic_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

export interface ProcedureConsumptionKit {
  id: string;
  clinic_id: string;
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
  created_at: string;
  inventory_kits?: {
    id: string;
    name: string;
    kit_type: string;
  };
}

export interface ProcedureConsumptionKitFormData {
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
}

export function useProcedureConsumptionKits(procedureId?: string) {
  return useQuery({
    queryKey: ["procedure-consumption-kits", procedureId],
    queryFn: async () => {
      let query = supabase
        .from("procedure_consumption_kits")
        .select(`*, inventory_kits(id, name, kit_type)`)
        .order("created_at");

      if (procedureId) query = query.eq("procedure_id", procedureId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProcedureConsumptionKit[];
    },
  });
}

export function useCreateProcedureConsumptionKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProcedureConsumptionKitFormData) => {
      const clinicId = await getClinicId();
      const { data: result, error } = await supabase
        .from("procedure_consumption_kits")
        .insert({ clinic_id: clinicId, ...data })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedure-consumption-kits"] });
      toast.success("Kit vinculado ao procedimento!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteProcedureConsumptionKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("procedure_consumption_kits")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedure-consumption-kits"] });
      toast.success("Kit desvinculado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
