import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ProcedureProductKit,
  ProcedureProductKitFormData,
} from '@/types/product-kits';

// =============================================
// QUERIES
// =============================================

export function useProcedureProductKitsByProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-product-kits', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];

      const { data, error } = await supabase
        .from('procedure_product_kits')
        .select(`
          *,
          product_kits:product_kit_id (
            name,
            product_kit_items (
              quantity,
              products:product_id (cost_price)
            )
          )
        `)
        .eq('procedure_id', procedureId)
        .order('created_at');

      if (error) throw error;

      return (data || []).map((item: any) => {
        // Calculate kit total cost
        const kitItems = item.product_kits?.product_kit_items || [];
        const kitTotalCost = kitItems.reduce((sum: number, ki: any) => {
          return sum + (ki.quantity * (ki.products?.cost_price || 0));
        }, 0);

        return {
          ...item,
          kit_id: item.product_kit_id, // backwards-compat alias for UI
          kit_name: item.product_kits?.name,
          kit_total_cost: kitTotalCost * item.quantity,
        } as ProcedureProductKit;
      });
    },
    enabled: !!procedureId,
  });
}

// Count how many procedures use a kit
export function useKitUsageCount(kitId: string | null) {
  return useQuery({
    queryKey: ['product-kit-usage', kitId],
    queryFn: async () => {
      if (!kitId) return 0;

      const { count, error } = await supabase
        .from('procedure_product_kits')
        .select('*', { count: 'exact', head: true })
        .eq('product_kit_id', kitId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!kitId,
  });
}

// Count usage for multiple kits
export function useKitsUsageCount() {
  return useQuery({
    queryKey: ['product-kits-usage-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_product_kits')
        .select('product_kit_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        counts[item.product_kit_id] = (counts[item.product_kit_id] || 0) + 1;
      });

      return counts;
    },
  });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreateProcedureProductKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProcedureProductKitFormData) => {
      const { data, error } = await supabase
        .from('procedure_product_kits')
        .insert({
          procedure_id: formData.procedure_id,
          product_kit_id: formData.kit_id,
          quantity: formData.quantity,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este kit já está vinculado ao procedimento');
        }
        if (error.code === '23503') {
          throw new Error('Kit inválido. Cadastre o kit em Estoque → Kits antes de vincular.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-product-kits', variables.procedure_id] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-usage-count'] });
      toast.success('Kit vinculado ao procedimento!');
    },
    onError: (error: any) => {
      console.error('Error creating procedure product kit:', error);
      toast.error(error.message || 'Erro ao vincular kit');
    },
  });
}

export function useUpdateProcedureProductKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, procedureId, formData }: {
      id: string;
      procedureId: string;
      formData: Partial<ProcedureProductKitFormData>
    }) => {
      const { data, error } = await supabase
        .from('procedure_product_kits')
        .update({
          quantity: formData.quantity,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-product-kits', result.procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      toast.success('Vínculo atualizado!');
    },
    onError: (error) => {
      console.error('Error updating procedure product kit:', error);
      toast.error('Erro ao atualizar vínculo');
    },
  });
}

export function useDeleteProcedureProductKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, procedureId }: { id: string; procedureId: string }) => {
      const { error } = await supabase
        .from('procedure_product_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-product-kits', result.procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-usage-count'] });
      toast.success('Kit removido do procedimento!');
    },
    onError: (error) => {
      console.error('Error deleting procedure product kit:', error);
      toast.error('Erro ao remover kit');
    },
  });
}
