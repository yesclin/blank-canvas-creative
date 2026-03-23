import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsumedProduct {
  id: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  consumed_at: string;
  source: string;
}

export interface AppointmentCostDetails {
  appointment_id: string;
  procedure_cost: number | null;
  procedure_name: string | null;
  professional_name: string | null;
  scheduled_date: string | null;
  consumed_materials: ConsumedProduct[];
  total_materials_cost: number;
}

/**
 * Hook para buscar detalhes de custo de um atendimento finalizado.
 * Inclui o custo histórico do procedimento e materiais/produtos consumidos.
 * Os valores são históricos - capturados no momento da execução.
 */
export function useAppointmentCostDetails(appointmentId: string | null) {
  return useQuery({
    queryKey: ['appointment-cost-details', appointmentId],
    queryFn: async (): Promise<AppointmentCostDetails | null> => {
      if (!appointmentId) return null;

      // Get appointment with procedure cost and related data
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          procedure_cost,
          scheduled_date,
          procedures:procedure_id (name),
          professionals:professional_id (full_name)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      // Get consumed materials/products for this appointment from material_consumption
      const { data: consumedMaterials, error: materialsError } = await supabase
        .from('material_consumption')
        .select(`
          id,
          material_id,
          quantity,
          unit,
          unit_cost,
          total_cost,
          consumed_at,
          source,
          products:material_id (name)
        `)
        .eq('appointment_id', appointmentId)
        .order('consumed_at');

      if (materialsError) {
        console.error('Error fetching consumed materials:', materialsError);
      }

      // Also check stock_movements for products consumed via procedure
      const { data: stockMovements, error: stockError } = await supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          quantity,
          unit_cost,
          total_cost,
          created_at,
          products:product_id (name, unit)
        `)
        .eq('reference_type', 'procedure_execution')
        .eq('reference_id', appointmentId)
        .order('created_at');

      if (stockError) {
        console.error('Error fetching stock movements:', stockError);
      }

      // Combine both sources, preferring material_consumption if available
      let materials: ConsumedProduct[] = [];

      if (consumedMaterials && consumedMaterials.length > 0) {
        materials = consumedMaterials.map((cm: any) => ({
          id: cm.id,
          material_id: cm.material_id,
          material_name: cm.products?.name || 'Produto desconhecido',
          quantity: Number(cm.quantity) || 0,
          unit: cm.unit || 'unidade',
          unit_cost: Number(cm.unit_cost) || 0,
          total_cost: Number(cm.total_cost) || 0,
          consumed_at: cm.consumed_at,
          source: cm.source || 'procedure',
        }));
      } else if (stockMovements && stockMovements.length > 0) {
        // Fallback to stock_movements if material_consumption is empty
        materials = stockMovements.map((sm: any) => ({
          id: sm.id,
          material_id: sm.product_id,
          material_name: sm.products?.name || 'Produto desconhecido',
          quantity: Number(sm.quantity) || 0,
          unit: sm.products?.unit || 'unidade',
          unit_cost: Number(sm.unit_cost) || 0,
          total_cost: Number(sm.total_cost) || 0,
          consumed_at: sm.created_at,
          source: 'procedure',
        }));
      }

      const totalMaterialsCost = materials.reduce((sum, m) => sum + m.total_cost, 0);

      return {
        appointment_id: appointmentId,
        procedure_cost: (appointment as any)?.procedure_cost || null,
        procedure_name: (appointment as any)?.procedures?.name || null,
        professional_name: (appointment as any)?.professionals?.full_name || null,
        scheduled_date: (appointment as any)?.scheduled_date || null,
        consumed_materials: materials,
        total_materials_cost: totalMaterialsCost,
      };
    },
    enabled: !!appointmentId,
  });
}

/**
 * Hook para buscar resumo de custos de múltiplos atendimentos (para relatórios).
 */
export function useAppointmentsCostSummary(appointmentIds: string[]) {
  return useQuery({
    queryKey: ['appointments-cost-summary', appointmentIds],
    queryFn: async () => {
      if (!appointmentIds.length) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          procedure_cost,
          scheduled_date,
          procedures:procedure_id (name)
        `)
        .in('id', appointmentIds)
        .eq('status', 'finalizado');

      if (error) throw error;
      return data || [];
    },
    enabled: appointmentIds.length > 0,
  });
}
