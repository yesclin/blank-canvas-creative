// Types for the Agenda module

export type AppointmentStatus = 
  | 'nao_confirmado' 
  | 'confirmado' 
  | 'chegou' 
  | 'em_atendimento' 
  | 'finalizado' 
  | 'faltou' 
  | 'cancelado';

export type AppointmentType = 'consulta' | 'retorno' | 'procedimento' | 'encaixe';

export type PaymentType = 'particular' | 'convenio';

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'timeline';

export type GroupBy = 'professional' | 'room' | 'specialty' | 'type' | 'status' | 'general';

export interface Specialty {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

export interface Room {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Professional {
  id: string;
  clinic_id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  specialty_id?: string;
  specialty?: Specialty;
  registration_number?: string;
  avatar_url?: string;
  color: string;
  is_active: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  has_clinical_alert: boolean;
  clinical_alert_text?: string;
  is_active: boolean;
}

export interface Insurance {
  id: string;
  clinic_id: string;
  name: string;
  ans_code?: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient?: Patient;
  professional_id: string;
  professional?: Professional;
  room_id?: string;
  room?: Room;
  specialty_id?: string;
  specialty?: Specialty;
  insurance_id?: string;
  insurance?: Insurance;
  procedure_id?: string;
  procedure?: {
    id: string;
    name: string;
    duration_minutes: number;
    price?: number;
  };
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  is_first_visit: boolean;
  is_return: boolean;
  has_pending_payment: boolean;
  is_fit_in: boolean;
  payment_type: PaymentType;
  expected_value?: number;
  procedure_cost?: number; // Historical cost calculated at execution time
  notes?: string;
  cancellation_reason?: string;
  arrived_at?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface AgendaFilters {
  professionalId?: string;
  specialtyId?: string;
  roomId?: string;
  appointmentType?: AppointmentType;
  paymentType?: PaymentType;
  status?: AppointmentStatus;
  startDate: Date;
  endDate: Date;
}

export interface AgendaStats {
  totalAppointments: number;
  absences: number;
  fitIns: number;
  freeSlots: number;
  occupancyRate: number;
}

export interface AgendaInsight {
  id: string;
  type: 'warning' | 'info' | 'suggestion';
  title: string;
  description: string;
  recommendation: string;
  action?: {
    label: string;
    filters?: Partial<AgendaFilters>;
  };
}

export const statusLabels: Record<AppointmentStatus, string> = {
  nao_confirmado: 'Não Confirmado',
  confirmado: 'Confirmado',
  chegou: 'Chegou',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
};

export const statusColors: Record<AppointmentStatus, string> = {
  nao_confirmado: 'bg-muted text-muted-foreground',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  chegou: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  em_atendimento: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  finalizado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  faltou: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export const typeLabels: Record<AppointmentType, string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  procedimento: 'Procedimento',
  encaixe: 'Encaixe',
};

export interface ScheduleBlock {
  id: string;
  clinic_id: string;
  professional_id: string | null;
  title: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
}
