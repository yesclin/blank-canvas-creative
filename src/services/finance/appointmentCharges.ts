import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço central de cobranças vinculadas a agendamento.
 *
 * Regras:
 *  - Dedup por appointment_id: nunca cria uma segunda cobrança "pendente" se já existir uma
 *    ("pendente" ou "vencido") ou uma cobrança "pago" que cubra o valor esperado.
 *  - Convênio / cortesia / isento não gera cobrança automática particular.
 *  - Sempre carrega clinic_id, patient_id, professional_id, appointment_id, procedure_id.
 *  - Cancelamento marca as cobranças pendentes como "cancelado" (nunca deleta).
 *  - Toda operação passa por RLS (clinic_id), preservando isolamento multi-clínica.
 *  - Auditoria: o trigger universal (finance_universal_audit) grava em finance_audit_logs.
 */

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
  procedures?: {
    name?: string | null;
    price?: number | null;
    charge_on_schedule?: boolean | null;
    charge_on_finish?: boolean | null;
  } | null;
};

export type ChargePhase = "schedule" | "finish";

function resolveExpected(appt: Appointment): number {
  const stored = Number(appt.amount_expected ?? appt.expected_value ?? 0) || 0;
  if (stored > 0) return stored;
  return Number(appt.procedures?.price ?? 0) || 0;
}

function shouldAutoCharge(paymentType: string | null | undefined): boolean {
  // Não gera cobrança particular automática para convênio/cortesia.
  if (!paymentType) return true;
  const t = paymentType.toLowerCase();
  return t !== "convenio" && t !== "convênio" && t !== "cortesia" && t !== "isento";
}

/**
 * Garante que existe (no máximo) uma cobrança vinculada ao agendamento.
 * Retorna o id da transação existente/criada, ou null se não é caso de cobrar.
 */
export async function ensureAppointmentCharge(appointmentId: string): Promise<string | null> {
  // 1. Recarrega o agendamento com os dados essenciais.
  const { data: appt, error: apErr } = await supabase
    .from("appointments")
    .select(`
      id, clinic_id, patient_id, professional_id, procedure_id,
      appointment_type, payment_type, scheduled_date, amount_expected, expected_value,
      patients(full_name),
      procedures(name, price)
    `)
    .eq("id", appointmentId)
    .maybeSingle();

  if (apErr || !appt) return null;
  const appointment = appt as unknown as Appointment;

  if (!shouldAutoCharge(appointment.payment_type)) return null;
  const expected = resolveExpected(appointment);
  if (expected <= 0) return null;

  // 2. Dedup: qualquer cobrança viva (pendente/atrasado/pago/parcial) trava a criação.
  const { data: existing } = await supabase
    .from("finance_transactions")
    .select("id, status, amount")
    .eq("appointment_id", appointmentId)
    .in("status", ["pendente", "vencido", "pago", "parcial"])
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  // 3. Cria cobrança pendente.
  const { data: { user } } = await supabase.auth.getUser();
  const description = `Cobrança do agendamento - ${appointment.patients?.full_name ?? "Paciente"}`;
  const origin =
    appointment.appointment_type === "procedimento" ? "procedimento" :
    appointment.appointment_type === "retorno" ? "retorno" : "consulta";

  const { data: tx, error: txErr } = await supabase
    .from("finance_transactions")
    .insert({
      clinic_id: appointment.clinic_id,
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
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
    })
    .select("id")
    .maybeSingle();

  if (txErr) {
    console.error("ensureAppointmentCharge failed:", txErr);
    return null;
  }
  return tx?.id ?? null;
}

/**
 * Cancela todas as cobranças pendentes vinculadas ao agendamento.
 * Cobranças já pagas ou parciais NÃO são tocadas (precisam de estorno explícito).
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
