import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

/**
 * When the Prontuário page is opened without a patientId,
 * this hook checks if the current professional has an active appointment today
 * and automatically redirects to that patient's medical record.
 * 
 * Priority:
 * 1. Active appointment (em_atendimento / started) for the current professional
 * 2. Most recent "chegou" appointment for the current professional
 * 3. Falls back to null (show PatientSelector)
 */
export function useAutoPatientRedirect(hasPatientId: boolean) {
  const navigate = useNavigate();
  const { professionalId, isLoading: permLoading } = usePermissions();
  const [redirected, setRedirected] = useState(false);

  const { data: autoPatient, isLoading } = useQuery({
    queryKey: ["auto-patient-redirect", professionalId],
    queryFn: async () => {
      if (!professionalId) return null;

      const today = format(new Date(), "yyyy-MM-dd");

      // Priority 1: Any appointment currently in progress (started but not finished),
      // regardless of scheduled_date — handles appointments started on previous days
      const { data: activeStarted } = await supabase
        .from("appointments")
        .select("id, patient_id, specialty_id, procedure_id, professional_id")
        .eq("professional_id", professionalId)
        .not("started_at", "is", null)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeStarted) {
        return activeStarted;
      }

      // Priority 2: Active appointment by status today (em_atendimento but maybe not started_at set)
      const { data: activeStatus } = await supabase
        .from("appointments")
        .select("id, patient_id, specialty_id, procedure_id, professional_id")
        .eq("professional_id", professionalId)
        .eq("scheduled_date", today)
        .in("status", ["em_atendimento", "in_progress", "atendendo", "attending"])
        .is("finished_at", null)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (activeStatus) {
        return activeStatus;
      }

      // Priority 3: Patient that has arrived (chegou) today
      const { data: arrived } = await supabase
        .from("appointments")
        .select("id, patient_id, specialty_id, procedure_id, professional_id")
        .eq("professional_id", professionalId)
        .eq("scheduled_date", today)
        .eq("status", "chegou")
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      return arrived || null;
    },
    enabled: !hasPatientId && !permLoading && !!professionalId,
    staleTime: 10000,
  });

  useEffect(() => {
    if (hasPatientId || redirected || isLoading || permLoading) return;
    if (!autoPatient) return;

    const params = new URLSearchParams({
      appointmentId: autoPatient.id,
      professionalId: autoPatient.professional_id,
    });
    if (autoPatient.specialty_id) {
      params.set("specialtyId", autoPatient.specialty_id);
    }
    if (autoPatient.procedure_id) {
      params.set("procedureId", autoPatient.procedure_id);
    }

    setRedirected(true);
    navigate(`/app/prontuario/${autoPatient.patient_id}?${params.toString()}`, { replace: true });
  }, [hasPatientId, autoPatient, redirected, isLoading, permLoading, navigate]);

  return {
    isCheckingAutoRedirect: !hasPatientId && (isLoading || permLoading) && !redirected,
    hasAutoPatient: !!autoPatient,
  };
}
