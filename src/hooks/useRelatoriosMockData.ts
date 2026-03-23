import { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
// DADOS MOCK PARA RELATÓRIOS
// =============================================

const professionals = [
  { id: '1', name: 'Dr. Carlos Mendes', specialty: 'Dermatologia' },
  { id: '2', name: 'Dra. Ana Beatriz', specialty: 'Nutrição' },
  { id: '3', name: 'Dr. Roberto Lima', specialty: 'Fisioterapia' },
  { id: '4', name: 'Dra. Mariana Costa', specialty: 'Psicologia' },
];

const procedures = [
  { id: '1', name: 'Consulta Dermatológica', value: 350 },
  { id: '2', name: 'Avaliação Nutricional', value: 280 },
  { id: '3', name: 'Sessão de Fisioterapia', value: 150 },
  { id: '4', name: 'Consulta Psicológica', value: 200 },
  { id: '5', name: 'Limpeza de Pele', value: 180 },
  { id: '6', name: 'Peeling', value: 450 },
];

const insurances = [
  { id: '1', name: 'Unimed' },
  { id: '2', name: 'Bradesco Saúde' },
  { id: '3', name: 'Amil' },
  { id: '4', name: 'SulAmérica' },
  { id: '5', name: 'Particular' },
];

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'convenio', label: 'Convênio' },
];

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useRelatoriosMockData(filters: ReportFilters) {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading when filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400); // Quick loading simulation
    
    return () => clearTimeout(timer);
  }, [filters.startDate, filters.endDate, filters.professionalId, filters.insuranceId]);

  // Generate consistent seed based on filters for reproducible data
  const filterSeed = useMemo(() => {
    return filters.startDate.getTime() + filters.endDate.getTime() + 
           (filters.professionalId?.length || 0) + (filters.insuranceId?.length || 0);
  }, [filters]);

  // Seeded random function for consistent data
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  // Calculate period length for scaling data
  const periodDays = differenceInDays(filters.endDate, filters.startDate) + 1;

  // Dados financeiros por período - reactive to filters
  const financialData = useMemo((): FinancialReportData[] => {
    const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    return days.map((day, index) => ({
      period: format(day, 'dd/MM', { locale: ptBR }),
      faturamento: Math.floor(seededRandom(filterSeed, index * 3) * 5000) + 2000,
      recebido: Math.floor(seededRandom(filterSeed, index * 3 + 1) * 4000) + 1500,
      pendente: Math.floor(seededRandom(filterSeed, index * 3 + 2) * 1500) + 200,
    }));
  }, [filters.startDate, filters.endDate, filterSeed]);

  // Faturamento por profissional
  const revenueByProfessional = useMemo((): RevenueByProfessional[] => {
    return professionals.map(prof => {
      const totalRevenue = Math.floor(Math.random() * 30000) + 10000;
      const appointmentCount = Math.floor(Math.random() * 50) + 20;
      return {
        professionalId: prof.id,
        professionalName: prof.name,
        totalRevenue,
        appointmentCount,
        averageTicket: Math.round(totalRevenue / appointmentCount),
      };
    });
  }, []);

  // Faturamento por procedimento
  const revenueByProcedure = useMemo((): RevenueByProcedure[] => {
    return procedures.map(proc => {
      const quantity = Math.floor(Math.random() * 40) + 10;
      return {
        procedureId: proc.id,
        procedureName: proc.name,
        quantity,
        totalRevenue: proc.value * quantity,
        averageValue: proc.value,
      };
    });
  }, []);

  // Faturamento por forma de pagamento
  const revenueByPaymentMethod = useMemo((): RevenueByPaymentMethod[] => {
    const totalRevenue = 85000;
    const distribution = [35, 25, 15, 10, 15]; // percentuais
    return paymentMethods.map((method, index) => ({
      method: method.value,
      label: method.label,
      totalRevenue: Math.round((distribution[index] / 100) * totalRevenue),
      percentage: distribution[index],
      count: Math.floor(Math.random() * 50) + 20,
    }));
  }, []);

  // Pacotes de tratamento
  const packagesReport = useMemo((): PackageReport[] => {
    return [
      { packageId: '1', patientName: 'Maria Silva', packageName: 'Pacote Estético 10 sessões', totalSessions: 10, usedSessions: 7, totalValue: 1800, paidValue: 1800, status: 'ativo' },
      { packageId: '2', patientName: 'João Santos', packageName: 'Fisioterapia Intensiva', totalSessions: 20, usedSessions: 20, totalValue: 2400, paidValue: 2400, status: 'finalizado' },
      { packageId: '3', patientName: 'Ana Costa', packageName: 'Acompanhamento Nutricional', totalSessions: 12, usedSessions: 4, totalValue: 2160, paidValue: 1080, status: 'ativo' },
      { packageId: '4', patientName: 'Pedro Oliveira', packageName: 'Psicoterapia Mensal', totalSessions: 8, usedSessions: 8, totalValue: 1600, paidValue: 1600, status: 'finalizado' },
    ];
  }, []);

  // Dados de atendimentos
  const appointmentData = useMemo((): AppointmentReportData[] => {
    const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    return days.map(day => {
      const total = Math.floor(Math.random() * 20) + 10;
      const realizados = Math.floor(total * 0.8);
      const cancelados = Math.floor(total * 0.1);
      const faltas = total - realizados - cancelados;
      return {
        period: format(day, 'dd/MM', { locale: ptBR }),
        realizados,
        cancelados,
        faltas,
        total,
      };
    });
  }, [filters.startDate, filters.endDate]);

  // Atendimentos por profissional
  const attendanceByProfessional = useMemo((): AttendanceByProfessional[] => {
    return professionals.map(prof => ({
      professionalId: prof.id,
      professionalName: prof.name,
      realized: Math.floor(Math.random() * 40) + 20,
      cancelled: Math.floor(Math.random() * 5) + 1,
      noShow: Math.floor(Math.random() * 3) + 1,
      occupancyRate: Math.floor(Math.random() * 30) + 70,
    }));
  }, []);

  // Atendimentos por especialidade
  const attendanceBySpecialty = useMemo((): AttendanceBySpecialty[] => {
    const specialties = [...new Set(professionals.map(p => p.specialty))];
    const total = 150;
    return specialties.map((spec, index) => ({
      specialtyId: String(index + 1),
      specialtyName: spec,
      count: Math.floor(Math.random() * 40) + 20,
      percentage: Math.floor(100 / specialties.length),
    }));
  }, []);

  // Dados de pacientes
  const patientData = useMemo((): PatientReportData[] => {
    const months = eachMonthOfInterval({ 
      start: subMonths(filters.endDate, 5), 
      end: filters.endDate 
    });
    return months.map(month => ({
      period: format(month, 'MMM/yy', { locale: ptBR }),
      novos: Math.floor(Math.random() * 30) + 10,
      ativos: Math.floor(Math.random() * 200) + 150,
      inativos: Math.floor(Math.random() * 50) + 20,
      retornos: Math.floor(Math.random() * 80) + 40,
    }));
  }, [filters.endDate]);

  // Retenção de pacientes
  const patientRetention = useMemo((): PatientRetention[] => {
    const months = eachMonthOfInterval({ 
      start: subMonths(filters.endDate, 5), 
      end: filters.endDate 
    });
    return months.map(month => {
      const newPatients = Math.floor(Math.random() * 30) + 15;
      const returningPatients = Math.floor(Math.random() * 50) + 30;
      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        newPatients,
        returningPatients,
        retentionRate: Math.round((returningPatients / (newPatients + returningPatients)) * 100),
      };
    });
  }, [filters.endDate]);

  // Pacientes por convênio
  const patientsByInsurance = useMemo((): PatientByInsurance[] => {
    const total = 500;
    const distribution = [30, 20, 18, 12, 20];
    return insurances.map((ins, index) => ({
      insuranceId: ins.id,
      insuranceName: ins.name,
      patientCount: Math.round((distribution[index] / 100) * total),
      percentage: distribution[index],
    }));
  }, []);

  // Relatório de convênios
  const insuranceReport = useMemo((): InsuranceReportData[] => {
    return insurances.filter(i => i.name !== 'Particular').map(ins => ({
      insuranceId: ins.id,
      insuranceName: ins.name,
      appointmentCount: Math.floor(Math.random() * 50) + 20,
      totalRevenue: Math.floor(Math.random() * 20000) + 10000,
      averageValue: Math.floor(Math.random() * 100) + 200,
    }));
  }, []);

  // Performance dos profissionais
  const professionalPerformance = useMemo((): ProfessionalPerformance[] => {
    return professionals.map(prof => {
      const appointmentsRealized = Math.floor(Math.random() * 50) + 30;
      const totalRevenue = Math.floor(Math.random() * 40000) + 15000;
      return {
        professionalId: prof.id,
        professionalName: prof.name,
        specialty: prof.specialty,
        appointmentsRealized,
        totalRevenue,
        averageTicket: Math.round(totalRevenue / appointmentsRealized),
        occupancyRate: Math.floor(Math.random() * 25) + 75,
        commission: Math.round(totalRevenue * 0.3),
      };
    });
  }, []);

  // Consumo de estoque
  const stockConsumption = useMemo((): StockConsumptionReport[] => {
    return [
      { productId: '1', productName: 'Luvas descartáveis', category: 'Descartáveis', consumed: 500, unit: 'un', estimatedCost: 250 },
      { productId: '2', productName: 'Álcool 70%', category: 'Insumos', consumed: 15, unit: 'L', estimatedCost: 180 },
      { productId: '3', productName: 'Gaze estéril', category: 'Descartáveis', consumed: 200, unit: 'pct', estimatedCost: 400 },
      { productId: '4', productName: 'Seringa 5ml', category: 'Descartáveis', consumed: 100, unit: 'un', estimatedCost: 80 },
      { productId: '5', productName: 'Ácido hialurônico', category: 'Medicamentos', consumed: 20, unit: 'amp', estimatedCost: 2000 },
    ];
  }, []);

  // Dados de comunicação
  const communicationData = useMemo((): CommunicationReportData[] => {
    const weeks = eachWeekOfInterval({ start: filters.startDate, end: filters.endDate });
    return weeks.slice(0, 4).map((week, index) => {
      const enviadas = Math.floor(Math.random() * 100) + 50;
      const confirmadas = Math.floor(enviadas * (0.7 + Math.random() * 0.2));
      return {
        period: `Semana ${index + 1}`,
        enviadas,
        confirmadas,
        taxaConfirmacao: Math.round((confirmadas / enviadas) * 100),
      };
    });
  }, [filters.startDate, filters.endDate]);

  // Resumo executivo
  const executiveSummary = useMemo((): ExecutiveSummary => {
    const faturamentoAtual = 85000;
    const faturamentoAnterior = 78000;
    const ocupacaoAgenda = 82;
    const ocupacaoAnterior = 78;
    const ticketMedio = 285;
    const ticketMedioAnterior = 270;
    const taxaRetencao = 75;
    const taxaRetencaoAnterior = 72;

    return {
      faturamentoAtual,
      faturamentoAnterior,
      variacaoFaturamento: Math.round(((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100),
      ocupacaoAgenda,
      ocupacaoAnterior,
      variacaoOcupacao: ocupacaoAgenda - ocupacaoAnterior,
      ticketMedio,
      ticketMedioAnterior,
      variacaoTicket: Math.round(((ticketMedio - ticketMedioAnterior) / ticketMedioAnterior) * 100),
      taxaRetencao,
      taxaRetencaoAnterior,
      variacaoRetencao: taxaRetencao - taxaRetencaoAnterior,
      novosPacientes: 45,
      atendimentosRealizados: 298,
      taxaFaltas: 8,
    };
  }, []);

  // Totais consolidados
  const totals = useMemo(() => {
    const totalFaturamento = financialData.reduce((acc, d) => acc + d.faturamento, 0);
    const totalRecebido = financialData.reduce((acc, d) => acc + d.recebido, 0);
    const totalPendente = financialData.reduce((acc, d) => acc + d.pendente, 0);
    const totalAtendimentos = appointmentData.reduce((acc, d) => acc + d.total, 0);
    const totalRealizados = appointmentData.reduce((acc, d) => acc + d.realizados, 0);
    const totalFaltas = appointmentData.reduce((acc, d) => acc + d.faltas, 0);

    return {
      faturamento: totalFaturamento,
      recebido: totalRecebido,
      pendente: totalPendente,
      atendimentos: totalAtendimentos,
      realizados: totalRealizados,
      faltas: totalFaltas,
      taxaOcupacao: Math.round((totalRealizados / totalAtendimentos) * 100),
      taxaFaltas: Math.round((totalFaltas / totalAtendimentos) * 100),
    };
  }, [financialData, appointmentData]);

  return {
    // Estado de carregamento
    isLoading,
    // Listas para filtros
    professionals,
    procedures,
    insurances,
    paymentMethods,
    // Dados financeiros
    financialData,
    revenueByProfessional,
    revenueByProcedure,
    revenueByPaymentMethod,
    packagesReport,
    // Dados de agenda
    appointmentData,
    attendanceByProfessional,
    attendanceBySpecialty,
    // Dados de pacientes
    patientData,
    patientRetention,
    patientsByInsurance,
    // Dados de convênios
    insuranceReport,
    // Performance
    professionalPerformance,
    // Estoque
    stockConsumption,
    // Comunicação
    communicationData,
    // Executivo
    executiveSummary,
    // Totais
    totals,
  };
}
