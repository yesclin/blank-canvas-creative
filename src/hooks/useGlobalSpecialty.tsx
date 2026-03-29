/**
 * Global Specialty Context — Single Source of Truth
 * 
 * Provides the resolved specialty object to the entire application.
 * ALL consumers (prontuário, agenda, templates, etc.) MUST use this context.
 * 
 * Resolution priority:
 * 1. First enabled official specialty (auto-resolved from clinic DB)
 * 2. User manual override (for multi-specialty clinics)
 * 
 * Note: Appointment-level override happens in useActiveSpecialty (prontuário-specific).
 */

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { useEnabledSpecialties, type EnabledSpecialty } from "./useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";
import { resolveOfficialSlug, type ResolvedSpecialty } from "./useResolvedSpecialty";

interface GlobalSpecialtyContextValue {
  /** All enabled official specialties for this clinic */
  enabledSpecialties: EnabledSpecialty[];
  /** Loading state */
  isLoading: boolean;
  /** Whether only one specialty is enabled */
  isSingleSpecialty: boolean;
  /** User's manual selection id (null = use default/first) */
  selectedSpecialtyId: string | null;
  /** Set manual selection */
  setSelectedSpecialtyId: (id: string | null) => void;
  /** The final resolved specialty — THE source of truth */
  resolvedSpecialty: ResolvedSpecialty | null;
  /** Whether resolution is complete (not loading) */
  isResolved: boolean;
  /** True only when clinic has zero active specialties */
  noSpecialtyConfigured: boolean;
}

const GlobalSpecialtyContext = createContext<GlobalSpecialtyContextValue>({
  enabledSpecialties: [],
  isLoading: true,
  isSingleSpecialty: false,
  selectedSpecialtyId: null,
  setSelectedSpecialtyId: () => {},
  resolvedSpecialty: null,
  isResolved: false,
  noSpecialtyConfigured: false,
});

export function useGlobalSpecialty() {
  return useContext(GlobalSpecialtyContext);
}

export { GlobalSpecialtyContext };

/**
 * Convert an EnabledSpecialty from DB to a ResolvedSpecialty.
 */
function toResolved(spec: EnabledSpecialty): ResolvedSpecialty | null {
  const slug = resolveOfficialSlug(spec.slug) ?? resolveOfficialSlug(spec.name);
  if (!slug) return null;
  return {
    id: spec.id,
    key: slug,
    name: spec.name,
    slug,
    clinicId: spec.clinic_id,
    enabled: spec.is_active,
  };
}

export function GlobalSpecialtyProvider({ children }: { children: ReactNode }) {
  const { data: rawSpecialties = [], isLoading } = useEnabledSpecialties();
  const specialties = useMemo(() => filterOfficialSpecialties(rawSpecialties), [rawSpecialties]);
  const [selectedSpecialtyId, setSelectedId] = useState<string | null>(null);

  // Reset selection if selected specialty is no longer enabled
  const validSelectedId = useMemo(() => {
    if (!selectedSpecialtyId) return null;
    return specialties.some(s => s.id === selectedSpecialtyId) ? selectedSpecialtyId : null;
  }, [selectedSpecialtyId, specialties]);

  const setSelectedSpecialtyId = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // THE resolved specialty — single object used everywhere
  const resolvedSpecialty = useMemo((): ResolvedSpecialty | null => {
    if (specialties.length === 0) return null;

    // If user manually selected one, use it
    if (validSelectedId) {
      const selected = specialties.find(s => s.id === validSelectedId);
      if (selected) {
        const resolved = toResolved(selected);
        if (resolved) return resolved;
      }
    }

    // Otherwise use first enabled
    for (const spec of specialties) {
      const resolved = toResolved(spec);
      if (resolved) return resolved;
    }

    return null;
  }, [specialties, validSelectedId]);

  const isResolved = !isLoading;
  const noSpecialtyConfigured = isResolved && specialties.length === 0;

  const value = useMemo((): GlobalSpecialtyContextValue => ({
    enabledSpecialties: specialties,
    isLoading,
    isSingleSpecialty: specialties.length <= 1,
    selectedSpecialtyId: validSelectedId,
    setSelectedSpecialtyId,
    resolvedSpecialty,
    isResolved,
    noSpecialtyConfigured,
  }), [specialties, isLoading, validSelectedId, setSelectedSpecialtyId, resolvedSpecialty, isResolved, noSpecialtyConfigured]);

  return (
    <GlobalSpecialtyContext.Provider value={value}>
      {children}
    </GlobalSpecialtyContext.Provider>
  );
}
