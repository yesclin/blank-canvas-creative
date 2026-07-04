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
  templates: ResolvedTemplate[];
}

interface EnabledAnamnesisTemplateRow {
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
  structure: Json;
  version_number: number | null;
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

      // Fonte única do seletor: Recursos da Clínica.
      // Não há fallback para modelo padrão/global/plataforma aqui: se o Super
      // Admin liberou 5 modelos em clinic_resources, apenas esses 5 aparecem.
      const { data, error } = await supabase.rpc(
        "get_enabled_anamnesis_templates_for_prontuario",
        { p_clinic_id: clinic.id, p_specialty_id: specialtyId },
      );

      if (error) {
        console.error("Error fetching enabled anamnesis templates:", error);
        return null;
      }

      const allowed = ((data ?? []) as EnabledAnamnesisTemplateRow[])
        .filter((t, index, arr) => arr.findIndex((x) => x.id === t.id) === index)
        .sort((a, b) => {
          if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          return a.name.localeCompare(b.name, "pt-BR");
        });

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

      const templates: ResolvedTemplate[] = allowed.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        specialty_id: t.specialty_id,
        procedure_id: t.procedure_id,
        is_default: t.is_default,
        is_system: t.is_system,
        current_version_id: t.current_version_id,
        campos: t.campos,
        structure: t.structure || t.campos || [],
        version_number: t.version_number,
        resolution: "fallback",
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

      return {
        resolved: {
          ...resolved,
          resolution,
        },
        allTemplates,
        templates: templates.map((t) => (
          t.id === resolved.id ? { ...t, resolution } : t
        )),
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
      return query.data?.templates.find((t) => t.id === templateId) ?? null;
    },
  };
}
