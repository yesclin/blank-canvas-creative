import { useQuery } from '@tanstack/react-query';
import { format, subMonths, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type {
  ReportFilters,
  FinancialReportData,
  RevenueByProfessional,
  RevenueByProcedure,
  RevenueByPaymentMethod,
  PackageReport,
  AppointmentReportData,
  AttendanceByProfessional,
  AttendanceBySpecialty,
  PatientReportData,
  PatientRetention,
  PatientByInsurance,
  InsuranceReportData,
  ProfessionalPerformance,
  StockConsumptionReport,
  CommunicationReportData,
  ExecutiveSummary,
} from '@/types/relatorios';

// =============================================
// HOOK PRINCIPAL COM DADOS REAIS
// =============================================

export function useReportsRealData(filters: ReportFilters) {
  const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
  const endDateStr = format(filters.endDate, 'yyyy-MM-dd');

  // =============================================
  // LISTA DE PROFISSIONAIS E CONVÊNIOS
  // =============================================
  const { data: professionals = [] } = useQuery({
    queryKey: ['report-professionals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('professionals')
        .select('id, full_name, specialty_id, specialties:specialty_id (name)')
        .eq('is_active', true);
      return data?.map(p => ({ 
        id: p.id, 
        name: p.full_name, 
        specialty: (p.specialties as unknown as { name: string } | null)?.name || '' 
      })) || [];
    },
  });

  const { data: insurances = [] } = useQuery({
    queryKey: ['report-insurances'],
    queryFn: async () => {
      const { data } = await supabase
        .from('insurances')
        .select('id, name')
        .eq('is_active', true);
      return data?.map(i => ({ id: i.id, name: i.name })) || [];
    },
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ['report-procedures'],
    queryFn: async () => {
      const { data } = await supabase
        .from('procedures')
        .select('id, name, price');
      return data?.map(p => ({ id: p.id, name: p.name, value: p.price || 0 })) || [];
    },
  });

  // =============================================
  // DADOS DE AGENDAMENTOS/ATENDIMENTOS
  // =============================================
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ['report-appointments', startDateStr, endDateStr, filters.professionalId, filters.insuranceId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          status,
          expected_value,
          payment_type,
          professional_id,
          insurance_id,
          procedure_id,
          patient_id,
          professionals:professional_id (id, full_name, specialty_id, specialties:specialty_id (name)),
          procedures:procedure_id (id, name),
          insurances:insurance_id (id, name)
        `)
        .gte('scheduled_date', startDateStr)
        .lte('scheduled_date', endDateStr);

      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }
      if (filters.insuranceId) {
        query = query.eq('insurance_id', filters.insuranceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // =============================================
  // DADOS DE TRANSAÇÕES FINANCEIRAS
  // =============================================
  const { data: financialTransactions = [], isLoading: loadingFinance } = useQuery({
    queryKey: ['report-finance-transactions', startDateStr, endDateStr, filters.professionalId],
    queryFn: async () => {
      let query = supabase
        .from('finance_transactions')
        .select('*')
        .gte('transaction_date', startDateStr)
        .lte('transaction_date', endDateStr);

      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // =============================================
  // DADOS DE PACIENTES
  // =============================================
  const { data: patientsData = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['report-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, created_at');
      if (error) throw error;
      return data || [];
    },
  });

  // Pacientes por convênio (usando patient_insurances)
  const { data: patientInsurancesData = [] } = useQuery({
    queryKey: ['report-patient-insurances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_insurances')
        .select('patient_id, insurance_id, insurances:insurance_id (id, name)');
      if (error) throw error;
      return data || [];
    },
  });

  // =============================================
  // DADOS DE CONSUMO DE ESTOQUE
  // =============================================
  const { data: stockConsumptionData = [], isLoading: loadingStock } = useQuery({
    queryKey: ['report-stock-consumption', startDateStr, endDateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          quantity,
          total_cost,
          movement_type,
          created_at,
          products:product_id (id, name, category, unit, cost_price)
        `)
        .eq('movement_type', 'saida')
        .gte('created_at', `${startDateStr}T00:00:00`)
        .lte('created_at', `${endDateStr}T23:59:59`);

      if (error) throw error;
      return data || [];
    },
  });

  // =============================================
  // PROCESSAMENTO DE DADOS
  // =============================================

  const isLoading = loadingAppointments || loadingFinance || loadingPatients || loadingStock;

  // Dados financeiros por período
  const financialData: FinancialReportData[] = (() => {
    if (!financialTransactions.length) return [];
    
    const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    const byDay = new Map<string, { faturamento: number; recebido: number; pendente: number }>();
    
    days.forEach(day => {
      byDay.set(format(day, 'yyyy-MM-dd'), { faturamento: 0, recebido: 0, pendente: 0 });
    });

    financialTransactions.forEach(tx => {
      const dateKey = tx.transaction_date;
      const entry = byDay.get(dateKey);
      if (entry && tx.type === 'entrada') {
        entry.faturamento += Number(tx.amount) || 0;
        entry.recebido += Number(tx.amount) || 0;
      }
    });

    return Array.from(byDay.entries()).map(([date, values]) => ({
      period: format(new Date(date), 'dd/MM', { locale: ptBR }),
      ...values,
    }));
  })();

  // Faturamento por profissional
  const revenueByProfessional: RevenueByProfessional[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const byProf = new Map<string, { name: string; revenue: number; count: number }>();
    
    appointmentsData.filter(a => a.status === 'finalizado').forEach(apt => {
      const prof = apt.professionals as unknown as { id: string; full_name: string } | null;
      if (!prof) return;
      
      const existing = byProf.get(prof.id) || { name: prof.full_name, revenue: 0, count: 0 };
      existing.revenue += Number(apt.expected_value) || 0;
      existing.count += 1;
      byProf.set(prof.id, existing);
    });

    return Array.from(byProf.entries()).map(([id, data]) => ({
      professionalId: id,
      professionalName: data.name,
      totalRevenue: data.revenue,
      appointmentCount: data.count,
      averageTicket: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }));
  })();

  // Faturamento por procedimento
  const revenueByProcedure: RevenueByProcedure[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const byProc = new Map<string, { name: string; revenue: number; count: number }>();
    
    appointmentsData.filter(a => a.status === 'finalizado' && a.procedure_id).forEach(apt => {
      const proc = apt.procedures as unknown as { id: string; name: string } | null;
      if (!proc) return;
      
      const existing = byProc.get(proc.id) || { name: proc.name, revenue: 0, count: 0 };
      existing.revenue += Number(apt.expected_value) || 0;
      existing.count += 1;
      byProc.set(proc.id, existing);
    });

    return Array.from(byProc.entries()).map(([id, data]) => ({
      procedureId: id,
      procedureName: data.name,
      totalRevenue: data.revenue,
      quantity: data.count,
      averageValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }));
  })();

  // Faturamento por forma de pagamento
  const revenueByPaymentMethod: RevenueByPaymentMethod[] = (() => {
    if (!financialTransactions.length) return [];
    
    const methods = new Map<string, { total: number; count: number }>();
    const labels: Record<string, string> = {
      pix: 'PIX',
      credito: 'Cartão de Crédito',
      debito: 'Cartão de Débito',
      dinheiro: 'Dinheiro',
      convenio: 'Convênio',
    };

    financialTransactions.filter(tx => tx.type === 'entrada').forEach(tx => {
      const method = tx.payment_method || 'outro';
      const existing = methods.get(method) || { total: 0, count: 0 };
      existing.total += Number(tx.amount) || 0;
      existing.count += 1;
      methods.set(method, existing);
    });

    const totalRevenue = Array.from(methods.values()).reduce((sum, m) => sum + m.total, 0);

    return Array.from(methods.entries()).map(([method, data]) => ({
      method,
      label: labels[method] || method,
      totalRevenue: data.total,
      count: data.count,
      percentage: totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0,
    }));
  })();

  // Pacotes (placeholder - não temos tabela de pacotes ainda)
  const packagesReport: PackageReport[] = [];

  // Dados de atendimentos por período
  const appointmentData: AppointmentReportData[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    const byDay = new Map<string, { realizados: number; cancelados: number; faltas: number; total: number }>();
    
    days.forEach(day => {
      byDay.set(format(day, 'yyyy-MM-dd'), { realizados: 0, cancelados: 0, faltas: 0, total: 0 });
    });

    appointmentsData.forEach(apt => {
      const entry = byDay.get(apt.scheduled_date);
      if (!entry) return;
      
      entry.total += 1;
      if (apt.status === 'finalizado') entry.realizados += 1;
      else if (apt.status === 'cancelado') entry.cancelados += 1;
      else if (apt.status === 'faltou') entry.faltas += 1;
    });

    return Array.from(byDay.entries()).map(([date, values]) => ({
      period: format(new Date(date), 'dd/MM', { locale: ptBR }),
      ...values,
    }));
  })();

  // Atendimentos por profissional
  const attendanceByProfessional: AttendanceByProfessional[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const byProf = new Map<string, { name: string; realized: number; cancelled: number; noShow: number; total: number }>();
    
    appointmentsData.forEach(apt => {
      const prof = apt.professionals as unknown as { id: string; full_name: string } | null;
      if (!prof) return;
      
      const existing = byProf.get(prof.id) || { name: prof.full_name, realized: 0, cancelled: 0, noShow: 0, total: 0 };
      existing.total += 1;
      if (apt.status === 'finalizado') existing.realized += 1;
      else if (apt.status === 'cancelado') existing.cancelled += 1;
      else if (apt.status === 'faltou') existing.noShow += 1;
      byProf.set(prof.id, existing);
    });

    return Array.from(byProf.entries()).map(([id, data]) => ({
      professionalId: id,
      professionalName: data.name,
      realized: data.realized,
      cancelled: data.cancelled,
      noShow: data.noShow,
      occupancyRate: data.total > 0 ? Math.round((data.realized / data.total) * 100) : 0,
    }));
  })();

  // Atendimentos por especialidade
  const attendanceBySpecialty: AttendanceBySpecialty[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const bySpec = new Map<string, number>();
    
    appointmentsData.filter(a => a.status === 'finalizado').forEach(apt => {
      const prof = apt.professionals as unknown as { specialties?: { name: string } | null } | null;
      const spec = prof?.specialties?.name || 'Não especificada';
      bySpec.set(spec, (bySpec.get(spec) || 0) + 1);
    });

    const total = Array.from(bySpec.values()).reduce((sum, c) => sum + c, 0);

    return Array.from(bySpec.entries()).map(([name, count], index) => ({
      specialtyId: String(index + 1),
      specialtyName: name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  })();

  // Dados de pacientes por período
  const patientData: PatientReportData[] = (() => {
    const months = eachMonthOfInterval({ start: subMonths(filters.endDate, 5), end: filters.endDate });
    
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const novos = patientsData.filter(p => p.created_at?.startsWith(monthStr)).length;
      const ativos = patientsData.filter(p => p.created_at && p.created_at <= format(month, 'yyyy-MM-dd')).length;
      
      // Calcular retornos baseado em agendamentos
      const retornos = appointmentsData?.filter(a => 
        a.scheduled_date?.startsWith(monthStr) && a.status === 'finalizado'
      ).length || 0;

      return {
        period: format(month, 'MMM/yy', { locale: ptBR }),
        novos,
        ativos,
        inativos: 0,
        retornos,
      };
    });
  })();

  // Retenção de pacientes
  const patientRetention: PatientRetention[] = (() => {
    const months = eachMonthOfInterval({ start: subMonths(filters.endDate, 5), end: filters.endDate });
    
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const newPatients = patientsData.filter(p => p.created_at?.startsWith(monthStr)).length;
      
      // Pacientes que retornaram = tiveram mais de um agendamento
      const patientsWithAppointments = new Set(
        appointmentsData?.filter(a => a.scheduled_date?.startsWith(monthStr) && a.status === 'finalizado')
          .map(a => a.patient_id)
      );
      const returningPatients = patientsWithAppointments.size;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        newPatients,
        returningPatients,
        retentionRate: (newPatients + returningPatients) > 0 
          ? Math.round((returningPatients / (newPatients + returningPatients)) * 100) 
          : 0,
      };
    });
  })();

  // Pacientes por convênio
  const patientsByInsurance: PatientByInsurance[] = (() => {
    const byIns = new Map<string, { name: string; count: number }>();
    
    // Contar pacientes sem convênio
    const patientsWithInsurance = new Set(patientInsurancesData.map(pi => pi.patient_id));
    const patientsWithoutInsurance = patientsData.filter(p => !patientsWithInsurance.has(p.id)).length;
    
    if (patientsWithoutInsurance > 0) {
      byIns.set('particular', { name: 'Particular', count: patientsWithoutInsurance });
    }
    
    patientInsurancesData.forEach(pi => {
      const ins = pi.insurances as unknown as { id: string; name: string } | null;
      if (!ins) return;
      
      const existing = byIns.get(ins.id) || { name: ins.name, count: 0 };
      existing.count += 1;
      byIns.set(ins.id, existing);
    });

    const total = patientsData.length;

    return Array.from(byIns.entries()).map(([id, data]) => ({
      insuranceId: id,
      insuranceName: data.name,
      patientCount: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
    }));
  })();

  // Relatório de convênios
  const insuranceReport: InsuranceReportData[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const byIns = new Map<string, { name: string; count: number; revenue: number }>();
    
    appointmentsData.filter(a => a.status === 'finalizado' && a.insurance_id).forEach(apt => {
      const ins = apt.insurances as unknown as { id: string; name: string } | null;
      if (!ins) return;
      
      const existing = byIns.get(ins.id) || { name: ins.name, count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(apt.expected_value) || 0;
      byIns.set(ins.id, existing);
    });

    return Array.from(byIns.entries()).map(([id, data]) => ({
      insuranceId: id,
      insuranceName: data.name,
      appointmentCount: data.count,
      totalRevenue: data.revenue,
      averageValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }));
  })();

  // Performance dos profissionais
  const professionalPerformance: ProfessionalPerformance[] = (() => {
    if (!appointmentsData?.length) return [];
    
    const byProf = new Map<string, { 
      name: string; 
      specialty: string;
      realized: number; 
      total: number;
      revenue: number 
    }>();
    
    appointmentsData.forEach(apt => {
      const prof = apt.professionals as unknown as { id: string; full_name: string; specialties?: { name: string } | null } | null;
      if (!prof) return;
      
      const existing = byProf.get(prof.id) || { 
        name: prof.full_name, 
        specialty: prof.specialties?.name || '',
        realized: 0, 
        total: 0,
        revenue: 0 
      };
      existing.total += 1;
      if (apt.status === 'finalizado') {
        existing.realized += 1;
        existing.revenue += Number(apt.expected_value) || 0;
      }
      byProf.set(prof.id, existing);
    });

    return Array.from(byProf.entries()).map(([id, data]) => ({
      professionalId: id,
      professionalName: data.name,
      specialty: data.specialty,
      appointmentsRealized: data.realized,
      totalRevenue: data.revenue,
      averageTicket: data.realized > 0 ? Math.round(data.revenue / data.realized) : 0,
      occupancyRate: data.total > 0 ? Math.round((data.realized / data.total) * 100) : 0,
      commission: Math.round(data.revenue * 0.3),
    }));
  })();

  // Consumo de estoque
  const stockConsumption: StockConsumptionReport[] = (() => {
    if (!stockConsumptionData?.length) return [];
    
    const byProduct = new Map<string, { 
      name: string; 
      category: string;
      unit: string;
      consumed: number; 
      cost: number 
    }>();
    
    stockConsumptionData.forEach(mov => {
      const prod = mov.products as unknown as { id: string; name: string; category?: string; unit?: string } | null;
      if (!prod) return;
      
      const existing = byProduct.get(prod.id) || { 
        name: prod.name, 
        category: prod.category || 'Geral',
        unit: prod.unit || 'un',
        consumed: 0, 
        cost: 0 
      };
      existing.consumed += Number(mov.quantity) || 0;
      existing.cost += Number(mov.total_cost) || 0;
      byProduct.set(prod.id, existing);
    });

    return Array.from(byProduct.entries()).map(([id, data]) => ({
      productId: id,
      productName: data.name,
      category: data.category,
      consumed: data.consumed,
      unit: data.unit,
      estimatedCost: data.cost,
    }));
  })();

  // Dados de comunicação (placeholder - precisa de tabela de mensagens)
  const communicationData: CommunicationReportData[] = [];

  // Resumo executivo
  const executiveSummary: ExecutiveSummary = (() => {
    const faturamentoAtual = financialTransactions
      .filter(tx => tx.type === 'entrada')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    const atendimentosRealizados = appointmentsData?.filter(a => a.status === 'finalizado').length || 0;
    const totalAgendamentos = appointmentsData?.length || 0;
    const faltas = appointmentsData?.filter(a => a.status === 'faltou').length || 0;
    
    const novosPacientes = patientsData.filter(p => 
      p.created_at && p.created_at >= startDateStr && p.created_at <= endDateStr
    ).length;

    const ticketMedio = atendimentosRealizados > 0 ? Math.round(faturamentoAtual / atendimentosRealizados) : 0;
    const ocupacaoAgenda = totalAgendamentos > 0 ? Math.round((atendimentosRealizados / totalAgendamentos) * 100) : 0;
    const taxaFaltas = totalAgendamentos > 0 ? Math.round((faltas / totalAgendamentos) * 100) : 0;

    // Para variações, usamos valores zerados (precisaria de período anterior)
    return {
      faturamentoAtual,
      faturamentoAnterior: 0,
      variacaoFaturamento: 0,
      ocupacaoAgenda,
      ocupacaoAnterior: 0,
      variacaoOcupacao: 0,
      ticketMedio,
      ticketMedioAnterior: 0,
      variacaoTicket: 0,
      taxaRetencao: patientRetention.length > 0 ? patientRetention[patientRetention.length - 1].retentionRate : 0,
      taxaRetencaoAnterior: 0,
      variacaoRetencao: 0,
      novosPacientes,
      atendimentosRealizados,
      taxaFaltas,
    };
  })();

  // Totais consolidados
  const totals = {
    faturamento: financialData.reduce((acc, d) => acc + d.faturamento, 0),
    recebido: financialData.reduce((acc, d) => acc + d.recebido, 0),
    pendente: financialData.reduce((acc, d) => acc + d.pendente, 0),
    atendimentos: appointmentData.reduce((acc, d) => acc + d.total, 0),
    realizados: appointmentData.reduce((acc, d) => acc + d.realizados, 0),
    faltas: appointmentData.reduce((acc, d) => acc + d.faltas, 0),
    taxaOcupacao: 0,
    taxaFaltas: 0,
  };
  
  totals.taxaOcupacao = totals.atendimentos > 0 ? Math.round((totals.realizados / totals.atendimentos) * 100) : 0;
  totals.taxaFaltas = totals.atendimentos > 0 ? Math.round((totals.faltas / totals.atendimentos) * 100) : 0;

  const paymentMethods = [
    { value: 'pix', label: 'PIX' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'debito', label: 'Cartão de Débito' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'convenio', label: 'Convênio' },
  ];

  return {
    isLoading,
    professionals,
    procedures,
    insurances,
    paymentMethods,
    financialData,
    revenueByProfessional,
    revenueByProcedure,
    revenueByPaymentMethod,
    packagesReport,
    appointmentData,
    attendanceByProfessional,
    attendanceBySpecialty,
    patientData,
    patientRetention,
    patientsByInsurance,
    insuranceReport,
    professionalPerformance,
    stockConsumption,
    communicationData,
    executiveSummary,
    totals,
  };
}
