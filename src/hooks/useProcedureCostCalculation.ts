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

export interface ProcedureCostDetail {
  procedure_id: string;
  procedure_name: string;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total: number;
    is_required: boolean;
  }>;
  kits: Array<{
    id: string;
    name: string;
    quantity: number;
    kit_cost: number;
    total: number;
    is_required: boolean;
    items: Array<{
      material_name: string;
      quantity: number;
      unit: string;
      unit_cost: number;
    }>;
  }>;
  material_cost: number;
  kit_cost: number;
  total_cost: number;
}

// Hook para calcular custo detalhado de um procedimento
export function useProcedureCostDetail(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-cost-detail', procedureId],
    queryFn: async (): Promise<ProcedureCostDetail | null> => {
      if (!procedureId) return null;
      
      // Buscar procedimento
      const { data: procedure, error: procError } = await supabase
        .from('procedures')
        .select('id, name')
        .eq('id', procedureId)
        .single();
        
      if (procError) throw procError;
      
      // Buscar materiais do procedimento
      const { data: materials, error: matError } = await supabase
        .from('procedure_materials')
        .select(`
          id,
          quantity,
          products:product_id (name, unit, cost_price)
        `)
        .eq('procedure_id', procedureId);
        
      if (matError) throw matError;
      
      // Buscar kits do procedimento
      const { data: kits, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          id,
          quantity,
          product_kits:product_kit_id (
            id,
            name,
            product_kit_items (
              quantity,
              products:product_id (name, unit, cost_price)
            )
          )
        `)
        .eq('procedure_id', procedureId);
        
      if (kitError) throw kitError;
      
      // Calcular custos dos materiais
      const materialsList = (materials || []).map((m: any) => {
        const unitCost = Number(m.products?.cost_price) || 0;
        return {
          id: m.id,
          name: m.products?.name || 'Material não encontrado',
          quantity: m.quantity,
          unit: m.products?.unit || 'un',
          unit_cost: unitCost,
          total: m.quantity * unitCost,
          is_required: false,
        };
      });
      
      // Calcular custos dos kits
      const kitsList = (kits || []).map((k: any) => {
        const kitItems = k.product_kits?.product_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          return sum + (item.quantity * (Number(item.products?.cost_price) || 0));
        }, 0);
        
        return {
          id: k.id,
          name: k.product_kits?.name || 'Kit não encontrado',
          quantity: k.quantity,
          kit_cost: kitCost,
          total: k.quantity * kitCost,
          is_required: false,
          items: kitItems.map((item: any) => ({
            material_name: item.products?.name || '',
            quantity: item.quantity,
            unit: item.products?.unit || 'un',
            unit_cost: Number(item.products?.cost_price) || 0,
          })),
        };
      });
      
      const materialCost = materialsList.reduce((sum, m) => sum + m.total, 0);
      const kitCost = kitsList.reduce((sum, k) => sum + k.total, 0);
      
      return {
        procedure_id: procedure.id,
        procedure_name: procedure.name,
        materials: materialsList,
        kits: kitsList,
        material_cost: materialCost,
        kit_cost: kitCost,
        total_cost: materialCost + kitCost,
      };
    },
    enabled: !!procedureId,
  });
}

// Hook para listar todos os procedimentos com seus custos
export function useProceduresWithCosts() {
  return useQuery({
    queryKey: ['procedures-with-costs'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      // Buscar todos os procedimentos
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('id, name, is_active')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name');
        
      if (procError) throw procError;

      const procedureIds = (procedures || []).map((p: any) => p.id);
      if (procedureIds.length === 0) return [];

      // Buscar todos os materiais vinculados (escopo pelos procedimentos da clínica)
      const { data: materials, error: matError } = await supabase
        .from('procedure_materials')
        .select(`
          procedure_id,
          quantity,
          products:product_id (cost_price)
        `)
        .in('procedure_id', procedureIds);
        
      if (matError) throw matError;
      
      // Buscar todos os kits vinculados
      const { data: kits, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          procedure_id,
          quantity,
          product_kits:product_kit_id (
            product_kit_items (
              quantity,
              products:product_id (cost_price)
            )
          )
        `)
        .in('procedure_id', procedureIds);
        
      if (kitError) throw kitError;
      
      // Calcular custo por procedimento
      const materialCosts: Record<string, number> = {};
      (materials || []).forEach((m: any) => {
        const cost = m.quantity * (Number(m.products?.cost_price) || 0);
        materialCosts[m.procedure_id] = (materialCosts[m.procedure_id] || 0) + cost;
      });
      
      const kitCosts: Record<string, number> = {};
      (kits || []).forEach((k: any) => {
        const kitItems = k.product_kits?.product_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          return sum + (item.quantity * (Number(item.products?.cost_price) || 0));
        }, 0);
        kitCosts[k.procedure_id] = (kitCosts[k.procedure_id] || 0) + (k.quantity * kitCost);
      });
      
      // Contar itens por procedimento
      const materialCounts: Record<string, number> = {};
      (materials || []).forEach((m: any) => {
        materialCounts[m.procedure_id] = (materialCounts[m.procedure_id] || 0) + 1;
      });
      
      const kitCounts: Record<string, number> = {};
      (kits || []).forEach((k: any) => {
        kitCounts[k.procedure_id] = (kitCounts[k.procedure_id] || 0) + 1;
      });
      
      return (procedures || []).map((proc: any) => ({
        id: proc.id,
        name: proc.name,
        is_active: proc.is_active,
        material_count: materialCounts[proc.id] || 0,
        kit_count: kitCounts[proc.id] || 0,
        material_cost: materialCosts[proc.id] || 0,
        kit_cost: kitCosts[proc.id] || 0,
        total_cost: (materialCosts[proc.id] || 0) + (kitCosts[proc.id] || 0),
        has_items: (materialCounts[proc.id] || 0) + (kitCounts[proc.id] || 0) > 0,
      }));
    },
  });
}

// Hook para contar onde um material é usado
export function useMaterialUsageCount() {
  return useQuery({
    queryKey: ['material-usage-count'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      // Procedimentos da clínica (procedure_materials não tem clinic_id)
      const { data: clinicProcedures } = await supabase
        .from('procedures')
        .select('id')
        .eq('clinic_id', clinicId);
      const clinicProcedureIds = (clinicProcedures || []).map((p: any) => p.id);

      // Uso em procedimentos diretos
      const { data: procMaterials, error: pmError } = clinicProcedureIds.length
        ? await supabase
            .from('procedure_materials')
            .select('product_id, procedure_id')
            .in('procedure_id', clinicProcedureIds)
        : { data: [], error: null };
        
      if (pmError) throw pmError;
      
      // Uso em kits
      const { data: kitItems, error: kiError } = await supabase
        .from('material_kit_items')
        .select(`
          product_id,
          kit_id,
          product_kits:kit_id (clinic_id)
        `);
        
      if (kiError) throw kiError;
      
      // Filtrar por clinic_id
      const filteredKitItems = (kitItems || []).filter(
        (item: any) => item.product_kits?.clinic_id === clinicId
      );
      
      // Agregar contagens
      const usageMap: Record<string, { 
        in_procedures: number; 
        in_kits: number;
        procedure_ids: string[];
        kit_ids: string[];
      }> = {};
      
      (procMaterials || []).forEach((pm: any) => {
        if (!usageMap[pm.product_id]) {
          usageMap[pm.product_id] = { 
            in_procedures: 0, 
            in_kits: 0,
            procedure_ids: [],
            kit_ids: [],
          };
        }
        usageMap[pm.product_id].in_procedures++;
        usageMap[pm.product_id].procedure_ids.push(pm.procedure_id);
      });
      
      filteredKitItems.forEach((ki: any) => {
        if (!usageMap[ki.product_id]) {
          usageMap[ki.product_id] = { 
            in_procedures: 0, 
            in_kits: 0,
            procedure_ids: [],
            kit_ids: [],
          };
        }
        usageMap[ki.product_id].in_kits++;
        usageMap[ki.product_id].kit_ids.push(ki.kit_id);
      });
      
      return usageMap;
    },
  });
}
