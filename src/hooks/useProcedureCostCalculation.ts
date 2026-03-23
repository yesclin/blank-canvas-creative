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
          unit,
          is_required,
          materials:material_id (name, unit_cost)
        `)
        .eq('procedure_id', procedureId);
        
      if (matError) throw matError;
      
      // Buscar kits do procedimento
      const { data: kits, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          id,
          quantity,
          is_required,
          material_kits:kit_id (
            id,
            name,
            material_kit_items (
              quantity,
              unit,
              materials:material_id (name, unit_cost)
            )
          )
        `)
        .eq('procedure_id', procedureId);
        
      if (kitError) throw kitError;
      
      // Calcular custos dos materiais
      const materialsList = (materials || []).map((m: any) => {
        const unitCost = m.materials?.unit_cost || 0;
        return {
          id: m.id,
          name: m.materials?.name || 'Material não encontrado',
          quantity: m.quantity,
          unit: m.unit,
          unit_cost: unitCost,
          total: m.quantity * unitCost,
          is_required: m.is_required,
        };
      });
      
      // Calcular custos dos kits
      const kitsList = (kits || []).map((k: any) => {
        const kitItems = k.material_kits?.material_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          return sum + (item.quantity * (item.materials?.unit_cost || 0));
        }, 0);
        
        return {
          id: k.id,
          name: k.material_kits?.name || 'Kit não encontrado',
          quantity: k.quantity,
          kit_cost: kitCost,
          total: k.quantity * kitCost,
          is_required: k.is_required,
          items: kitItems.map((item: any) => ({
            material_name: item.materials?.name || '',
            quantity: item.quantity,
            unit: item.unit,
            unit_cost: item.materials?.unit_cost || 0,
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
      
      // Buscar todos os materiais vinculados
      const { data: materials, error: matError } = await supabase
        .from('procedure_materials')
        .select(`
          procedure_id,
          quantity,
          materials:material_id (unit_cost)
        `)
        .eq('clinic_id', clinicId);
        
      if (matError) throw matError;
      
      // Buscar todos os kits vinculados
      const { data: kits, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          procedure_id,
          quantity,
          material_kits:kit_id (
            material_kit_items (
              quantity,
              materials:material_id (unit_cost)
            )
          )
        `)
        .eq('clinic_id', clinicId);
        
      if (kitError) throw kitError;
      
      // Calcular custo por procedimento
      const materialCosts: Record<string, number> = {};
      (materials || []).forEach((m: any) => {
        const cost = m.quantity * (m.materials?.unit_cost || 0);
        materialCosts[m.procedure_id] = (materialCosts[m.procedure_id] || 0) + cost;
      });
      
      const kitCosts: Record<string, number> = {};
      (kits || []).forEach((k: any) => {
        const kitItems = k.material_kits?.material_kit_items || [];
        const kitCost = kitItems.reduce((sum: number, item: any) => {
          return sum + (item.quantity * (item.materials?.unit_cost || 0));
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
      
      // Uso em procedimentos diretos
      const { data: procMaterials, error: pmError } = await supabase
        .from('procedure_materials')
        .select('material_id, procedure_id')
        .eq('clinic_id', clinicId);
        
      if (pmError) throw pmError;
      
      // Uso em kits
      const { data: kitItems, error: kiError } = await supabase
        .from('material_kit_items')
        .select(`
          material_id,
          kit_id,
          material_kits:kit_id (clinic_id)
        `);
        
      if (kiError) throw kiError;
      
      // Filtrar por clinic_id
      const filteredKitItems = (kitItems || []).filter(
        (item: any) => item.material_kits?.clinic_id === clinicId
      );
      
      // Agregar contagens
      const usageMap: Record<string, { 
        in_procedures: number; 
        in_kits: number;
        procedure_ids: string[];
        kit_ids: string[];
      }> = {};
      
      (procMaterials || []).forEach((pm: any) => {
        if (!usageMap[pm.material_id]) {
          usageMap[pm.material_id] = { 
            in_procedures: 0, 
            in_kits: 0,
            procedure_ids: [],
            kit_ids: [],
          };
        }
        usageMap[pm.material_id].in_procedures++;
        usageMap[pm.material_id].procedure_ids.push(pm.procedure_id);
      });
      
      filteredKitItems.forEach((ki: any) => {
        if (!usageMap[ki.material_id]) {
          usageMap[ki.material_id] = { 
            in_procedures: 0, 
            in_kits: 0,
            procedure_ids: [],
            kit_ids: [],
          };
        }
        usageMap[ki.material_id].in_kits++;
        usageMap[ki.material_id].kit_ids.push(ki.kit_id);
      });
      
      return usageMap;
    },
  });
}
