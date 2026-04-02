import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CrmFollowup, CrmFollowupFormData } from "@/types/followup";

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

export interface FollowupsFilters {
  search?: string;
  status?: string;
  followup_type?: string;
  assigned_to?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useFollowups(filters: FollowupsFilters = {}) {
  return useQuery({
    queryKey: ["crm-followups", filters],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let query = supabase
        .from("crm_followups")
        .select(`
          *,
          lead:crm_leads!crm_followups_lead_id_fkey(id, name),
          opportunity:crm_opportunities!crm_followups_opportunity_id_fkey(id, title)
        `)
        .eq("clinic_id", clinicId)
        .order("scheduled_at", { ascending: true });

      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.followup_type) query = query.eq("followup_type", filters.followup_type);
      if (filters.assigned_to) query = query.eq("assigned_to", filters.assigned_to);
      if (filters.dateFrom) query = query.gte("scheduled_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("scheduled_at", filters.dateTo + "T23:59:59");

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CrmFollowup[];
    },
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CrmFollowupFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("crm_followups")
        .insert({
          clinic_id: clinicId,
          lead_id: formData.lead_id || null,
          opportunity_id: formData.opportunity_id || null,
          patient_id: formData.patient_id || null,
          followup_type: formData.followup_type,
          subject: formData.subject?.trim() || null,
          notes: formData.notes?.trim() || null,
          scheduled_at: formData.scheduled_at,
          assigned_to: formData.assigned_to || null,
          status: "pending",
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      toast.success("Follow-up criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar follow-up: ${error.message}`);
    },
  });
}

export function useUpdateFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<CrmFollowupFormData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (formData.lead_id !== undefined) updateData.lead_id = formData.lead_id || null;
      if (formData.opportunity_id !== undefined) updateData.opportunity_id = formData.opportunity_id || null;
      if (formData.patient_id !== undefined) updateData.patient_id = formData.patient_id || null;
      if (formData.followup_type !== undefined) updateData.followup_type = formData.followup_type;
      if (formData.subject !== undefined) updateData.subject = formData.subject?.trim() || null;
      if (formData.notes !== undefined) updateData.notes = formData.notes?.trim() || null;
      if (formData.scheduled_at !== undefined) updateData.scheduled_at = formData.scheduled_at;
      if (formData.assigned_to !== undefined) updateData.assigned_to = formData.assigned_to || null;

      const { data, error } = await supabase
        .from("crm_followups")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      toast.success("Follow-up atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useCompleteFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("crm_followups")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user?.id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      toast.success("Follow-up concluído");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useCancelFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_followups")
        .update({ status: "canceled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      toast.success("Follow-up cancelado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useRescheduleFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: string; scheduled_at: string }) => {
      const { error } = await supabase
        .from("crm_followups")
        .update({ scheduled_at, status: "pending" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      toast.success("Follow-up reagendado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
