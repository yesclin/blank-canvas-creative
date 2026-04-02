import { useMutation, useQueryClient } from "@tanstack/react-query";
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

// ─── LEAD → PATIENT ───

export interface LeadToPatientData {
  leadId: string;
  existingPatientId?: string; // if linking to existing
  patientData?: {
    full_name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    gender?: string;
  };
}

export function useConvertLeadToPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LeadToPatientData) => {
      const clinicId = await getClinicId();
      let patientId = data.existingPatientId;

      if (!patientId && data.patientData) {
        const { data: patient, error } = await supabase
          .from("patients")
          .insert({
            clinic_id: clinicId,
            full_name: data.patientData.full_name,
            email: data.patientData.email || null,
            phone: data.patientData.phone || null,
            cpf: data.patientData.cpf || null,
            birth_date: data.patientData.birth_date || null,
            gender: data.patientData.gender || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        patientId = patient.id;
      }

      if (!patientId) throw new Error("Paciente não identificado");

      // Update lead
      const { error: leadErr } = await supabase
        .from("crm_leads")
        .update({
          converted_patient_id: patientId,
          patient_id: patientId,
          status: "convertido",
        })
        .eq("id", data.leadId);
      if (leadErr) throw leadErr;

      return patientId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Lead convertido em paciente com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro na conversão: ${error.message}`);
    },
  });
}

// ─── QUOTE → APPOINTMENT ───

export interface QuoteToAppointmentData {
  quoteId: string;
  opportunityId?: string;
  patientId: string;
  professionalId: string;
  specialtyId?: string;
  procedureId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedValue?: number;
  notes?: string;
}

export function useConvertQuoteToAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QuoteToAppointmentData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinicId,
          patient_id: data.patientId,
          professional_id: data.professionalId,
          specialty_id: data.specialtyId || null,
          procedure_id: data.procedureId || null,
          scheduled_date: data.scheduledDate,
          start_time: data.startTime,
          end_time: data.endTime,
          duration_minutes: data.durationMinutes,
          expected_value: data.expectedValue || null,
          notes: data.notes || null,
          status: "agendado",
          appointment_type: "consulta",
          care_mode: "presencial",
          created_by: user?.id || null,
          created_source: "comercial",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Update quote status
      await supabase
        .from("crm_quotes")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", data.quoteId);

      // Update opportunity if linked
      if (data.opportunityId) {
        await supabase
          .from("crm_opportunities")
          .update({ status: "ganha", is_won: true, closed_at: new Date().toISOString() })
          .eq("id", data.opportunityId);
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["crm-quote-detail"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado a partir do orçamento");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });
}

// ─── QUOTE → TREATMENT PACKAGE ───

export interface QuoteToPackageData {
  quoteId: string;
  patientId: string;
  name: string;
  totalSessions: number;
  totalAmount: number;
  procedureId?: string;
  professionalId?: string;
  paymentMethod?: string;
  validUntil?: string;
  notes?: string;
}

export function useConvertQuoteToPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QuoteToPackageData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: pkg, error } = await supabase
        .from("treatment_packages")
        .insert({
          clinic_id: clinicId,
          patient_id: data.patientId,
          name: data.name,
          total_sessions: data.totalSessions,
          total_amount: data.totalAmount,
          paid_amount: 0,
          procedure_id: data.procedureId || null,
          professional_id: data.professionalId || null,
          payment_method: data.paymentMethod || null,
          valid_until: data.validUntil || null,
          notes: data.notes || null,
          created_by: user?.id || null,
          status: "ativo",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Update quote
      await supabase
        .from("crm_quotes")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", data.quoteId);

      return pkg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["crm-quote-detail"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-packages"] });
      toast.success("Pacote de tratamento criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pacote: ${error.message}`);
    },
  });
}

// ─── QUOTE → FINANCE ───

export interface QuoteToFinanceData {
  quoteId: string;
  patientId?: string;
  professionalId?: string;
  amount: number;
  description: string;
  paymentMethod?: string;
  transactionDate: string;
  notes?: string;
}

export function useConvertQuoteToFinance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QuoteToFinanceData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: transaction, error } = await supabase
        .from("finance_transactions")
        .insert({
          clinic_id: clinicId,
          type: "receita",
          status: "pendente",
          description: data.description,
          amount: data.amount,
          transaction_date: data.transactionDate,
          payment_method: data.paymentMethod || null,
          patient_id: data.patientId || null,
          professional_id: data.professionalId || null,
          reference_type: "crm_quote",
          reference_id: data.quoteId,
          notes: data.notes || null,
          created_by: user?.id || null,
          origin: "comercial",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Update quote
      await supabase
        .from("crm_quotes")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", data.quoteId);

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["crm-quote-detail"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Lançamento financeiro criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao lançar financeiro: ${error.message}`);
    },
  });
}
