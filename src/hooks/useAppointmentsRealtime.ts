import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Assina mudanças de agendamentos/sessões da clínica e invalida os caches
 * relacionados. Substitui o polling agressivo (30s/10s/5s) da Agenda e do
 * Atendimento — o polling permanece apenas como fallback de longa duração.
 */
export function useAppointmentsRealtime(clinicId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!clinicId) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["atendimento-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["active-appointment"] });
      void queryClient.invalidateQueries({ queryKey: ["appointment-session"] });
    };

    const channel = supabase
      .channel(`appointments-realtime-${clinicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinicId}` },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_sessions", filter: `clinic_id=eq.${clinicId}` },
        invalidate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clinicId, queryClient]);
}
