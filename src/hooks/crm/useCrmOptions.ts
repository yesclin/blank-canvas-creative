import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicContext } from "@/hooks/useClinicContext";

/**
 * Helpers de seleção para CRM.
 *
 * Cada hook usa `useClinicContext` (cache validado) em vez de chamar
 * `supabase.auth.getUser()` por execução. Antes, abrir um Lead chamava
 * `getUser()` 5 vezes em paralelo.
 */
export function useCrmSpecialties() {
  const { clinicId, isReady } = useClinicContext();
  return useQuery({
    queryKey: ["crm-specialties", clinicId],
    enabled: isReady,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrmProcedures() {
  const { clinicId, isReady } = useClinicContext();
  return useQuery({
    queryKey: ["crm-procedures", clinicId],
    enabled: isReady && !!clinicId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name")
        .eq("clinic_id", clinicId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrmProfessionals() {
  const { clinicId, isReady } = useClinicContext();
  return useQuery({
    queryKey: ["crm-professionals", clinicId],
    enabled: isReady && !!clinicId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name:full_name")
        .eq("clinic_id", clinicId!)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrmUsers() {
  const { clinicId, isReady } = useClinicContext();
  return useQuery({
    queryKey: ["crm-users", clinicId],
    enabled: isReady && !!clinicId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("clinic_id", clinicId!)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data || []).map((p: any) => ({ id: p.user_id, name: p.full_name }));
    },
  });
}

export function useCrmLeadsForSelect() {
  const { clinicId, isReady } = useClinicContext();
  return useQuery({
    queryKey: ["crm-leads-select", clinicId],
    enabled: isReady && !!clinicId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, name, phone, email")
        .eq("clinic_id", clinicId!)
        .not("status", "eq", "arquivado")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}
