import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getAppointmentMaterialsUsed,
  type AppointmentMaterialUsed,
} from "@/utils/getAppointmentMaterialsUsed";

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
  specialty_slug: string | null;
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
  clinic_id: string;
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
  // Specialty / extended blocks
  procedures_performed: PerformedProcedureRecord[];
  aesthetic_products: AestheticProductRecord[];
  before_after: BeforeAfterRecord[];
  facial_maps: FacialMapRecord[];
  odontogram: OdontogramRecord | null;
  materials_consumed: MaterialConsumedRecord[];
  /**
   * Lista unificada de materiais/produtos efetivamente utilizados no
   * atendimento. Reúne stock_movements, material_consumption,
   * aesthetic_products_used e fallback temporal. É a fonte recomendada
   * para exibir os materiais dentro de "Procedimentos Realizados".
   */
  materials_used: AppointmentMaterialUsed[];
  body_measurements: BodyMeasurementRecord[];
  addendums: AddendumRecord[];
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

export interface PerformedProcedureRecord {
  id: string;
  procedure_name: string;
  region: string | null;
  technique: string | null;
  notes: string | null;
  status: string;
  performed_at: string;
}

export interface AestheticProductRecord {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  manufacturer: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  application_area: string | null;
  procedure_type: string | null;
  registered_at: string;
}

export interface BeforeAfterRecord {
  id: string;
  title: string | null;
  description: string | null;
  view_angle: string | null;
  procedure_type: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  before_image_date: string | null;
  after_image_date: string | null;
  created_at: string;
  source: "aesthetic" | "general";
}

export interface FacialMapRecord {
  id: string;
  map_type: string | null;
  notes: string | null;
  created_at: string;
  applications: Array<{
    id: string;
    region: string | null;
    product_name: string | null;
    units: number | null;
    notes: string | null;
    data: any;
  }>;
}

export interface OdontogramRecord {
  id: string;
  data: any;
  created_at: string;
  updated_at: string;
  records: Array<{
    id: string;
    tooth_number: number;
    surface: string | null;
    condition: string;
    notes: string | null;
    created_at: string;
  }>;
}

export interface MaterialConsumedRecord {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface BodyMeasurementRecord {
  id: string;
  measurement_type: string;
  data: any;
  created_at: string;
}

export interface AddendumRecord {
  id: string;
  record_type: string;
  record_id: string;
  content: string;
  reason: string | null;
  module_origin: string | null;
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

// Helper: tries the request and returns [] on error (table may not exist or RLS blocks it)
async function safeQuery<T>(promise: PromiseLike<{ data: T | null; error: any }>): Promise<T | []> {
  try {
    const { data, error } = await promise;
    if (error) {
      // Table missing / RLS denied – degrade gracefully
      return [] as any;
    }
    return (data ?? ([] as any)) as T;
  } catch {
    return [] as any;
  }
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
          specialties(name, slug),
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
      const patientId = apt.patient_id;

      // 2. Fetch clinic info + clinical data in parallel
      const [
        { data: clinicData },
        { data: anamRecords },
        { data: evolRecords },
        { data: docRecords },
        { data: alertRecords },
        { data: mediaRecords },
        { data: consolidatedDoc },
        performedProceduresData,
        aestheticProductsData,
        aestheticBeforeAfterData,
        beforeAfterRecordsData,
        facialMapsData,
        odontogramData,
        stockMovementsData,
        bodyMeasurementsData,
        addendumsData,
      ] = await Promise.all([
        supabase.from("clinics").select("name, logo_url, phone, email, cnpj").eq("id", clinicId).maybeSingle(),
        supabase.from("anamnesis_records").select("id, status, data, responses, signed_at, created_at, template_id, anamnesis_templates(name)").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_evolutions").select("id, evolution_type, content, notes, status, signed_at, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_documents").select("id, document_type, title, status, signed_at, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_alerts").select("id, alert_type, severity, title, description, is_active, created_at").eq("appointment_id", appointmentId).eq("is_active", true).order("created_at"),
        supabase.from("clinical_media").select("id, file_url, file_type, file_name, classification, description, created_at").eq("appointment_id", appointmentId).order("created_at"),
        supabase.from("clinical_attendance_documents").select("id, status, is_locked, signed_at, generated_at, snapshot_json, hash_sha256, signature_metadata").eq("appointment_id", appointmentId).limit(1).maybeSingle(),
        // Specialty / extended blocks (degraded gracefully)
        safeQuery<any[]>(supabase.from("clinical_performed_procedures").select("id, procedure_name, region, technique, notes, status, performed_at").eq("appointment_id", appointmentId).order("performed_at")),
        safeQuery<any[]>(supabase.from("aesthetic_products_used").select("id, product_name, quantity, unit, manufacturer, batch_number, expiry_date, application_area, procedure_type, registered_at").eq("appointment_id", appointmentId).order("registered_at")),
        safeQuery<any[]>(supabase.from("aesthetic_before_after").select("id, title, description, view_angle, procedure_type, before_image_url, after_image_url, before_image_date, after_image_date, created_at").eq("appointment_id", appointmentId).order("created_at")),
        safeQuery<any[]>(supabase.from("before_after_records").select("id, category, notes, procedure_date, created_at, before_media:before_media_id(file_url, file_name), after_media:after_media_id(file_url, file_name)").eq("appointment_id", appointmentId).order("created_at")),
        safeQuery<any[]>(supabase.from("facial_maps").select("id, map_type, notes, created_at, facial_map_applications(id, region, product_name, units, notes, data)").eq("appointment_id", appointmentId).order("created_at")),
        safeQuery<any[]>(supabase.from("odontograms").select("id, data, created_at, updated_at, odontogram_records(id, tooth_number, surface, condition, notes, created_at)").eq("appointment_id", appointmentId).order("created_at", { ascending: false }).limit(1)),
        safeQuery<any[]>(supabase.from("stock_movements").select("id, product_id, quantity, unit_cost, notes, created_at, products:product_id(name, unit)").eq("reference_id", appointmentId).eq("reference_type", "appointment").order("created_at")),
        safeQuery<any[]>(supabase.from("body_measurements").select("id, measurement_type, data, created_at").eq("appointment_id", appointmentId).order("created_at")),
        safeQuery<any[]>(supabase.from("clinical_addendums").select("id, record_type, record_id, content, reason, module_origin, created_at").eq("patient_id", patientId).order("created_at")),
      ]);

      // 3. If consolidated doc is signed, fetch the latest signature row
      let latestSignature: any = null;
      if (consolidatedDoc?.id && consolidatedDoc?.signed_at) {
        const { data: sigRow } = await supabase
          .from("medical_record_signatures")
          .select("id, signed_by_name, sign_method, signature_hash, ip_address, user_agent, signed_at, evidence_snapshot")
          .eq("record_id", consolidatedDoc.id)
          .eq("record_type", "consolidated_document")
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        latestSignature = sigRow || null;
      }

      const session = Array.isArray(apt.appointment_sessions) ? apt.appointment_sessions[0] : apt.appointment_sessions;
      const startedAt = apt.started_at ? new Date(apt.started_at).getTime() : 0;
      const finishedAt = apt.finished_at ? new Date(apt.finished_at).getTime() : Date.now();
      const totalSeconds = Math.floor((finishedAt - startedAt) / 1000);
      const pausedSeconds = session?.total_paused_seconds || 0;

      // Filter addendums to only those that reference records of this appointment.
      // We keep addendums whose record_id matches one of the appointment's clinical records.
      const recordIdsInAppointment = new Set<string>([
        ...(anamRecords || []).map((r: any) => r.id),
        ...(evolRecords || []).map((r: any) => r.id),
        ...(docRecords || []).map((r: any) => r.id),
        ...(consolidatedDoc?.id ? [consolidatedDoc.id] : []),
      ]);
      const filteredAddendums = (addendumsData as any[]).filter((a: any) => recordIdsInAppointment.has(a.record_id));

      // Merge before/after sources
      const mergedBeforeAfter: BeforeAfterRecord[] = [
        ...(aestheticBeforeAfterData as any[]).map((r: any) => ({
          id: r.id,
          title: r.title || null,
          description: r.description || null,
          view_angle: r.view_angle || null,
          procedure_type: r.procedure_type || null,
          before_image_url: r.before_image_url || null,
          after_image_url: r.after_image_url || null,
          before_image_date: r.before_image_date || null,
          after_image_date: r.after_image_date || null,
          created_at: r.created_at,
          source: "aesthetic" as const,
        })),
        ...(beforeAfterRecordsData as any[]).map((r: any) => ({
          id: r.id,
          title: r.category || null,
          description: r.notes || null,
          view_angle: null,
          procedure_type: null,
          before_image_url: r.before_media?.file_url || null,
          after_image_url: r.after_media?.file_url || null,
          before_image_date: r.procedure_date || null,
          after_image_date: r.procedure_date || null,
          created_at: r.created_at,
          source: "general" as const,
        })),
      ];

      const odontogramRow = (odontogramData as any[])[0] || null;

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
        specialty_slug: (apt.specialties as any)?.slug || null,
        procedure_id: apt.procedure_id,
        procedure_name: (apt.procedures as any)?.name || null,
        effective_seconds: Math.max(0, totalSeconds - pausedSeconds),
        paused_seconds: pausedSeconds,
        session_summary: session?.session_summary || null,
        session_notes: session?.session_notes || null,
        amount_expected: apt.amount_expected || 0,
        amount_received: apt.amount_received || 0,
        payment_status: apt.payment_status || "pendente",
        clinic_id: clinicId,
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
        procedures_performed: (performedProceduresData as any[]).map((r: any) => ({
          id: r.id,
          procedure_name: r.procedure_name,
          region: r.region,
          technique: r.technique,
          notes: r.notes,
          status: r.status,
          performed_at: r.performed_at,
        })),
        aesthetic_products: (aestheticProductsData as any[]).map((r: any) => ({
          id: r.id,
          product_name: r.product_name,
          quantity: Number(r.quantity || 0),
          unit: r.unit || "un",
          manufacturer: r.manufacturer,
          batch_number: r.batch_number,
          expiry_date: r.expiry_date,
          application_area: r.application_area,
          procedure_type: r.procedure_type,
          registered_at: r.registered_at,
        })),
        before_after: mergedBeforeAfter,
        facial_maps: (facialMapsData as any[]).map((r: any) => ({
          id: r.id,
          map_type: r.map_type,
          notes: r.notes,
          created_at: r.created_at,
          applications: (r.facial_map_applications || []).map((a: any) => ({
            id: a.id,
            region: a.region,
            product_name: a.product_name,
            units: a.units != null ? Number(a.units) : null,
            notes: a.notes,
            data: a.data,
          })),
        })),
        odontogram: odontogramRow ? {
          id: odontogramRow.id,
          data: odontogramRow.data,
          created_at: odontogramRow.created_at,
          updated_at: odontogramRow.updated_at,
          records: (odontogramRow.odontogram_records || []).map((r: any) => ({
            id: r.id,
            tooth_number: r.tooth_number,
            surface: r.surface,
            condition: r.condition,
            notes: r.notes,
            created_at: r.created_at,
          })),
        } : null,
        materials_consumed: (stockMovementsData as any[]).map((r: any) => ({
          id: r.id,
          product_id: r.product_id,
          product_name: r.products?.name || null,
          quantity: Number(r.quantity || 0),
          unit: r.products?.unit || null,
          unit_cost: r.unit_cost != null ? Number(r.unit_cost) : null,
          notes: r.notes,
          created_at: r.created_at,
        })),
        body_measurements: (bodyMeasurementsData as any[]).map((r: any) => ({
          id: r.id,
          measurement_type: r.measurement_type,
          data: r.data,
          created_at: r.created_at,
        })),
        addendums: filteredAddendums.map((a: any) => ({
          id: a.id,
          record_type: a.record_type,
          record_id: a.record_id,
          content: a.content,
          reason: a.reason,
          module_origin: a.module_origin,
          created_at: a.created_at,
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
          signature: latestSignature,
        } : null,
      };
    },
    enabled: !!appointmentId,
  });
}
