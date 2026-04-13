import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InventoryItem, InventoryItemFormData } from "@/types/inventory-items";

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

export function useInventoryItems(filters?: {
  includeInactive?: boolean;
  itemType?: string;
  isSellable?: boolean;
  isConsumable?: boolean;
}) {
  return useQuery({
    queryKey: ["inventory-items", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("*")
        .order("name");

      if (!filters?.includeInactive) {
        query = query.eq("is_active", true);
      }
      if (filters?.itemType) {
        query = query.eq("item_type", filters.itemType);
      }
      if (filters?.isSellable !== undefined) {
        query = query.eq("is_sellable", filters.isSellable);
      }
      if (filters?.isConsumable !== undefined) {
        query = query.eq("is_consumable_in_procedures", filters.isConsumable);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: ["inventory-items", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as InventoryItem | null;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InventoryItemFormData) => {
      const clinicId = await getClinicId();

      const { data: item, error } = await supabase
        .from("inventory_items")
        .insert({
          clinic_id: clinicId,
          name: data.name,
          commercial_name: data.commercial_name || null,
          description: data.description || null,
          internal_code: data.internal_code || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          category: data.category || null,
          brand: data.brand || null,
          manufacturer: data.manufacturer || null,
          item_type: data.item_type,
          is_sellable: data.is_sellable,
          is_consumable_in_procedures: data.is_consumable_in_procedures,
          is_active: data.is_active,
          controls_stock: data.controls_stock,
          controls_batch: data.controls_batch,
          controls_expiry: data.controls_expiry,
          requires_traceability: data.requires_traceability,
          requires_cold_chain: data.requires_cold_chain,
          storage_notes: data.storage_notes || null,
          unit_of_measure: data.unit_of_measure,
          minimum_stock: data.minimum_stock,
          ideal_stock: data.ideal_stock,
          default_cost_price: data.default_cost_price,
          default_sale_price: data.default_sale_price,
          alert_days_before_expiry: data.alert_days_before_expiry,
          anvisa_registration: data.anvisa_registration || null,
          composition: data.composition || null,
          leaflet_text_or_url: data.leaflet_text_or_url || null,
          supplier_id: data.supplier_id || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar item: " + error.message);
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItemFormData> }) => {
      const updateData: Record<string, any> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = typeof value === 'string' && value === '' ? null : value;
        }
      });

      const { error } = await supabase
        .from("inventory_items")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });
}

export function useToggleInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("inventory_items")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });
}
