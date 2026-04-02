import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export interface CrmGoal {
  id: string;
  clinic_id: string;
  goal_type: string;
  title: string;
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  professional_id: string | null;
  specialty_id: string | null;
  user_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  professional?: { id: string; name: string } | null;
}

export interface GoalFormData {
  goal_type: string;
  title: string;
  target_value: number;
  period_start: string;
  period_end: string;
  professional_id?: string;
  specialty_id?: string;
  user_id?: string;
}

export const GOAL_TYPES = [
  { value: "leads", label: "Quantidade de Leads" },
  { value: "revenue", label: "Valor Fechado (R$)" },
  { value: "conversion", label: "Taxa de Conversão (%)" },
  { value: "packages", label: "Pacotes Vendidos" },
] as const;

export function useCommercialGoals() {
  return useQuery({
    queryKey: ["crm-goals"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("crm_goals")
        .select(`
          *,
          professional:professionals!crm_goals_professional_id_fkey(id, name)
        `)
        .eq("clinic_id", clinicId)
        .order("period_end", { ascending: false });
      if (error) throw error;
      return (data || []) as CrmGoal[];
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: GoalFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("crm_goals").insert({
        clinic_id: clinicId,
        goal_type: form.goal_type,
        title: form.title,
        target_value: form.target_value,
        current_value: 0,
        period_start: form.period_start,
        period_end: form.period_end,
        professional_id: form.professional_id || null,
        specialty_id: form.specialty_id || null,
        user_id: form.user_id || null,
        status: "active",
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-goals"] });
      toast.success("Meta criada com sucesso");
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current_value }: { id: string; current_value: number }) => {
      const { error } = await supabase
        .from("crm_goals")
        .update({ current_value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-goals"] });
      toast.success("Progresso atualizado");
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-goals"] });
      toast.success("Meta removida");
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });
}
