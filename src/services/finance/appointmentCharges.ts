import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço central de cobranças + comissão vinculadas a agendamento.
 *
 * Fase 4 (financeiro avançado do procedimento):
 *  - Respeita charge_mode ("automatic" | "manual"): manual nunca cria cobrança automaticamente.
 *  - Respeita charge_on_schedule / charge_on_finish (fase 2/3).
 *  - is_free  => nunca gera cobrança.
 *  - Convênio => usa insurance_price (se houver); Particular => particular_price ?? price.
 *  - Cortesia/isento => não cobra.
 *  - allow_installments / max_installments => propagados nos metadados.
 *  - default_finance_category_id / default_payment_method_id / cost_center => aplicados na transação.
 *  - Dedup por appointment_id: nunca duplica cobrança viva (pendente/vencido/pago/parcial).
 *  - Comissão: gerada conforme commission_type + commission_value + commission_trigger
 *    ("on_finish" ou "on_payment"), com dedup por (appointment_id, professional_id).
 */

type ProcedureFinanceFlags = {
  name?: string | null;
  price?: number | null;
  particular_price?: number | null;
  insurance_price?: number | null;
  is_free?: boolean | null;
  allow_discount?: boolean | null;
  min_price?: number | null;
  allow_installments?: boolean | null;
  max_installments?: number | null;
  charge_mode?: "automatic" | "manual" | null;
  charge_on_schedule?: boolean | null;
  charge_on_finish?: boolean | null;
  default_finance_category_id?: string | null;
  default_payment_method_id?: string | null;
  cost_center?: string | null;
  commission_type?: "none" | "percent" | "fixed" | null;
  commission_value?: number | null;
  commission_trigger?: "on_finish" | "on_payment" | null;
};

type Appointment = {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  procedure_id: string | null;
  appointment_type?: string | null;
  payment_type?: string | null;
  scheduled_date?: string | null;
  status?: string | null;
  amount_expected?: number | null;
  expected_value?: number | null;
  patients?: { full_name?: string | null } | null;
  procedures?: ProcedureFinanceFlags | null;
};

export type ChargePhase = "schedule" | "finish";

const APPT_SELECT = `
  id, clinic_id, patient_id, professional_id, procedure_id,
  appointment_type, payment_type, scheduled_date, status, amount_expected, expected_value,
  patients(full_name),
  procedures(
    name, price, particular_price, insurance_price, is_free, allow_discount, min_price,
    allow_installments, max_installments, charge_mode, charge_on_schedule, charge_on_finish,
    default_finance_category_id, default_payment_method_id, cost_center,
    commission_type, commission_value, commission_trigger
  )
`;

function isInsurance(paymentType?: string | null): boolean {
  if (!paymentType) return false;
  const t = paymentType.toLowerCase();
  return t === "convenio" || t === "convênio";
}

function isCourtesy(paymentType?: string | null): boolean {
  if (!paymentType) return false;
  const t = paymentType.toLowerCase();
  return t === "cortesia" || t === "isento";
}

/**
 * Valor esperado, resolvido conforme:
 *   is_free => 0
 *   convênio => insurance_price ?? amount_expected ?? price
 *   particular => amount_expected ?? particular_price ?? price
 */
export function resolveExpectedForProcedure(appt: Appointment): number {
  const proc = appt.procedures;
  if (proc?.is_free) return 0;
  const stored = Number(appt.amount_expected ?? appt.expected_value ?? 0) || 0;
  if (isInsurance(appt.payment_type)) {
    return Number(proc?.insurance_price ?? stored ?? proc?.price ?? 0) || 0;
  }
  if (stored > 0) return stored;
  return Number(proc?.particular_price ?? proc?.price ?? 0) || 0;
}

/**
 * Garante que existe (no máximo) uma cobrança vinculada ao agendamento.
 * Retorna o id da transação existente/criada, ou null se não é caso de cobrar.
 */
export async function ensureAppointmentCharge(
  appointmentId: string,
  phase: ChargePhase = "schedule",
): Promise<string | null> {
  const { data: appt, error: apErr } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("id", appointmentId)
    .maybeSingle();

  if (apErr || !appt) return null;
  const appointment = appt as unknown as Appointment;
  const proc = appointment.procedures;

  // Regras de bloqueio automático.
  if (proc?.is_free) return null;
  if (isCourtesy(appointment.payment_type)) return null;
  if (proc?.charge_mode === "manual") return null; // cobrança manual: nunca automatizada
  if (phase === "schedule" && proc?.charge_on_schedule === false) return null;
  if (phase === "finish" && proc?.charge_on_finish === false) return null;

  const expected = resolveExpectedForProcedure(appointment);
  if (expected <= 0) return null;

  // Dedup: qualquer cobrança viva trava a criação.
  const { data: existing } = await supabase
    .from("finance_transactions")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .in("status", ["pendente", "vencido", "pago", "parcial"])
    .limit(1);
  if (existing && existing.length > 0) return existing[0].id;

  const { data: { user } } = await supabase.auth.getUser();
  const description = `Cobrança do agendamento - ${appointment.patients?.full_name ?? "Paciente"}`;
  const origin =
    appointment.appointment_type === "procedimento" ? "procedimento" :
    appointment.appointment_type === "retorno" ? "retorno" : "consulta";

  const insertPayload: Record<string, unknown> = {
    clinic_id: appointment.clinic_id,
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    professional_id: appointment.professional_id,
    procedure_id: appointment.procedure_id,
    type: "receita" as const,
    status: "pendente" as const,
    description,
    amount: expected,
    transaction_date: appointment.scheduled_date ?? new Date().toISOString().slice(0, 10),
    due_date: appointment.scheduled_date ?? null,
    origin,
    reference_type: "appointment",
    reference_id: appointment.id,
    created_by: user?.id ?? null,
    category_id: proc?.default_finance_category_id ?? null,
    payment_method_id: proc?.default_payment_method_id ?? null,
    cost_center: proc?.cost_center ?? null,
  };

  const { data: tx, error: txErr } = await supabase
    .from("finance_transactions")
    .insert(insertPayload as any)
    .select("id")
    .maybeSingle();

  if (txErr) {
    console.error("ensureAppointmentCharge failed:", txErr);
    return null;
  }
  return tx?.id ?? null;
}

/**
 * Valida um valor pago manualmente contra as regras do procedimento.
 * Retorna { ok, reason } para bloquear ou permitir.
 */
export async function validateChargeAmount(
  appointmentId: string,
  amount: number,
): Promise<{ ok: boolean; reason?: string; expected?: number; min?: number }> {
  const { data: appt } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return { ok: true };
  const a = appt as unknown as Appointment;
  const proc = a.procedures;
  const expected = resolveExpectedForProcedure(a);

  if (proc?.is_free && amount > 0) {
    return { ok: false, reason: "Procedimento gratuito — não pode gerar cobrança." };
  }
  if (proc?.allow_discount === false && amount < expected) {
    return { ok: false, reason: "Este procedimento não permite desconto.", expected };
  }
  const min = Number(proc?.min_price ?? 0) || 0;
  if (min > 0 && amount < min) {
    return { ok: false, reason: `Valor abaixo do mínimo permitido (R$ ${min.toFixed(2)}).`, min };
  }
  return { ok: true, expected, min };
}

export async function validateInstallments(
  appointmentId: string,
  installments: number,
): Promise<{ ok: boolean; reason?: string; max?: number }> {
  if (installments <= 1) return { ok: true };
  const { data: appt } = await supabase
    .from("appointments")
    .select("procedures(allow_installments, max_installments)")
    .eq("id", appointmentId)
    .maybeSingle();
  const proc = (appt as any)?.procedures ?? null;
  if (!proc) return { ok: true };
  if (proc.allow_installments === false) {
    return { ok: false, reason: "Este procedimento não permite parcelamento." };
  }
  const max = Number(proc.max_installments ?? 0) || 0;
  if (max > 0 && installments > max) {
    return { ok: false, reason: `Parcelamento máximo permitido: ${max}x.`, max };
  }
  return { ok: true, max };
}

/**
 * Gera comissão para a fase indicada, respeitando commission_trigger.
 * Dedup por (appointment_id, professional_id) — nunca duplica.
 */
export async function generateAppointmentCommission(
  appointmentId: string,
  trigger: "on_finish" | "on_payment",
  opts?: { transactionId?: string | null; receivedAmount?: number | null },
): Promise<string | null> {
  const { data: appt } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return null;
  const a = appt as unknown as Appointment;
  const proc = a.procedures;
  const type = proc?.commission_type ?? "none";
  const value = Number(proc?.commission_value ?? 0) || 0;
  const configuredTrigger = (proc?.commission_trigger ?? "on_payment") as "on_finish" | "on_payment";

  if (type === "none" || value <= 0) return null;
  if (configuredTrigger !== trigger) return null;

  const base = Number(opts?.receivedAmount ?? resolveExpectedForProcedure(a)) || 0;
  if (base <= 0) return null;

  const commissionAmount = type === "percent"
    ? Number(((base * value) / 100).toFixed(2))
    : Number(value.toFixed(2));
  if (commissionAmount <= 0) return null;

  // Dedup
  const { data: existing } = await supabase
    .from("commission_entries")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("professional_id", a.professional_id)
    .not("status", "eq", "cancelled")
    .limit(1);
  if (existing && existing.length > 0) return existing[0].id;

  const payload = {
    clinic_id: a.clinic_id,
    appointment_id: a.id,
    patient_id: a.patient_id,
    professional_id: a.professional_id,
    procedure_id: a.procedure_id,
    transaction_id: opts?.transactionId ?? null,
    base_amount: base,
    commission_amount: commissionAmount,
    received_amount: Number(opts?.receivedAmount ?? 0) || 0,
    percent_applied: type === "percent" ? value : null,
    fixed_applied: type === "fixed" ? value : null,
    reference_date: a.scheduled_date ?? new Date().toISOString().slice(0, 10),
    payer_type: isInsurance(a.payment_type) ? "insurance" : "patient",
  };
  const { data: entry, error } = await supabase
    .from("commission_entries")
    .insert(payload as any)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("generateAppointmentCommission failed:", error);
    return null;
  }
  return entry?.id ?? null;
}

/**
 * Cancela cobranças pendentes vinculadas ao agendamento (não toca em pagas).
 */
export async function cancelAppointmentCharges(appointmentId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from("finance_transactions")
    .update({
      status: "cancelado" as const,
      canceled_at: new Date().toISOString(),
      cancel_reason: reason ?? "Agendamento cancelado",
    })
    .eq("appointment_id", appointmentId)
    .in("status", ["pendente", "vencido"]);
  if (error) console.error("cancelAppointmentCharges failed:", error);
}
