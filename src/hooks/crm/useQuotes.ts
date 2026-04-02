import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CrmQuote, CrmQuoteFormData } from "@/types/quote";
import { calculateItemTotal, calculateQuoteTotals } from "@/types/quote";

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

export interface QuotesFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useQuotes(filters: QuotesFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["crm-quotes", filters, page, pageSize],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let query = supabase
        .from("crm_quotes")
        .select(`
          *,
          lead:crm_leads!crm_quotes_lead_id_fkey(id, name),
          patient:patients!crm_quotes_patient_id_fkey(id, full_name),
          opportunity:crm_opportunities!crm_quotes_opportunity_id_fkey(id, title),
          professional:professionals!crm_quotes_professional_id_fkey(id, name)
        `, { count: "exact" })
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`quote_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { quotes: (data || []) as CrmQuote[], total: count || 0 };
    },
  });
}

export function useQuoteWithItems(quoteId: string | null) {
  return useQuery({
    queryKey: ["crm-quote-detail", quoteId],
    enabled: !!quoteId,
    queryFn: async () => {
      const { data: quote, error: qErr } = await supabase
        .from("crm_quotes")
        .select(`
          *,
          lead:crm_leads!crm_quotes_lead_id_fkey(id, name),
          patient:patients!crm_quotes_patient_id_fkey(id, full_name),
          opportunity:crm_opportunities!crm_quotes_opportunity_id_fkey(id, title),
          professional:professionals!crm_quotes_professional_id_fkey(id, name)
        `)
        .eq("id", quoteId!)
        .single();
      if (qErr) throw qErr;

      const { data: items, error: iErr } = await supabase
        .from("crm_quote_items")
        .select(`
          *,
          procedure:procedures!crm_quote_items_procedure_id_fkey(id, name)
        `)
        .eq("quote_id", quoteId!)
        .order("created_at");
      if (iErr) throw iErr;

      return { ...quote, items: items || [] } as CrmQuote;
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CrmQuoteFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      // Generate quote number
      const { data: numData } = await supabase.rpc("generate_quote_number", { p_clinic_id: clinicId });
      const quoteNumber = numData || `ORC-${Date.now()}`;

      const { subtotal, discountAmount, total } = calculateQuoteTotals(formData.items, formData.discount_percent || 0);

      const { data: quote, error } = await supabase
        .from("crm_quotes")
        .insert({
          clinic_id: clinicId,
          lead_id: formData.lead_id || null,
          patient_id: formData.patient_id || null,
          opportunity_id: formData.opportunity_id || null,
          professional_id: formData.professional_id || null,
          quote_number: quoteNumber,
          status: "draft",
          total_value: subtotal,
          discount_value: discountAmount,
          discount_percent: formData.discount_percent || 0,
          final_value: total,
          valid_until: formData.valid_until || null,
          notes: formData.notes?.trim() || null,
          terms_text: formData.terms_text?.trim() || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert items
      if (formData.items.length > 0) {
        const itemsToInsert = formData.items.map(item => ({
          clinic_id: clinicId,
          quote_id: quote.id,
          procedure_id: item.procedure_id || null,
          specialty_id: item.specialty_id || null,
          professional_id: item.professional_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_value: item.unit_value,
          discount_percent: item.discount_percent || 0,
          total_value: calculateItemTotal(item),
        }));
        const { error: iErr } = await supabase.from("crm_quote_items").insert(itemsToInsert);
        if (iErr) throw iErr;
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      toast.success("Orçamento criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      const now = new Date().toISOString();
      if (status === "approved") updateData.approved_at = now;
      if (status === "rejected") updateData.rejected_at = now;
      if (status === "converted") updateData.converted_at = now;

      const { error } = await supabase
        .from("crm_quotes")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["crm-quote-detail"] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      // Get original
      const { data: original, error: oErr } = await supabase
        .from("crm_quotes")
        .select("*")
        .eq("id", quoteId)
        .single();
      if (oErr) throw oErr;

      const { data: items, error: iErr } = await supabase
        .from("crm_quote_items")
        .select("*")
        .eq("quote_id", quoteId);
      if (iErr) throw iErr;

      const { data: numData } = await supabase.rpc("generate_quote_number", { p_clinic_id: clinicId });

      const { data: newQuote, error: nErr } = await supabase
        .from("crm_quotes")
        .insert({
          clinic_id: clinicId,
          lead_id: original.lead_id,
          patient_id: original.patient_id,
          opportunity_id: original.opportunity_id,
          professional_id: original.professional_id,
          quote_number: numData || `ORC-${Date.now()}`,
          status: "draft",
          total_value: original.total_value,
          discount_value: original.discount_value,
          discount_percent: original.discount_percent || 0,
          final_value: original.final_value,
          valid_until: original.valid_until,
          notes: original.notes,
          terms_text: original.terms_text,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (nErr) throw nErr;

      if (items && items.length > 0) {
        const newItems = items.map((item: any) => ({
          clinic_id: clinicId,
          quote_id: newQuote.id,
          procedure_id: item.procedure_id,
          specialty_id: item.specialty_id,
          professional_id: item.professional_id,
          description: item.description,
          quantity: item.quantity,
          unit_value: item.unit_value,
          discount_percent: item.discount_percent,
          total_value: item.total_value,
        }));
        await supabase.from("crm_quote_items").insert(newItems);
      }

      return newQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quotes"] });
      toast.success("Orçamento duplicado");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao duplicar: ${error.message}`);
    },
  });
}
