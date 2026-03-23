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
// QUERIES
// =============================================

export function useMaterialsList(includeInactive: boolean = false) {
  return useQuery({
    queryKey: ['materials-list', includeInactive],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('materials')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');
        
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Material[];
    },
  });
}

export function useMaterial(id: string | null) {
  return useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Material;
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
        .from('materials')
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          min_quantity: formData.min_quantity,
          unit_cost: formData.unit_cost,
          description: formData.description,
          is_active: true,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      toast.success('Material criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating material:', error);
      toast.error('Erro ao criar material');
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: MaterialFormData }) => {
      const { data, error } = await supabase
        .from('materials')
        .update({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          min_quantity: formData.min_quantity,
          unit_cost: formData.unit_cost,
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
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
      toast.success('Material atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating material:', error);
      toast.error('Erro ao atualizar material');
    },
  });
}

export function useToggleMaterialStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('materials')
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
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      toast.success(data.is_active ? 'Material ativado!' : 'Material desativado!');
    },
    onError: (error) => {
      console.error('Error toggling material status:', error);
      toast.error('Erro ao alterar status do material');
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: MaterialFormData = {
  name: '',
  category: 'descartavel',
  unit: 'unidade',
  min_quantity: 0,
  unit_cost: undefined,
  description: '',
};

export function useMaterialForm(initialData?: Material | null) {
  const [formData, setFormData] = useState<MaterialFormData>(
    initialData
      ? {
          name: initialData.name,
          category: initialData.category as MaterialCategory,
          unit: initialData.unit,
          min_quantity: initialData.min_quantity,
          unit_cost: initialData.unit_cost,
          description: initialData.description || '',
        }
      : defaultFormData
  );

  const updateField = <K extends keyof MaterialFormData>(
    field: K,
    value: MaterialFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const loadMaterial = (material: Material) => {
    setFormData({
      name: material.name,
      category: material.category as MaterialCategory,
      unit: material.unit,
      min_quantity: material.min_quantity,
      unit_cost: material.unit_cost,
      description: material.description || '',
    });
  };

  const isValid = formData.name.trim().length > 0;

  return {
    formData,
    updateField,
    resetForm,
    loadMaterial,
    isValid,
  };
}
