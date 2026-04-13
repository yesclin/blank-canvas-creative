import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InventoryBatch, InventoryBatchFormData } from "@/types/inventory-batches";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

export function useInventoryBatches(filters?: {
  itemId?: string;
  status?: string;
  expiringInDays?: number;
}) {
  return useQuery({
    queryKey: ["inventory-batches", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_batches")
        .select(`*, inventory_items(id, name, unit_of_measure, controls_expiry)`)
        .order("created_at", { ascending: false });

      if (filters?.itemId) query = query.eq("item_id", filters.itemId);
      if (filters?.status && filters.status !== 'all') query = query.eq("status", filters.status);
      if (filters?.expiringInDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringInDays);
        query = query
          .eq("status", "active")
          .lte("expiry_date", futureDate.toISOString().split("T")[0])
          .gte("expiry_date", new Date().toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryBatch[];
    },
  });
}

export function useCreateInventoryBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InventoryBatchFormData) => {
      const clinicId = await getClinicId();
      const { data: batch, error } = await supabase
        .from("inventory_batches")
        .insert({
          clinic_id: clinicId,
          item_id: data.item_id,
          batch_number: data.batch_number,
          manufacturing_date: data.manufacturing_date || null,
          expiry_date: data.expiry_date || null,
          supplier_id: data.supplier_id || null,
          invoice_number: data.invoice_number || null,
          unit_cost: data.unit_cost,
          unit_sale_price: data.unit_sale_price || null,
          quantity_received: data.quantity_received,
          quantity_available: data.quantity_received,
          storage_location: data.storage_location || null,
          notes: data.notes || null,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return batch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-batches"] });
      toast.success("Lote registrado com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao registrar lote: " + e.message),
  });
}

export function useUpdateBatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("inventory_batches")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-batches"] });
      toast.success("Status do lote atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useExpiringBatches(days = 30) {
  return useQuery({
    queryKey: ["inventory-batches", "expiring", days],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(`*, inventory_items(id, name, unit_of_measure)`)
        .eq("status", "active")
        .not("expiry_date", "is", null)
        .lte("expiry_date", futureDate.toISOString().split("T")[0])
        .order("expiry_date");
      if (error) throw error;
      return data as InventoryBatch[];
    },
    refetchInterval: 60000,
  });
}

export function useExpiredBatches() {
  return useQuery({
    queryKey: ["inventory-batches", "expired"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(`*, inventory_items(id, name, unit_of_measure)`)
        .eq("status", "active")
        .not("expiry_date", "is", null)
        .lt("expiry_date", today)
        .order("expiry_date");
      if (error) throw error;
      return data as InventoryBatch[];
    },
    refetchInterval: 60000,
  });
}
