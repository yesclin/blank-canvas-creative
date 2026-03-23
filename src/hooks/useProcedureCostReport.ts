import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReportFilters } from '@/types/relatorios';

// =============================================
// TIPOS PARA RELATÓRIO DE CUSTOS
// =============================================

export interface ProcedureCostData {
  procedureId: string;
  procedureName: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  minCost: number;
  maxCost: number;
  hasCostData: boolean;
}

export interface ProcedureCostSummary {
  totalProcedures: number;
  totalExecutions: number;
  totalCost: number;
  averageCostPerExecution: number;
  proceduresWithCost: number;
  proceduresWithoutCost: number;
  mostExpensive: { name: string; cost: number } | null;
  leastExpensive: { name: string; cost: number } | null;
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useProcedureCostReport(filters: ReportFilters) {
  const { data, isLoading } = useQuery({
    queryKey: ['procedure-cost-report', filters.startDate, filters.endDate, filters.professionalId, filters.procedureId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          procedure_id,
          procedure_cost,
          professional_id,
          scheduled_date,
          procedures:procedure_id (
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

      const { data: appointments, error } = await query;
      if (error) throw error;
      return appointments || [];
    },
  });

  // Processar dados para o relatório
  const processedData = (() => {
    if (!data || data.length === 0) {
      return { 
        procedures: [] as ProcedureCostData[], 
        summary: null as ProcedureCostSummary | null 
      };
    }

    // Agrupar por procedimento
    const procedureMap = new Map<string, {
      id: string;
      name: string;
      costs: number[];
      executions: number;
    }>();

    data.forEach(apt => {
      if (!apt.procedure_id || !apt.procedures) return;

      const procedure = apt.procedures as unknown as { id: string; name: string };
      const procedureId = procedure.id;
      const procedureName = procedure.name;
      const cost = apt.procedure_cost ?? 0;

      if (!procedureMap.has(procedureId)) {
        procedureMap.set(procedureId, {
          id: procedureId,
          name: procedureName,
          costs: [],
          executions: 0,
        });
      }

      const entry = procedureMap.get(procedureId)!;
      entry.executions += 1;
      
      // Só adiciona custo se for > 0 (significa que foi calculado)
      if (cost > 0) {
        entry.costs.push(cost);
      }
    });

    // Converter para array
    const procedures: ProcedureCostData[] = [];
    
    procedureMap.forEach((data, procedureId) => {
      const hasCostData = data.costs.length > 0;
      const totalCost = data.costs.reduce((acc, c) => acc + c, 0);
      const averageCost = hasCostData ? totalCost / data.costs.length : 0;
      const minCost = hasCostData ? Math.min(...data.costs) : 0;
      const maxCost = hasCostData ? Math.max(...data.costs) : 0;

      procedures.push({
        procedureId,
        procedureName: data.name,
        quantity: data.executions,
        averageCost,
        totalCost,
        minCost,
        maxCost,
        hasCostData,
      });
    });

    // Ordenar por custo total (maior para menor)
    procedures.sort((a, b) => b.totalCost - a.totalCost);

    // Calcular resumo
    const totalProcedures = procedures.length;
    const totalExecutions = procedures.reduce((acc, p) => acc + p.quantity, 0);
    const totalCost = procedures.reduce((acc, p) => acc + p.totalCost, 0);
    const averageCostPerExecution = totalExecutions > 0 ? totalCost / totalExecutions : 0;
    const proceduresWithCost = procedures.filter(p => p.hasCostData).length;
    const proceduresWithoutCost = procedures.filter(p => !p.hasCostData).length;

    // Encontrar mais e menos custoso (apenas entre os que têm custo)
    const withCost = procedures.filter(p => p.hasCostData && p.averageCost > 0);
    withCost.sort((a, b) => b.averageCost - a.averageCost);
    
    const mostExpensive = withCost.length > 0 
      ? { name: withCost[0].procedureName, cost: withCost[0].averageCost }
      : null;
    const leastExpensive = withCost.length > 0 
      ? { name: withCost[withCost.length - 1].procedureName, cost: withCost[withCost.length - 1].averageCost }
      : null;

    const summary: ProcedureCostSummary = {
      totalProcedures,
      totalExecutions,
      totalCost,
      averageCostPerExecution,
      proceduresWithCost,
      proceduresWithoutCost,
      mostExpensive,
      leastExpensive,
    };

    return { procedures, summary };
  })();

  return {
    data: processedData.procedures,
    summary: processedData.summary,
    isLoading,
  };
}
