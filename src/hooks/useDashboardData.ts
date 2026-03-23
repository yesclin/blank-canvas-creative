import { useState, useMemo } from 'react';
import type {
  DashboardUser,
  DashboardAppointment,
  DashboardFinance,
  DashboardInsight,
  DashboardProfessional,
  DashboardStats,
  DashboardPeriod,
} from '@/types/dashboard';

// =============================================
// MOCK DATA
// =============================================

const mockUser: DashboardUser = {
  id: '1',
  name: 'Dr. Carlos',
  role: 'owner',
};

const mockAppointments: DashboardAppointment[] = [
  {
    id: '1',
    time: '08:00',
    end_time: '08:30',
    patient_name: 'Maria Silva',
    patient_id: '1',
    professional_name: 'Dr. Carlos',
    professional_id: '1',
    professional_color: '#10B981',
    appointment_type: 'consulta',
    status: 'finalizado',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: true,
    has_pending_payment: false,
    procedure_name: 'Consulta Inicial',
    expected_value: 250,
  },
  {
    id: '2',
    time: '08:30',
    end_time: '09:00',
    patient_name: 'João Santos',
    patient_id: '2',
    professional_name: 'Dra. Ana',
    professional_id: '2',
    professional_color: '#8B5CF6',
    appointment_type: 'procedimento',
    status: 'finalizado',
    is_first_visit: false,
    has_clinical_alert: true,
    is_recurring: false,
    has_pending_payment: false,
    procedure_name: 'Limpeza de Pele',
    expected_value: 350,
  },
  {
    id: '3',
    time: '09:00',
    end_time: '09:30',
    patient_name: 'Ana Costa',
    patient_id: '3',
    professional_name: 'Dr. Carlos',
    professional_id: '1',
    professional_color: '#10B981',
    appointment_type: 'retorno',
    status: 'em_atendimento',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: true,
    has_pending_payment: false,
    expected_value: 0,
  },
  {
    id: '4',
    time: '09:30',
    end_time: '10:00',
    patient_name: 'Pedro Lima',
    patient_id: '4',
    professional_name: 'Dra. Ana',
    professional_id: '2',
    professional_color: '#8B5CF6',
    appointment_type: 'consulta',
    status: 'chegou',
    is_first_visit: true,
    has_clinical_alert: false,
    is_recurring: false,
    has_pending_payment: false,
    procedure_name: 'Consulta Inicial',
    insurance_name: 'Unimed',
    expected_value: 180,
  },
  {
    id: '5',
    time: '10:00',
    end_time: '10:30',
    patient_name: 'Lucia Ferreira',
    patient_id: '5',
    professional_name: 'Dr. Carlos',
    professional_id: '1',
    professional_color: '#10B981',
    appointment_type: 'procedimento',
    status: 'confirmado',
    is_first_visit: false,
    has_clinical_alert: true,
    is_recurring: false,
    has_pending_payment: true,
    procedure_name: 'Botox',
    expected_value: 1500,
  },
  {
    id: '6',
    time: '10:30',
    end_time: '11:00',
    patient_name: 'Roberto Souza',
    patient_id: '6',
    professional_name: 'Dra. Ana',
    professional_id: '2',
    professional_color: '#8B5CF6',
    appointment_type: 'encaixe',
    status: 'confirmado',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: true,
    has_pending_payment: false,
    procedure_name: 'Avaliação',
    expected_value: 150,
  },
  {
    id: '7',
    time: '11:00',
    end_time: '11:30',
    patient_name: 'Carla Mendes',
    patient_id: '7',
    professional_name: 'Dr. Carlos',
    professional_id: '1',
    professional_color: '#10B981',
    appointment_type: 'consulta',
    status: 'nao_confirmado',
    is_first_visit: true,
    has_clinical_alert: false,
    is_recurring: false,
    has_pending_payment: false,
    procedure_name: 'Consulta Inicial',
    expected_value: 250,
  },
  {
    id: '8',
    time: '14:00',
    end_time: '14:30',
    patient_name: 'Fernando Alves',
    patient_id: '8',
    professional_name: 'Dra. Ana',
    professional_id: '2',
    professional_color: '#8B5CF6',
    appointment_type: 'procedimento',
    status: 'confirmado',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: false,
    has_pending_payment: false,
    procedure_name: 'Peeling',
    expected_value: 450,
  },
  {
    id: '9',
    time: '14:30',
    end_time: '15:00',
    patient_name: 'Patricia Oliveira',
    patient_id: '9',
    professional_name: 'Dr. Carlos',
    professional_id: '1',
    professional_color: '#10B981',
    appointment_type: 'retorno',
    status: 'confirmado',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: true,
    has_pending_payment: false,
    expected_value: 0,
  },
  {
    id: '10',
    time: '15:00',
    end_time: '15:30',
    patient_name: 'Ricardo Gomes',
    patient_id: '10',
    professional_name: 'Dra. Ana',
    professional_id: '2',
    professional_color: '#8B5CF6',
    appointment_type: 'consulta',
    status: 'faltou',
    is_first_visit: false,
    has_clinical_alert: false,
    is_recurring: false,
    has_pending_payment: false,
    procedure_name: 'Consulta',
    expected_value: 200,
  },
];

const mockFinance: DashboardFinance = {
  today: {
    expected: 3330,
    received: 600,
    pending: 2730,
    ticketAverage: 333,
    appointmentsCount: 10,
  },
  month: {
    accumulated: 45680,
    goal: 80000,
    goalPercent: 57.1,
    particular: 32500,
    convenio: 13180,
  },
};

const mockProfessionals: DashboardProfessional[] = [
  {
    id: '1',
    name: 'Dr. Carlos',
    specialty: 'Dermatologia',
    color: '#10B981',
    status: 'em_atendimento',
    todayAppointments: 5,
    completedAppointments: 2,
    currentPatient: 'Ana Costa',
  },
  {
    id: '2',
    name: 'Dra. Ana',
    specialty: 'Estética',
    color: '#8B5CF6',
    status: 'disponivel',
    todayAppointments: 5,
    completedAppointments: 2,
  },
];

const mockInsights: DashboardInsight[] = [
  {
    id: '1',
    type: 'warning',
    title: '1 falta registrada hoje',
    description: 'Ricardo Gomes faltou às 15:00. Considere entrar em contato.',
    action: 'Enviar mensagem',
    link: '/app/marketing',
    value: 'R$ 200 perdidos',
  },
  {
    id: '2',
    type: 'warning',
    title: '2 consultas não confirmadas',
    description: 'Carla Mendes (11:00) não confirmou. Taxa de confirmação: 80%',
    action: 'Enviar lembrete',
    link: '/app/agenda',
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Horários disponíveis à tarde',
    description: 'Dr. Carlos tem 2 horários livres entre 16h e 18h.',
    action: 'Ver agenda',
    link: '/app/agenda',
  },
  {
    id: '4',
    type: 'success',
    title: 'Botox é o procedimento mais rentável',
    description: 'Representa 45% do faturamento previsto hoje (R$ 1.500)',
    action: 'Ver relatório',
    link: '/app/gestao/financas',
  },
  {
    id: '5',
    type: 'info',
    title: 'Meta mensal em 57%',
    description: 'Faltam R$ 34.320 para atingir a meta de R$ 80.000',
    action: 'Ver financeiro',
    link: '/app/gestao/financas',
  },
];

// =============================================
// HOOKS
// =============================================

export function useDashboardData() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [user] = useState<DashboardUser>(mockUser);

  const appointments = useMemo(() => mockAppointments, []);
  const finance = useMemo(() => mockFinance, []);
  const professionals = useMemo(() => mockProfessionals, []);
  const insights = useMemo(() => mockInsights, []);

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
    } else if (stats.remainingAppointments <= 2) {
      contextMessage = 'Agenda leve hoje. Oportunidade para encaixes!';
    }

    return {
      text: greetingText,
      userName: user.name,
      context: contextMessage,
    };
  }, [user.name, stats, finance.today.expected]);

  // Filter appointments by current time for "next appointments"
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
  };
}

export function getGreetingEmoji(hour: number): string {
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 18) return '🌤️';
  return '🌙';
}
