import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  MaterialKit, 
  MaterialKitFormData, 
  MaterialKitItem, 
  MaterialKitItemFormData 
} from '@/types/cadastros-clinicos';

// =============================================
// HELPER
// =============================================
async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

// =============================================
// KIT QUERIES — backed by product_kits table
// =============================================

export function useMaterialKitsList(includeInactive: boolean = false) {
  return useQuery({
    queryKey: ['material-kits-list', includeInactive],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('product_kits')
        .select(`
          *,
          product_kit_items (
            id,
            quantity,
            products:product_id (cost_price)
          )
        `)
        .eq('clinic_id', clinicId)
        .order('name');
        
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((kit: any): MaterialKit => {
        const items = kit.product_kit_items || [];
        const totalCost = items.reduce((sum: number, item: any) => {
          const unitCost = item.products?.cost_price || 0;
          return sum + (Number(unitCost) * Number(item.quantity));
        }, 0);
        
        return {
          id: kit.id,
          clinic_id: kit.clinic_id,
          name: kit.name,
          description: kit.description,
          is_active: kit.is_active,
          items_count: items.length,
          total_cost: totalCost,
          created_at: kit.created_at,
          updated_at: kit.updated_at,
        };
      });
    },
  });
}

export function useMaterialKitItems(kitId: string | null) {
  return useQuery({
    queryKey: ['material-kit-items', kitId],
    queryFn: async () => {
      if (!kitId) return [];
      
      const { data, error } = await supabase
        .from('product_kit_items')
        .select(`
          id,
          kit_id,
          product_id,
          quantity,
          created_at,
          products:product_id (id, name, unit, cost_price)
        `)
        .eq('kit_id', kitId);
      
      if (error) throw error;
      
      return (data || []).map((item: any): MaterialKitItem => ({
        id: item.id,
        kit_id: item.kit_id,
        material_id: item.product_id,
        material_name: item.products?.name || 'Produto',
        material_unit: item.products?.unit || 'un',
        quantity: Number(item.quantity),
        unit_cost: Number(item.products?.cost_price) || 0,
        created_at: item.created_at,
      }));
    },
    enabled: !!kitId,
  });
}

// =============================================
// KIT MUTATIONS
// =============================================

export function useCreateMaterialKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: MaterialKitFormData) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('product_kits')
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          description: formData.description,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Kit criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar kit: ' + error.message);
    },
  });
}

export function useUpdateMaterialKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...formData }: MaterialKitFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('product_kits')
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Kit atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar kit: ' + error.message);
    },
  });
}

export function useToggleMaterialKitStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('product_kits')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success(vars.is_active ? 'Kit ativado' : 'Kit desativado');
    },
  });
}

export function useDeleteMaterialKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_kits')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Kit removido com sucesso');
    },
  });
}

// =============================================
// KIT ITEM MUTATIONS
// =============================================

export function useAddMaterialKitItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: MaterialKitItemFormData & { kit_id: string }) => {
      const { data, error } = await supabase
        .from('product_kit_items')
        .insert({
          kit_id: formData.kit_id,
          product_id: formData.material_id,
          quantity: formData.quantity,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['material-kit-items', vars.kit_id] });
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Item adicionado ao kit');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar item: ' + error.message);
    },
  });
}

export function useRemoveMaterialKitItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, kitId }: { itemId: string; kitId: string }) => {
      const { error } = await supabase
        .from('product_kit_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      return { kitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-kit-items', result.kitId] });
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Item removido do kit');
    },
    onError: (error) => {
      toast.error('Erro ao remover item: ' + error.message);
    },
  });
}

// =============================================
// FORM HOOKS
// =============================================

const defaultKitFormData: MaterialKitFormData = {
  name: '',
  description: '',
};

export function useMaterialKitForm(initialData?: MaterialKit | null) {
  const [formData, setFormData] = useState<MaterialKitFormData>(
    initialData
      ? { name: initialData.name, description: initialData.description }
      : defaultKitFormData
  );

  const updateField = <K extends keyof MaterialKitFormData>(field: K, value: MaterialKitFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => setFormData(defaultKitFormData);

  return { formData, setFormData, updateField, reset };
}

const defaultItemFormData: MaterialKitItemFormData = {
  material_id: '',
  quantity: 1,
};

export function useMaterialKitItemForm() {
  const [formData, setFormData] = useState<MaterialKitItemFormData>(defaultItemFormData);

  const updateField = <K extends keyof MaterialKitItemFormData>(field: K, value: MaterialKitItemFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => setFormData(defaultItemFormData);

  return { formData, setFormData, updateField, reset };
}
