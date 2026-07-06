import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import type { TabKey } from "@/hooks/prontuario/useMedicalRecordPermissions";
import type { ClinicalBlockKey } from "./specialtyTabsConfig";
import { getClinicalBlockLabel, getVisibleTabsForSpecialty } from "./specialtyTabsConfig";
import type { SpecialtyKey } from "./useActiveSpecialty";
import {
  doesResourceApplyToSpecialty,
  getEnabledProntuarioTabs,
  getProntuarioResourceTab,
  isProntuarioResourceActive,
  normalizeProntuarioFeatureKey,
  normalizeProntuarioSpecialtySlug,
  type ClinicProntuarioResource,
  type EnabledProntuarioTab,
} from "./prontuarioFeatureTabs";

interface ClinicSpecialtyRow {
  id: string;
  name: string | null;
  slug: string | null;
}

interface UseEnabledProntuarioTabsOptions {
  specialtyKey?: SpecialtyKey | null;
  baseTabs?: string[];
  canViewTab?: (tabKey: TabKey) => boolean;
  getStandardTabKey?: (tabId: string) => TabKey;
  getLabel?: (tabId: string) => string;
  getIcon?: (tabId: string) => LucideIcon;
}

export interface UseEnabledProntuarioTabsResult {
  navItems: EnabledProntuarioTab[];
  visibleTabs: string[];
  enabledTabs: string[];
  mappedTabs: string[];
  enabledFeatures: string[];
  enabledResources: ClinicProntuarioResource[];
  allResources: ClinicProntuarioResource[];
  isLoading: boolean;
  refetch: () => void;
}

const defaultCanViewTab = () => true;
const defaultGetStandardTabKey = () => "resumo" as TabKey;

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function useEnabledProntuarioTabs(
  clinicId: string | null | undefined,
  specialtyId: string | null | undefined,
  options: UseEnabledProntuarioTabsOptions = {},
): UseEnabledProntuarioTabsResult {
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: ["clinic-prontuario-resources", clinicId],
    enabled: Boolean(clinicId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("clinic_resources")
        .select("id, clinic_id, resource_key, resource_type, specialty_id, specialty_slug, enabled, effective_at, expires_at, title")
        .eq("clinic_id", clinicId);

      if (error) {
        console.error("[useEnabledProntuarioTabs] erro ao buscar clinic_resources:", error);
        return [];
      }

      return (data ?? []) as ClinicProntuarioResource[];
    },
  });

  const specialtiesQuery = useQuery({
    queryKey: ["clinic-prontuario-specialties", clinicId],
    enabled: Boolean(clinicId),
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, slug")
        .eq("clinic_id", clinicId);

      if (error) {
        console.error("[useEnabledProntuarioTabs] erro ao buscar specialties:", error);
        return [];
      }

      return (data ?? []) as ClinicSpecialtyRow[];
    },
  });

  useEffect(() => {
    if (!clinicId) return;
    const channel = supabase
      .channel(`clinic-prontuario-resources-${clinicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clinic_resources", filter: `clinic_id=eq.${clinicId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["clinic-prontuario-resources", clinicId] });
          void queryClient.invalidateQueries({ queryKey: ["clinic-enabled-resources", clinicId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clinicId, queryClient]);

  const clinicSpecialtyKeys = useMemo(() => {
    return new Set(
      (specialtiesQuery.data ?? [])
        .map((specialty) => normalizeProntuarioSpecialtySlug(specialty.slug) ?? normalizeProntuarioSpecialtySlug(specialty.name))
        .filter((key): key is SpecialtyKey => Boolean(key)),
    );
  }, [specialtiesQuery.data]);

  const specialtyKey = useMemo((): SpecialtyKey => {
    if (options.specialtyKey) return options.specialtyKey;
    const activeSpecialty = (specialtiesQuery.data ?? []).find((specialty) => specialty.id === specialtyId);
    return normalizeProntuarioSpecialtySlug(activeSpecialty?.slug) ?? normalizeProntuarioSpecialtySlug(activeSpecialty?.name) ?? "geral";
  }, [options.specialtyKey, specialtiesQuery.data, specialtyId]);

  const baseTabs = options.baseTabs ?? getVisibleTabsForSpecialty(specialtyKey);
  const canViewTab = options.canViewTab ?? defaultCanViewTab;
  const getStandardTabKey = options.getStandardTabKey ?? defaultGetStandardTabKey;
  const getLabel = options.getLabel ?? ((tabId: string) => getClinicalBlockLabel(tabId as ClinicalBlockKey, specialtyKey));
  const getIcon = options.getIcon ?? (() => FileText);
  const resources = resourcesQuery.data ?? [];

  const enabledResources = useMemo(() => {
    return resources.filter((resource) =>
      doesResourceApplyToSpecialty(resource, specialtyId, specialtyKey, clinicSpecialtyKeys) &&
      isProntuarioResourceActive(resource),
    );
  }, [resources, specialtyId, specialtyKey, clinicSpecialtyKeys]);

  const mappedTabs = useMemo(() => {
    return uniqueValues(enabledResources.map(getProntuarioResourceTab));
  }, [enabledResources]);

  const enabledFeatures = useMemo(() => {
    return uniqueValues(enabledResources.map((resource) => normalizeProntuarioFeatureKey(resource.resource_key)));
  }, [enabledResources]);

  const navItems = useMemo(() => {
    return getEnabledProntuarioTabs({
      clinicId,
      specialtyId,
      specialtyKey,
      baseTabs,
      resources,
      clinicSpecialtyKeys,
      canViewTab,
      getStandardTabKey,
      getLabel,
      getIcon,
    });
  }, [clinicId, specialtyId, specialtyKey, baseTabs, resources, clinicSpecialtyKeys, canViewTab, getStandardTabKey, getLabel, getIcon]);

  const visibleTabs = useMemo(() => navItems.map((item) => item.id), [navItems]);

  return {
    navItems,
    visibleTabs,
    enabledTabs: visibleTabs,
    mappedTabs,
    enabledFeatures,
    enabledResources,
    allResources: resources,
    isLoading: resourcesQuery.isLoading || specialtiesQuery.isLoading,
    refetch: () => {
      void resourcesQuery.refetch();
      void specialtiesQuery.refetch();
    },
  };
}