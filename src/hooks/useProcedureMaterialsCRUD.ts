import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProcedureMaterial, ProcedureMaterialFormData } from '@/types/cadastros-clinicos';

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

export function useProcedureMaterialsList() {
  return useQuery({
    queryKey: ['procedure-materials-list'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_materials')
        .select(`
          *,
          materials:material_id (name, category, unit_cost),
          procedures:procedure_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.materials?.name,
        material_category: item.materials?.category,
        material_unit_cost: item.materials?.unit_cost,
        procedure_name: item.procedures?.name,
      })) as ProcedureMaterial[];
    },
  });
}

export function useProcedureMaterialsByProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-materials', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      const { data, error } = await supabase
        .from('procedure_materials')
        .select(`
          *,
          materials:material_id (name, category, unit_cost)
        `)
        .eq('procedure_id', procedureId)
        .order('created_at');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.materials?.name,
        material_category: item.materials?.category,
        material_unit_cost: item.materials?.unit_cost,
      })) as ProcedureMaterial[];
    },
    enabled: !!procedureId,
  });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreateProcedureMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: ProcedureMaterialFormData) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_materials')
        .insert({
          clinic_id: clinicId,
          procedure_id: formData.procedure_id,
          material_id: formData.material_id,
          quantity: formData.quantity,
          unit: formData.unit,
          is_required: formData.is_required,
          allow_manual_edit: formData.allow_manual_edit,
          notes: formData.notes,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este material já está vinculado ao procedimento');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-materials'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Material vinculado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating procedure material:', error);
      toast.error(error.message || 'Erro ao vincular material');
    },
  });
}

export function useUpdateProcedureMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ProcedureMaterialFormData> }) => {
      const { data, error } = await supabase
        .from('procedure_materials')
        .update({
          quantity: formData.quantity,
          unit: formData.unit,
          is_required: formData.is_required,
          allow_manual_edit: formData.allow_manual_edit,
          notes: formData.notes,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-materials'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating procedure material:', error);
      toast.error('Erro ao atualizar vínculo');
    },
  });
}

export function useDeleteProcedureMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procedure_materials')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-materials'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting procedure material:', error);
      toast.error('Erro ao remover vínculo');
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: ProcedureMaterialFormData = {
  procedure_id: '',
  material_id: '',
  quantity: 1,
  unit: 'unidade',
  is_required: true,
  allow_manual_edit: true,
  notes: '',
};

export function useProcedureMaterialForm(initialData?: ProcedureMaterial | null) {
  const [formData, setFormData] = useState<ProcedureMaterialFormData>(
    initialData
      ? {
          procedure_id: initialData.procedure_id,
          material_id: initialData.material_id,
          quantity: initialData.quantity,
          unit: initialData.unit,
          is_required: initialData.is_required,
          allow_manual_edit: initialData.allow_manual_edit,
          notes: initialData.notes || '',
        }
      : defaultFormData
  );

  const updateField = <K extends keyof ProcedureMaterialFormData>(
    field: K,
    value: ProcedureMaterialFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const isValid = formData.procedure_id && formData.material_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
}
