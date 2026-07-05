import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CommissionRuleKind =
  | "percentual"
  | "fixo"
  | "por_procedimento"
  | "por_especialidade"
  | "por_pacote"
  | "por_convenio"
  | "por_particular";

export interface CommissionRule {
  id: string;
  clinic_id: string;
  professional_id: string | null;
  procedure_id: string | null;
  specialty_id: string | null;
  insurance_id: string | null;
  kind: CommissionRuleKind;
  percentual: number | null;
  valor_fixo: number | null;
  pay_trigger: "on_finish" | "on_payment";
  priority: number | null;
  is_active: boolean;
  applies_to_particular: boolean;
  applies_to_convenio: boolean;
  notes: string | null;
  professional?: { id: string; full_name: string } | null;
  procedure?: { id: string; name: string } | null;
  insurance?: { id: string; name: string } | null;
}

export function useCommissionRules() {
  return useQuery({
    queryKey: ["finance", "commission-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commission_rules")
        .select(`
          id, clinic_id, professional_id, procedure_id, specialty_id, insurance_id,
          kind, percentual, valor_fixo, pay_trigger, priority, is_active,
          applies_to_particular, applies_to_convenio, notes,
          professional:professionals(id, full_name),
          procedure:procedures(id, name),
          insurance:insurances(id, name)
        `)
        .order("priority", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as CommissionRule[];
    },
  });
}

export function useCommissionRuleActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["finance", "commission-rules"] });

  const upsert = useMutation({
    mutationFn: async (rule: Partial<CommissionRule> & { clinic_id: string; kind: CommissionRuleKind }) => {
      const payload: any = { ...rule };
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await (supabase as any).from("commission_rules").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("commission_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Regra salva"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar regra"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("commission_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Regra removida"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("commission_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { upsert, remove, toggleActive };
}
