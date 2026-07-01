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

      // Resolve fallback: if active specialty is "other_specialty" (Atendimento Geral /
      // Outras Especialidades — used to host custom specialties like Quiropraxia),
      // also include templates from "geral" (Clínica Geral) as fallback.
      const specialtyIds: string[] = [specialtyId];
      const { data: currentSpecialty } = await supabase
        .from("specialties")
        .select("id, slug, name")
        .eq("id", specialtyId)
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


      console.log("[useResolvedAnamnesisTemplate] clinicId:", clinic.id);
      console.log("[useResolvedAnamnesisTemplate] specialty atual:", currentSpecialty);
      console.log("[useResolvedAnamnesisTemplate] specialty slug:", currentSpecialty?.slug);
      console.log("[useResolvedAnamnesisTemplate] isCustomSpecialty:", isCustomSpecialty);
      console.log("[useResolvedAnamnesisTemplate] specialtyIds a consultar:", specialtyIds);

      const { data: templates, error } = await supabase
        .from("anamnesis_templates")
        .select("id, name, description, specialty_id, procedure_id, is_default, is_system, system_locked, current_version_id, campos")
        .in("specialty_id", specialtyIds)
        .eq("is_active", true)
        .eq("archived", false)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`)
        .order("is_system", { ascending: false })
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching templates for resolution:", error);
        return null;
      }

      console.log("[useResolvedAnamnesisTemplate] modelos encontrados:", templates?.length ?? 0, templates);

      if (!templates || templates.length === 0) return null;

      // Filtra apenas modelos LIBERADOS para esta clínica em `clinic_resources`.
      // Convenção do catálogo: resource_key = 'tpl:anamnesis:<template_id>'.
      const templateIds = templates.map((t) => t.id);
      const keys = templateIds.map((id) => `tpl:anamnesis:${id}`);
      const { data: enabledRows } = await supabase
        .from("clinic_resources")
        .select("resource_key")
        .eq("clinic_id", clinic.id)
        .eq("enabled", true)
        .in("resource_key", keys);
      const enabledSet = new Set((enabledRows ?? []).map((r) => r.resource_key));
      const allowed = templates.filter((t) => enabledSet.has(`tpl:anamnesis:${t.id}`));
      console.log("[useResolvedAnamnesisTemplate] liberados para a clínica:", allowed.length, "de", templates.length);

      if (allowed.length === 0) return null;



      // Build options list
      const allTemplates: TemplateOption[] = allowed.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        procedure_id: t.procedure_id,
        is_default: t.is_default,
        is_system: t.is_system,
        system_locked: !!(t as any).system_locked,
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
          .single();

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
        .single();

      if (!full) return null;

      let structure: Json = full.campos || [];
      let versionNumber: number | null = null;

      if (full.current_version_id) {
        const { data: ver } = await supabase
          .from("anamnesis_template_versions")
          .select("structure, version_number")
          .eq("id", full.current_version_id)
          .single();

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
