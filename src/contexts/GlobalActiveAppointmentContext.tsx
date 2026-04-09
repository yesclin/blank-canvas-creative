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

  // Derive selectedAppointment from appointments list
  const selectedAppointment = selectedId
    ? appointments.find((a) => a.id === selectedId) ?? null
    : null;

  // Sync selected appointment when appointments list changes
  useEffect(() => {
    if (isLoading) return;

    const currentIds = appointments.map((a) => a.id);
    const prevIds = prevAppointmentIdsRef.current;
    prevAppointmentIdsRef.current = currentIds;

    // If selected appointment is gone
    if (selectedId && !currentIds.includes(selectedId)) {
      if (appointments.length > 0) {
        setSelectedId(appointments[0].id);
      } else {
        setSelectedId(null);
        setDrawerOpen(false);
      }
    }
  }, [appointments, isLoading, selectedId]);

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
