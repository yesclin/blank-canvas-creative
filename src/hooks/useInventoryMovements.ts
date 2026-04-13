import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InventoryMovement, InventoryMovementFormData, InventoryMovementType } from "@/types/inventory-batches";
import { entryMovementTypes } from "@/types/inventory-batches";

async function getClinicAndUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return { clinicId: profile.clinic_id, userId: user.id };
}

export function useInventoryMovements(filters?: {
  itemId?: string;
  batchId?: string;
  movementType?: InventoryMovementType;
  startDate?: string;
  endDate?: string;
  types?: InventoryMovementType[];
}) {
  return useQuery({
    queryKey: ["inventory-movements", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_movements")
        .select(`*, inventory_items(id, name, unit_of_measure), inventory_batches(id, batch_number)`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.itemId) query = query.eq("item_id", filters.itemId);
      if (filters?.batchId) query = query.eq("batch_id", filters.batchId);
      if (filters?.movementType) query = query.eq("movement_type", filters.movementType);
      if (filters?.types && filters.types.length > 0) query = query.in("movement_type", filters.types);
      if (filters?.startDate) query = query.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters?.endDate) query = query.lte("created_at", `${filters.endDate}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });
}

export function useCreateInventoryMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InventoryMovementFormData) => {
      const { clinicId, userId } = await getClinicAndUser();

      // Get item info for cost defaults
      const { data: item } = await supabase
        .from("inventory_items")
        .select("default_cost_price, controls_batch")
        .eq("id", data.item_id)
        .single();

      const unitCost = data.unit_cost ?? item?.default_cost_price ?? 0;

      const { data: movement, error } = await supabase
        .from("inventory_movements")
        .insert({
          clinic_id: clinicId,
          item_id: data.item_id,
          batch_id: data.batch_id || null,
          movement_type: data.movement_type,
          quantity: data.quantity,
          unit_cost: unitCost,
          total_cost: unitCost * Math.abs(data.quantity),
          unit_sale_price: data.unit_sale_price || null,
          reason: data.reason || null,
          source_module: data.source_module || 'manual',
          source_id: null,
          notes: data.notes || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update batch quantity_available if batch_id specified
      if (data.batch_id) {
        const isEntry = entryMovementTypes.includes(data.movement_type);
        const { data: batch } = await supabase
          .from("inventory_batches")
          .select("quantity_available")
          .eq("id", data.batch_id)
          .single();

        if (batch) {
          const newQty = isEntry
            ? Number(batch.quantity_available) + data.quantity
            : Number(batch.quantity_available) - data.quantity;

          const updates: Record<string, any> = { quantity_available: Math.max(0, newQty) };
          if (newQty <= 0) updates.status = 'depleted';

          await supabase
            .from("inventory_batches")
            .update(updates)
            .eq("id", data.batch_id);
        }
      }

      return movement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-movements"] });
      qc.invalidateQueries({ queryKey: ["inventory-batches"] });
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao registrar movimentação: " + e.message),
  });
}
