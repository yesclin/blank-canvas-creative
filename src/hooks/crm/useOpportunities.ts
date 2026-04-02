import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CrmOpportunity, CrmOpportunityFormData, CrmOpportunityHistory } from "@/types/crm";

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

export interface OpportunitiesFilters {
  search?: string;
  status?: string;
  specialty_id?: string;
  assigned_to_user_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useOpportunities(filters: OpportunitiesFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["crm-opportunities", filters, page, pageSize],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let query = supabase
        .from("crm_opportunities")
        .select(`
          *,
          lead:crm_leads!crm_opportunities_lead_id_fkey(id, name),
          specialty:specialties!crm_opportunities_specialty_id_fkey(id, name),
          procedure:procedures!crm_opportunities_procedure_id_fkey(id, name),
          professional:professionals!crm_opportunities_professional_id_fkey(id, name)
        `, { count: "exact" })
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%`);
      }
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.specialty_id) query = query.eq("specialty_id", filters.specialty_id);
      if (filters.assigned_to_user_id) query = query.eq("assigned_to_user_id", filters.assigned_to_user_id);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { opportunities: (data || []) as CrmOpportunity[], total: count || 0 };
    },
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CrmOpportunityFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("crm_opportunities")
        .insert({
          clinic_id: clinicId,
          title: formData.title.trim(),
          lead_id: formData.lead_id || null,
          patient_id: formData.patient_id || null,
          specialty_id: formData.specialty_id || null,
          professional_id: formData.professional_id || null,
          procedure_id: formData.procedure_id || null,
          estimated_value: formData.estimated_value || null,
          closing_probability: formData.closing_probability || 0,
          expected_close_date: formData.expected_close_date || null,
          assigned_to_user_id: formData.assigned_to_user_id || null,
          notes: formData.notes?.trim() || null,
          status: formData.status || "aberta",
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Record initial history
      await supabase.from("crm_opportunity_history").insert({
        clinic_id: clinicId,
        opportunity_id: data.id,
        field_changed: "status",
        old_value: null,
        new_value: "aberta",
        changed_by: user?.id || null,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      toast.success("Oportunidade criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar oportunidade: ${error.message}`);
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...formData }: CrmOpportunityFormData & { id: string }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      // Get old data for history
      const { data: oldData } = await supabase
        .from("crm_opportunities")
        .select("status, estimated_value, closing_probability, assigned_to_user_id")
        .eq("id", id)
        .single();

      const updateData: Record<string, unknown> = {};
      if (formData.title !== undefined) updateData.title = formData.title.trim();
      if (formData.lead_id !== undefined) updateData.lead_id = formData.lead_id || null;
      if (formData.patient_id !== undefined) updateData.patient_id = formData.patient_id || null;
      if (formData.specialty_id !== undefined) updateData.specialty_id = formData.specialty_id || null;
      if (formData.professional_id !== undefined) updateData.professional_id = formData.professional_id || null;
      if (formData.procedure_id !== undefined) updateData.procedure_id = formData.procedure_id || null;
      if (formData.estimated_value !== undefined) updateData.estimated_value = formData.estimated_value || null;
      if (formData.closing_probability !== undefined) updateData.closing_probability = formData.closing_probability;
      if (formData.expected_close_date !== undefined) updateData.expected_close_date = formData.expected_close_date || null;
      if (formData.assigned_to_user_id !== undefined) updateData.assigned_to_user_id = formData.assigned_to_user_id || null;
      if (formData.notes !== undefined) updateData.notes = formData.notes?.trim() || null;
      if (formData.status !== undefined) {
        updateData.status = formData.status;
        if (formData.status === "ganha") {
          updateData.is_won = true;
          updateData.is_lost = false;
          updateData.closed_at = new Date().toISOString();
        } else if (formData.status === "perdida") {
          updateData.is_won = false;
          updateData.is_lost = true;
          updateData.closed_at = new Date().toISOString();
        } else {
          updateData.is_won = false;
          updateData.is_lost = false;
          updateData.closed_at = null;
        }
      }

      const { data, error } = await supabase
        .from("crm_opportunities")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Record history for status changes
      if (formData.status && oldData && formData.status !== oldData.status) {
        await supabase.from("crm_opportunity_history").insert({
          clinic_id: clinicId,
          opportunity_id: id,
          field_changed: "status",
          old_value: oldData.status,
          new_value: formData.status,
          changed_by: user?.id || null,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity-history"] });
      toast.success("Oportunidade atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar oportunidade: ${error.message}`);
    },
  });
}

export function useOpportunityHistory(opportunityId: string | null) {
  return useQuery({
    queryKey: ["crm-opportunity-history", opportunityId],
    enabled: !!opportunityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_opportunity_history")
        .select("*")
        .eq("opportunity_id", opportunityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CrmOpportunityHistory[];
    },
  });
}
