import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const DEFAULT_STAGES = [
  { name: "Novo Lead", sort_order: 1, color: "#3B82F6" },
  { name: "Em Contato", sort_order: 2, color: "#06B6D4" },
  { name: "Qualificado", sort_order: 3, color: "#10B981" },
  { name: "Pré-atendimento Enviado", sort_order: 4, color: "#F97316" },
  { name: "Orçamento Enviado", sort_order: 5, color: "#8B5CF6" },
  { name: "Em Negociação", sort_order: 6, color: "#F59E0B" },
  { name: "Fechado", sort_order: 7, color: "#22C55E" },
  { name: "Perdido", sort_order: 8, color: "#EF4444" },
];

async function ensureDefaultStages(clinicId: string) {
  // Check if clinic already has stages
  const { data: existing, error: checkError } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("clinic_id", clinicId)
    .limit(1);

  if (checkError) {
    console.warn("[Pipeline] Erro ao verificar etapas existentes:", checkError.message);
    return; // Don't block loading
  }

  if (existing && existing.length > 0) return; // Already has stages

  console.info("[Pipeline] Criando etapas padrão para clinic_id:", clinicId);
  const rows = DEFAULT_STAGES.map(s => ({
    clinic_id: clinicId,
    name: s.name,
    sort_order: s.sort_order,
    color: s.color,
    is_active: true,
  }));

  const { error: insertError } = await supabase
    .from("crm_pipeline_stages")
    .insert(rows);

  if (insertError) {
    console.error("[Pipeline] Erro ao criar etapas padrão:", insertError.message);
  }
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
      console.info("[Pipeline] clinic_id:", clinicId);

      // Ensure default stages exist (idempotent)
      await ensureDefaultStages(clinicId);

      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("[Pipeline] Erro ao carregar etapas:", error.message);
        throw error;
      }

      console.info("[Pipeline] Etapas carregadas:", data?.length ?? 0);
      return (data || []) as PipelineStage[];
    },
    retry: 1,
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
