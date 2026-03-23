import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ProductKit,
  ProductKitFormData,
  ProductKitItem,
  ProductKitItemFormData,
} from '@/types/product-kits';

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

export function useProductKitsList(includeInactive: boolean = false) {
  return useQuery({
    queryKey: ['product-kits-list', includeInactive],
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

      // Calculate items count and total cost
      return (data || []).map((kit: any) => {
        const items = kit.product_kit_items || [];
        const totalCost = items.reduce((sum: number, item: any) => {
          const unitCost = item.products?.cost_price || 0;
          return sum + (item.quantity * unitCost);
        }, 0);

        return {
          ...kit,
          items_count: items.length,
          total_cost: totalCost,
          product_kit_items: undefined,
        } as ProductKit;
      });
    },
  });
}

export function useProductKit(id: string | null) {
  return useQuery({
    queryKey: ['product-kit', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('product_kits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProductKit;
    },
    enabled: !!id,
  });
}

// =============================================
// KIT ITEMS QUERIES
// =============================================

export function useProductKitItems(kitId: string | null) {
  return useQuery({
    queryKey: ['product-kit-items', kitId],
    queryFn: async () => {
      if (!kitId) return [];

      const { data, error } = await supabase
        .from('product_kit_items')
        .select(`
          *,
          products:product_id (name, unit, cost_price, stock_quantity)
        `)
        .eq('kit_id', kitId)
        .order('created_at');

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        product_unit: item.products?.unit,
        product_cost_price: item.products?.cost_price,
        product_stock: item.products?.stock_quantity,
      })) as ProductKitItem[];
    },
    enabled: !!kitId,
  });
}

// =============================================
// KIT MUTATIONS
// =============================================

export function useCreateProductKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProductKitFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('product_kits')
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
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      toast.success('Kit de produtos criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating product kit:', error);
      toast.error('Erro ao criar kit de produtos');
    },
  });
}

export function useUpdateProductKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ProductKitFormData }) => {
      const { data, error } = await supabase
        .from('product_kits')
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
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-kit'] });
      toast.success('Kit atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating product kit:', error);
      toast.error('Erro ao atualizar kit');
    },
  });
}

export function useToggleProductKitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('product_kits')
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
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      toast.success(data.is_active ? 'Kit ativado!' : 'Kit desativado!');
    },
    onError: (error) => {
      console.error('Error toggling product kit status:', error);
      toast.error('Erro ao alterar status do kit');
    },
  });
}

// =============================================
// KIT ITEMS MUTATIONS
// =============================================

export function useAddProductToKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kitId, formData }: { kitId: string; formData: ProductKitItemFormData }) => {
      const { data, error } = await supabase
        .from('product_kit_items')
        .insert({
          kit_id: kitId,
          product_id: formData.product_id,
          quantity: formData.quantity,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este produto já está no kit');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, { kitId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-kit-items', kitId] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      toast.success('Produto adicionado ao kit!');
    },
    onError: (error: any) => {
      console.error('Error adding product to kit:', error);
      toast.error(error.message || 'Erro ao adicionar produto');
    },
  });
}

export function useUpdateKitItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kitId, quantity }: { id: string; kitId: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('product_kit_items')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, kitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-kit-items', result.kitId] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      toast.success('Quantidade atualizada!');
    },
    onError: (error) => {
      console.error('Error updating kit item:', error);
      toast.error('Erro ao atualizar item');
    },
  });
}

export function useRemoveProductFromKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kitId }: { id: string; kitId: string }) => {
      const { error } = await supabase
        .from('product_kit_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { kitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-kit-items', result.kitId] });
      queryClient.invalidateQueries({ queryKey: ['product-kits-list'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-product-costs'] });
      toast.success('Produto removido do kit!');
    },
    onError: (error) => {
      console.error('Error removing product from kit:', error);
      toast.error('Erro ao remover produto');
    },
  });
}

// =============================================
// FORM HOOKS
// =============================================

const defaultKitFormData: ProductKitFormData = {
  name: '',
  description: '',
};

export function useProductKitForm(initialData?: ProductKit | null) {
  const [formData, setFormData] = useState<ProductKitFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
        }
      : defaultKitFormData
  );

  const updateField = <K extends keyof ProductKitFormData>(
    field: K,
    value: ProductKitFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultKitFormData);
  };

  const loadKit = (kit: ProductKit) => {
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

const defaultItemFormData: ProductKitItemFormData = {
  product_id: '',
  quantity: 1,
};

export function useProductKitItemForm() {
  const [formData, setFormData] = useState<ProductKitItemFormData>(defaultItemFormData);

  const updateField = <K extends keyof ProductKitItemFormData>(
    field: K,
    value: ProductKitItemFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultItemFormData);
  };

  const isValid = formData.product_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
}
