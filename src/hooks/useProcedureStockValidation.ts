import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockValidationItem {
  productId: string;
  productName: string;
  requiredQuantity: number;
  availableStock: number;
  hasEnoughStock: boolean;
  deficit: number;
}

export interface StockValidationResult {
  isValid: boolean;
  items: StockValidationItem[];
  totalDeficit: number;
  allowNegativeStock: boolean;
}

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

export function useProcedureStockValidation(procedureId: string | null | undefined) {
  return useQuery({
    queryKey: ["procedure-stock-validation", procedureId],
    queryFn: async (): Promise<StockValidationResult> => {
      if (!procedureId) {
        return {
          isValid: true,
          items: [],
          totalDeficit: 0,
          allowNegativeStock: false,
        };
      }

      const clinicId = await getClinicId();

      // Get clinic settings
      const { data: clinic } = await supabase
        .from("clinics")
        .select("allow_negative_stock")
        .eq("id", clinicId)
        .single();

      const allowNegativeStock = clinic?.allow_negative_stock ?? false;

      // Get procedure products with current stock
      const { data: procedureProducts, error } = await supabase
        .from("procedure_products")
        .select(`
          id,
          quantity,
          products:product_id (
            id,
            name,
            stock_quantity
          )
        `)
        .eq("procedure_id", procedureId);

      if (error) throw error;

      if (!procedureProducts || procedureProducts.length === 0) {
        return {
          isValid: true,
          items: [],
          totalDeficit: 0,
          allowNegativeStock,
        };
      }

      const items: StockValidationItem[] = procedureProducts.map((pp: any) => {
        const product = pp.products;
        const requiredQuantity = pp.quantity;
        const availableStock = product?.stock_quantity ?? 0;
        const hasEnoughStock = availableStock >= requiredQuantity;
        const deficit = hasEnoughStock ? 0 : requiredQuantity - availableStock;

        return {
          productId: product?.id ?? "",
          productName: product?.name ?? "Produto desconhecido",
          requiredQuantity,
          availableStock,
          hasEnoughStock,
          deficit,
        };
      });

      const totalDeficit = items.reduce((sum, item) => sum + item.deficit, 0);
      const isValid = items.every((item) => item.hasEnoughStock);

      return {
        isValid,
        items,
        totalDeficit,
        allowNegativeStock,
      };
    },
    enabled: !!procedureId,
    staleTime: 30000, // 30 seconds
  });
}

// Function to validate stock before procedure execution (imperative)
export async function validateProcedureStock(
  procedureId: string
): Promise<StockValidationResult> {
  const clinicId = await getClinicId();

  // Get clinic settings
  const { data: clinic } = await supabase
    .from("clinics")
    .select("allow_negative_stock")
    .eq("id", clinicId)
    .single();

  const allowNegativeStock = clinic?.allow_negative_stock ?? false;

  // Get procedure products with current stock
  const { data: procedureProducts, error } = await supabase
    .from("procedure_products")
    .select(`
      id,
      quantity,
      products:product_id (
        id,
        name,
        stock_quantity
      )
    `)
    .eq("procedure_id", procedureId);

  if (error) throw error;

  if (!procedureProducts || procedureProducts.length === 0) {
    return {
      isValid: true,
      items: [],
      totalDeficit: 0,
      allowNegativeStock,
    };
  }

  const items: StockValidationItem[] = procedureProducts.map((pp: any) => {
    const product = pp.products;
    const requiredQuantity = pp.quantity;
    const availableStock = product?.stock_quantity ?? 0;
    const hasEnoughStock = availableStock >= requiredQuantity;
    const deficit = hasEnoughStock ? 0 : requiredQuantity - availableStock;

    return {
      productId: product?.id ?? "",
      productName: product?.name ?? "Produto desconhecido",
      requiredQuantity,
      availableStock,
      hasEnoughStock,
      deficit,
    };
  });

  const totalDeficit = items.reduce((sum, item) => sum + item.deficit, 0);
  const isValid = items.every((item) => item.hasEnoughStock);

  return {
    isValid,
    items,
    totalDeficit,
    allowNegativeStock,
  };
}
