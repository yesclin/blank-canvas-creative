import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProcedureKit, ProcedureKitFormData } from '@/types/cadastros-clinicos';

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

export function useProcedureKitsList() {
  return useQuery({
    queryKey: ['procedure-kits-list'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_kits')
        .select(`
          *,
          material_kits:kit_id (name, is_active),
          procedures:procedure_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        kit_name: item.material_kits?.name,
        kit_is_active: item.material_kits?.is_active,
        procedure_name: item.procedures?.name,
      })) as (ProcedureKit & { kit_is_active?: boolean })[];
    },
  });
}

export function useProcedureKitsByProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-kits', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      const { data, error } = await supabase
        .from('procedure_kits')
        .select(`
          *,
          material_kits:kit_id (name, is_active)
        `)
        .eq('procedure_id', procedureId)
        .order('created_at');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        kit_name: item.material_kits?.name,
        kit_is_active: item.material_kits?.is_active,
      })) as (ProcedureKit & { kit_is_active?: boolean })[];
    },
    enabled: !!procedureId,
  });
}

// Query para saber em quais procedimentos um kit é usado
export function useKitUsageByKit(kitId: string | null) {
  return useQuery({
    queryKey: ['kit-usage', kitId],
    queryFn: async () => {
      if (!kitId) return [];
      
      const { data, error } = await supabase
        .from('procedure_kits')
        .select(`
          id,
          quantity,
          is_required,
          procedures:procedure_id (id, name)
        `)
        .eq('kit_id', kitId);
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        is_required: item.is_required,
        procedure_id: item.procedures?.id,
        procedure_name: item.procedures?.name,
      }));
    },
    enabled: !!kitId,
  });
}

// Query para contar uso de cada kit
export function useKitsUsageCount() {
  return useQuery({
    queryKey: ['kits-usage-count'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_kits')
        .select('kit_id, procedure_id')
        .eq('clinic_id', clinicId);
      
      if (error) throw error;
      
      // Agrupar por kit_id e contar
      const usageMap: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        usageMap[item.kit_id] = (usageMap[item.kit_id] || 0) + 1;
      });
      
      return usageMap;
    },
  });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreateProcedureKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: ProcedureKitFormData) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_kits')
        .insert({
          clinic_id: clinicId,
          procedure_id: formData.procedure_id,
          kit_id: formData.kit_id,
          quantity: formData.quantity,
          is_required: formData.is_required,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este kit já está vinculado ao procedimento');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-kits'] });
      queryClient.invalidateQueries({ queryKey: ['kits-usage-count'] });
      queryClient.invalidateQueries({ queryKey: ['kit-usage'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Kit vinculado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating procedure kit:', error);
      toast.error(error.message || 'Erro ao vincular kit');
    },
  });
}

export function useUpdateProcedureKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ProcedureKitFormData> }) => {
      const { data, error } = await supabase
        .from('procedure_kits')
        .update({
          quantity: formData.quantity,
          is_required: formData.is_required,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-kits'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating procedure kit:', error);
      toast.error('Erro ao atualizar vínculo');
    },
  });
}

export function useDeleteProcedureKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procedure_kits')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-kits'] });
      queryClient.invalidateQueries({ queryKey: ['kits-usage-count'] });
      queryClient.invalidateQueries({ queryKey: ['kit-usage'] });
      queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting procedure kit:', error);
      toast.error('Erro ao remover vínculo');
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: ProcedureKitFormData = {
  procedure_id: '',
  kit_id: '',
  quantity: 1,
  is_required: true,
};

export function useProcedureKitForm(initialData?: ProcedureKit | null) {
  const [formData, setFormData] = useState<ProcedureKitFormData>(
    initialData
      ? {
          procedure_id: initialData.procedure_id,
          kit_id: initialData.kit_id,
          quantity: initialData.quantity,
          is_required: initialData.is_required,
        }
      : defaultFormData
  );

  const updateField = <K extends keyof ProcedureKitFormData>(
    field: K,
    value: ProcedureKitFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const isValid = formData.procedure_id && formData.kit_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
}
