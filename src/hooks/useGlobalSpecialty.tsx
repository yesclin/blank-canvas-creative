/**
 * Global Specialty Context
 * 
 * Exposes enabled specialties + manual selection for multi-specialty clinics.
 * When only 1 specialty is enabled, it's auto-selected.
 * When 2-3 are enabled, the user picks in the Prontuário header.
 */

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { useEnabledSpecialties, type EnabledSpecialty } from "./useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";

interface GlobalSpecialtyContextValue {
  enabledSpecialties: EnabledSpecialty[];
  isSingleSpecialty: boolean;
  /** Manually selected specialty id (null = use default/first) */
  selectedSpecialtyId: string | null;
  setSelectedSpecialtyId: (id: string | null) => void;
}

const GlobalSpecialtyContext = createContext<GlobalSpecialtyContextValue>({
  enabledSpecialties: [],
  isSingleSpecialty: false,
  selectedSpecialtyId: null,
  setSelectedSpecialtyId: () => {},
});

export function useGlobalSpecialty() {
  return useContext(GlobalSpecialtyContext);
}

export { GlobalSpecialtyContext };

export function GlobalSpecialtyProvider({ children }: { children: ReactNode }) {
  const { data: rawSpecialties = [] } = useEnabledSpecialties();
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

  const value = useMemo((): GlobalSpecialtyContextValue => ({
    enabledSpecialties: specialties,
    isSingleSpecialty: specialties.length <= 1,
    selectedSpecialtyId: validSelectedId,
    setSelectedSpecialtyId,
  }), [specialties, validSelectedId, setSelectedSpecialtyId]);

  return (
    <GlobalSpecialtyContext.Provider value={value}>
      {children}
    </GlobalSpecialtyContext.Provider>
  );
}
