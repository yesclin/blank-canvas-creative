/**
 * Fase 2B — Pacotes/Sessões
 * Hook central: listagem, criação (venda), baixa, cancelamento/conclusão,
 * geração de finance_transactions (à vista ou parcelado), vínculo de sessão
 * a appointment e auditoria mínima via audit_logs.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import { toast } from "sonner";

export type PackageStatusExt = "ativo" | "concluido" | "cancelado" | "expirado";

export interface TreatmentPackageRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_id: string | null;
  professional_id: string | null;
  name: string;
  total_amount: number;
  paid_amount: number;
  total_sessions: number;
  used_sessions: number;
  status: PackageStatusExt;
  payment_method: string | null;
  valid_until: string | null;
  session_price: number | null;
  session_interval_days: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patients?: { full_name: string } | null;
  procedures?: { name: string } | null;
  professionals?: { full_name: string } | null;
}

export interface CreatePackageInput {
  patient_id: string;
  procedure_id?: string | null;
  professional_id?: string | null;
  name: string;
  total_sessions: number;
  total_amount: number;
  session_price?: number | null;
  session_interval_days?: number | null;
  payment_method?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  // Financeiro: parcelamento
  installments?: number; // 1 = à vista
  first_due_date?: string; // ISO date, default hoje
}

async function audit(clinicId: string, entity: string, entityId: string, action: string, meta: any = {}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      clinic_id: clinicId,
      user_id: userData.user?.id,
      entity,
      entity_id: entityId,
      action,
      metadata: meta,
    } as any);
  } catch {
    /* audit opcional */
  }
}

export function useTreatmentPackages(filters?: { status?: PackageStatusExt; patientId?: string; search?: string }) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["treatment-packages-full", scope.clinicId, filters],
    enabled: !!scope.clinicId,
    queryFn: async () => {
      let q = supabase
        .from("treatment_packages")
        .select(`
          *,
          patients:patient_id(full_name),
          procedures:procedure_id(name),
          professionals:professional_id(full_name)
        `)
        .eq("clinic_id", scope.clinicId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.patientId) q = q.eq("patient_id", filters.patientId);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as TreatmentPackageRow[];
    },
  });
}

export function usePackageSessions(packageId: string | null) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["package-sessions", packageId],
    enabled: !!packageId && !!scope.clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_date, start_time, status, professional_id, professionals:professional_id(full_name)")
        .eq("clinic_id", scope.clinicId!)
        .eq("treatment_package_id", packageId!)
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePackagePayments(packageId: string | null) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["package-payments", packageId],
    enabled: !!packageId && !!scope.clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("id, description, amount, paid_amount, status, due_date, paid_at, installment_number, installment_total")
        .eq("clinic_id", scope.clinicId!)
        .eq("treatment_package_id", packageId!)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTreatmentPackage() {
  const qc = useQueryClient();
  const { scope } = useActiveClinicScope();
  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      if (!scope.clinicId) throw new Error("Clínica não identificada.");
      const { data: userData } = await supabase.auth.getUser();

      // Impedir duplicidade: mesmo paciente + procedimento + total_amount + ativo aberto nas últimas 24h
      if (input.procedure_id) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: dup } = await supabase
          .from("treatment_packages")
          .select("id")
          .eq("clinic_id", scope.clinicId)
          .eq("patient_id", input.patient_id)
          .eq("procedure_id", input.procedure_id)
          .eq("status", "ativo")
          .gte("created_at", since)
          .limit(1);
        if (dup && dup.length > 0) {
          throw new Error("Já existe um pacote ativo idêntico criado nas últimas 24h para este paciente.");
        }
      }

      const { data: pkg, error } = await supabase
        .from("treatment_packages")
        .insert({
          clinic_id: scope.clinicId,
          patient_id: input.patient_id,
          procedure_id: input.procedure_id ?? null,
          professional_id: input.professional_id ?? null,
          name: input.name,
          total_sessions: input.total_sessions,
          total_amount: input.total_amount,
          session_price: input.session_price ?? (input.total_sessions ? input.total_amount / input.total_sessions : null),
          session_interval_days: input.session_interval_days ?? null,
          payment_method: input.payment_method ?? null,
          valid_until: input.valid_until ?? null,
          notes: input.notes ?? null,
          status: "ativo",
          paid_amount: 0,
          used_sessions: 0,
          created_by: userData.user?.id,
        } as any)
        .select("*")
        .maybeSingle();
      if (error || !pkg) throw error ?? new Error("Falha ao criar pacote.");

      // Gerar receitas: à vista (1) ou parcelado (N)
      const installments = Math.max(1, input.installments ?? 1);
      const perInstallment = Number((input.total_amount / installments).toFixed(2));
      const startDate = input.first_due_date ? new Date(input.first_due_date) : new Date();
      const rows = Array.from({ length: installments }).map((_, i) => {
        const due = new Date(startDate);
        due.setMonth(due.getMonth() + i);
        return {
          clinic_id: scope.clinicId,
          patient_id: input.patient_id,
          treatment_package_id: pkg.id,
          type: "receita",
          status: "pendente",
          description: `${input.name} — parcela ${i + 1}/${installments}`,
          amount: perInstallment,
          due_date: due.toISOString().slice(0, 10),
          installment_number: i + 1,
          installment_total: installments,
          category: "pacote",
          origin: "pacote",
        };
      });
      const { error: txErr } = await supabase.from("finance_transactions").insert(rows as any);
      if (txErr) throw txErr;

      await audit(scope.clinicId, "treatment_package", pkg.id, "create", { installments, total: input.total_amount });
      return pkg;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-packages-full"] });
      qc.invalidateQueries({ queryKey: ["finance-transactions"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Pacote criado e cobranças geradas.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar pacote."),
  });
}

export function useLinkAppointmentToPackage() {
  const qc = useQueryClient();
  const { scope } = useActiveClinicScope();
  return useMutation({
    mutationFn: async ({ appointmentId, packageId }: { appointmentId: string; packageId: string | null }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ treatment_package_id: packageId } as any)
        .eq("id", appointmentId)
        .eq("clinic_id", scope.clinicId!);
      if (error) throw error;
      if (scope.clinicId) await audit(scope.clinicId, "appointment", appointmentId, "link_package", { packageId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-packages-full"] });
      qc.invalidateQueries({ queryKey: ["package-sessions"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Sessão vinculada ao pacote.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao vincular sessão."),
  });
}

export function useUpdatePackageStatus() {
  const qc = useQueryClient();
  const { scope } = useActiveClinicScope();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: PackageStatusExt; reason?: string }) => {
      const { error } = await supabase
        .from("treatment_packages")
        .update({ status, notes: reason ? `[${status}] ${reason}` : undefined, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .eq("clinic_id", scope.clinicId!);
      if (error) throw error;

      // Se cancelar pacote, cancelar cobranças pendentes vinculadas
      if (status === "cancelado") {
        await supabase
          .from("finance_transactions")
          .update({ status: "cancelado" } as any)
          .eq("treatment_package_id", id)
          .eq("clinic_id", scope.clinicId!)
          .eq("status", "pendente");
      }
      if (scope.clinicId) await audit(scope.clinicId, "treatment_package", id, `status:${status}`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-packages-full"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Pacote atualizado.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar pacote."),
  });
}

export function usePackageSummary(packageId: string | null) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["package-summary", packageId],
    enabled: !!packageId && !!scope.clinicId,
    queryFn: async () => {
      const { data: appts } = await supabase
        .from("appointments")
        .select("status")
        .eq("clinic_id", scope.clinicId!)
        .eq("treatment_package_id", packageId!);
      const counts = { finalizado: 0, agendado: 0, faltou: 0, cancelado: 0, outros: 0 };
      (appts ?? []).forEach((a: any) => {
        if (a.status === "finalizado") counts.finalizado++;
        else if (["nao_confirmado", "confirmado", "chegou", "em_atendimento"].includes(a.status)) counts.agendado++;
        else if (a.status === "faltou") counts.faltou++;
        else if (a.status === "cancelado") counts.cancelado++;
        else counts.outros++;
      });
      return counts;
    },
  });
}
