import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import type { DashboardInsight } from '@/types/dashboard';

// =============================================
// TIPOS DE ALERTAS DE MARGEM
// =============================================

export interface MarginAlertConfig {
  enabled: boolean;
  minPercent: number;
  periodDays: number;
}

export interface ProcedureMarginAlert {
  procedureId: string;
  procedureName: string;
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  marginValue: number;
  marginPercent: number;
  alertType: 'critical' | 'warning';
}

// =============================================
// HOOK PARA CONFIGURAÇÃO DE ALERTAS
// =============================================

export function useMarginAlertConfig(clinicId: string | null) {
  return useQuery({
    queryKey: ['margin-alert-config', clinicId],
    queryFn: async (): Promise<MarginAlertConfig> => {
      if (!clinicId) {
        return { enabled: true, minPercent: 20, periodDays: 30 };
      }

      const { data, error } = await supabase
        .from('clinics')
        .select('margin_alert_enabled, margin_alert_min_percent, margin_alert_period_days')
        .eq('id', clinicId)
        .single();

      if (error) throw error;

      return {
        enabled: data?.margin_alert_enabled ?? true,
        minPercent: Number(data?.margin_alert_min_percent) || 20,
        periodDays: data?.margin_alert_period_days || 30,
      };
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

// =============================================
// HOOK PARA ATUALIZAR CONFIGURAÇÃO
// =============================================

export function useUpdateMarginAlertConfig() {
  const updateConfig = async (clinicId: string, config: Partial<MarginAlertConfig>) => {
    const updates: Record<string, unknown> = {};
    
    if (config.enabled !== undefined) {
      updates.margin_alert_enabled = config.enabled;
    }
    if (config.minPercent !== undefined) {
      updates.margin_alert_min_percent = config.minPercent;
    }
    if (config.periodDays !== undefined) {
      updates.margin_alert_period_days = config.periodDays;
    }

    const { error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId);

    if (error) throw error;
  };

  return { updateConfig };
}

// =============================================
// HOOK PARA CALCULAR ALERTAS DE MARGEM
// =============================================

export function useMarginAlerts(clinicId: string | null) {
  const { data: config } = useMarginAlertConfig(clinicId);

  return useQuery({
    queryKey: ['margin-alerts', clinicId, config?.periodDays],
    queryFn: async (): Promise<ProcedureMarginAlert[]> => {
      if (!clinicId || !config?.enabled) return [];

      const startDate = subDays(new Date(), config.periodDays);
      const startDateStr = format(startDate, 'yyyy-MM-dd');

      // Buscar atendimentos finalizados no período
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select(`
          id,
          procedure_id,
          expected_value,
          insurance_id,
          procedures:procedure_id (
            id,
            name,
            value
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'finalizado')
        .gte('scheduled_date', startDateStr)
        .not('procedure_id', 'is', null);

      if (aptError) throw aptError;
      if (!appointments || appointments.length === 0) return [];

      // Buscar consumo de materiais por atendimento
      const appointmentIds = appointments.map(a => a.id);
      const { data: consumptionData } = await supabase
        .from('material_consumption')
        .select('appointment_id, total_cost')
        .in('appointment_id', appointmentIds);

      // Buscar custos estimados dos procedimentos (materiais diretos)
      const procedureIds = [...new Set(appointments.map(a => a.procedure_id).filter(Boolean))] as string[];
      
      const { data: procedureMaterials } = await supabase
        .from('procedure_materials')
        .select(`
          procedure_id,
          quantity,
          materials:material_id (
            unit_cost
          )
        `)
        .in('procedure_id', procedureIds);

      // Buscar kits vinculados
      const { data: procedureKits } = await supabase
        .from('procedure_kits')
        .select(`
          procedure_id,
          material_kits:kit_id (
            material_kit_items (
              quantity,
              materials:material_id (
                unit_cost
              )
            )
          )
        `)
        .in('procedure_id', procedureIds);

      // Criar mapas de consumo e custo estimado
      const consumptionByAppointment = new Map<string, number>();
      consumptionData?.forEach(c => {
        const current = consumptionByAppointment.get(c.appointment_id) || 0;
        consumptionByAppointment.set(c.appointment_id, current + (Number(c.total_cost) || 0));
      });

      const estimatedCostByProcedure = new Map<string, number>();
      
      // Custo de materiais diretos
      procedureMaterials?.forEach(pm => {
        if (pm.procedure_id && pm.materials) {
          const material = pm.materials as unknown as { unit_cost: number | null };
          const cost = (Number(material.unit_cost) || 0) * pm.quantity;
          const current = estimatedCostByProcedure.get(pm.procedure_id) || 0;
          estimatedCostByProcedure.set(pm.procedure_id, current + cost);
        }
      });

      // Custo dos kits
      procedureKits?.forEach(pk => {
        if (pk.procedure_id && pk.material_kits) {
          const kit = pk.material_kits as unknown as {
            material_kit_items: Array<{
              quantity: number;
              materials: { unit_cost: number | null };
            }>;
          };
          const kitCost = kit.material_kit_items?.reduce((acc, item) => {
            return acc + (Number(item.materials?.unit_cost) || 0) * item.quantity;
          }, 0) || 0;
          const current = estimatedCostByProcedure.get(pk.procedure_id) || 0;
          estimatedCostByProcedure.set(pk.procedure_id, current + kitCost);
        }
      });

      // Agrupar por procedimento e calcular margens
      const procedureMap = new Map<string, {
        id: string;
        name: string;
        appointments: typeof appointments;
        totalRevenue: number;
        realCost: number;
        estimatedCost: number;
        hasRealCost: boolean;
      }>();

      appointments.forEach(apt => {
        if (!apt.procedure_id || !apt.procedures) return;

        const procedure = apt.procedures as unknown as { id: string; name: string; value: number };
        const procedureId = procedure.id;

        if (!procedureMap.has(procedureId)) {
          procedureMap.set(procedureId, {
            id: procedureId,
            name: procedure.name,
            appointments: [],
            totalRevenue: 0,
            realCost: 0,
            estimatedCost: estimatedCostByProcedure.get(procedureId) || 0,
            hasRealCost: false,
          });
        }

        const entry = procedureMap.get(procedureId)!;
        entry.appointments.push(apt);

        const revenue = Number(apt.expected_value) || procedure.value || 0;
        entry.totalRevenue += revenue;

        const realCost = consumptionByAppointment.get(apt.id) || 0;
        if (realCost > 0) {
          entry.realCost += realCost;
          entry.hasRealCost = true;
        }
      });

      // Gerar alertas
      const alerts: ProcedureMarginAlert[] = [];

      procedureMap.forEach((data) => {
        const quantity = data.appointments.length;
        const totalRevenue = data.totalRevenue;
        const totalCost = data.hasRealCost
          ? data.realCost
          : data.estimatedCost * quantity;

        // Só gera alerta se tiver custo definido
        if (totalCost <= 0 && data.estimatedCost <= 0) return;

        const marginValue = totalRevenue - totalCost;
        const marginPercent = totalRevenue > 0 ? (marginValue / totalRevenue) * 100 : 0;

        // Margem negativa (crítico) ou abaixo do mínimo (atenção)
        if (marginValue < 0) {
          alerts.push({
            procedureId: data.id,
            procedureName: data.name,
            quantity,
            totalRevenue,
            totalCost,
            marginValue,
            marginPercent,
            alertType: 'critical',
          });
        } else if (marginPercent < config.minPercent) {
          alerts.push({
            procedureId: data.id,
            procedureName: data.name,
            quantity,
            totalRevenue,
            totalCost,
            marginValue,
            marginPercent,
            alertType: 'warning',
          });
        }
      });

      // Ordenar: críticos primeiro, depois por margem (menor primeiro)
      alerts.sort((a, b) => {
        if (a.alertType !== b.alertType) {
          return a.alertType === 'critical' ? -1 : 1;
        }
        return a.marginPercent - b.marginPercent;
      });

      return alerts;
    },
    enabled: !!clinicId && !!config?.enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================
// GERAR INSIGHTS PARA DASHBOARD
// =============================================

export function generateMarginInsights(
  alerts: ProcedureMarginAlert[],
  periodDays: number
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  // Alertas críticos (margem negativa)
  const criticalAlerts = alerts.filter(a => a.alertType === 'critical');
  if (criticalAlerts.length > 0) {
    const topCritical = criticalAlerts[0];
    const totalLoss = criticalAlerts.reduce((sum, a) => sum + Math.abs(a.marginValue), 0);

    insights.push({
      id: 'margin-critical',
      type: 'critical',
      title: criticalAlerts.length === 1
        ? `⚠️ "${topCritical.procedureName}" com prejuízo`
        : `⚠️ ${criticalAlerts.length} procedimentos com prejuízo`,
      description: criticalAlerts.length === 1
        ? `Custo maior que faturamento nos últimos ${periodDays} dias.`
        : `Procedimentos gerando prejuízo no período analisado.`,
      action: 'Ver relatório',
      link: '/app/gestao/relatorios',
      value: `- R$ ${totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });
  }

  // Alertas de atenção (margem baixa)
  const warningAlerts = alerts.filter(a => a.alertType === 'warning');
  if (warningAlerts.length > 0 && insights.length < 2) {
    const topWarning = warningAlerts[0];

    insights.push({
      id: 'margin-warning',
      type: 'info',
      title: warningAlerts.length === 1
        ? `"${topWarning.procedureName}" com margem baixa`
        : `${warningAlerts.length} procedimentos com margem baixa`,
      description: warningAlerts.length === 1
        ? `Margem de ${topWarning.marginPercent.toFixed(1)}% - avalie preço ou custo.`
        : `Margens abaixo do esperado no período.`,
      action: 'Ver relatório',
      link: '/app/gestao/relatorios',
    });
  }

  return insights;
}
