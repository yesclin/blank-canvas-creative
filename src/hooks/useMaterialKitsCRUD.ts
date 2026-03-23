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
// HELPER: Get clinic_id from current user
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
// KIT QUERIES
// =============================================

export function useMaterialKitsList(includeInactive: boolean = false) {
  return useQuery({
    queryKey: ['material-kits-list', includeInactive],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('material_kits')
        .select(`
          *,
          material_kit_items (
            id,
            quantity,
            materials:material_id (unit_cost)
          )
        `)
        .eq('clinic_id', clinicId)
        .order('name');
        
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate items count and total cost
      return (data || []).map((kit: any) => {
        const items = kit.material_kit_items || [];
        const totalCost = items.reduce((sum: number, item: any) => {
          const unitCost = item.materials?.unit_cost || 0;
          return sum + (item.quantity * unitCost);
        }, 0);
        
        return {
          ...kit,
          items_count: items.length,
          total_cost: totalCost,
          material_kit_items: undefined, // Remove nested data
        } as MaterialKit;
      });
    },
  });
}

export function useMaterialKit(id: string | null) {
  return useQuery({
    queryKey: ['material-kit', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('material_kits')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as MaterialKit;
    },
    enabled: !!id,
  });
}

// =============================================
// KIT ITEMS QUERIES
// =============================================

export function useMaterialKitItems(kitId: string | null) {
  return useQuery({
    queryKey: ['material-kit-items', kitId],
    queryFn: async () => {
      if (!kitId) return [];
      
      const { data, error } = await supabase
        .from('material_kit_items')
        .select(`
          *,
          materials:material_id (name, category, unit_cost)
        `)
        .eq('kit_id', kitId)
        .order('created_at');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.materials?.name,
        material_category: item.materials?.category,
        material_unit_cost: item.materials?.unit_cost,
      })) as MaterialKitItem[];
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('material_kits')
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          description: formData.description,
          created_by: user?.id,
          is_active: true,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success('Kit criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating material kit:', error);
      toast.error('Erro ao criar kit');
    },
  });
}

export function useUpdateMaterialKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: MaterialKitFormData }) => {
      const { data, error } = await supabase
        .from('material_kits')
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['material-kit'] });
      toast.success('Kit atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating material kit:', error);
      toast.error('Erro ao atualizar kit');
    },
  });
}

export function useToggleMaterialKitStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('material_kits')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success(data.is_active ? 'Kit ativado!' : 'Kit desativado!');
    },
    onError: (error) => {
      console.error('Error toggling material kit status:', error);
      toast.error('Erro ao alterar status do kit');
    },
  });
}

export function useDeleteMaterialKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('material_kits')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success('Kit removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting material kit:', error);
      toast.error('Erro ao remover kit');
    },
  });
}

// =============================================
// KIT ITEMS MUTATIONS
// =============================================

export function useAddMaterialToKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ kitId, formData }: { kitId: string; formData: MaterialKitItemFormData }) => {
      const { data, error } = await supabase
        .from('material_kit_items')
        .insert({
          kit_id: kitId,
          material_id: formData.material_id,
          quantity: formData.quantity,
          unit: formData.unit,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este material já está no kit');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, { kitId }) => {
      queryClient.invalidateQueries({ queryKey: ['material-kit-items', kitId] });
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success('Material adicionado ao kit!');
    },
    onError: (error: any) => {
      console.error('Error adding material to kit:', error);
      toast.error(error.message || 'Erro ao adicionar material');
    },
  });
}

export function useUpdateKitItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, kitId, formData }: { id: string; kitId: string; formData: Partial<MaterialKitItemFormData> }) => {
      const { data, error } = await supabase
        .from('material_kit_items')
        .update({
          quantity: formData.quantity,
          unit: formData.unit,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return { data, kitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-kit-items', result.kitId] });
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success('Item atualizado!');
    },
    onError: (error) => {
      console.error('Error updating kit item:', error);
      toast.error('Erro ao atualizar item');
    },
  });
}

export function useRemoveMaterialFromKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, kitId }: { id: string; kitId: string }) => {
      const { error } = await supabase
        .from('material_kit_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { kitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-kit-items', result.kitId] });
      queryClient.invalidateQueries({ queryKey: ['material-kits-list'] });
      toast.success('Material removido do kit!');
    },
    onError: (error) => {
      console.error('Error removing material from kit:', error);
      toast.error('Erro ao remover material');
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
      ? {
          name: initialData.name,
          description: initialData.description || '',
        }
      : defaultKitFormData
  );

  const updateField = <K extends keyof MaterialKitFormData>(
    field: K,
    value: MaterialKitFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultKitFormData);
  };

  const loadKit = (kit: MaterialKit) => {
    setFormData({
      name: kit.name,
      description: kit.description || '',
    });
  };

  const isValid = formData.name.trim().length > 0;

  return {
    formData,
    updateField,
    resetForm,
    loadKit,
    isValid,
  };
}

const defaultItemFormData: MaterialKitItemFormData = {
  material_id: '',
  quantity: 1,
  unit: 'unidade',
};

export function useMaterialKitItemForm() {
  const [formData, setFormData] = useState<MaterialKitItemFormData>(defaultItemFormData);

  const updateField = <K extends keyof MaterialKitItemFormData>(
    field: K,
    value: MaterialKitItemFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultItemFormData);
  };

  const isValid = formData.material_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
}
