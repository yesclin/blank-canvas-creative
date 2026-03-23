// =============================================
// TIPOS DO DASHBOARD PRINCIPAL
// =============================================

export interface DashboardUser {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'profissional' | 'recepcionista';
  professional_id?: string;
}

export interface DashboardAppointment {
  id: string;
  time: string;
  end_time: string;
  patient_name: string;
  patient_id: string;
  professional_name: string;
  professional_id: string;
  professional_color: string;
  appointment_type: 'consulta' | 'retorno' | 'procedimento' | 'encaixe';
  status: 'nao_confirmado' | 'confirmado' | 'chegou' | 'em_atendimento' | 'finalizado' | 'faltou' | 'cancelado';
  is_first_visit: boolean;
  has_clinical_alert: boolean;
  is_recurring: boolean;
  has_pending_payment: boolean;
  insurance_name?: string;
  procedure_name?: string;
  expected_value: number;
}

export interface DashboardFinance {
  today: {
    expected: number;
    received: number;
    pending: number;
    ticketAverage: number;
    appointmentsCount: number;
  };
  month: {
    accumulated: number;
    goal: number;
    goalPercent: number;
    particular: number;
    convenio: number;
  };
}

export interface DashboardInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'success' | 'info' | 'critical';
  title: string;
  description: string;
  action?: string;
  link?: string;
  value?: string | number;
}

export interface DashboardProfessional {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  color: string;
  status: 'disponivel' | 'em_atendimento' | 'ausente' | 'ocupado';
  todayAppointments: number;
  completedAppointments: number;
  currentPatient?: string;
}

export interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  remainingAppointments: number;
  absences: number;
  confirmationRate: number;
  newPatients: number;
}

export type DashboardPeriod = 'today' | 'week' | 'month';

export const statusLabels: Record<DashboardAppointment['status'], string> = {
  nao_confirmado: 'Não confirmado',
  confirmado: 'Confirmado',
  chegou: 'Chegou',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
};

export const statusColors: Record<DashboardAppointment['status'], string> = {
  nao_confirmado: 'bg-gray-100 text-gray-700 border-gray-300',
  confirmado: 'bg-blue-100 text-blue-700 border-blue-300',
  chegou: 'bg-green-100 text-green-700 border-green-300',
  em_atendimento: 'bg-purple-100 text-purple-700 border-purple-300',
  finalizado: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  faltou: 'bg-red-100 text-red-700 border-red-300',
  cancelado: 'bg-orange-100 text-orange-700 border-orange-300',
};

export const appointmentTypeLabels: Record<DashboardAppointment['appointment_type'], string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  procedimento: 'Procedimento',
  encaixe: 'Encaixe',
};
