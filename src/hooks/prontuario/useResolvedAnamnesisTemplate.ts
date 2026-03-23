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

      const { data: templates, error } = await supabase
        .from("anamnesis_templates")
        .select("id, name, description, specialty_id, procedure_id, is_default, is_system, current_version_id, campos")
        .eq("specialty_id", specialtyId)
        .eq("is_active", true)
        .eq("archived", false)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching templates for resolution:", error);
        return null;
      }

      if (!templates || templates.length === 0) return null;

      // Build options list
      const allTemplates: TemplateOption[] = templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        procedure_id: t.procedure_id,
        is_default: t.is_default,
        is_system: t.is_system,
        current_version_id: t.current_version_id,
      }));

      // Resolve priority
      let resolved = procedureId
        ? templates.find((t) => t.procedure_id === procedureId)
        : undefined;
      let resolution: ResolvedTemplate["resolution"] = "procedure";

      if (!resolved) {
        resolved = templates.find((t) => t.is_default);
        resolution = "default";
      }

      if (!resolved) {
        resolved = templates[0];
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
