import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type {
  DashboardUser,
  DashboardAppointment,
  DashboardFinance,
  DashboardInsight,
  DashboardProfessional,
  DashboardStats,
  DashboardPeriod,
} from '@/types/dashboard';
import { useMarginAlerts, useMarginAlertConfig, generateMarginInsights, type ProcedureMarginAlert } from './useMarginAlerts';

// =============================================
// HELPER FUNCTIONS
// =============================================

async function getUserContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Retorna contexto vazio em vez de erro
    return {
      userId: null as string | null,
      clinicId: null as string | null,
      fullName: null as string | null,
      role: 'recepcionista' as DashboardUser['role'],
    };
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id, full_name")
    .eq("user_id", user.id)
    .single();
  
  // Retorna contexto parcial se não houver clínica
  if (!profile?.clinic_id) {
    return {
      userId: user.id,
      clinicId: null as string | null,
      fullName: profile?.full_name || null,
      role: 'recepcionista' as DashboardUser['role'],
    };
  }
  
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("clinic_id", profile.clinic_id)
    .single();
  
  return {
    userId: user.id,
    clinicId: profile.clinic_id,
    fullName: profile.full_name,
    role: roleData?.role as DashboardUser['role'] || 'recepcionista',
  };
}

// =============================================
// DATA FETCHING HOOKS
// =============================================

function getPeriodDateRange(period: DashboardPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  switch (period) {
    case 'week':
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'today':
    default:
      const today = format(now, 'yyyy-MM-dd');
      return { startDate: today, endDate: today };
  }
}

function usePeriodAppointments(clinicId: string | null, userRole: string | null, professionalId: string | null, period: DashboardPeriod) {
  const { startDate, endDate } = getPeriodDateRange(period);
  
  return useQuery({
    queryKey: ['dashboard-appointments', clinicId, period, startDate, endDate],
    queryFn: async (): Promise<DashboardAppointment[]> => {
      if (!clinicId) return [];
      
      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          appointment_type,
          payment_type,
          expected_value,
          is_fit_in,
          is_first_visit,
          has_pending_payment,
          patient_id,
          professional_id,
          procedure_id,
          insurance_id
        `)
        .eq('clinic_id', clinicId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      // Se for profissional, filtra apenas seus atendimentos
      if (userRole === 'profissional' && professionalId) {
        query = query.eq('professional_id', professionalId);
      }
      
      const { data: appointments, error } = await query;
      
      if (error) throw error;
      if (!appointments || appointments.length === 0) return [];
      
      // Buscar pacientes
      const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name')
        .in('id', patientIds);
      const patientsMap = new Map(patients?.map(p => [p.id, p]) || []);
      
      // Buscar profissionais
      const professionalIds = [...new Set(appointments.map(a => a.professional_id).filter(Boolean))];
      const { data: professionals } = await supabase
        .from('professionals')
        .select('id, full_name, color')
        .in('id', professionalIds);
      const professionalsMap = new Map(professionals?.map(p => [p.id, p]) || []);
      
      // Buscar procedimentos
      const procedureIds = [...new Set(appointments.map(a => a.procedure_id).filter(Boolean))] as string[];
      let proceduresMap = new Map<string, { id: string; name: string }>();
      if (procedureIds.length > 0) {
        const { data: procedures } = await supabase
          .from('procedures')
          .select('id, name')
          .in('id', procedureIds);
        proceduresMap = new Map(procedures?.map(p => [p.id, p]) || []);
      }
      
      // Buscar convênios
      const insuranceIds = [...new Set(appointments.map(a => a.insurance_id).filter(Boolean))] as string[];
      let insurancesMap = new Map<string, { id: string; name: string }>();
      if (insuranceIds.length > 0) {
        const { data: insurances } = await supabase
          .from('insurances')
          .select('id, name')
          .in('id', insuranceIds);
        insurancesMap = new Map(insurances?.map(i => [i.id, i]) || []);
      }
      
      // Buscar alertas clínicos dos pacientes
      const { data: alertsData } = await supabase
        .from('patient_clinical_data')
        .select('patient_id')
        .in('patient_id', patientIds)
        .not('allergies', 'is', null);
      
      const patientsWithAlerts = new Set(alertsData?.map(a => a.patient_id) || []);
      
      return appointments.map((apt): DashboardAppointment => {
        const patient = patientsMap.get(apt.patient_id);
        const professional = professionalsMap.get(apt.professional_id);
        const procedure = apt.procedure_id ? proceduresMap.get(apt.procedure_id) : null;
        const insurance = apt.insurance_id ? insurancesMap.get(apt.insurance_id) : null;
        
        return {
          id: apt.id,
          time: apt.start_time?.substring(0, 5) || '',
          end_time: apt.end_time?.substring(0, 5) || '',
          patient_name: patient?.full_name || 'Paciente',
          patient_id: apt.patient_id || '',
          professional_name: professional?.full_name || 'Profissional',
          professional_id: apt.professional_id || '',
          professional_color: professional?.color || '#10B981',
          appointment_type: (apt.appointment_type || 'consulta') as DashboardAppointment['appointment_type'],
          status: (apt.status || 'nao_confirmado') as DashboardAppointment['status'],
          is_first_visit: apt.is_first_visit || false,
          has_clinical_alert: patientsWithAlerts.has(apt.patient_id),
          is_recurring: false,
          has_pending_payment: apt.has_pending_payment || false,
          procedure_name: procedure?.name,
          insurance_name: insurance?.name,
          expected_value: Number(apt.expected_value) || 0,
        };
      });
    },
    enabled: !!clinicId,
    refetchInterval: 30000,
  });
}

function useDashboardFinance(clinicId: string | null, period: DashboardPeriod) {
  const { startDate, endDate } = getPeriodDateRange(period);
  
  return useQuery({
    queryKey: ['dashboard-finance', clinicId, period, startDate, endDate],
    queryFn: async (): Promise<DashboardFinance> => {
      if (!clinicId) {
        return {
          today: { expected: 0, received: 0, pending: 0, ticketAverage: 0, appointmentsCount: 0 },
          month: { accumulated: 0, goal: 0, goalPercent: 0, particular: 0, convenio: 0 },
        };
      }
      
      const today = new Date();
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      
      // Buscar atendimentos do período para calcular previsto
      const { data: periodAppointments } = await supabase
        .from('appointments')
        .select('expected_value, payment_type, status')
        .eq('clinic_id', clinicId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .neq('status', 'cancelado');
      
      // Buscar transações do período (recebimentos)
      const { data: periodTransactions } = await supabase
        .from('finance_transactions')
        .select('amount')
        .eq('clinic_id', clinicId)
        .eq('type', 'entrada')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);
      
      // Buscar transações do mês (acumulado)
      const { data: monthTransactions } = await supabase
        .from('finance_transactions')
        .select('amount')
        .eq('clinic_id', clinicId)
        .eq('type', 'entrada')
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd);
      
      // Buscar atendimentos finalizados do mês para distribuição particular/convênio
      const { data: monthAppointments } = await supabase
        .from('appointments')
        .select('expected_value, payment_type')
        .eq('clinic_id', clinicId)
        .gte('scheduled_date', monthStart)
        .lte('scheduled_date', monthEnd)
        .eq('status', 'finalizado');
      
      // Buscar meta mensal da clínica
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('monthly_goal')
        .eq('id', clinicId)
        .single();
      
      // Calcular valores do período
      const periodExpected = periodAppointments?.reduce((sum, apt) => sum + (Number(apt.expected_value) || 0), 0) || 0;
      const periodReceived = periodTransactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      const periodCount = periodAppointments?.length || 0;
      
      // Calcular valores do mês
      const monthAccumulated = monthTransactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      const monthGoal = Number(clinicData?.monthly_goal) || 80000;
      
      // Particular vs Convênio do mês
      const monthParticular = monthAppointments
        ?.filter(a => a.payment_type === 'particular')
        .reduce((sum, a) => sum + (Number(a.expected_value) || 0), 0) || 0;
      const monthConvenio = monthAppointments
        ?.filter(a => a.payment_type === 'convenio')
        .reduce((sum, a) => sum + (Number(a.expected_value) || 0), 0) || 0;
      
      return {
        today: {
          expected: periodExpected,
          received: periodReceived,
          pending: Math.max(0, periodExpected - periodReceived),
          ticketAverage: periodCount > 0 ? Math.round(periodExpected / periodCount) : 0,
          appointmentsCount: periodCount,
        },
        month: {
          accumulated: monthAccumulated,
          goal: monthGoal,
          goalPercent: monthGoal > 0 ? Math.round((monthAccumulated / monthGoal) * 100) : 0,
          particular: monthParticular,
          convenio: monthConvenio,
        },
      };
    },
    enabled: !!clinicId,
    refetchInterval: 60000,
  });
}

function useDashboardProfessionals(clinicId: string | null, period: DashboardPeriod) {
  const { startDate, endDate } = getPeriodDateRange(period);
  
  return useQuery({
    queryKey: ['dashboard-professionals', clinicId, period, startDate, endDate],
    queryFn: async (): Promise<DashboardProfessional[]> => {
      if (!clinicId) return [];
      
      // Buscar profissionais ativos
      const { data: professionals } = await supabase
        .from('professionals')
        .select('id, full_name, color, specialty_id')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      
      if (!professionals || professionals.length === 0) return [];
      
      // Buscar especialidades
      const specialtyIds = [...new Set(professionals.map(p => p.specialty_id).filter(Boolean))] as string[];
      let specialtiesMap = new Map<string, string>();
      if (specialtyIds.length > 0) {
        const { data: specialties } = await supabase
          .from('specialties')
          .select('id, name')
          .in('id', specialtyIds);
        specialtiesMap = new Map(specialties?.map(s => [s.id, s.name]) || []);
      }
      
      // Buscar atendimentos do período
      const { data: appointments } = await supabase
        .from('appointments')
        .select('professional_id, status, patient_id')
        .eq('clinic_id', clinicId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);
      
      // Buscar nomes dos pacientes em atendimento
      const inProgressApts = appointments?.filter(a => a.status === 'em_atendimento') || [];
      const patientIds = inProgressApts.map(a => a.patient_id).filter(Boolean);
      let patientsMap = new Map<string, string>();
      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id, full_name')
          .in('id', patientIds);
        patientsMap = new Map(patients?.map(p => [p.id, p.full_name]) || []);
      }
      
      return professionals.map((prof): DashboardProfessional => {
        const profAppointments = appointments?.filter(a => a.professional_id === prof.id) || [];
        const completed = profAppointments.filter(a => a.status === 'finalizado').length;
        const inProgress = profAppointments.find(a => a.status === 'em_atendimento');
        
        let status: DashboardProfessional['status'] = 'disponivel';
        if (inProgress) {
          status = 'em_atendimento';
        } else if (profAppointments.some(a => ['confirmado', 'chegou'].includes(a.status))) {
          status = 'ocupado';
        }
        
        const currentPatientName = inProgress ? patientsMap.get(inProgress.patient_id) : undefined;
        
        return {
          id: prof.id,
          name: prof.full_name,
          specialty: prof.specialty_id ? (specialtiesMap.get(prof.specialty_id) || 'Geral') : 'Geral',
          color: prof.color || '#10B981',
          status,
          todayAppointments: profAppointments.length,
          completedAppointments: completed,
          currentPatient: currentPatientName,
        };
      });
    },
    enabled: !!clinicId,
    refetchInterval: 30000,
  });
}

// =============================================
// INSIGHTS GENERATOR
// =============================================

function generateInsights(
  appointments: DashboardAppointment[],
  finance: DashboardFinance,
  professionals: DashboardProfessional[],
  marginAlerts: ProcedureMarginAlert[] = [],
  marginAlertPeriodDays: number = 30
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  
  // 1. Faltas do dia
  const absences = appointments.filter(a => a.status === 'faltou');
  if (absences.length > 0) {
    const lostValue = absences.reduce((sum, a) => sum + a.expected_value, 0);
    insights.push({
      id: 'absences',
      type: 'warning',
      title: `${absences.length} falta${absences.length > 1 ? 's' : ''} registrada${absences.length > 1 ? 's' : ''} hoje`,
      description: absences.length === 1 
        ? `${absences[0].patient_name} faltou às ${absences[0].time}. Considere entrar em contato.`
        : `${absences.map(a => a.patient_name).slice(0, 2).join(', ')}${absences.length > 2 ? ` e mais ${absences.length - 2}` : ''} faltaram.`,
      action: 'Enviar mensagem',
      link: '/app/comunicacao',
      value: lostValue > 0 ? `R$ ${lostValue.toLocaleString('pt-BR')} perdidos` : undefined,
    });
  }
  
  // 2. Consultas não confirmadas
  const unconfirmed = appointments.filter(a => a.status === 'nao_confirmado');
  if (unconfirmed.length > 0) {
    const confirmedCount = appointments.filter(a => 
      ['confirmado', 'chegou', 'em_atendimento', 'finalizado'].includes(a.status)
    ).length;
    const confirmationRate = appointments.length > 0 
      ? Math.round((confirmedCount / appointments.length) * 100) 
      : 0;
    
    insights.push({
      id: 'unconfirmed',
      type: 'warning',
      title: `${unconfirmed.length} consulta${unconfirmed.length > 1 ? 's' : ''} não confirmada${unconfirmed.length > 1 ? 's' : ''}`,
      description: unconfirmed.length === 1
        ? `${unconfirmed[0].patient_name} (${unconfirmed[0].time}) não confirmou.`
        : `Taxa de confirmação atual: ${confirmationRate}%`,
      action: 'Enviar lembrete',
      link: '/app/comunicacao',
    });
  }
  
  // 3. Horários ociosos - enhanced version
  const idleProfessionals = professionals.filter(p => 
    p.todayAppointments === 0 && p.status === 'disponivel'
  );
  const lowOccupancyProfessionals = professionals.filter(p => {
    // Consider low occupancy if less than 3 appointments and status is available
    return p.todayAppointments > 0 && p.todayAppointments < 3 && p.status === 'disponivel';
  });
  
  if (idleProfessionals.length > 0) {
    const profName = idleProfessionals[0].name;
    insights.push({
      id: 'idle-slots',
      type: 'warning',
      title: `⚠️ ${idleProfessionals.length === 1 ? profName + ' está' : idleProfessionals.length + ' profissionais estão'} sem atendimentos`,
      description: idleProfessionals.length === 1
        ? `Agenda livre hoje. Considere oferecer encaixes.`
        : `${idleProfessionals.map(p => p.name).slice(0, 2).join(', ')}${idleProfessionals.length > 2 ? ` e mais ${idleProfessionals.length - 2}` : ''} estão disponíveis.`,
      action: 'Agendar encaixe',
      link: '/app/agenda',
    });
  } else if (lowOccupancyProfessionals.length > 0) {
    const profName = lowOccupancyProfessionals[0].name;
    insights.push({
      id: 'idle-slots',
      type: 'opportunity',
      title: 'Horários disponíveis',
      description: lowOccupancyProfessionals.length === 1
        ? `${profName} tem horários livres hoje.`
        : `${lowOccupancyProfessionals.length} profissionais com baixa ocupação.`,
      action: 'Ver agenda',
      link: '/app/agenda',
    });
  }
  
  // 4. Procedimento mais rentável
  const procedureRevenue = new Map<string, { name: string; value: number }>();
  appointments
    .filter(a => a.expected_value > 0 && a.procedure_name)
    .forEach(apt => {
      const current = procedureRevenue.get(apt.procedure_name!) || { name: apt.procedure_name!, value: 0 };
      current.value += apt.expected_value;
      procedureRevenue.set(apt.procedure_name!, current);
    });
  
  if (procedureRevenue.size > 0) {
    const totalValue = Array.from(procedureRevenue.values()).reduce((sum, p) => sum + p.value, 0);
    const topProcedure = Array.from(procedureRevenue.entries())
      .sort((a, b) => b[1].value - a[1].value)[0];
    
    if (topProcedure && topProcedure[1].value > 0 && totalValue > 0) {
      const percentage = Math.round((topProcedure[1].value / totalValue) * 100);
      insights.push({
        id: 'top-procedure',
        type: 'success',
        title: `${topProcedure[0]} é o mais rentável`,
        description: `Representa ${percentage}% do faturamento previsto hoje (R$ ${topProcedure[1].value.toLocaleString('pt-BR')})`,
        action: 'Ver relatório',
        link: '/app/gestao/relatorios',
      });
    }
  }
  
  // 5. Meta mensal
  if (finance.month.goal > 0) {
    const remaining = finance.month.goal - finance.month.accumulated;
    if (finance.month.goalPercent >= 100) {
      insights.push({
        id: 'monthly-goal',
        type: 'success',
        title: '🎉 Meta mensal atingida!',
        description: `Faturamento de R$ ${finance.month.accumulated.toLocaleString('pt-BR')} (${finance.month.goalPercent}% da meta)`,
        action: 'Ver relatório',
        link: '/app/gestao/relatorios',
      });
    } else if (remaining > 0 && finance.month.goalPercent >= 50) {
      insights.push({
        id: 'monthly-goal',
        type: 'info',
        title: `Meta mensal em ${finance.month.goalPercent}%`,
        description: `Faltam R$ ${remaining.toLocaleString('pt-BR')} para atingir a meta`,
        action: 'Ver financeiro',
        link: '/app/gestao/financas',
      });
    }
  }
  
  // 6. Alertas de margem (apenas para admins - será filtrado no componente)
  const marginInsights = generateMarginInsights(marginAlerts, marginAlertPeriodDays);
  insights.push(...marginInsights);
  
  // Limitar a 4 insights
  return insights.slice(0, 4);
}

// =============================================
// MAIN HOOK
// =============================================

export function useDashboardRealData() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [userContext, setUserContext] = useState<{
    userId: string | null;
    clinicId: string | null;
    fullName: string | null;
    role: DashboardUser['role'];
    professionalId?: string;
  } | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  
  // Fetch user context on mount
  useEffect(() => {
    async function loadContext() {
      try {
        const context = await getUserContext();
        
        // Se não houver clinicId, ainda definimos o contexto para que a UI funcione
        if (!context.clinicId) {
          setUserContext({
            userId: context.userId,
            clinicId: null,
            fullName: context.fullName,
            role: context.role,
          });
          setContextLoaded(true);
          return;
        }
        
        // Se for profissional, buscar o professional_id
        if (context.role === 'profissional' && context.userId && context.clinicId) {
          const { data: profData } = await supabase
            .from('professionals')
            .select('id')
            .eq('clinic_id', context.clinicId)
            .eq('user_id', context.userId)
            .single();
          
          setUserContext({ 
            userId: context.userId,
            clinicId: context.clinicId,
            fullName: context.fullName,
            role: context.role,
            professionalId: profData?.id 
          });
        } else {
          setUserContext({
            userId: context.userId,
            clinicId: context.clinicId,
            fullName: context.fullName,
            role: context.role,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar contexto do usuário:', error);
        // Ainda carrega a UI mesmo com erro
        setUserContext({
          userId: null,
          clinicId: null,
          fullName: null,
          role: 'recepcionista',
        });
      } finally {
        setContextLoaded(true);
      }
    }
    loadContext();
  }, []);
  
  const user: DashboardUser = useMemo(() => ({
    id: userContext?.userId || '',
    name: userContext?.fullName || 'Usuário',
    role: userContext?.role || 'recepcionista',
    professional_id: userContext?.professionalId,
  }), [userContext]);
  
  // Fetch real data
  const { data: appointments = [], isLoading: loadingAppointments } = usePeriodAppointments(
    userContext?.clinicId || null,
    userContext?.role || null,
    userContext?.professionalId || null,
    period
  );
  
  const { data: finance = {
    today: { expected: 0, received: 0, pending: 0, ticketAverage: 0, appointmentsCount: 0 },
    month: { accumulated: 0, goal: 0, goalPercent: 0, particular: 0, convenio: 0 },
  }, isLoading: loadingFinance } = useDashboardFinance(userContext?.clinicId || null, period);
  
  const { data: professionals = [], isLoading: loadingProfessionals } = useDashboardProfessionals(
    userContext?.clinicId || null,
    period
  );
  
  // Margin alerts - apenas para perfis elevados
  const isAdmin = !!userContext?.role && ['admin', 'owner'].includes(userContext.role);
  const { data: marginAlerts = [] } = useMarginAlerts(
    isAdmin ? userContext?.clinicId || null : null
  );
  const { data: marginConfig } = useMarginAlertConfig(
    isAdmin ? userContext?.clinicId || null : null
  );
  
  // Calculate stats from real appointments
  const stats: DashboardStats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'finalizado').length;
    const remaining = appointments.filter(a => 
      ['nao_confirmado', 'confirmado', 'chegou', 'em_atendimento'].includes(a.status)
    ).length;
    const absences = appointments.filter(a => a.status === 'faltou').length;
    const confirmed = appointments.filter(a => 
      ['confirmado', 'chegou', 'em_atendimento', 'finalizado'].includes(a.status)
    ).length;
    const newPatients = appointments.filter(a => a.is_first_visit).length;

    return {
      totalAppointments: total,
      completedAppointments: completed,
      remainingAppointments: remaining,
      absences,
      confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      newPatients,
    };
  }, [appointments]);
  
  // Generate insights from real data (including margin alerts for admins)
  const insights = useMemo(() => 
    generateInsights(
      appointments, 
      finance, 
      professionals, 
      isAdmin ? marginAlerts : [],
      marginConfig?.periodDays || 30
    ),
    [appointments, finance, professionals, marginAlerts, marginConfig?.periodDays, isAdmin]
  );
  
  // Dynamic greeting based on real data
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let greetingText = 'Bom dia';
    if (hour >= 12 && hour < 18) greetingText = 'Boa tarde';
    else if (hour >= 18 || hour < 5) greetingText = 'Boa noite';

    let contextMessage = 'Aqui estão os pontos que merecem sua atenção hoje.';
    
    if (stats.absences > 0) {
      contextMessage = `Você tem ${stats.absences} falta(s) registrada(s) hoje.`;
    } else if (stats.totalAppointments > 8) {
      contextMessage = `Dia cheio! ${stats.totalAppointments} atendimentos agendados.`;
    } else if (finance.today.expected > 2000) {
      contextMessage = `Faturamento previsto de R$ ${finance.today.expected.toLocaleString('pt-BR')} hoje.`;
    } else if (stats.totalAppointments === 0) {
      contextMessage = 'Nenhum atendimento agendado para hoje.';
    } else if (stats.remainingAppointments <= 2) {
      contextMessage = 'Agenda leve hoje. Oportunidade para encaixes!';
    }

    return {
      text: greetingText,
      userName: user.name,
      context: contextMessage,
    };
  }, [user.name, stats, finance.today.expected]);

  // Upcoming appointments (filtered by current time)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return appointments.filter(a => 
      a.time >= currentTime || 
      ['em_atendimento', 'chegou'].includes(a.status)
    ).slice(0, 6);
  }, [appointments]);

  const appointmentsWithAlerts = useMemo(() => {
    return appointments.filter(a => a.has_clinical_alert);
  }, [appointments]);
  
  const isLoading = loadingAppointments || loadingFinance || loadingProfessionals || !contextLoaded;

  return {
    user,
    period,
    setPeriod,
    appointments,
    upcomingAppointments,
    appointmentsWithAlerts,
    finance,
    professionals,
    insights,
    stats,
    greeting,
    isLoading,
  };
}

export function getGreetingEmoji(hour: number): string {
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 18) return '🌤️';
  return '🌙';
}
