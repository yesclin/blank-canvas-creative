import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AttendanceDetail {
  // Appointment
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  care_mode: string;
  notes: string | null;
  // Patient
  patient_id: string;
  patient_name: string;
  patient_birth_date: string | null;
  patient_phone: string | null;
  patient_cpf: string | null;
  // Professional
  professional_id: string;
  professional_name: string;
  // Specialty & Procedure
  specialty_id: string | null;
  specialty_name: string | null;
  procedure_id: string | null;
  procedure_name: string | null;
  // Session
  effective_seconds: number;
  paused_seconds: number;
  session_summary: any;
  session_notes: string | null;
  // Financial
  amount_expected: number;
  amount_received: number;
  payment_status: string;
  // Clinic
  clinic_name: string;
  clinic_logo_url: string | null;
  clinic_phone: string | null;
  clinic_email: string | null;
  clinic_cnpj: string | null;
  // Clinical data
  anamnesis_records: AnamnesisRecord[];
  evolutions: EvolutionRecord[];
  clinical_documents: ClinicalDocRecord[];
  clinical_alerts: AlertRecord[];
  clinical_media: MediaRecord[];
  // Consolidated document
  consolidated_document: ConsolidatedDocRecord | null;
}

export interface AnamnesisRecord {
  id: string;
  template_name: string | null;
  status: string;
  data: any;
  responses: any;
  signed_at: string | null;
  created_at: string;
}

export interface EvolutionRecord {
  id: string;
  evolution_type: string | null;
  content: any;
  notes: string | null;
  status: string;
  signed_at: string | null;
  created_at: string;
}

export interface ClinicalDocRecord {
  id: string;
  document_type: string;
  title: string;
  status: string;
  signed_at: string | null;
  created_at: string;
}

export interface AlertRecord {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MediaRecord {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  classification: string | null;
  description: string | null;
  created_at: string;
}

export interface ConsolidatedDocRecord {
  id: string;
  status: string;
  is_locked: boolean;
  signed_at: string | null;
  generated_at: string;
  snapshot_json: any;
  hash_sha256: string | null;
  signature_metadata: any | null;
  signature?: {
    id: string;
    signed_by_name: string | null;
    sign_method: string | null;
    signature_hash: string | null;
    ip_address: string | null;
    user_agent: string | null;
    signed_at: string;
    evidence_snapshot: any | null;
  } | null;
}

export function useAttendanceDetail(appointmentId: string | null) {
  return useQuery({
    queryKey: ["attendance-detail", appointmentId],
    queryFn: async (): Promise<AttendanceDetail | null> => {
      if (!appointmentId) return null;

      // 1. Fetch appointment with relations
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, scheduled_date, start_time, end_time, status, started_at, finished_at,
          care_mode, notes, patient_id, professional_id, specialty_id, procedure_id,
          amount_expected, amount_received, payment_status, clinic_id,
          patients(full_name, birth_date, phone, cpf),
          professionals(full_name),
          specialties(name),
          procedures(name),
          appointment_sessions(
            total_paused_seconds, session_summary, session_notes
          )
        `)
        .eq("id", appointmentId)
        .maybeSingle();

      if (aptError) throw aptError;
      if (!apt) return null;

      const clinicId = apt.clinic_id;

      // 2. Fetch clinic info + clinical data in parallel
      const [
        { data: clinicData },
        { data: anamRecords },
        { data: evolRecords },
        { data: docRecords },
        { data: alertRecords },
        { data: mediaRecords },
        { data: consolidatedDoc },
      ] = await Promise.all([
        supabase.from("clinics").select("name, logo_url, phone, email, cnpj").eq("id", clinicId).maybeSingle(),
        supabase.from("anamnesis_records").select("id, status, data, responses, signed_at, created_at, template_id, anamnesis_templates(name)").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_evolutions").select("id, evolution_type, content, notes, status, signed_at, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_documents").select("id, document_type, title, status, signed_at, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_alerts").select("id, alert_type, severity, title, description, is_active, created_at").eq("appointment_id", appointmentId).eq("is_active", true).order("created_at"),
        supabase.from("clinical_media").select("id, file_url, file_type, file_name, classification, description, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_attendance_documents").select("id, status, is_locked, signed_at, generated_at, snapshot_json, hash_sha256, signature_metadata").eq("appointment_id", appointmentId).limit(1).maybeSingle(),
      ]);

      const session = Array.isArray(apt.appointment_sessions) ? apt.appointment_sessions[0] : apt.appointment_sessions;
      const startedAt = apt.started_at ? new Date(apt.started_at).getTime() : 0;
      const finishedAt = apt.finished_at ? new Date(apt.finished_at).getTime() : Date.now();
      const totalSeconds = Math.floor((finishedAt - startedAt) / 1000);
      const pausedSeconds = session?.total_paused_seconds || 0;

      return {
        id: apt.id,
        scheduled_date: apt.scheduled_date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        started_at: apt.started_at,
        finished_at: apt.finished_at,
        care_mode: apt.care_mode,
        notes: apt.notes,
        patient_id: apt.patient_id,
        patient_name: (apt.patients as any)?.full_name || "Paciente",
        patient_birth_date: (apt.patients as any)?.birth_date || null,
        patient_phone: (apt.patients as any)?.phone || null,
        patient_cpf: (apt.patients as any)?.cpf || null,
        professional_id: apt.professional_id,
        professional_name: (apt.professionals as any)?.full_name || "Profissional",
        specialty_id: apt.specialty_id,
        specialty_name: (apt.specialties as any)?.name || null,
        procedure_id: apt.procedure_id,
        procedure_name: (apt.procedures as any)?.name || null,
        effective_seconds: Math.max(0, totalSeconds - pausedSeconds),
        paused_seconds: pausedSeconds,
        session_summary: session?.session_summary || null,
        session_notes: session?.session_notes || null,
        amount_expected: apt.amount_expected || 0,
        amount_received: apt.amount_received || 0,
        payment_status: apt.payment_status || "pendente",
        clinic_name: clinicData?.name || "",
        clinic_logo_url: clinicData?.logo_url || null,
        clinic_phone: clinicData?.phone || null,
        clinic_email: clinicData?.email || null,
        clinic_cnpj: clinicData?.cnpj || null,
        anamnesis_records: (anamRecords || []).map((r: any) => ({
          id: r.id,
          template_name: r.anamnesis_templates?.name || null,
          status: r.status,
          data: r.data,
          responses: r.responses,
          signed_at: r.signed_at,
          created_at: r.created_at,
        })),
        evolutions: (evolRecords || []).map((r: any) => ({
          id: r.id,
          evolution_type: r.evolution_type,
          content: r.content,
          notes: r.notes,
          status: r.status,
          signed_at: r.signed_at,
          created_at: r.created_at,
        })),
        clinical_documents: (docRecords || []).map((r: any) => ({
          id: r.id,
          document_type: r.document_type,
          title: r.title,
          status: r.status,
          signed_at: r.signed_at,
          created_at: r.created_at,
        })),
        clinical_alerts: alertRecords || [],
        clinical_media: (mediaRecords || []).map((r: any) => ({
          id: r.id,
          file_url: r.file_url,
          file_type: r.file_type || "",
          file_name: r.file_name || "",
          classification: r.classification,
          description: r.description,
          created_at: r.created_at,
        })),
        consolidated_document: consolidatedDoc ? {
          id: consolidatedDoc.id,
          status: consolidatedDoc.status,
          is_locked: consolidatedDoc.is_locked,
          signed_at: consolidatedDoc.signed_at,
          generated_at: consolidatedDoc.generated_at,
          snapshot_json: consolidatedDoc.snapshot_json,
          hash_sha256: (consolidatedDoc as any).hash_sha256 ?? null,
          signature_metadata: (consolidatedDoc as any).signature_metadata ?? null,
          signature: null, // populated below if signed
        } : null,
      };
    },
    enabled: !!appointmentId,
  });
}
