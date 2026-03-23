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
        .order("stock_quantity");
      
      if (error) throw error;
      
      // Filter client-side: products where stock is at or below minimum
      return (data as Product[]).filter(
        p => p.stock_quantity <= p.min_stock_quantity
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
          barcode: data.barcode || null,
          category: data.category || null,
          unit: data.unit,
          stock_quantity: data.stock_quantity || 0,
          min_stock_quantity: data.min_stock_quantity || 0,
          cost_price: data.cost_price || 0,
          sale_price: data.sale_price,
          supplier: data.supplier || null,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating product:", error);
      toast.error("Erro ao criar produto: " + error.message);
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { error } = await supabase
        .from("products")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Atualizar custos de procedimentos quando cost_price mudar
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
          stock_quantity: quantity,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar estoque: " + error.message);
    },
  });
}
