import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

export function useCrmSpecialties() {
  return useQuery({
    queryKey: ["crm-specialties"],
    queryFn: async () => {
      const clinicId = await getClinicId();
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
  return useQuery({
    queryKey: ["crm-procedures"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrmProfessionals() {
  return useQuery({
    queryKey: ["crm-professionals"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrmUsers() {
  return useQuery({
    queryKey: ["crm-users"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data || []).map((p: any) => ({ id: p.user_id, name: p.full_name }));
    },
  });
}

export function useCrmLeadsForSelect() {
  return useQuery({
    queryKey: ["crm-leads-select"],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, name, phone, email")
        .eq("clinic_id", clinicId)
        .not("status", "eq", "arquivado")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}
