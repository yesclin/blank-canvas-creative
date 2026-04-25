import { supabase } from '@/integrations/supabase/client';
import { generateHash } from '@/utils/documentControl';

/**
 * Builds a full clinical snapshot for a specific appointment and persists it
 * as an immutable `clinical_attendance_documents` record.
 *
 * This is the single source of truth for what happened in that session.
 */
export async function generateConsolidatedAttendanceDocument(appointmentId: string) {
  // 1. Check if a document already exists (idempotent)
  const { data: existing } = await supabase
    .from('clinical_attendance_documents')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (existing) return existing;

  // 2. Fetch appointment with relations
  const { data: apt, error: aptErr } = await supabase
    .from('appointments')
    .select(`
      *, 
      patients(full_name, birth_date, phone, cpf, email, gender),
      professionals(full_name),
      specialties(name),
      procedures(name)
    `)
    .eq('id', appointmentId)
    .single();

  if (aptErr || !apt) throw new Error('Agendamento não encontrado');

  const clinicId = apt.clinic_id;
  const patientId = apt.patient_id;

  // Helper: never throw if a specialty table doesn't exist or RLS blocks it.
  const safe = async <T,>(p: PromiseLike<{ data: T | null; error: any }>): Promise<T | []> => {
    try {
      const { data, error } = await p;
      if (error) return [] as any;
      return (data ?? ([] as any)) as T;
    } catch { return [] as any; }
  };

  // 3. Fetch clinic info + all clinical data in parallel
  const [
    { data: clinic },
    { data: anamnesisRecords },
    { data: evolutions },
    { data: clinicalDocs },
    { data: alerts },
    { data: media },
    { data: session },
    performedProcedures,
    aestheticProducts,
    aestheticBeforeAfter,
    facialMaps,
    odontogramRows,
    stockMovements,
    bodyMeasurements,
  ] = await Promise.all([
    supabase.from('clinics').select('name, logo_url, phone, email, cnpj, address').eq('id', clinicId).maybeSingle(),
    supabase.from('anamnesis_records')
      .select('id, status, data, responses, signed_at, created_at, template_id, anamnesis_templates(name)')
      .eq('appointment_id', appointmentId).order('created_at'),
    supabase.from('clinical_evolutions')
      .select('id, evolution_type, content, notes, status, signed_at, created_at')
      .eq('appointment_id', appointmentId).order('created_at'),
    supabase.from('clinical_documents')
      .select('id, document_type, title, content, status, signed_at, created_at')
      .eq('appointment_id', appointmentId).order('created_at'),
    supabase.from('clinical_alerts')
      .select('id, alert_type, severity, title, description, is_active, created_at')
      .eq('appointment_id', appointmentId).order('created_at'),
    supabase.from('clinical_media')
      .select('id, file_url, file_type, file_name, classification, description, created_at')
      .eq('appointment_id', appointmentId).order('created_at'),
    supabase.from('appointment_sessions')
      .select('total_paused_seconds, session_summary, session_notes, pause_events')
      .eq('appointment_id', appointmentId).maybeSingle(),
    safe<any[]>(supabase.from('clinical_performed_procedures').select('id, procedure_name, region, technique, notes, status, performed_at').eq('appointment_id', appointmentId).order('performed_at')),
    safe<any[]>(supabase.from('aesthetic_products_used').select('id, product_name, quantity, unit, manufacturer, batch_number, expiry_date, application_area, procedure_type, registered_at').eq('appointment_id', appointmentId).order('registered_at')),
    safe<any[]>(supabase.from('aesthetic_before_after').select('id, title, description, view_angle, procedure_type, before_image_url, after_image_url, before_image_date, after_image_date, created_at').eq('appointment_id', appointmentId).order('created_at')),
    safe<any[]>(supabase.from('facial_maps').select('id, map_type, notes, created_at, facial_map_applications(id, region, product_name, units, notes, data)').eq('appointment_id', appointmentId).order('created_at')),
    safe<any[]>(supabase.from('odontograms').select('id, data, created_at, updated_at, odontogram_records(id, tooth_number, surface, condition, notes, created_at)').eq('appointment_id', appointmentId).order('created_at', { ascending: false }).limit(1)),
    safe<any[]>(supabase.from('stock_movements').select('id, product_id, quantity, unit_cost, notes, created_at, products:product_id(name, unit)').eq('reference_id', appointmentId).eq('reference_type', 'appointment').order('created_at')),
    safe<any[]>(supabase.from('body_measurements').select('id, measurement_type, data, created_at').eq('appointment_id', appointmentId).order('created_at')),
  ]);

  const startedAt = apt.started_at || apt.created_at;
  const finishedAt = apt.finished_at || new Date().toISOString();
  const totalSec = Math.floor((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  const pausedSec = session?.total_paused_seconds || 0;

  // 4. Build immutable snapshot
  const snapshot = {
    version: 1,
    generated_at: new Date().toISOString(),

    // ─ Header / Clinic ─
    clinic: {
      name: clinic?.name || '',
      logo_url: clinic?.logo_url || null,
      phone: clinic?.phone || null,
      email: clinic?.email || null,
      cnpj: clinic?.cnpj || null,
      address: clinic?.address || null,
    },

    // ─ Appointment context ─
    appointment: {
      id: apt.id,
      scheduled_date: apt.scheduled_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      started_at: startedAt,
      finished_at: finishedAt,
      care_mode: apt.care_mode,
      duration_seconds: totalSec,
      paused_seconds: pausedSec,
      effective_seconds: Math.max(0, totalSec - pausedSec),
      notes: apt.notes,
    },

    // ─ Patient ─
    patient: {
      id: apt.patient_id,
      full_name: (apt.patients as any)?.full_name || 'Paciente',
      birth_date: (apt.patients as any)?.birth_date || null,
      phone: (apt.patients as any)?.phone || null,
      cpf: (apt.patients as any)?.cpf || null,
      email: (apt.patients as any)?.email || null,
      gender: (apt.patients as any)?.gender || null,
    },

    // ─ Professional ─
    professional: {
      id: apt.professional_id,
      full_name: (apt.professionals as any)?.full_name || 'Profissional',
    },

    // ─ Specialty & Procedure ─
    specialty: {
      id: apt.specialty_id,
      name: (apt.specialties as any)?.name || null,
    },
    procedure: {
      id: apt.procedure_id,
      name: (apt.procedures as any)?.name || null,
    },

    // ─ Clinical blocks ─
    anamnesis: (anamnesisRecords || []).map((r: any) => ({
      id: r.id,
      template_name: r.anamnesis_templates?.name || null,
      status: r.status,
      responses: r.responses || r.data || {},
      signed_at: r.signed_at,
      created_at: r.created_at,
    })),

    evolutions: (evolutions || []).map((r: any) => ({
      id: r.id,
      evolution_type: r.evolution_type,
      content: r.content,
      notes: r.notes,
      status: r.status,
      signed_at: r.signed_at,
      created_at: r.created_at,
    })),

    documents: (clinicalDocs || []).map((r: any) => ({
      id: r.id,
      document_type: r.document_type,
      title: r.title,
      content: r.content,
      status: r.status,
      signed_at: r.signed_at,
      created_at: r.created_at,
    })),

    alerts: (alerts || []).map((r: any) => ({
      id: r.id,
      alert_type: r.alert_type,
      severity: r.severity,
      title: r.title,
      description: r.description,
      is_active: r.is_active,
      created_at: r.created_at,
    })),

    media: (media || []).map((r: any) => ({
      id: r.id,
      file_url: r.file_url,
      file_type: r.file_type,
      file_name: r.file_name,
      classification: r.classification,
      description: r.description,
      created_at: r.created_at,
    })),

    // ─ Session notes ─
    session_notes: session?.session_notes || null,

    // ─ Financial ─
    financial: {
      payment_status: apt.payment_status || 'pendente',
      amount_expected: apt.amount_expected || 0,
      amount_received: apt.amount_received || 0,
    },
  };

  // 5. Hash the snapshot for integrity
  const snapshotStr = JSON.stringify(snapshot);
  const hash = await generateHash(snapshotStr);

  // 6. Get current user
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  const now = new Date().toISOString();

  // 7. Persist
  const title = `Documento Consolidado – ${(apt.patients as any)?.full_name || 'Paciente'} – ${apt.scheduled_date}`;

  const { data: doc, error: insertErr } = await supabase
    .from('clinical_attendance_documents')
    .insert({
      appointment_id: appointmentId,
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: apt.professional_id,
      specialty_id: apt.specialty_id || null,
      procedure_id: apt.procedure_id || null,
      document_type: 'consolidated',
      title,
      status: 'generated',
      snapshot_json: snapshot as any,
      render_version: 1,
      generated_at: now,
      generated_by: userId,
      is_locked: true,
      locked_at: now,
      hash_sha256: hash,
    })
    .select('id')
    .single();

  if (insertErr) throw new Error(`Erro ao gerar documento consolidado: ${insertErr.message}`);

  return doc;
}
