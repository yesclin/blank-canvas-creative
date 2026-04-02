import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

export interface PaymentMethod {
  id: string;
  clinic_id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  accepts_change: boolean;
  allows_installments: boolean;
  max_installments: number;
  requires_authorization_code: boolean;
  requires_due_date: boolean;
  auto_settle: boolean;
  fee_type: string | null;
  fee_value: number | null;
  display_order: number;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  name: string;
  code: string;
  category: string;
  description?: string;
  accepts_change: boolean;
  allows_installments: boolean;
  max_installments: number;
  requires_authorization_code: boolean;
  requires_due_date: boolean;
  auto_settle: boolean;
  fee_type?: string;
  fee_value?: number;
  display_order: number;
  color?: string;
  icon?: string;
  is_default: boolean;
}

export const PAYMENT_CATEGORIES = [
  { value: "cash", label: "Dinheiro" },
  { value: "instant", label: "Instantâneo" },
  { value: "card", label: "Cartão" },
  { value: "bank", label: "Bancário" },
  { value: "insurance", label: "Convênio" },
  { value: "courtesy", label: "Cortesia" },
  { value: "internal_credit", label: "Crédito Interno" },
  { value: "other", label: "Outro" },
];

export const FEE_TYPES = [
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Fixo (R$)" },
];

/** All active payment methods for the current clinic, ordered by display_order */
export function usePaymentMethods(includeInactive = false) {
  return useQuery({
    queryKey: ["payment-methods", includeInactive],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const clinicId = await getClinicId();
      let query = supabase
        .from("payment_methods")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("display_order", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: PaymentMethodFormData) => {
      const clinicId = await getClinicId();
      const { error } = await supabase.from("payment_methods").insert({
        clinic_id: clinicId,
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        category: form.category,
        description: form.description?.trim() || null,
        accepts_change: form.accepts_change,
        allows_installments: form.allows_installments,
        max_installments: form.max_installments,
        requires_authorization_code: form.requires_authorization_code,
        requires_due_date: form.requires_due_date,
        auto_settle: form.auto_settle,
        fee_type: form.fee_type || null,
        fee_value: form.fee_value ?? 0,
        display_order: form.display_order,
        color: form.color || null,
        icon: form.icon || null,
        is_default: form.is_default,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Forma de recebimento criada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: PaymentMethodFormData & { id: string }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({
          name: form.name.trim(),
          code: form.code.trim().toLowerCase(),
          category: form.category,
          description: form.description?.trim() || null,
          accepts_change: form.accepts_change,
          allows_installments: form.allows_installments,
          max_installments: form.max_installments,
          requires_authorization_code: form.requires_authorization_code,
          requires_due_date: form.requires_due_date,
          auto_settle: form.auto_settle,
          fee_type: form.fee_type || null,
          fee_value: form.fee_value ?? 0,
          display_order: form.display_order,
          color: form.color || null,
          icon: form.icon || null,
          is_default: form.is_default,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Forma de recebimento atualizada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useTogglePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Forma de recebimento removida");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
