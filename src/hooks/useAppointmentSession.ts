import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PauseEvent {
  paused_at: string;
  resumed_at: string | null;
  reason?: string;
}

export interface AppointmentSession {
  id: string;
  appointment_id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  pause_events: PauseEvent[];
  total_paused_seconds: number;
  session_summary: SessionSummary | null;
  session_notes: string | null;
  is_paused: boolean;
  current_pause_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary {
  // Header
  patient_name: string;
  professional_name: string;
  specialty_name: string | null;
  procedure_name: string | null;
  scheduled_date: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  paused_seconds: number;
  effective_seconds: number;
  // Clinical
  anamnesis_count: number;
  evolutions_count: number;
  media_count: number;
  alerts_count: number;
  consents_count: number;
  clinical_documents_count: number;
  // Items detail
  anamnesis_templates: string[];
  evolution_notes: string[];
  products_used: string[];
  // Operational
  payment_status: string;
  amount_expected: number;
  amount_received: number;
  notes: string | null;
}

// Fetch session for an appointment
export function useAppointmentSession(appointmentId: string | null | undefined) {
  return useQuery({
    queryKey: ["appointment-session", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("appointment_sessions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();
      if (error) {
        console.error("Error fetching session:", error);
        return null;
      }
      if (!data) return null;
      return {
        ...data,
        pause_events: (data.pause_events as PauseEvent[]) || [],
        session_summary: data.session_summary as SessionSummary | null,
      } as AppointmentSession;
    },
    enabled: !!appointmentId,
    refetchInterval: 10000,
  });
}

// Create or get session for an appointment
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      appointmentId: string;
      clinicId: string;
      patientId: string;
      professionalId: string;
    }) => {
      // Check if session already exists
      const { data: existing } = await supabase
        .from("appointment_sessions")
        .select("id")
        .eq("appointment_id", params.appointmentId)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from("appointment_sessions")
        .insert({
          appointment_id: params.appointmentId,
          clinic_id: params.clinicId,
          patient_id: params.patientId,
          professional_id: params.professionalId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-session", params.appointmentId] });
    },
  });
}

// Pause an active session
export function usePauseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: string; reason?: string }) => {
      const now = new Date().toISOString();

      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from("appointment_sessions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (fetchError || !session) throw new Error("Sessão não encontrada");
      if (session.is_paused) throw new Error("Sessão já está pausada");

      const pauseEvents = [...((session.pause_events as PauseEvent[]) || [])];
      pauseEvents.push({ paused_at: now, resumed_at: null, reason });

      const { error } = await supabase
        .from("appointment_sessions")
        .update({
          is_paused: true,
          current_pause_started_at: now,
          pause_events: pauseEvents,
        })
        .eq("appointment_id", appointmentId);

      if (error) throw error;

      // Also update appointment paused_at
      await supabase
        .from("appointments")
        .update({ paused_at: now })
        .eq("id", appointmentId);

      return { appointmentId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-session", result.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Atendimento pausado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao pausar atendimento");
    },
  });
}

// Resume a paused session
export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => {
      const now = new Date().toISOString();

      const { data: session, error: fetchError } = await supabase
        .from("appointment_sessions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (fetchError || !session) throw new Error("Sessão não encontrada");
      if (!session.is_paused) throw new Error("Sessão não está pausada");

      const pauseEvents = [...((session.pause_events as PauseEvent[]) || [])];
      // Close the last open pause event
      const lastIdx = pauseEvents.length - 1;
      if (lastIdx >= 0 && !pauseEvents[lastIdx].resumed_at) {
        pauseEvents[lastIdx].resumed_at = now;
      }

      // Calculate additional paused seconds
      const pauseStart = session.current_pause_started_at
        ? new Date(session.current_pause_started_at).getTime()
        : Date.now();
      const additionalSeconds = Math.floor((Date.now() - pauseStart) / 1000);

      const { error } = await supabase
        .from("appointment_sessions")
        .update({
          is_paused: false,
          current_pause_started_at: null,
          pause_events: pauseEvents,
          total_paused_seconds: (session.total_paused_seconds || 0) + additionalSeconds,
        })
        .eq("appointment_id", appointmentId);

      if (error) throw error;

      // Clear paused_at on appointment
      await supabase
        .from("appointments")
        .update({ paused_at: null })
        .eq("id", appointmentId);

      return { appointmentId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-session", result.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Atendimento retomado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao retomar atendimento");
    },
  });
}

// Generate and save session summary when finalizing
export function useFinalizeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => {
      // Fetch appointment details
      const { data: apt } = await supabase
        .from("appointments")
        .select(`
          *,
          patients(full_name),
          professionals(full_name),
          specialties(name),
          procedures(name)
        `)
        .eq("id", appointmentId)
        .single();

      if (!apt) throw new Error("Agendamento não encontrado");

      // If session is still paused, resume it first
      const { data: session } = await supabase
        .from("appointment_sessions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      let totalPaused = session?.total_paused_seconds || 0;
      if (session?.is_paused && session.current_pause_started_at) {
        const additionalSeconds = Math.floor(
          (Date.now() - new Date(session.current_pause_started_at).getTime()) / 1000
        );
        totalPaused += additionalSeconds;
      }

      // Fetch related clinical data counts
      const clinicId = apt.clinic_id;
      const patientId = apt.patient_id;

      const [
        { count: anamnesisCount },
        { count: evolutionsCount },
        { count: mediaCount },
        { count: alertsCount },
        { count: consentsCount },
        { count: clinicalDocsCount },
      ] = await Promise.all([
        supabase.from("anamnesis_records").select("id", { count: "exact", head: true })
          .eq("appointment_id", appointmentId),
        supabase.from("clinical_evolutions").select("id", { count: "exact", head: true })
          .eq("appointment_id", appointmentId),
        supabase.from("clinical_media").select("id", { count: "exact", head: true })
          .eq("patient_id", patientId).eq("clinic_id", clinicId),
        supabase.from("clinical_alerts").select("id", { count: "exact", head: true })
          .eq("patient_id", patientId).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("clinical_documents").select("id", { count: "exact", head: true })
          .eq("patient_id", patientId).eq("clinic_id", clinicId)
          .eq("document_type", "consent"),
        supabase.from("clinical_documents").select("id", { count: "exact", head: true })
          .eq("patient_id", patientId).eq("clinic_id", clinicId),
      ]);

      // Fetch anamnesis template names
      const { data: anamnesisRecords } = await supabase
        .from("anamnesis_records")
        .select("template_id, anamnesis_templates(name)")
        .eq("appointment_id", appointmentId);

      const anamnesisTemplates = (anamnesisRecords || [])
        .map((r: any) => r.anamnesis_templates?.name)
        .filter(Boolean);

      // Fetch evolution notes
      const { data: evolutions } = await supabase
        .from("clinical_evolutions")
        .select("notes")
        .eq("appointment_id", appointmentId);

      const evolutionNotes = (evolutions || [])
        .map((e: any) => e.notes)
        .filter(Boolean)
        .slice(0, 5); // Limit to 5

      const startedAt = apt.started_at || apt.created_at;
      const finishedAt = apt.finished_at || new Date().toISOString();
      const totalDuration = Math.floor(
        (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
      );

      const summary: SessionSummary = {
        patient_name: apt.patients?.full_name || "Paciente",
        professional_name: apt.professionals?.full_name || "Profissional",
        specialty_name: apt.specialties?.name || null,
        procedure_name: apt.procedures?.name || null,
        scheduled_date: apt.scheduled_date,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_seconds: totalDuration,
        paused_seconds: totalPaused,
        effective_seconds: totalDuration - totalPaused,
        anamnesis_count: anamnesisCount || 0,
        evolutions_count: evolutionsCount || 0,
        media_count: mediaCount || 0,
        alerts_count: alertsCount || 0,
        consents_count: consentsCount || 0,
        clinical_documents_count: clinicalDocsCount || 0,
        anamnesis_templates: anamnesisTemplates,
        evolution_notes: evolutionNotes,
        products_used: [],
        payment_status: apt.payment_status || "pendente",
        amount_expected: apt.amount_expected || 0,
        amount_received: apt.amount_received || 0,
        notes: apt.notes || null,
      };

      if (session) {
        // Close any open pause events
        const pauseEvents = [...((session.pause_events as PauseEvent[]) || [])];
        const lastIdx = pauseEvents.length - 1;
        if (lastIdx >= 0 && !pauseEvents[lastIdx].resumed_at) {
          pauseEvents[lastIdx].resumed_at = finishedAt;
        }

        await supabase
          .from("appointment_sessions")
          .update({
            is_paused: false,
            current_pause_started_at: null,
            total_paused_seconds: totalPaused,
            pause_events: pauseEvents,
            session_summary: summary as any,
          })
          .eq("appointment_id", appointmentId);
      } else {
        // Create session with summary even if it wasn't created before
        await supabase
          .from("appointment_sessions")
          .insert({
            appointment_id: appointmentId,
            clinic_id: clinicId,
            patient_id: patientId,
            professional_id: apt.professional_id,
            total_paused_seconds: totalPaused,
            session_summary: summary as any,
          });
      }

      // Clear paused_at
      await supabase
        .from("appointments")
        .update({ paused_at: null })
        .eq("id", appointmentId);

      // Generate consolidated attendance document (idempotent)
      try {
        const { generateConsolidatedAttendanceDocument } = await import("@/utils/generateConsolidatedAttendanceDocument");
        await generateConsolidatedAttendanceDocument(appointmentId);
      } catch (docErr) {
        console.error("Error generating consolidated document:", docErr);
        // Non-blocking: session finalization succeeds even if doc generation fails
      }

      return { appointmentId, summary };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-session", result.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      console.error("Error finalizing session:", error);
    },
  });
}
