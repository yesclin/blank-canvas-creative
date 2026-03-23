import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================
// TIPOS
// =============================================

export interface ProcedureProduct {
  id: string;
  clinic_id: string;
  procedure_id: string;
  product_id: string;
  quantity: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_name?: string;
  product_unit?: string;
  product_cost_price?: number;
}

export interface ProcedureProductFormData {
  procedure_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}

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

export function useProcedureProductsByProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-products', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      const { data, error } = await supabase
        .from('procedure_products')
        .select(`
          *,
          products:product_id (name, unit, cost_price)
        `)
        .eq('procedure_id', procedureId)
        .order('created_at');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        product_unit: item.products?.unit,
        product_cost_price: item.products?.cost_price,
      })) as ProcedureProduct[];
    },
    enabled: !!procedureId,
  });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreateProcedureProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: ProcedureProductFormData) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('procedure_products')
        .insert({
          clinic_id: clinicId,
          procedure_id: formData.procedure_id,
          product_id: formData.product_id,
          quantity: formData.quantity,
          notes: formData.notes || null,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este produto já está vinculado ao procedimento');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-products', variables.procedure_id] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-cost', variables.procedure_id] });
      toast.success('Produto vinculado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating procedure product:', error);
      toast.error(error.message || 'Erro ao vincular produto');
    },
  });
}

export function useUpdateProcedureProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, procedureId, formData }: { id: string; procedureId: string; formData: Partial<ProcedureProductFormData> }) => {
      const { data, error } = await supabase
        .from('procedure_products')
        .update({
          quantity: formData.quantity,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return { data, procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-products', result.procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-cost', result.procedureId] });
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating procedure product:', error);
      toast.error('Erro ao atualizar vínculo');
    },
  });
}

export function useDeleteProcedureProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, procedureId }: { id: string; procedureId: string }) => {
      const { error } = await supabase
        .from('procedure_products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-products', result.procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-cost', result.procedureId] });
      toast.success('Produto removido do procedimento!');
    },
    onError: (error) => {
      console.error('Error deleting procedure product:', error);
      toast.error('Erro ao remover produto');
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: ProcedureProductFormData = {
  procedure_id: '',
  product_id: '',
  quantity: 1,
  notes: '',
};

export function useProcedureProductForm() {
  const [formData, setFormData] = useState<ProcedureProductFormData>(defaultFormData);

  const updateField = <K extends keyof ProcedureProductFormData>(
    field: K,
    value: ProcedureProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const loadFromExisting = (item: ProcedureProduct) => {
    setFormData({
      procedure_id: item.procedure_id,
      product_id: item.product_id,
      quantity: item.quantity,
      notes: item.notes || '',
    });
  };

  const isValid = formData.procedure_id && formData.product_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    loadFromExisting,
    isValid,
  };
}
