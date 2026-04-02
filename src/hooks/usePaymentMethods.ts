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
    .limit(1)
    .maybeSingle();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

export const METHOD_TYPES = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "transferencia_bancaria", label: "Transferência Bancária" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "carteira_digital", label: "Carteira Digital" },
  { value: "link_pagamento", label: "Link de Pagamento" },
  { value: "cheque", label: "Cheque" },
  { value: "convenio", label: "Convênio" },
  { value: "outro", label: "Outro" },
] as const;

export const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

export const ACCOUNT_TYPES = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Conta Poupança" },
];

export const CARD_BRANDS = [
  "Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Diners",
];

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

export interface PaymentMethod {
  id: string;
  clinic_id: string;
  name: string;
  code: string;
  category: string;
  method_type: string;
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
  // New detailed fields
  bank_name: string | null;
  bank_code: string | null;
  agency: string | null;
  account_number: string | null;
  account_digit: string | null;
  account_type: string | null;
  account_holder_name: string | null;
  account_holder_document: string | null;
  pix_key_type: string | null;
  pix_key: string | null;
  wallet_provider: string | null;
  acquirer_name: string | null;
  card_brands: string[] | null;
  fee_percent: number | null;
  fixed_fee: number | null;
  settlement_days: number | null;
  default_entry_account: string | null;
  insurance_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  name: string;
  code: string;
  category: string;
  method_type: string;
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
  // New fields
  bank_name?: string;
  bank_code?: string;
  agency?: string;
  account_number?: string;
  account_digit?: string;
  account_type?: string;
  account_holder_name?: string;
  account_holder_document?: string;
  pix_key_type?: string;
  pix_key?: string;
  wallet_provider?: string;
  acquirer_name?: string;
  card_brands?: string[];
  fee_percent?: number;
  fixed_fee?: number;
  settlement_days?: number;
  default_entry_account?: string;
  insurance_id?: string;
  notes?: string;
}

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

function buildInsertPayload(form: PaymentMethodFormData, clinicId: string) {
  return {
    clinic_id: clinicId,
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    category: form.category,
    method_type: form.method_type,
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
    bank_name: form.bank_name || null,
    bank_code: form.bank_code || null,
    agency: form.agency || null,
    account_number: form.account_number || null,
    account_digit: form.account_digit || null,
    account_type: form.account_type || null,
    account_holder_name: form.account_holder_name || null,
    account_holder_document: form.account_holder_document || null,
    pix_key_type: form.pix_key_type || null,
    pix_key: form.pix_key || null,
    wallet_provider: form.wallet_provider || null,
    acquirer_name: form.acquirer_name || null,
    card_brands: form.card_brands?.length ? form.card_brands : null,
    fee_percent: form.fee_percent ?? 0,
    fixed_fee: form.fixed_fee ?? 0,
    settlement_days: form.settlement_days ?? 0,
    default_entry_account: form.default_entry_account || null,
    insurance_id: form.insurance_id || null,
    notes: form.notes || null,
  };
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: PaymentMethodFormData) => {
      const clinicId = await getClinicId();
      const { error } = await supabase.from("payment_methods").insert(buildInsertPayload(form, clinicId));
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
      const payload = buildInsertPayload(form, "");
      delete (payload as any).clinic_id;
      const { error } = await supabase
        .from("payment_methods")
        .update(payload)
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
