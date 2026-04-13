import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data: profile } = await supabase
    .from("profiles").select("clinic_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

// ==========================================
// PROCEDURE CONSUMPTION TEMPLATES
// ==========================================

export interface ProcedureConsumptionTemplate {
  id: string;
  clinic_id: string;
  procedure_id: string;
  item_id: string;
  default_quantity: number;
  unit: string;
  batch_required: boolean;
  allow_quantity_edit_on_finish: boolean;
  is_required: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  inventory_items?: {
    id: string;
    name: string;
    unit_of_measure: string;
    default_cost_price: number;
    controls_batch: boolean;
    controls_expiry: boolean;
    requires_traceability: boolean;
  };
}

export interface ConsumptionTemplateFormData {
  procedure_id: string;
  item_id: string;
  default_quantity: number;
  unit: string;
  batch_required: boolean;
  allow_quantity_edit_on_finish: boolean;
  is_required: boolean;
  notes?: string;
}

export function useProcedureConsumptionTemplates(procedureId?: string) {
  return useQuery({
    queryKey: ["procedure-consumption-templates", procedureId],
    queryFn: async () => {
      let query = supabase
        .from("procedure_consumption_templates")
        .select(`*, inventory_items(id, name, unit_of_measure, default_cost_price, controls_batch, controls_expiry, requires_traceability)`)
        .order("created_at");

      if (procedureId) query = query.eq("procedure_id", procedureId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProcedureConsumptionTemplate[];
    },
  });
}

export function useCreateConsumptionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConsumptionTemplateFormData) => {
      const clinicId = await getClinicId();
      const { data: result, error } = await supabase
        .from("procedure_consumption_templates")
        .insert({ clinic_id: clinicId, ...data, notes: data.notes || null })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedure-consumption-templates"] });
      toast.success("Consumo vinculado ao procedimento!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateConsumptionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConsumptionTemplateFormData> }) => {
      const { error } = await supabase
        .from("procedure_consumption_templates")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedure-consumption-templates"] });
      toast.success("Consumo atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteConsumptionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("procedure_consumption_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedure-consumption-templates"] });
      toast.success("Vínculo removido!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

// ==========================================
// INVENTORY KITS (new tables)
// ==========================================

export interface InventoryKit {
  id: string;
  clinic_id: string;
  name: string;
  description?: string | null;
  kit_type: 'clinical' | 'retail';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryKitItem {
  id: string;
  kit_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  // Relations
  inventory_items?: {
    id: string;
    name: string;
    unit_of_measure: string;
    default_cost_price: number;
  };
}

export function useInventoryKits(includeInactive = false) {
  return useQuery({
    queryKey: ["inventory-kits", includeInactive],
    queryFn: async () => {
      let query = supabase.from("inventory_kits").select("*").order("name");
      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryKit[];
    },
  });
}

export function useInventoryKitItems(kitId: string | null) {
  return useQuery({
    queryKey: ["inventory-kit-items", kitId],
    queryFn: async () => {
      if (!kitId) return [];
      const { data, error } = await supabase
        .from("inventory_kit_items")
        .select(`*, inventory_items(id, name, unit_of_measure, default_cost_price)`)
        .eq("kit_id", kitId);
      if (error) throw error;
      return data as InventoryKitItem[];
    },
    enabled: !!kitId,
  });
}

export function useCreateInventoryKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; kit_type: 'clinical' | 'retail' }) => {
      const clinicId = await getClinicId();
      const { data: kit, error } = await supabase
        .from("inventory_kits")
        .insert({ clinic_id: clinicId, name: data.name, description: data.description || null, kit_type: data.kit_type })
        .select()
        .single();
      if (error) throw error;
      return kit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-kits"] });
      toast.success("Kit criado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateInventoryKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; description: string; kit_type: string; is_active: boolean }> }) => {
      const { error } = await supabase.from("inventory_kits").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-kits"] });
      toast.success("Kit atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useAddInventoryKitItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { kit_id: string; item_id: string; quantity: number }) => {
      const { data: item, error } = await supabase
        .from("inventory_kit_items")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-kit-items"] });
      toast.success("Item adicionado ao kit!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useRemoveInventoryKitItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_kit_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-kit-items"] });
      toast.success("Item removido do kit!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

// ==========================================
// CONSUMPTION COST CALCULATOR
// ==========================================

export function useProcedureEstimatedCost(procedureId?: string) {
  const { data: templates = [] } = useProcedureConsumptionTemplates(procedureId);

  const totalCost = templates.reduce((sum, t) => {
    const unitCost = t.inventory_items?.default_cost_price || 0;
    return sum + unitCost * t.default_quantity;
  }, 0);

  return { templates, totalCost };
}
