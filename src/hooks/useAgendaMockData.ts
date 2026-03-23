import { useMemo } from 'react';
import { format, addDays, subDays, startOfWeek, addHours, setHours, setMinutes } from 'date-fns';
import type { 
  Appointment, 
  Professional, 
  Patient, 
  Room, 
  Specialty, 
  Insurance,
  AgendaStats,
  AgendaInsight,
  AppointmentStatus,
  AppointmentType
} from '@/types/agenda';

// Mock data generators
const generateMockSpecialties = (): Specialty[] => [
  { id: '1', clinic_id: '1', name: 'Clínica Geral', description: '', color: '#3B82F6', is_active: true },
  { id: '2', clinic_id: '1', name: 'Cardiologia', description: '', color: '#EF4444', is_active: true },
  { id: '3', clinic_id: '1', name: 'Dermatologia', description: '', color: '#10B981', is_active: true },
  { id: '4', clinic_id: '1', name: 'Ortopedia', description: '', color: '#F59E0B', is_active: true },
];

const generateMockRooms = (): Room[] => [
  { id: '1', clinic_id: '1', name: 'Consultório 1', description: '', is_active: true },
  { id: '2', clinic_id: '1', name: 'Consultório 2', description: '', is_active: true },
  { id: '3', clinic_id: '1', name: 'Sala de Procedimentos', description: '', is_active: true },
];

const generateMockProfessionals = (specialties: Specialty[]): Professional[] => [
  { 
    id: '1', 
    clinic_id: '1', 
    full_name: 'Dr. João Silva', 
    email: 'joao@clinica.com',
    specialty_id: '1',
    specialty: specialties[0],
    registration_number: 'CRM 12345',
    color: '#3B82F6',
    is_active: true 
  },
  { 
    id: '2', 
    clinic_id: '1', 
    full_name: 'Dra. Maria Santos', 
    email: 'maria@clinica.com',
    specialty_id: '2',
    specialty: specialties[1],
    registration_number: 'CRM 23456',
    color: '#EC4899',
    is_active: true 
  },
  { 
    id: '3', 
    clinic_id: '1', 
    full_name: 'Dr. Carlos Oliveira', 
    email: 'carlos@clinica.com',
    specialty_id: '3',
    specialty: specialties[2],
    registration_number: 'CRM 34567',
    color: '#10B981',
    is_active: true 
  },
];

const generateMockPatients = (): Patient[] => [
  { id: '1', clinic_id: '1', full_name: 'Ana Paula Costa', phone: '(11) 99999-0001', has_clinical_alert: false, is_active: true },
  { id: '2', clinic_id: '1', full_name: 'Roberto Ferreira', phone: '(11) 99999-0002', has_clinical_alert: true, clinical_alert_text: 'Alergia a dipirona', is_active: true },
  { id: '3', clinic_id: '1', full_name: 'Carla Mendes', phone: '(11) 99999-0003', has_clinical_alert: false, is_active: true },
  { id: '4', clinic_id: '1', full_name: 'Fernando Lima', phone: '(11) 99999-0004', has_clinical_alert: false, is_active: true },
  { id: '5', clinic_id: '1', full_name: 'Juliana Souza', phone: '(11) 99999-0005', has_clinical_alert: true, clinical_alert_text: 'Diabético', is_active: true },
  { id: '6', clinic_id: '1', full_name: 'Marcos Almeida', phone: '(11) 99999-0006', has_clinical_alert: false, is_active: true },
  { id: '7', clinic_id: '1', full_name: 'Patricia Rocha', phone: '(11) 99999-0007', has_clinical_alert: false, is_active: true },
  { id: '8', clinic_id: '1', full_name: 'Lucas Pereira', phone: '(11) 99999-0008', has_clinical_alert: false, is_active: true },
];

const generateMockInsurances = (): Insurance[] => [
  { id: '1', clinic_id: '1', name: 'Unimed', ans_code: '12345', is_active: true },
  { id: '2', clinic_id: '1', name: 'Bradesco Saúde', ans_code: '23456', is_active: true },
  { id: '3', clinic_id: '1', name: 'SulAmérica', ans_code: '34567', is_active: true },
];

const statuses: AppointmentStatus[] = ['nao_confirmado', 'confirmado', 'chegou', 'em_atendimento', 'finalizado', 'faltou', 'cancelado'];
const types: AppointmentType[] = ['consulta', 'retorno', 'procedimento'];

const generateMockAppointments = (
  professionals: Professional[],
  patients: Patient[],
  rooms: Room[],
  specialties: Specialty[],
  insurances: Insurance[],
  selectedDate: Date
): Appointment[] => {
  const appointments: Appointment[] = [];
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Generate appointments for the week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = addDays(weekStart, dayOffset);
    const isWeekend = dayOffset >= 5;
    
    if (isWeekend) continue;
    
    // Generate 4-8 appointments per professional per day
    professionals.forEach((professional, profIndex) => {
      const appointmentsForDay = Math.floor(Math.random() * 5) + 4;
      let currentHour = 8;
      
      for (let i = 0; i < appointmentsForDay && currentHour < 18; i++) {
        const duration = [30, 45, 60][Math.floor(Math.random() * 3)];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const insurance = Math.random() > 0.5 ? insurances[Math.floor(Math.random() * insurances.length)] : undefined;
        
        // Weight status towards confirmed/finalized for past, not_confirmed for future
        const isPast = currentDay < new Date();
        let status: AppointmentStatus;
        if (isPast) {
          status = ['finalizado', 'finalizado', 'faltou', 'cancelado'][Math.floor(Math.random() * 4)] as AppointmentStatus;
        } else if (format(currentDay, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) {
          status = statuses[Math.floor(Math.random() * 5)] as AppointmentStatus;
        } else {
          status = ['nao_confirmado', 'confirmado'][Math.floor(Math.random() * 2)] as AppointmentStatus;
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        const isFirstVisit = Math.random() > 0.7;
        const isReturn = type === 'retorno';
        const hasPendingPayment = Math.random() > 0.8;
        const isFitIn = Math.random() > 0.9;
        
        const startTime = `${String(currentHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;
        const endHour = currentHour + Math.floor(duration / 60);
        const endMinute = (parseInt(startTime.split(':')[1]) + duration) % 60;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
        
        appointments.push({
          id: `${dayOffset}-${profIndex}-${i}`,
          clinic_id: '1',
          patient_id: patient.id,
          patient,
          professional_id: professional.id,
          professional,
          room_id: room.id,
          room,
          specialty_id: professional.specialty_id,
          specialty: professional.specialty,
          insurance_id: insurance?.id,
          insurance,
          scheduled_date: format(currentDay, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
          appointment_type: type,
          status,
          is_first_visit: isFirstVisit,
          is_return: isReturn,
          has_pending_payment: hasPendingPayment,
          is_fit_in: isFitIn,
          payment_type: insurance ? 'convenio' : 'particular',
          arrived_at: status === 'chegou' || status === 'em_atendimento' || status === 'finalizado' 
            ? new Date().toISOString() 
            : undefined,
          started_at: status === 'em_atendimento' || status === 'finalizado' 
            ? new Date().toISOString() 
            : undefined,
          finished_at: status === 'finalizado' 
            ? new Date().toISOString() 
            : undefined,
          created_at: new Date().toISOString(),
        });
        
        currentHour += Math.ceil(duration / 60);
        if (Math.random() > 0.7) currentHour += 0.5; // Random gaps
      }
    });
  }
  
  return appointments;
};

const generateMockStats = (appointments: Appointment[], selectedDate: Date): AgendaStats => {
  const todayAppointments = appointments.filter(
    a => a.scheduled_date === format(selectedDate, 'yyyy-MM-dd')
  );
  
  const absences = todayAppointments.filter(a => a.status === 'faltou').length;
  const fitIns = todayAppointments.filter(a => a.is_fit_in).length;
  const totalSlots = 24; // Assuming 8h-18h with 30min slots across 3 professionals
  const occupiedSlots = todayAppointments.filter(a => a.status !== 'cancelado').length;
  
  return {
    totalAppointments: todayAppointments.length,
    absences,
    fitIns,
    freeSlots: Math.max(0, totalSlots - occupiedSlots),
    occupancyRate: Math.round((occupiedSlots / totalSlots) * 100),
  };
};

const generateMockInsights = (appointments: Appointment[], professionals: Professional[]): AgendaInsight[] => {
  const insights: AgendaInsight[] = [];
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(a => a.scheduled_date === today);
  
  // Check for idle professionals
  professionals.forEach(prof => {
    const profAppointments = todayAppointments.filter(a => a.professional_id === prof.id);
    if (profAppointments.length < 3) {
      insights.push({
        id: `idle-${prof.id}`,
        type: 'warning',
        title: 'Agenda Ociosa',
        description: `${prof.full_name} tem poucos agendamentos para hoje.`,
        recommendation: 'Considere abrir horários de encaixe ou campanhas de marketing.',
        action: {
          label: 'Ver agenda',
          filters: { professionalId: prof.id },
        },
      });
    }
  });
  
  // Check for too many fit-ins
  const fitIns = todayAppointments.filter(a => a.is_fit_in).length;
  if (fitIns > 3) {
    insights.push({
      id: 'many-fitins',
      type: 'info',
      title: 'Muitos Encaixes',
      description: `${fitIns} encaixes foram realizados hoje.`,
      recommendation: 'Avalie se a quantidade de horários regulares está adequada.',
    });
  }
  
  // Placeholder insights
  insights.push({
    id: 'delay-placeholder',
    type: 'suggestion',
    title: 'Atrasos Acumulados',
    description: 'Análise de atrasos será disponibilizada em breve.',
    recommendation: 'Configure o tempo médio de consulta para melhorar a previsão.',
  });
  
  insights.push({
    id: 'absence-rate',
    type: 'info',
    title: 'Taxa de Faltas',
    description: 'Horários com maior taxa de falta: 8h e 14h.',
    recommendation: 'Considere lembretes automáticos para esses horários.',
    action: {
      label: 'Ver configurações',
    },
  });
  
  return insights;
};

export function useAgendaMockData(selectedDate: Date) {
  return useMemo(() => {
    const specialties = generateMockSpecialties();
    const rooms = generateMockRooms();
    const professionals = generateMockProfessionals(specialties);
    const patients = generateMockPatients();
    const insurances = generateMockInsurances();
    const appointments = generateMockAppointments(
      professionals, 
      patients, 
      rooms, 
      specialties, 
      insurances,
      selectedDate
    );
    const stats = generateMockStats(appointments, selectedDate);
    const insights = generateMockInsights(appointments, professionals);
    
    return {
      specialties,
      rooms,
      professionals,
      patients,
      insurances,
      appointments,
      stats,
      insights,
    };
  }, [selectedDate]);
}
