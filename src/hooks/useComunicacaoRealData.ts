import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";
import type {
  CRMPatient,
  MessageTemplate,
  AutomationRule,
  MarketingCampaign,
  MessageLog,
  CRMStatus,
  CommunicationChannel,
} from "@/types/comunicacao";

// =============================================
// CRM PATIENTS (aggregated from patients + appointments)
// =============================================

export function useCRMPatients() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["crm-patients", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, birth_date, is_active")
        .eq("clinic_id", clinic!.id)
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;

      // Get appointment stats per patient
      const { data: appointments } = await supabase
        .from("appointments")
        .select("patient_id, status, scheduled_date")
        .eq("clinic_id", clinic!.id);

      const apptMap = new Map<string, { total: number; missed: number; last?: string; next?: string }>();
      const today = new Date().toISOString().split("T")[0];

      (appointments || []).forEach((a) => {
        const entry = apptMap.get(a.patient_id) || { total: 0, missed: 0 };
        entry.total++;
        if (a.status === "faltou") entry.missed++;
        if (a.scheduled_date <= today && (!entry.last || a.scheduled_date > entry.last)) {
          entry.last = a.scheduled_date;
        }
        if (a.scheduled_date >= today && (!entry.next || a.scheduled_date < entry.next)) {
          entry.next = a.scheduled_date;
        }
        apptMap.set(a.patient_id, entry);
      });

      return (patients || []).map((p): CRMPatient => {
        const stats = apptMap.get(p.id) || { total: 0, missed: 0 };
        // Determine CRM status based on data
        let crmStatus: CRMStatus = "novo_contato";
        if (stats.total === 0) crmStatus = "novo_contato";
        else if (stats.next) crmStatus = "em_atendimento";
        else if (stats.last) crmStatus = "em_acompanhamento";

        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone || undefined,
          email: p.email || undefined,
          birth_date: p.birth_date || undefined,
          crm_status: crmStatus,
          preferred_contact: "whatsapp" as CommunicationChannel,
          opt_out_messages: false,
          last_appointment: stats.last,
          next_appointment: stats.next,
          total_appointments: stats.total,
          missed_appointments: stats.missed,
          active_packages: 0,
          tags: [],
          messages_count: 0,
        };
      });
    },
  });
}

// =============================================
// TEMPLATES (from message_templates table)
// =============================================

export function useTemplates() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["message-templates", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((t): MessageTemplate => ({
        id: t.id,
        clinic_id: t.clinic_id,
        name: t.name,
        category: (t.category || "campanha_geral") as any,
        channel: (t.channel || "whatsapp") as CommunicationChannel,
        content: t.content,
        is_active: t.is_active,
        is_system: false,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));
    },
  });
}

// =============================================
// AUTOMATIONS (from automation_rules table)
// =============================================

export function useAutomations() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["automation-rules", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*, message_templates(*)")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((a): AutomationRule => ({
        id: a.id,
        clinic_id: a.clinic_id,
        name: a.name,
        trigger_type: a.trigger_event as any,
        trigger_config: (a.conditions as any) || {},
        template_id: a.template_id || undefined,
        is_active: a.is_active,
        priority: 0,
        created_at: a.created_at,
        updated_at: a.updated_at,
      }));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const rule = query.data?.find((r) => r.id === id);
      if (!rule) return;

      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Automação atualizada");
    },
    onError: () => toast.error("Erro ao atualizar automação"),
  });

  return { ...query, toggleAutomation: toggleMutation.mutate };
}

// =============================================
// MESSAGE LOGS (from message_logs table)
// =============================================

export function useMessageLogs() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["message-logs", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_queue")
        .select("*, patients(full_name, phone)")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((m: any): MessageLog => ({
        id: m.id,
        clinic_id: m.clinic_id,
        patient_id: m.patient_id || "",
        patient: m.patients ? { full_name: m.patients.full_name, phone: m.patients.phone } : undefined,
        template_id: m.template_id || undefined,
        channel: (m.channel || "whatsapp") as CommunicationChannel,
        message_type: "manual" as any,
        content: m.message_body || m.rendered_message || "",
        status: (m.status || "pending") as any,
        metadata: {},
        created_at: m.created_at,
      }));
    },
  });
}

// =============================================
// PIPELINE STATS
// =============================================

export function usePipelineStats(patients: CRMPatient[] | undefined) {
  const statusCounts: Record<CRMStatus, number> = {
    novo_contato: 0,
    primeira_consulta_agendada: 0,
    em_atendimento: 0,
    tratamento_em_andamento: 0,
    em_acompanhamento: 0,
    inativo: 0,
    alta_finalizado: 0,
  };

  (patients || []).forEach((p) => {
    if (statusCounts[p.crm_status] !== undefined) {
      statusCounts[p.crm_status]++;
    }
  });

  return statusCounts;
}

// =============================================
// MESSAGE STATS
// =============================================

export function useMessageStats(logs: MessageLog[] | undefined) {
  const total = logs?.length || 0;
  const sent = logs?.filter((l) => l.status === "sent" || l.status === "delivered" || l.status === "read").length || 0;
  const delivered = logs?.filter((l) => l.status === "delivered" || l.status === "read").length || 0;
  const read = logs?.filter((l) => l.status === "read").length || 0;
  const failed = logs?.filter((l) => l.status === "failed").length || 0;

  return {
    total,
    sent,
    delivered,
    read,
    failed,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    readRate: total > 0 ? Math.round((read / total) * 100) : 0,
  };
}

// =============================================
// COMBINED HOOK (replaces useComunicacaoMockData)
// =============================================

export function useComunicacaoRealData() {
  const { data: crmPatients, isLoading: loadingPatients } = useCRMPatients();
  const { data: templates, isLoading: loadingTemplates } = useTemplates();
  const { data: automations, isLoading: loadingAutomations, toggleAutomation } = useAutomations();
  const { data: messageLogs, isLoading: loadingLogs } = useMessageLogs();

  const pipelineStats = usePipelineStats(crmPatients);
  const messageStats = useMessageStats(messageLogs);

  const isLoading = loadingPatients || loadingTemplates || loadingAutomations || loadingLogs;

  return {
    crmPatients: crmPatients || [],
    templates: templates || [],
    automations: automations || [],
    campaigns: [] as MarketingCampaign[], // campaigns table not yet created, empty for now
    messageLogs: messageLogs || [],
    settings: null,
    pipelineStats,
    messageStats,
    toggleAutomation,
    isLoading,
  };
}
