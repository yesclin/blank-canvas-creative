/**
 * ESTÉTICA - Produtos Utilizados
 * 
 * Hook para gerenciar produtos utilizados em procedimentos estéticos
 * com rastreabilidade completa de lote e validade.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface AestheticProductUsed {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  facial_map_id: string | null;
  product_name: string;
  manufacturer: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  quantity: number;
  unit: string;
  procedure_type: string | null;
  procedure_description: string | null;
  application_area: string | null;
  notes: string | null;
  registered_by: string | null;
  registered_at: string;
  created_at: string;
}

export interface CreateProductUsedData {
  product_name: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  unit: string;
  procedure_type?: string;
  procedure_description?: string;
  application_area?: string;
  notes?: string;
}

interface UseProdutosUtilizadosParams {
  patientId: string | null;
  appointmentId?: string | null;
}

export function useProdutosUtilizadosData({ 
  patientId, 
  appointmentId 
}: UseProdutosUtilizadosParams) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ['aesthetic-products-used', patientId, clinic?.id];

  // Buscar produtos utilizados pelo paciente
  const { data: products = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('aesthetic_products_used')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching products used:', error);
        throw error;
      }

      return data as AestheticProductUsed[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Produtos do atendimento atual
  const currentAppointmentProducts = appointmentId
    ? products.filter(p => p.appointment_id === appointmentId)
    : [];

  // Adicionar produto
  const addProductMutation = useMutation({
    mutationFn: async (data: CreateProductUsedData) => {
      if (!patientId || !clinic?.id) throw new Error('Dados obrigatórios ausentes');

      const { data: userData } = await supabase.auth.getUser();

      const { data: result, error } = await supabase
        .from('aesthetic_products_used')
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          appointment_id: appointmentId || null,
          product_name: data.product_name,
          manufacturer: data.manufacturer || null,
          batch_number: data.batch_number || null,
          expiry_date: data.expiry_date || null,
          quantity: data.quantity,
          unit: data.unit,
          procedure_type: data.procedure_type || null,
          procedure_description: data.procedure_description || null,
          application_area: data.application_area || null,
          notes: data.notes || null,
          registered_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Produto registrado');
    },
    onError: (error) => {
      console.error('Error adding product:', error);
      toast.error('Erro ao registrar produto');
    },
  });

  // Atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProductUsedData> }) => {
      const { error } = await supabase
        .from('aesthetic_products_used')
        .update({
          product_name: data.product_name,
          manufacturer: data.manufacturer || null,
          batch_number: data.batch_number || null,
          expiry_date: data.expiry_date || null,
          quantity: data.quantity,
          unit: data.unit,
          procedure_type: data.procedure_type || null,
          procedure_description: data.procedure_description || null,
          application_area: data.application_area || null,
          notes: data.notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Produto atualizado');
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    },
  });

  // Remover produto
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aesthetic_products_used')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Produto removido');
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast.error('Erro ao remover produto');
    },
  });

  // Verificar produtos próximos do vencimento
  const getExpiringProducts = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return products.filter(p => {
      if (!p.expiry_date) return false;
      const expiryDate = new Date(p.expiry_date);
      return expiryDate <= thirtyDaysFromNow;
    });
  };

  return {
    products,
    currentAppointmentProducts,
    isLoading,
    addProduct: addProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
    isAdding: addProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    getExpiringProducts,
  };
}

// Tipos de procedimento para seleção
export const PROCEDURE_TYPES = [
  { value: 'toxin', label: 'Toxina Botulínica' },
  { value: 'filler', label: 'Preenchimento' },
  { value: 'biostimulator', label: 'Bioestimulador' },
  { value: 'skincare', label: 'Skincare/Cosmético' },
  { value: 'other', label: 'Outro' },
];

// Unidades comuns
export const PRODUCT_UNITS = [
  { value: 'un', label: 'Unidade(s)' },
  { value: 'ml', label: 'ml' },
  { value: 'UI', label: 'UI' },
  { value: 'mg', label: 'mg' },
  { value: 'g', label: 'g' },
  { value: 'ampola', label: 'Ampola(s)' },
  { value: 'seringa', label: 'Seringa(s)' },
];
