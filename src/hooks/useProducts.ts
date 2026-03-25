import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product, ProductFormData } from "@/types/inventory";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

// Fetch all active products
export function useProducts(includeInactive = false) {
  return useQuery({
    queryKey: ["products", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch single product
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

// Fetch products with low stock
export function useLowStockProducts() {
  return useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("current_stock");
      
      if (error) throw error;
      
      return (data as Product[]).filter(
        p => p.current_stock <= p.min_stock
      );
    },
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const clinicId = await getClinicId();
      
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          clinic_id: clinicId,
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          category: data.category || null,
          unit: data.unit,
          current_stock: data.current_stock || 0,
          min_stock: data.min_stock || 0,
          cost_price: data.cost_price || 0,
          sale_price: data.sale_price,
          product_type: data.product_type || 'material_clinico',
          is_active: data.is_active ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar produto: " + error.message);
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.current_stock !== undefined) updateData.current_stock = data.current_stock;
      if (data.min_stock !== undefined) updateData.min_stock = data.min_stock;
      if (data.cost_price !== undefined) updateData.cost_price = data.cost_price;
      if (data.sale_price !== undefined) updateData.sale_price = data.sale_price;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["procedure-product-costs"] });
      queryClient.invalidateQueries({ queryKey: ["procedure-product-cost"] });
      queryClient.invalidateQueries({ queryKey: ["procedure-products"] });
      toast.success("Produto atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });
}

// Delete product (soft delete)
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      toast.success("Produto removido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover produto: " + error.message);
    },
  });
}

// Update stock quantity directly
export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ 
          current_stock: quantity,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar estoque: " + error.message);
    },
  });
}
