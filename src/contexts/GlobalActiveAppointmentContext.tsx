import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
  const { appointments, isLoading, refresh, hasConfirmedEmpty } = useGlobalActiveAppointments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedAppointmentById = (() => {
    if (selectedId) {
      const found = appointments.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return null;
  })();

  // Derive selectedAppointment with automatic fallback to first item
  const selectedAppointment = selectedAppointmentById ?? appointments[0] ?? null;

  // Keep a stable selectedId whenever we have active appointments
  useEffect(() => {
    if (appointments.length === 0) return;

    if (!selectedId || !appointments.some((appointment) => appointment.id === selectedId)) {
      setSelectedId(appointments[0].id);
    }
  }, [appointments, selectedId]);

  // Only clear state when we truly have zero appointments (confirmed empty result)
  useEffect(() => {
    if (!hasConfirmedEmpty) return;

    setSelectedId(null);
    setDrawerOpen(false);
  }, [hasConfirmedEmpty]);

  const setSelectedAppointment = useCallback((apt: Appointment | null) => {
    setSelectedId(apt?.id ?? null);
  }, []);

  const openDrawer = useCallback((apt?: Appointment) => {
    const nextAppointment = apt ?? selectedAppointment ?? appointments[0] ?? null;

    if (nextAppointment) {
      setSelectedId(nextAppointment.id);
    }

    setDrawerOpen(true);
  }, [appointments, selectedAppointment]);

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
