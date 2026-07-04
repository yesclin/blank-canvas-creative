import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import type { Json } from "@/integrations/supabase/types";

export interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  procedure_id: string | null;
  is_default: boolean;
  is_system: boolean;
  system_locked: boolean;
  current_version_id: string | null;
}

export interface ResolvedTemplate {
  id: string;
  name: string;
  description: string | null;
  specialty_id: string | null;
  procedure_id: string | null;
  is_default: boolean;
  is_system: boolean;
  current_version_id: string | null;
  campos: Json;
  /** The resolved structure from the current version (preferred over campos) */
  structure: Json;
  version_number: number | null;
  /** How the template was resolved */
  resolution: "procedure" | "default" | "fallback";
}

interface ResolvedResult {
  resolved: ResolvedTemplate;
  allTemplates: TemplateOption[];
}

interface EnabledAnamnesisResource {
  resource_id: string | null;
  resource_key: string;
  specialty_id: string | null;
}

interface AnamnesisTemplateRow {
  id: string;
  name: string;
  description: string | null;
  specialty_id: string | null;
  procedure_id: string | null;
  is_default: boolean;
  is_system: boolean;
  system_locked: boolean;
  current_version_id: string | null;
  campos: Json;
}

const ANAMNESIS_RESOURCE_TYPES = ["anamnesis_model", "anamnese"];
const GENERIC_SPECIALTY_SLUGS = new Set([
  "geral",
  "other_specialty",
  "outras_especialidades",
  "atendimento_geral",
  "custom",
]);

/**
 * Resolves the correct anamnesis template for an active appointment.
 *
 * Priority:
 * 1. Template linked to the appointment's procedure_id (procedure-specific)
 * 2. Default template for the specialty (is_default = true)
 * 3. First active template for the specialty (fallback)
 *
 * Also returns the full list of active templates so a selector can be shown
 * when multiple templates exist.
 */
export function useResolvedAnamnesisTemplate(
  specialtyId: string | null | undefined,
  procedureId: string | null | undefined
) {
  const { clinic } = useClinicData();

  const query = useQuery({
    queryKey: ["resolved-anamnesis-template", clinic?.id, specialtyId, procedureId],
    queryFn: async (): Promise<ResolvedResult | null> => {
      if (!clinic?.id || !specialtyId) return null;

      // Resolve fallback only when there is no manual liberation for the active
      // clinic/specialty. The displayed alias (ex.: "Quiropraxia") is ignored:
      // the active specialty UUID is the source of truth.
      const specialtyIds: string[] = [specialtyId];
      const { data: currentSpecialty } = await supabase
        .from("specialties")
        .select("id, slug, name")
        .eq("id", specialtyId)
        .limit(1)
        .maybeSingle();

      const isCustomSpecialty =
        currentSpecialty?.slug === "other_specialty" ||
        currentSpecialty?.slug === "outras_especialidades" ||
        currentSpecialty?.slug === "atendimento_geral" ||
        currentSpecialty?.slug === "custom";
      if (isCustomSpecialty) {
        const { data: fallbacks } = await supabase
          .from("specialties")
          .select("id, slug")
          .in("slug", ["geral", "other_specialty", "outras_especialidades", "atendimento_geral", "custom"]);
        (fallbacks ?? []).forEach((s) => {
          if (s.id && !specialtyIds.includes(s.id)) specialtyIds.push(s.id);
        });
      }


      // 1) Modelos liberados EXPLICITAMENTE em Recursos da Clínica.
      //    Filtro obrigatório: clínica atual + tipo de modelo de anamnese +
      //    status ativo + specialty_id real do atendimento/clínica.
      const nowIso = new Date().toISOString();
      const { data: enabledRows, error: enabledError } = await supabase
        .from("clinic_resources")
        .select("resource_id, resource_key, specialty_id")
        .eq("clinic_id", clinic.id)
        .in("resource_type", ANAMNESIS_RESOURCE_TYPES)
        .eq("enabled", true)
        .eq("specialty_id", specialtyId)
        .lte("effective_at", nowIso)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

      if (enabledError) {
        console.error("Error fetching enabled anamnesis resources:", enabledError);
        return null;
      }

      const enabledTemplateIds = new Set<string>();
      ((enabledRows ?? []) as EnabledAnamnesisResource[]).forEach((r) => {
        if (r.resource_id) enabledTemplateIds.add(r.resource_id);
        // Fallback: extrai UUID do sufixo do resource_key (tpl:*:<uuid>)
        if (typeof r.resource_key === "string") {
          const m = r.resource_key.match(/([0-9a-f-]{36})$/i);
          if (m) enabledTemplateIds.add(m[1]);
        }
      });

      // 2) Se o Superadmin liberou algum modelo para esta clínica,
      //    esses são a fonte. Não usar fallback fixo quando há liberação
      //    manual para a especialidade ativa.
      let allowed: AnamnesisTemplateRow[] = [];
      const hasManualLiberation = (enabledRows?.length ?? 0) > 0;
      if (hasManualLiberation) {
        if (enabledTemplateIds.size === 0) return null;
        const { data: enabledTemplates, error: eTplErr } = await supabase
          .from("anamnesis_templates")
          .select("id, name, description, specialty_id, procedure_id, is_default, is_system, system_locked, current_version_id, campos")
          .in("id", Array.from(enabledTemplateIds))
          .eq("is_active", true)
          .eq("archived", false)
          .order("is_system", { ascending: false })
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });
        if (eTplErr) console.error("Error fetching enabled templates:", eTplErr);
        allowed = (enabledTemplates ?? []) as AnamnesisTemplateRow[];
      } else {
        // 3) Compatibilidade: nenhuma liberação manual foi feita para esta
        //    clínica/especialidade. Só então permite o fallback legado.
        const specialtyFilter = isCustomSpecialty
          ? specialtyIds
          : specialtyIds.filter((id) => !GENERIC_SPECIALTY_SLUGS.has(currentSpecialty?.slug ?? "") || id === specialtyId);
        const { data: templates, error } = await supabase
          .from("anamnesis_templates")
          .select("id, name, description, specialty_id, procedure_id, is_default, is_system, system_locked, current_version_id, campos")
          .in("specialty_id", specialtyFilter)
          .eq("is_active", true)
          .eq("archived", false)
          .order("is_system", { ascending: false })
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });
        if (error) {
          console.error("Error fetching templates for resolution:", error);
          return null;
        }
        allowed = (templates ?? []) as AnamnesisTemplateRow[];
      }

      if (allowed.length === 0) return null;




      // Build options list
      const allTemplates: TemplateOption[] = allowed.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        procedure_id: t.procedure_id,
        is_default: t.is_default,
        is_system: t.is_system,
        system_locked: !!t.system_locked,
        current_version_id: t.current_version_id,
      }));

      // Resolve priority
      let resolved = procedureId
        ? allowed.find((t) => t.procedure_id === procedureId)
        : undefined;
      let resolution: ResolvedTemplate["resolution"] = "procedure";

      if (!resolved) {
        resolved = allowed.find((t) => t.is_default);
        resolution = "default";
      }

      if (!resolved) {
        resolved = allowed[0];
        resolution = "fallback";
      }

      // Load version structure
      let structure: Json = resolved.campos || [];
      let versionNumber: number | null = null;

      if (resolved.current_version_id) {
        const { data: ver } = await supabase
          .from("anamnesis_template_versions")
          .select("structure, version_number")
          .eq("id", resolved.current_version_id)
          .limit(1)
          .maybeSingle();

        if (ver) {
          structure = ver.structure;
          versionNumber = ver.version_number;
        }
      }

      return {
        resolved: {
          id: resolved.id,
          name: resolved.name,
          description: resolved.description,
          specialty_id: resolved.specialty_id,
          procedure_id: resolved.procedure_id,
          is_default: resolved.is_default,
          is_system: resolved.is_system,
          current_version_id: resolved.current_version_id,
          campos: resolved.campos,
          structure,
          version_number: versionNumber,
          resolution,
        },
        allTemplates,
      };
    },
    enabled: !!clinic?.id && !!specialtyId,
    staleTime: 60_000,
  });

  return {
    data: query.data?.resolved || null,
    allTemplates: query.data?.allTemplates || [],
    hasMultipleTemplates: (query.data?.allTemplates?.length || 0) > 1,
    isLoading: query.isLoading,
    /** Load a specific template by ID (for manual selection) */
    loadTemplateById: async (templateId: string): Promise<ResolvedTemplate | null> => {
      const template = query.data?.allTemplates.find((t) => t.id === templateId);
      if (!template) return null;

      // Fetch full data
      const { data: full } = await supabase
        .from("anamnesis_templates")
        .select("*")
        .eq("id", templateId)
        .limit(1)
        .maybeSingle();

      if (!full) return null;

      let structure: Json = full.campos || [];
      let versionNumber: number | null = null;

      if (full.current_version_id) {
        const { data: ver } = await supabase
          .from("anamnesis_template_versions")
          .select("structure, version_number")
          .eq("id", full.current_version_id)
          .limit(1)
          .maybeSingle();

        if (ver) {
          structure = ver.structure;
          versionNumber = ver.version_number;
        }
      }

      return {
        id: full.id,
        name: full.name,
        description: full.description,
        specialty_id: full.specialty_id,
        procedure_id: full.procedure_id,
        is_default: full.is_default,
        is_system: full.is_system,
        current_version_id: full.current_version_id,
        campos: full.campos,
        structure,
        version_number: versionNumber,
        resolution: "default",
      };
    },
  };
}
