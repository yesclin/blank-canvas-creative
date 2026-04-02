import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CrmLead, CrmLeadFormData } from "@/types/crm";

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

export interface LeadsFilters {
  search?: string;
  status?: string;
  source?: string;
  specialty_interest_id?: string;
  assigned_to?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useLeads(filters: LeadsFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["crm-leads", filters, page, pageSize],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let query = supabase
        .from("crm_leads")
        .select(`
          *,
          specialty_interest:specialties!crm_leads_specialty_interest_id_fkey(id, name),
          procedure_interest:procedures!crm_leads_procedure_interest_id_fkey(id, name)
        `, { count: "exact" })
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.source) query = query.eq("source", filters.source);
      if (filters.specialty_interest_id) query = query.eq("specialty_interest_id", filters.specialty_interest_id);
      if (filters.assigned_to) query = query.eq("assigned_to", filters.assigned_to);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { leads: (data || []) as CrmLead[], total: count || 0 };
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CrmLeadFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("crm_leads")
        .insert({
          clinic_id: clinicId,
          name: formData.name.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          source: formData.source || null,
          campaign_name: formData.campaign_name?.trim() || null,
          specialty_interest_id: formData.specialty_interest_id || null,
          procedure_interest_id: formData.procedure_interest_id || null,
          status: formData.status || "novo",
          notes: formData.notes?.trim() || null,
          assigned_to: formData.assigned_to || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...formData }: CrmLeadFormData & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (formData.name !== undefined) updateData.name = formData.name.trim();
      if (formData.email !== undefined) updateData.email = formData.email?.trim() || null;
      if (formData.phone !== undefined) updateData.phone = formData.phone?.trim() || null;
      if (formData.birth_date !== undefined) updateData.birth_date = formData.birth_date || null;
      if (formData.gender !== undefined) updateData.gender = formData.gender || null;
      if (formData.source !== undefined) updateData.source = formData.source || null;
      if (formData.campaign_name !== undefined) updateData.campaign_name = formData.campaign_name?.trim() || null;
      if (formData.specialty_interest_id !== undefined) updateData.specialty_interest_id = formData.specialty_interest_id || null;
      if (formData.procedure_interest_id !== undefined) updateData.procedure_interest_id = formData.procedure_interest_id || null;
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.notes !== undefined) updateData.notes = formData.notes?.trim() || null;
      if (formData.assigned_to !== undefined) updateData.assigned_to = formData.assigned_to || null;

      const { data, error } = await supabase
        .from("crm_leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
}
