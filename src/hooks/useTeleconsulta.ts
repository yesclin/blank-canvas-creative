import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";

export interface TeleconsultationSession {
  id: string;
  clinic_id: string;
  appointment_id: string;
  patient_id: string;
  professional_id: string;
  provider: string;
  external_meeting_id?: string;
  join_url_patient?: string;
  join_url_professional?: string;
  host_url?: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  recording_url?: string;
  recording_status?: string;
  connection_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeleconsultationSettings {
  id: string;
  clinic_id: string;
  enabled: boolean;
  default_provider: string;
  require_consent: boolean;
  require_precheck: boolean;
  late_tolerance_minutes: number;
  allow_recording: boolean;
  link_send_channels: string[];
  enabled_specialty_ids: string[];
  enabled_procedure_ids: string[];
}

export function useTeleconsultaSettings() {
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["teleconsultation-settings", clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const { data, error } = await supabase
        .from("teleconsultation_settings" as any)
        .select("*")
        .eq("clinic_id", clinicId)
        .maybeSingle();
      if (error) throw error;
      return data as TeleconsultationSettings | null;
    },
    enabled: !!clinicId,
  });
}

export function useTeleconsultaSession(appointmentId: string | null) {
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["teleconsultation-session", appointmentId],
    queryFn: async () => {
      if (!clinicId || !appointmentId) return null;
      const { data, error } = await supabase
        .from("teleconsultation_sessions" as any)
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TeleconsultationSession | null;
    },
    enabled: !!clinicId && !!appointmentId,
  });
}

export function useTeleconsultaActions() {
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;
  const queryClient = useQueryClient();

  const generateRoom = useMutation({
    mutationFn: async ({
      appointmentId,
      patientId,
      professionalId,
      provider = "manual",
    }: {
      appointmentId: string;
      patientId: string;
      professionalId: string;
      provider?: string;
    }) => {
      if (!clinicId) throw new Error("Clínica não encontrada");

      // Create session
      const meetingLink = `https://meet.yesclin.com/${crypto.randomUUID().slice(0, 8)}`;
      const { data: session, error: sessionError } = await supabase
        .from("teleconsultation_sessions" as any)
        .insert({
          clinic_id: clinicId,
          appointment_id: appointmentId,
          patient_id: patientId,
          professional_id: professionalId,
          provider,
          join_url_patient: meetingLink,
          join_url_professional: meetingLink,
          status: "criada",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update appointment
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          meeting_link: meetingLink,
          meeting_status: "gerada",
          meeting_provider: provider,
          meeting_created_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      // Log event
      await supabase.from("teleconsultation_events" as any).insert({
        clinic_id: clinicId,
        teleconsultation_session_id: (session as any).id,
        appointment_id: appointmentId,
        event_type: "room_created",
        actor_type: "professional",
      });

      return { session, meetingLink };
    },
    onSuccess: (_, variables) => {
      toast.success("Sala de teleconsulta gerada!");
      queryClient.invalidateQueries({ queryKey: ["teleconsultation-session", variables.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Erro ao gerar sala de teleconsulta"),
  });

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const startSession = useMutation({
    mutationFn: async ({ appointmentId, sessionId }: { appointmentId: string; sessionId: string }) => {
      if (!clinicId) throw new Error("Clínica não encontrada");
      
      const now = new Date().toISOString();
      
      await supabase
        .from("teleconsultation_sessions" as any)
        .update({ status: "em_andamento", started_at: now })
        .eq("id", sessionId);

      await supabase
        .from("appointments")
        .update({
          meeting_status: "em_andamento",
          meeting_started_at: now,
          status: "em_atendimento",
          started_at: now,
        })
        .eq("id", appointmentId);

      await supabase.from("teleconsultation_events" as any).insert({
        clinic_id: clinicId,
        teleconsultation_session_id: sessionId,
        appointment_id: appointmentId,
        event_type: "session_started",
        actor_type: "professional",
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Teleconsulta iniciada!");
      queryClient.invalidateQueries({ queryKey: ["teleconsultation-session", variables.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Erro ao iniciar teleconsulta"),
  });

  const endSession = useMutation({
    mutationFn: async ({ appointmentId, sessionId }: { appointmentId: string; sessionId: string }) => {
      if (!clinicId) throw new Error("Clínica não encontrada");
      
      const now = new Date().toISOString();

      await supabase
        .from("teleconsultation_sessions" as any)
        .update({ status: "encerrada", ended_at: now })
        .eq("id", sessionId);

      await supabase
        .from("appointments")
        .update({
          meeting_status: "encerrada",
          meeting_ended_at: now,
        })
        .eq("id", appointmentId);

      await supabase.from("teleconsultation_events" as any).insert({
        clinic_id: clinicId,
        teleconsultation_session_id: sessionId,
        appointment_id: appointmentId,
        event_type: "session_ended",
        actor_type: "professional",
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Teleconsulta encerrada!");
      queryClient.invalidateQueries({ queryKey: ["teleconsultation-session", variables.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Erro ao encerrar teleconsulta"),
  });

  const reportTechnicalIssue = useMutation({
    mutationFn: async ({ appointmentId, sessionId, description }: { appointmentId: string; sessionId: string; description?: string }) => {
      if (!clinicId) throw new Error("Clínica não encontrada");

      // Increment counter - use RPC or raw update
      const { data: apt } = await supabase
        .from("appointments")
        .select("technical_issue_count")
        .eq("id", appointmentId)
        .single();

      const currentCount = (apt as any)?.technical_issue_count || 0;
      
      await supabase
        .from("appointments")
        .update({ technical_issue_count: currentCount + 1 })
        .eq("id", appointmentId);

      await supabase.from("teleconsultation_events" as any).insert({
        clinic_id: clinicId,
        teleconsultation_session_id: sessionId,
        appointment_id: appointmentId,
        event_type: "technical_issue",
        actor_type: "professional",
        payload: { description },
      });
    },
    onSuccess: () => {
      toast.success("Intercorrência técnica registrada");
    },
    onError: () => toast.error("Erro ao registrar intercorrência"),
  });

  const convertToPresencial = useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => {
      if (!clinicId) throw new Error("Clínica não encontrada");

      await supabase
        .from("appointments")
        .update({
          care_mode: "presencial",
          meeting_status: "nao_gerada",
          meeting_link: null,
        })
        .eq("id", appointmentId);
    },
    onSuccess: (_, variables) => {
      toast.success("Agendamento convertido para presencial");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["teleconsultation-session", variables.appointmentId] });
    },
    onError: () => toast.error("Erro ao converter para presencial"),
  });

  const saveTeleconsultaSettings = useMutation({
    mutationFn: async (settings: Partial<TeleconsultationSettings>) => {
      if (!clinicId) throw new Error("Clínica não encontrada");

      const { error } = await supabase
        .from("teleconsultation_settings" as any)
        .upsert({
          clinic_id: clinicId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: "clinic_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações de teleconsulta salvas!");
      queryClient.invalidateQueries({ queryKey: ["teleconsultation-settings"] });
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  return {
    generateRoom,
    copyLink,
    startSession,
    endSession,
    reportTechnicalIssue,
    convertToPresencial,
    saveTeleconsultaSettings,
  };
}
