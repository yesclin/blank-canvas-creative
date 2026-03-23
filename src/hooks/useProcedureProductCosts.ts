import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export interface ProcedureProductCost {
  procedure_id: string;
  product_count: number;
  kit_count: number;
  products_cost: number;
  kits_cost: number;
  total_cost: number;
}

/**
 * Hook para calcular o custo total de produtos e kits por procedimento.
 * Usa cost_price dos produtos para calcular o custo real.
 * Atualiza automaticamente quando produtos/kits são adicionados/removidos/alterados.
 */
export function useProcedureProductCosts() {
  return useQuery({
    queryKey: ['procedure-product-costs'],
    queryFn: async (): Promise<Record<string, ProcedureProductCost>> => {
      const clinicId = await getClinicId();
      
      // Buscar todos os vínculos procedimento-produto com custo
      const { data: procedureProducts, error: ppError } = await supabase
        .from('procedure_products')
        .select(`
          procedure_id,
          quantity,
          products:product_id (cost_price)
        `)
        .eq('clinic_id', clinicId);
        
      if (ppError) throw ppError;
      
      // Buscar todos os vínculos procedimento-kit com custo
      const { data: procedureKits, error: pkError } = await supabase
        .from('procedure_product_kits')
        .select(`
          procedure_id,
          quantity,
          product_kits:kit_id (
            id,
            product_kit_items (
              quantity,
              products:product_id (cost_price)
            )
          )
        `)
        .eq('clinic_id', clinicId);
        
      if (pkError) throw pkError;
      
      // Agregar custos por procedimento
      const costMap: Record<string, ProcedureProductCost> = {};
      
      // Processar produtos individuais
      (procedureProducts || []).forEach((pp: any) => {
        const procedureId = pp.procedure_id;
        const costPrice = pp.products?.cost_price || 0;
        const itemCost = pp.quantity * costPrice;
        
        if (!costMap[procedureId]) {
          costMap[procedureId] = {
            procedure_id: procedureId,
            product_count: 0,
            kit_count: 0,
            products_cost: 0,
            kits_cost: 0,
            total_cost: 0,
          };
        }
        
        costMap[procedureId].product_count++;
        costMap[procedureId].products_cost += itemCost;
        costMap[procedureId].total_cost += itemCost;
      });
      
      // Processar kits
      (procedureKits || []).forEach((pk: any) => {
        const procedureId = pk.procedure_id;
        const kit = pk.product_kits;
        
        if (!kit) return;
        
        // Calcular custo do kit
        const kitItems = kit.product_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          const costPrice = item.products?.cost_price || 0;
          return sum + (item.quantity * costPrice);
        }, 0);
        
        const totalKitCost = kitCost * pk.quantity;
        
        if (!costMap[procedureId]) {
          costMap[procedureId] = {
            procedure_id: procedureId,
            product_count: 0,
            kit_count: 0,
            products_cost: 0,
            kits_cost: 0,
            total_cost: 0,
          };
        }
        
        costMap[procedureId].kit_count++;
        costMap[procedureId].kits_cost += totalKitCost;
        costMap[procedureId].total_cost += totalKitCost;
      });
      
      return costMap;
    },
  });
}

/**
 * Hook para obter o custo de produtos e kits de um procedimento específico.
 */
export function useProcedureProductCost(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-product-cost', procedureId],
    queryFn: async (): Promise<ProcedureProductCost | null> => {
      if (!procedureId) return null;
      
      // Buscar produtos
      const { data: procedureProducts, error: ppError } = await supabase
        .from('procedure_products')
        .select(`
          quantity,
          products:product_id (cost_price)
        `)
        .eq('procedure_id', procedureId);
        
      if (ppError) throw ppError;
      
      // Buscar kits
      const { data: procedureKits, error: pkError } = await supabase
        .from('procedure_product_kits')
        .select(`
          quantity,
          product_kits:kit_id (
            id,
            product_kit_items (
              quantity,
              products:product_id (cost_price)
            )
          )
        `)
        .eq('procedure_id', procedureId);
        
      if (pkError) throw pkError;
      
      let productsCost = 0;
      let productCount = 0;
      let kitsCost = 0;
      let kitCount = 0;
      
      // Calcular custo de produtos
      (procedureProducts || []).forEach((pp: any) => {
        const costPrice = pp.products?.cost_price || 0;
        productsCost += pp.quantity * costPrice;
        productCount++;
      });
      
      // Calcular custo de kits
      (procedureKits || []).forEach((pk: any) => {
        const kit = pk.product_kits;
        if (!kit) return;
        
        const kitItems = kit.product_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          const costPrice = item.products?.cost_price || 0;
          return sum + (item.quantity * costPrice);
        }, 0);
        
        kitsCost += kitCost * pk.quantity;
        kitCount++;
      });
      
      return {
        procedure_id: procedureId,
        product_count: productCount,
        kit_count: kitCount,
        products_cost: productsCost,
        kits_cost: kitsCost,
        total_cost: productsCost + kitsCost,
      };
    },
    enabled: !!procedureId,
  });
}
