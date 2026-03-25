import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Material, MaterialFormData, MaterialCategory } from '@/types/cadastros-clinicos';

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
// QUERIES - now backed by `products` table
// =============================================

export function useMaterialsList(includeInactive: boolean = false) {
  return useQuery({
    queryKey: ['materials-list', includeInactive],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('product_type', 'material_clinico')
        .order('name');
        
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map products columns to Material interface
      return (data || []).map((p: any): Material => ({
        id: p.id,
        clinic_id: p.clinic_id,
        name: p.name,
        category: (p.category || 'outros') as MaterialCategory,
        unit: p.unit,
        min_quantity: Number(p.min_stock) || 0,
        unit_cost: Number(p.cost_price) || 0,
        description: p.description,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    },
  });
}

export function useMaterial(id: string | null) {
  return useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      const p = data as any;
      return {
        id: p.id,
        clinic_id: p.clinic_id,
        name: p.name,
        category: (p.category || 'outros') as MaterialCategory,
        unit: p.unit,
        min_quantity: Number(p.min_stock) || 0,
        unit_cost: Number(p.cost_price) || 0,
        description: p.description,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      } as Material;
    },
    enabled: !!id,
  });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: MaterialFormData) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          min_stock: formData.min_quantity,
          cost_price: formData.unit_cost || 0,
          description: formData.description,
          product_type: 'material_clinico',
          sale_price: 0,
          current_stock: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      toast.success('Material cadastrado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar material: ' + error.message);
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...formData }: MaterialFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          min_stock: formData.min_quantity,
          cost_price: formData.unit_cost || 0,
          description: formData.description,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      toast.success('Material atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar material: ' + error.message);
    },
  });
}

export function useToggleMaterialStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      toast.success(vars.is_active ? 'Material ativado' : 'Material desativado');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by deactivating
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      toast.success('Material removido com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover material: ' + error.message);
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: MaterialFormData = {
  name: '',
  category: 'outros',
  unit: 'unidade',
  min_quantity: 0,
  unit_cost: 0,
  description: '',
};

export function useMaterialForm(initialData?: Material | null) {
  const [formData, setFormData] = useState<MaterialFormData>(
    initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          unit: initialData.unit,
          min_quantity: initialData.min_quantity,
          unit_cost: initialData.unit_cost,
          description: initialData.description,
        }
      : defaultFormData
  );

  const updateField = <K extends keyof MaterialFormData>(field: K, value: MaterialFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => setFormData(defaultFormData);

  return { formData, setFormData, updateField, reset };
}
