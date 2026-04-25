import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
export type GlobalSearchResultType =
  | "patient"
  | "clinical_data"
  | "anamnesis"
  | "evolution"
  | "alert"
  | "document"
  | "media"
  | "aesthetic_product"
  | "facial_map"
  | "before_after"
  | "odontogram"
  | "measurement";

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  snippet: string;
  matchedText: string;
  date: string;
  specialty?: string | null;
  appointmentId?: string | null;
  sourceTable: string;
  sourceRecordId: string;
  /** Tab key used by the prontuário UI to navigate to the right tab */
  navigationTarget: string;
}

export interface UseProntuarioGlobalSearchResult {
  results: GlobalSearchResult[];
  groupedResults: Record<GlobalSearchResultType, GlobalSearchResult[]>;
  isLoading: boolean;
  totalResults: number;
  /** True when the term hasn't reached the minimum length (2 chars) */
  isIdle: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/** Normalize text for case/accent-insensitive matching. */
export function normalizeText(input: unknown): string {
  if (input == null) return "";
  const str = typeof input === "string" ? input : String(input);
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Recursively flatten any JSONB / array / object into a single searchable text blob. */
export function jsonbToSearchableText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => jsonbToSearchableText(v)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((v) => jsonbToSearchableText(v))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

/** Build a snippet around the matched index with surrounding context. */
function buildSnippet(text: string, normalizedText: string, normalizedTerm: string): string {
  const idx = normalizedText.indexOf(normalizedTerm);
  if (idx < 0) {
    // Fallback: first 160 chars
    return text.slice(0, 160) + (text.length > 160 ? "…" : "");
  }
  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + normalizedTerm.length + 110);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

interface MatchInput {
  text: string;
  normalizedTerm: string;
}

function matches({ text, normalizedTerm }: MatchInput): boolean {
  if (!normalizedTerm) return false;
  return normalizeText(text).includes(normalizedTerm);
}

// Use debounced term: 300ms
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────
export function useProntuarioGlobalSearch(
  patientId: string | null | undefined,
  searchTerm: string
): UseProntuarioGlobalSearchResult {
  const { clinic } = useClinicData();
  const debouncedTerm = useDebounced(searchTerm.trim(), 300);
  const enabled = !!patientId && !!clinic?.id && debouncedTerm.length >= 2;

  const query = useQuery({
    queryKey: ["prontuario-global-search", clinic?.id, patientId],
    enabled: !!patientId && !!clinic?.id,
    staleTime: 30_000,
    queryFn: async () => {
      if (!patientId || !clinic?.id) {
        return {
          patient: null,
          clinicalData: null,
          anamneses: [] as any[],
          evolutions: [] as any[],
          alerts: [] as any[],
          documents: [] as any[],
          media: [] as any[],
          aestheticProducts: [] as any[],
          facialMaps: [] as any[],
          facialMapApplications: [] as any[],
          beforeAfter: [] as any[],
          odontogramTeeth: [] as any[],
          odontogramRecords: [] as any[],
          measurements: [] as any[],
        };
      }

      // Fetch all sources in parallel. Each source individually scoped by clinic + patient.
      const [
        patientRes,
        clinicalDataRes,
        anamnesesRes,
        evolutionsRes,
        alertsRes,
        documentsRes,
        mediaRes,
        aestheticProductsRes,
        facialMapsRes,
        beforeAfterRes,
        odontogramsRes,
        measurementsRes,
      ] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name, cpf, phone, email, notes, clinical_alert_text")
          .eq("id", patientId)
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
        supabase
          .from("patient_clinical_data")
          .select("*")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
        supabase
          .from("anamnesis_records")
          .select("id, responses, structure_snapshot, data, specialty_id, appointment_id, created_at, status, template_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("clinical_evolutions")
          .select("id, content, notes, evolution_type, specialty_id, appointment_id, created_at, status")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("clinical_alerts")
          .select("id, title, description, alert_type, severity, is_active, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("clinical_documents")
          .select("id, document_type, document_reference, patient_name, professional_name, title, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("clinical_media")
          .select("id, file_name, description, category, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("aesthetic_products_used")
          .select("id, product_name, manufacturer, batch_number, application_area, procedure_type, procedure_description, notes, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("facial_maps")
          .select("id, map_type, notes, data, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("aesthetic_before_after")
          .select("id, title, description, view_angle, procedure_type, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
        // Odontograms scoped by patient (we then load teeth/records via odontogram ids)
        supabase
          .from("odontograms")
          .select("id, created_at")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .limit(20),
        supabase
          .from("body_measurements")
          .select("id, measurement_type, data, created_at, appointment_id")
          .eq("patient_id", patientId)
          .eq("clinic_id", clinic.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      // Resolve facial map applications and odontogram children in a second pass
      const facialMapIds: string[] = (facialMapsRes.data || []).map((m: any) => m.id);
      const odontogramIds: string[] = (odontogramsRes.data || []).map((o: any) => o.id);

      const [facialMapApplicationsRes, odontogramTeethRes, odontogramRecordsRes] = await Promise.all([
        facialMapIds.length
          ? supabase
              .from("facial_map_applications")
              .select("id, facial_map_id, product_name, region, units, notes, data, created_at")
              .in("facial_map_id", facialMapIds)
          : Promise.resolve({ data: [], error: null } as any),
        odontogramIds.length
          ? supabase
              .from("odontogram_teeth")
              .select("id, odontogram_id, tooth_number, status, conditions, notes, updated_at")
              .in("odontogram_id", odontogramIds)
          : Promise.resolve({ data: [], error: null } as any),
        odontogramIds.length
          ? supabase
              .from("odontogram_records")
              .select("id, odontogram_id, tooth_number, surface, condition, notes, created_at")
              .in("odontogram_id", odontogramIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      return {
        patient: patientRes.data,
        clinicalData: clinicalDataRes.data,
        anamneses: anamnesesRes.data || [],
        evolutions: evolutionsRes.data || [],
        alerts: alertsRes.data || [],
        documents: documentsRes.data || [],
        media: mediaRes.data || [],
        aestheticProducts: aestheticProductsRes.data || [],
        facialMaps: facialMapsRes.data || [],
        facialMapApplications: facialMapApplicationsRes.data || [],
        beforeAfter: beforeAfterRes.data || [],
        odontogramTeeth: odontogramTeethRes.data || [],
        odontogramRecords: odontogramRecordsRes.data || [],
        measurements: measurementsRes.data || [],
      };
    },
  });

  const results = useMemo<GlobalSearchResult[]>(() => {
    if (!enabled || !query.data) return [];
    const normalizedTerm = normalizeText(debouncedTerm);
    if (!normalizedTerm) return [];

    const out: GlobalSearchResult[] = [];

    const push = (
      payload: Omit<GlobalSearchResult, "matchedText"> & { rawText: string }
    ) => {
      const { rawText, ...rest } = payload;
      out.push({
        ...rest,
        matchedText: debouncedTerm,
        snippet: buildSnippet(rawText, normalizeText(rawText), normalizedTerm),
      });
    };

    // 1. Patient cadastral data
    const p = query.data.patient as any;
    if (p) {
      const fields: Array<[string, string | null | undefined]> = [
        ["Nome", p.full_name],
        ["CPF", p.cpf],
        ["Telefone", p.phone],
        ["E-mail", p.email],
        ["Observações", p.notes],
        ["Alerta cadastrado", p.clinical_alert_text],
      ];
      for (const [label, val] of fields) {
        if (val && matches({ text: val, normalizedTerm })) {
          push({
            id: `patient-${label}`,
            type: "patient",
            title: `Dados do paciente — ${label}`,
            snippet: val,
            rawText: val,
            date: new Date().toISOString(),
            sourceTable: "patients",
            sourceRecordId: p.id,
            navigationTarget: "resumo",
          });
        }
      }
    }

    // 2. Clinical data
    const cd = query.data.clinicalData as any;
    if (cd) {
      const groups: Array<[string, unknown]> = [
        ["Alergias", cd.allergies],
        ["Doenças crônicas", cd.chronic_diseases],
        ["Medicamentos em uso", cd.current_medications],
        ["Histórico familiar", cd.family_history],
        ["Restrições clínicas", cd.clinical_restrictions],
        ["Tipo sanguíneo", cd.blood_type],
      ];
      for (const [label, val] of groups) {
        const text = jsonbToSearchableText(val);
        if (text && matches({ text, normalizedTerm })) {
          push({
            id: `cdata-${label}`,
            type: "clinical_data",
            title: `Dados clínicos — ${label}`,
            snippet: text,
            rawText: text,
            date: cd.updated_at || cd.created_at || new Date().toISOString(),
            sourceTable: "patient_clinical_data",
            sourceRecordId: cd.id,
            navigationTarget: "resumo",
          });
        }
      }
    }

    // 3. Anamneses
    for (const a of query.data.anamneses as any[]) {
      const text = [
        jsonbToSearchableText(a.responses),
        jsonbToSearchableText(a.data),
        jsonbToSearchableText(a.structure_snapshot),
      ]
        .filter(Boolean)
        .join(" ");
      if (text && matches({ text, normalizedTerm })) {
        push({
          id: `anamnese-${a.id}`,
          type: "anamnesis",
          title: "Anamnese",
          snippet: text,
          rawText: text,
          date: a.created_at,
          appointmentId: a.appointment_id,
          sourceTable: "anamnesis_records",
          sourceRecordId: a.id,
          navigationTarget: "anamnese",
        });
      }
    }

    // 4. Evolutions
    for (const e of query.data.evolutions as any[]) {
      const text = [
        jsonbToSearchableText(e.content),
        e.notes,
        e.evolution_type,
      ]
        .filter(Boolean)
        .join(" ");
      if (text && matches({ text, normalizedTerm })) {
        push({
          id: `evol-${e.id}`,
          type: "evolution",
          title: e.evolution_type ? `Evolução — ${e.evolution_type}` : "Evolução",
          snippet: text,
          rawText: text,
          date: e.created_at,
          appointmentId: e.appointment_id,
          sourceTable: "clinical_evolutions",
          sourceRecordId: e.id,
          navigationTarget: "evolucao",
        });
      }
    }

    // 5. Alerts
    for (const al of query.data.alerts as any[]) {
      const text = [al.title, al.description, al.alert_type, al.severity].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `alert-${al.id}`,
          type: "alert",
          title: al.title || "Alerta",
          snippet: al.description || al.alert_type || "",
          rawText: text,
          date: al.created_at,
          appointmentId: al.appointment_id,
          sourceTable: "clinical_alerts",
          sourceRecordId: al.id,
          navigationTarget: "alertas",
        });
      }
    }

    // 6. Documents
    for (const d of query.data.documents as any[]) {
      const text = [d.title, d.document_type, d.document_reference, d.patient_name, d.professional_name]
        .filter(Boolean)
        .join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `doc-${d.id}`,
          type: "document",
          title: d.title || d.document_type || "Documento",
          snippet: [d.document_type, d.document_reference].filter(Boolean).join(" • "),
          rawText: text,
          date: d.created_at,
          appointmentId: d.appointment_id,
          sourceTable: "clinical_documents",
          sourceRecordId: d.id,
          navigationTarget: "documentos",
        });
      }
    }

    // 7. Media / files
    for (const m of query.data.media as any[]) {
      const text = [m.file_name, m.description, m.category].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `media-${m.id}`,
          type: "media",
          title: m.file_name || "Arquivo",
          snippet: m.description || m.category || "",
          rawText: text,
          date: m.created_at,
          appointmentId: m.appointment_id,
          sourceTable: "clinical_media",
          sourceRecordId: m.id,
          navigationTarget: m.category === "image" ? "imagens" : "documentos",
        });
      }
    }

    // 8. Aesthetic products used
    for (const ap of query.data.aestheticProducts as any[]) {
      const text = [
        ap.product_name,
        ap.manufacturer,
        ap.batch_number,
        ap.application_area,
        ap.procedure_type,
        ap.procedure_description,
        ap.notes,
      ]
        .filter(Boolean)
        .join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `aprod-${ap.id}`,
          type: "aesthetic_product",
          title: ap.product_name || "Produto utilizado",
          snippet: [ap.batch_number && `Lote ${ap.batch_number}`, ap.manufacturer, ap.application_area]
            .filter(Boolean)
            .join(" • "),
          rawText: text,
          date: ap.created_at,
          appointmentId: ap.appointment_id,
          sourceTable: "aesthetic_products_used",
          sourceRecordId: ap.id,
          navigationTarget: "produtos_utilizados",
        });
      }
    }

    // 9. Facial maps
    for (const fm of query.data.facialMaps as any[]) {
      const text = [fm.notes, fm.map_type, jsonbToSearchableText(fm.data)].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `fmap-${fm.id}`,
          type: "facial_map",
          title: `Mapa Facial${fm.map_type ? ` — ${fm.map_type}` : ""}`,
          snippet: fm.notes || fm.map_type || "",
          rawText: text,
          date: fm.created_at,
          appointmentId: fm.appointment_id,
          sourceTable: "facial_maps",
          sourceRecordId: fm.id,
          navigationTarget: "mapa_facial",
        });
      }
    }

    // 9b. Facial map applications (linked to a map)
    for (const app of query.data.facialMapApplications as any[]) {
      const text = [app.product_name, app.region, app.notes, jsonbToSearchableText(app.data)]
        .filter(Boolean)
        .join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `fmapapp-${app.id}`,
          type: "facial_map",
          title: `Aplicação — ${app.product_name || "produto"}`,
          snippet: [app.region, app.units != null && `${app.units}U`].filter(Boolean).join(" • "),
          rawText: text,
          date: app.created_at,
          sourceTable: "facial_map_applications",
          sourceRecordId: app.id,
          navigationTarget: "mapa_facial",
        });
      }
    }

    // 9c. Before/after
    for (const ba of query.data.beforeAfter as any[]) {
      const text = [ba.title, ba.description, ba.view_angle, ba.procedure_type].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `ba-${ba.id}`,
          type: "before_after",
          title: ba.title || "Antes / Depois",
          snippet: [ba.procedure_type, ba.view_angle].filter(Boolean).join(" • "),
          rawText: text,
          date: ba.created_at,
          appointmentId: ba.appointment_id,
          sourceTable: "aesthetic_before_after",
          sourceRecordId: ba.id,
          navigationTarget: "antes_depois",
        });
      }
    }

    // 10. Odontogram teeth
    for (const t of query.data.odontogramTeeth as any[]) {
      const text = [
        `Dente ${t.tooth_number}`,
        t.status,
        t.notes,
        jsonbToSearchableText(t.conditions),
      ]
        .filter(Boolean)
        .join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `tooth-${t.id}`,
          type: "odontogram",
          title: `Odontograma — Dente ${t.tooth_number}`,
          snippet: [t.status, t.notes].filter(Boolean).join(" • "),
          rawText: text,
          date: t.updated_at || new Date().toISOString(),
          sourceTable: "odontogram_teeth",
          sourceRecordId: t.id,
          navigationTarget: "odontograma",
        });
      }
    }

    // 10b. Odontogram records
    for (const r of query.data.odontogramRecords as any[]) {
      const text = [`Dente ${r.tooth_number}`, r.surface, r.condition, r.notes].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `oreg-${r.id}`,
          type: "odontogram",
          title: `Odontograma — Dente ${r.tooth_number}`,
          snippet: [r.condition, r.surface, r.notes].filter(Boolean).join(" • "),
          rawText: text,
          date: r.created_at,
          sourceTable: "odontogram_records",
          sourceRecordId: r.id,
          navigationTarget: "odontograma",
        });
      }
    }

    // 11. Body measurements (Nutrição/Pediatria)
    for (const m of query.data.measurements as any[]) {
      const text = [m.measurement_type, jsonbToSearchableText(m.data)].filter(Boolean).join(" ");
      if (matches({ text, normalizedTerm })) {
        push({
          id: `meas-${m.id}`,
          type: "measurement",
          title: `Medida — ${m.measurement_type}`,
          snippet: jsonbToSearchableText(m.data).slice(0, 160),
          rawText: text,
          date: m.created_at,
          appointmentId: m.appointment_id,
          sourceTable: "body_measurements",
          sourceRecordId: m.id,
          navigationTarget: "antropometria",
        });
      }
    }

    // Sort newest first
    out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return out;
  }, [enabled, query.data, debouncedTerm]);

  const groupedResults = useMemo(() => {
    const groups = {} as Record<GlobalSearchResultType, GlobalSearchResult[]>;
    for (const r of results) {
      (groups[r.type] ||= []).push(r);
    }
    return groups;
  }, [results]);

  return {
    results,
    groupedResults,
    isLoading: enabled && (query.isLoading || query.isFetching),
    totalResults: results.length,
    isIdle: !enabled,
  };
}
