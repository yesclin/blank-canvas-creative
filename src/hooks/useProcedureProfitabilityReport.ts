import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReportFilters } from '@/types/relatorios';

// =============================================
// TIPOS PARA RELATÓRIO DE RENTABILIDADE
// =============================================

export interface ProcedureProfitabilityData {
  procedureId: string;
  procedureName: string;
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  marginValue: number;
  marginPercentage: number;
  hasCostDefined: boolean;
  paymentType?: 'particular' | 'convenio' | 'mixed';
}

export interface ProfitabilitySummary {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercentage: number;
  mostProfitable: { name: string; margin: number } | null;
  leastProfitable: { name: string; margin: number } | null;
  proceduresWithoutCost: number;
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useProcedureProfitabilityReport(filters: ReportFilters) {
  // Buscar atendimentos finalizados com procedimentos
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ['profitability-appointments', filters.startDate, filters.endDate, filters.professionalId, filters.procedureId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          procedure_id,
          professional_id,
          insurance_id,
          expected_value,
          payment_type,
          scheduled_date,
          procedures:procedure_id (
            id,
            name,
            value
          ),
          professionals:professional_id (
            id,
            name
          ),
          insurances:insurance_id (
            id,
            name
          )
        `)
        .eq('status', 'finalizado')
        .gte('scheduled_date', filters.startDate.toISOString().split('T')[0])
        .lte('scheduled_date', filters.endDate.toISOString().split('T')[0])
        .not('procedure_id', 'is', null);

      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }

      if (filters.procedureId) {
        query = query.eq('procedure_id', filters.procedureId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar consumo de materiais por atendimento
  const { data: consumptionData, isLoading: loadingConsumption } = useQuery({
    queryKey: ['profitability-consumption', filters.startDate, filters.endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_consumption')
        .select(`
          id,
          appointment_id,
          procedure_id,
          total_cost
        `)
        .gte('consumed_at', filters.startDate.toISOString())
        .lte('consumed_at', filters.endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar custos de materiais vinculados aos procedimentos (para quando não há consumo real)
  const { data: procedureMaterialsData, isLoading: loadingMaterials } = useQuery({
    queryKey: ['profitability-procedure-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_materials')
        .select(`
          id,
          procedure_id,
          material_id,
          quantity,
          materials:material_id (
            id,
            name,
            unit_cost
          )
        `);

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar kits vinculados aos procedimentos
  const { data: procedureKitsData, isLoading: loadingKits } = useQuery({
    queryKey: ['profitability-procedure-kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_kits')
        .select(`
          id,
          procedure_id,
          kit_id,
          material_kits:kit_id (
            id,
            name,
            material_kit_items (
              quantity,
              materials:material_id (
                unit_cost
              )
            )
          )
        `);

      if (error) throw error;
      return data || [];
    },
  });

  // Processar dados para o relatório
  const processedData = (() => {
    if (!appointmentsData) return { procedures: [], summary: null };

    // Agrupar atendimentos por procedimento
    const procedureMap = new Map<string, {
      id: string;
      name: string;
      appointments: typeof appointmentsData;
      totalRevenue: number;
      realCost: number;
      estimatedCost: number;
      hasRealCost: boolean;
      paymentTypes: Set<string>;
    }>();

    // Criar mapa de consumo por atendimento
    const consumptionByAppointment = new Map<string, number>();
    consumptionData?.forEach(c => {
      const current = consumptionByAppointment.get(c.appointment_id) || 0;
      consumptionByAppointment.set(c.appointment_id, current + (c.total_cost || 0));
    });

    // Criar mapa de custo estimado por procedimento (materiais diretos)
    const estimatedCostByProcedure = new Map<string, number>();
    procedureMaterialsData?.forEach(pm => {
      if (pm.procedure_id && pm.materials) {
        const material = pm.materials as unknown as { unit_cost: number | null };
        const cost = (material.unit_cost || 0) * pm.quantity;
        const current = estimatedCostByProcedure.get(pm.procedure_id) || 0;
        estimatedCostByProcedure.set(pm.procedure_id, current + cost);
      }
    });

    // Adicionar custo dos kits ao custo estimado
    procedureKitsData?.forEach(pk => {
      if (pk.procedure_id && pk.material_kits) {
        const kit = pk.material_kits as unknown as {
          material_kit_items: Array<{
            quantity: number;
            materials: { unit_cost: number | null };
          }>;
        };
        const kitCost = kit.material_kit_items?.reduce((acc, item) => {
          return acc + (item.materials?.unit_cost || 0) * item.quantity;
        }, 0) || 0;
        const current = estimatedCostByProcedure.get(pk.procedure_id) || 0;
        estimatedCostByProcedure.set(pk.procedure_id, current + kitCost);
      }
    });

    // Processar cada atendimento
    appointmentsData.forEach(apt => {
      if (!apt.procedure_id || !apt.procedures) return;

      const procedure = apt.procedures as unknown as { id: string; name: string; value: number };
      const procedureId = procedure.id;
      const procedureName = procedure.name;

      if (!procedureMap.has(procedureId)) {
        procedureMap.set(procedureId, {
          id: procedureId,
          name: procedureName,
          appointments: [],
          totalRevenue: 0,
          realCost: 0,
          estimatedCost: estimatedCostByProcedure.get(procedureId) || 0,
          hasRealCost: false,
          paymentTypes: new Set(),
        });
      }

      const entry = procedureMap.get(procedureId)!;
      entry.appointments.push(apt);

      // Calcular receita (usa expected_value se disponível, senão valor do procedimento)
      const revenue = apt.expected_value || procedure.value || 0;
      entry.totalRevenue += revenue;

      // Verificar custo real do atendimento
      const realCost = consumptionByAppointment.get(apt.id) || 0;
      if (realCost > 0) {
        entry.realCost += realCost;
        entry.hasRealCost = true;
      }

      // Tipo de pagamento
      if (apt.insurance_id) {
        entry.paymentTypes.add('convenio');
      } else {
        entry.paymentTypes.add('particular');
      }
    });

    // Converter para array de resultados
    const procedures: ProcedureProfitabilityData[] = [];

    procedureMap.forEach((data, procedureId) => {
      const quantity = data.appointments.length;
      const totalRevenue = data.totalRevenue;
      
      // Usar custo real se disponível, senão usar estimado multiplicado pela quantidade
      const totalCost = data.hasRealCost 
        ? data.realCost 
        : data.estimatedCost * quantity;
      
      const marginValue = totalRevenue - totalCost;
      const marginPercentage = totalRevenue > 0 ? (marginValue / totalRevenue) * 100 : 0;
      const hasCostDefined = data.estimatedCost > 0 || data.hasRealCost;

      // Determinar tipo de pagamento
      let paymentType: 'particular' | 'convenio' | 'mixed' = 'particular';
      if (data.paymentTypes.has('convenio') && data.paymentTypes.has('particular')) {
        paymentType = 'mixed';
      } else if (data.paymentTypes.has('convenio')) {
        paymentType = 'convenio';
      }

      procedures.push({
        procedureId,
        procedureName: data.name,
        quantity,
        totalRevenue,
        totalCost,
        marginValue,
        marginPercentage,
        hasCostDefined,
        paymentType,
      });
    });

    // Ordenar por margem (maior para menor)
    procedures.sort((a, b) => b.marginValue - a.marginValue);

    // Calcular resumo
    const totalRevenue = procedures.reduce((acc, p) => acc + p.totalRevenue, 0);
    const totalCost = procedures.reduce((acc, p) => acc + p.totalCost, 0);
    const totalMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
    const proceduresWithoutCost = procedures.filter(p => !p.hasCostDefined).length;

    // Encontrar mais e menos rentável (apenas entre os que têm custo definido)
    const withCost = procedures.filter(p => p.hasCostDefined);
    const mostProfitable = withCost.length > 0 
      ? { name: withCost[0].procedureName, margin: withCost[0].marginPercentage }
      : null;
    const leastProfitable = withCost.length > 0 
      ? { name: withCost[withCost.length - 1].procedureName, margin: withCost[withCost.length - 1].marginPercentage }
      : null;

    const summary: ProfitabilitySummary = {
      totalRevenue,
      totalCost,
      totalMargin,
      marginPercentage,
      mostProfitable,
      leastProfitable,
      proceduresWithoutCost,
    };

    return { procedures, summary };
  })();

  return {
    data: processedData.procedures,
    summary: processedData.summary,
    isLoading: loadingAppointments || loadingConsumption || loadingMaterials || loadingKits,
  };
}
