import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useGlobalActiveAppointments } from "@/hooks/useGlobalActiveAppointments";
import type { Appointment } from "@/types/agenda";

interface GlobalActiveAppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  selectedAppointment: Appointment | null;
  setSelectedAppointment: (apt: Appointment | null) => void;
  drawerOpen: boolean;
  openDrawer: (apt?: Appointment) => void;
  closeDrawer: () => void;
  refresh: () => void;
}

const GlobalActiveAppointmentContext = createContext<GlobalActiveAppointmentContextType | null>(null);

export function GlobalActiveAppointmentProvider({ children }: { children: ReactNode }) {
  const { appointments, isLoading, refresh } = useGlobalActiveAppointments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prevAppointmentIdsRef = useRef<string[]>([]);

  // Derive selectedAppointment with automatic fallback to first item
  const selectedAppointment = (() => {
    if (selectedId) {
      const found = appointments.find((a) => a.id === selectedId);
      if (found) return found;
    }
    // Fallback: if we have appointments but selectedId is invalid/null, use first
    return appointments.length > 0 ? appointments[0] : null;
  })();

  // Sync selected appointment when appointments list changes
  useEffect(() => {
    if (isLoading) return;
    if (appointments.length === 0) return;

    const currentIds = appointments.map((a) => a.id);
    prevAppointmentIdsRef.current = currentIds;

    // If selected appointment is gone, reset to first
    if (selectedId && !currentIds.includes(selectedId)) {
      setSelectedId(appointments[0].id);
    }
  }, [appointments, isLoading, selectedId]);

  // Only clear state when we truly have zero appointments (confirmed, not loading)
  useEffect(() => {
    if (!isLoading && appointments.length === 0) {
      setSelectedId(null);
      setDrawerOpen(false);
    }
  }, [appointments.length, isLoading]);

  const setSelectedAppointment = useCallback((apt: Appointment | null) => {
    setSelectedId(apt?.id ?? null);
  }, []);

  const openDrawer = useCallback((apt?: Appointment) => {
    if (apt) {
      setSelectedId(apt.id);
    } else if (appointments.length > 0 && !selectedId) {
      setSelectedId(appointments[0].id);
    }
    setDrawerOpen(true);
  }, [appointments, selectedId]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <GlobalActiveAppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        selectedAppointment,
        setSelectedAppointment,
        drawerOpen,
        openDrawer,
        closeDrawer,
        refresh,
      }}
    >
      {children}
    </GlobalActiveAppointmentContext.Provider>
  );
}

export function useGlobalActiveAppointment() {
  const ctx = useContext(GlobalActiveAppointmentContext);
  if (!ctx) {
    throw new Error("useGlobalActiveAppointment must be used within GlobalActiveAppointmentProvider");
  }
  return ctx;
}
