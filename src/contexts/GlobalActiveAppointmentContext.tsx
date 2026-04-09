import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback((apt?: Appointment) => {
    if (apt) {
      setSelectedAppointment(apt);
    } else if (appointments.length > 0 && !selectedAppointment) {
      setSelectedAppointment(appointments[0]);
    }
    setDrawerOpen(true);
  }, [appointments, selectedAppointment]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Keep selectedAppointment in sync with fresh data
  const syncedSelected = selectedAppointment
    ? appointments.find((a) => a.id === selectedAppointment.id) || null
    : null;

  // If selected appointment is no longer active, clear it
  if (selectedAppointment && !syncedSelected && appointments.length > 0 && !isLoading) {
    // Auto-select first if the current one was finalized
    setSelectedAppointment(appointments[0]);
  } else if (selectedAppointment && !syncedSelected && appointments.length === 0 && !isLoading) {
    setSelectedAppointment(null);
    if (drawerOpen) setDrawerOpen(false);
  }

  return (
    <GlobalActiveAppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        selectedAppointment: syncedSelected,
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
