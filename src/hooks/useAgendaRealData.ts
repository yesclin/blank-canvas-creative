import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { 
  Appointment, 
  Professional, 
  Patient, 
  Room, 
  Specialty, 
  Insurance,
  AgendaStats,
  AgendaInsight,
  ScheduleBlock,
} from "@/types/agenda";
import { WeekSchedule, getDefaultWeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";

// ============= PROFESSIONALS =============
export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id,
          clinic_id,
          user_id,
          full_name,
          email,
          phone,
          specialty_id,
          specialties:specialty_id(id, name, color),
          registration_number,
          avatar_url,
          color,
          is_active
        `)
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        clinic_id: p.clinic_id,
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        specialty_id: p.specialty_id,
        specialty: p.specialties ? {
          id: p.specialties.id,
          clinic_id: p.clinic_id,
          name: p.specialties.name,
          color: p.specialties.color || "#6366f1",
          is_active: true,
        } : undefined,
        registration_number: p.registration_number,
        avatar_url: p.avatar_url,
        color: p.color || "#6366f1",
        is_active: p.is_active,
      })) as Professional[];
    },
  });
}

// ============= PATIENTS =============
export function usePatientsList() {
  return useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          id,
          clinic_id,
          full_name,
          email,
          phone,
          cpf,
          birth_date,
          gender,
          has_clinical_alert,
          clinical_alert_text,
          is_active
        `)
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return (data || []) as Patient[];
    },
  });
}

// ============= ROOMS =============
export function useRoomsList() {
  return useQuery({
    queryKey: ["rooms-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, clinic_id, name, description, is_active")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return (data || []) as Room[];
    },
  });
}

// ============= SPECIALTIES =============
export function useSpecialtiesList(clinicId?: string) {
  return useQuery({
    queryKey: ["specialties-list", clinicId],
    queryFn: async () => {
      // Only fetch specialties that belong to this clinic (not global ones)
      const { data, error } = await supabase
        .from("specialties")
        .select("id, clinic_id, name, description, color, is_active")
        .eq("is_active", true)
        .eq("clinic_id", clinicId!)
        .order("name");
      
      if (error) throw error;
      return (data || []) as Specialty[];
    },
    enabled: !!clinicId,
  });
}

// Helper hook to get clinic_id without useClinicData (avoids hook order issues)
function useClinicId() {
  return useQuery({
    queryKey: ["clinic-id-only"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .maybeSingle();
      return profile?.clinic_id || null;
    },
  });
}

// ============= INSURANCES =============
export function useInsurancesList() {
  return useQuery({
    queryKey: ["insurances-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurances")
        .select("id, clinic_id, name, ans_code, is_active")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return (data || []) as Insurance[];
    },
  });
}

// ============= APPOINTMENTS =============
export function useAppointmentsForPeriod(
  startDate: Date, 
  endDate: Date,
  viewMode: "daily" | "weekly" | "monthly" = "daily"
) {
  // Calculate date range based on view mode
  let rangeStart = startDate;
  let rangeEnd = endDate;
  
  if (viewMode === "weekly") {
    rangeStart = startOfWeek(startDate, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(startDate, { weekStartsOn: 1 });
  } else if (viewMode === "monthly") {
    rangeStart = startOfMonth(startDate);
    rangeEnd = endOfMonth(startDate);
  }
  
  const start = format(rangeStart, "yyyy-MM-dd");
  const end = format(rangeEnd, "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["appointments", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          clinic_id,
          patient_id,
          professional_id,
          room_id,
          specialty_id,
          insurance_id,
          procedure_id,
          scheduled_date,
          start_time,
          end_time,
          duration_minutes,
          appointment_type,
          status,
          is_first_visit,
          is_return,
          has_pending_payment,
          is_fit_in,
          payment_type,
          expected_value,
          procedure_cost,
          notes,
          cancellation_reason,
          arrived_at,
          started_at,
          finished_at,
          created_at,
          patients!inner(id, full_name, phone, email, cpf, birth_date, gender, has_clinical_alert, clinical_alert_text, is_active),
          professionals!inner(id, full_name, color, specialty_id),
          rooms(id, name),
          specialties(id, name, color),
          insurances(id, name, ans_code),
          procedures(id, name, duration_minutes, price)
        `)
        .gte("scheduled_date", start)
        .lte("scheduled_date", end)
        .order("scheduled_date")
        .order("start_time");
      
      if (error) throw error;
      
      // Transform to match the Appointment type
      return (data || []).map(apt => ({
        id: apt.id,
        clinic_id: apt.clinic_id,
        patient_id: apt.patient_id,
        patient: apt.patients ? {
          id: apt.patients.id,
          clinic_id: apt.clinic_id,
          full_name: apt.patients.full_name,
          email: apt.patients.email,
          phone: apt.patients.phone,
          cpf: apt.patients.cpf,
          birth_date: apt.patients.birth_date,
          gender: apt.patients.gender,
          has_clinical_alert: apt.patients.has_clinical_alert || false,
          clinical_alert_text: apt.patients.clinical_alert_text,
          is_active: apt.patients.is_active,
        } : undefined,
        professional_id: apt.professional_id,
        professional: apt.professionals ? {
          id: apt.professionals.id,
          clinic_id: apt.clinic_id,
          full_name: apt.professionals.full_name,
          color: apt.professionals.color || "#6366f1",
          specialty_id: apt.professionals.specialty_id,
          is_active: true,
        } : undefined,
        room_id: apt.room_id,
        room: apt.rooms ? {
          id: apt.rooms.id,
          clinic_id: apt.clinic_id,
          name: apt.rooms.name,
          is_active: true,
        } : undefined,
        specialty_id: apt.specialty_id,
        specialty: apt.specialties ? {
          id: apt.specialties.id,
          clinic_id: apt.clinic_id,
          name: apt.specialties.name,
          color: apt.specialties.color || "#6366f1",
          is_active: true,
        } : undefined,
        insurance_id: apt.insurance_id,
        insurance: apt.insurances ? {
          id: apt.insurances.id,
          clinic_id: apt.clinic_id,
          name: apt.insurances.name,
          ans_code: apt.insurances.ans_code,
          is_active: true,
        } : undefined,
        procedure_id: apt.procedure_id,
        procedure: apt.procedures ? {
          id: apt.procedures.id,
          name: apt.procedures.name,
          duration_minutes: apt.procedures.duration_minutes,
          price: apt.procedures.price,
        } : undefined,
        scheduled_date: apt.scheduled_date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        duration_minutes: apt.duration_minutes,
        appointment_type: apt.appointment_type,
        status: apt.status,
        is_first_visit: apt.is_first_visit,
        is_return: apt.is_return,
        has_pending_payment: apt.has_pending_payment,
        is_fit_in: apt.is_fit_in,
        payment_type: apt.payment_type || "particular",
        expected_value: apt.expected_value,
        procedure_cost: apt.procedure_cost,
        notes: apt.notes,
        cancellation_reason: apt.cancellation_reason,
        arrived_at: apt.arrived_at,
        started_at: apt.started_at,
        finished_at: apt.finished_at,
        created_at: apt.created_at,
      })) as Appointment[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

// ============= CLINIC SCHEDULE =============
export function useClinicSchedule() {
  return useQuery({
    queryKey: ["clinic-schedule"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) return null;

      const { data, error } = await supabase
        .from("clinics")
        .select("opening_hours")
        .eq("id", profile.clinic_id)
        .single();
      
      if (error || !data?.opening_hours) return getDefaultWeekSchedule();
      
      return data.opening_hours as unknown as WeekSchedule;
    },
  });
}

// ============= PROFESSIONAL SCHEDULES =============
export interface ProfessionalScheduleConfig {
  professional_id: string;
  use_clinic_default: boolean;
  working_days: WeekSchedule;
  default_duration_minutes: number;
}

export function useProfessionalSchedulesMap() {
  return useQuery({
    queryKey: ["professional-schedules-map"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map<string, ProfessionalScheduleConfig>();

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) return new Map<string, ProfessionalScheduleConfig>();

      const { data, error } = await supabase
        .from("professional_schedule_config")
        .select("*")
        .eq("clinic_id", profile.clinic_id);
      
      if (error) {
        console.error("Error fetching professional schedules:", error);
        return new Map<string, ProfessionalScheduleConfig>();
      }
      
      const scheduleMap = new Map<string, ProfessionalScheduleConfig>();
      (data || []).forEach(config => {
        const workingDays = config.working_days as unknown as WeekSchedule;
        scheduleMap.set(config.professional_id, {
          professional_id: config.professional_id,
          use_clinic_default: config.use_clinic_default,
          working_days: workingDays || getDefaultWeekSchedule(),
          default_duration_minutes: config.default_duration_minutes || 30,
        });
      });
      
      return scheduleMap;
    },
  });
}

// ============= HELPER: Get effective schedule for a professional =============
const dayKeyMap: Record<number, keyof WeekSchedule> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
};

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function getEffectiveSchedule(
  professionalId: string,
  scheduleMap: Map<string, ProfessionalScheduleConfig>,
  clinicSchedule: WeekSchedule | null
): { schedule: WeekSchedule; useClinicDefault: boolean } {
  const profConfig = scheduleMap.get(professionalId);
  
  if (!profConfig || profConfig.use_clinic_default) {
    return { 
      schedule: clinicSchedule || getDefaultWeekSchedule(), 
      useClinicDefault: true 
    };
  }
  
  return { 
    schedule: profConfig.working_days, 
    useClinicDefault: false 
  };
}

// ============= AGENDA STATS (with real schedules) =============
export function useAgendaStats(
  selectedDate: Date, 
  appointments: Appointment[], 
  professionals: Professional[],
  clinicSchedule: WeekSchedule | null,
  scheduleMap: Map<string, ProfessionalScheduleConfig>
) {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const todayAppointments = appointments.filter(a => a.scheduled_date === dateStr);
  const dayOfWeek = selectedDate.getDay();
  const dayKey = dayKeyMap[dayOfWeek];
  
  // Calculate total available minutes based on each professional's actual schedule
  let totalAvailableMinutes = 0;
  const defaultDuration = 30;
  
  professionals.forEach(prof => {
    const { schedule } = getEffectiveSchedule(prof.id, scheduleMap, clinicSchedule);
    const daySchedule = schedule[dayKey];
    
    if (daySchedule?.enabled) {
      let availableMinutes = timeToMinutes(daySchedule.close) - timeToMinutes(daySchedule.open);
      
      // Subtract lunch break if enabled
      if (daySchedule.hasLunch && daySchedule.lunchStart && daySchedule.lunchEnd) {
        const lunchDuration = timeToMinutes(daySchedule.lunchEnd) - timeToMinutes(daySchedule.lunchStart);
        availableMinutes -= lunchDuration;
      }
      
      totalAvailableMinutes += Math.max(0, availableMinutes);
    }
  });
  
  // If no schedules configured, use a reasonable default
  if (totalAvailableMinutes === 0 && professionals.length > 0) {
    totalAvailableMinutes = professionals.length * 8 * 60; // 8 hours per professional
  }
  
  const totalSlots = Math.floor(totalAvailableMinutes / defaultDuration);
  
  const total = todayAppointments.length;
  const absences = todayAppointments.filter(a => a.status === "faltou").length;
  const fitIns = todayAppointments.filter(a => a.is_fit_in).length;
  const canceled = todayAppointments.filter(a => a.status === "cancelado").length;
  
  // Calculate occupied time based on actual appointment durations
  const occupiedMinutes = todayAppointments
    .filter(a => a.status !== "cancelado")
    .reduce((sum, a) => sum + (a.duration_minutes || defaultDuration), 0);
  
  const occupiedSlots = Math.ceil(occupiedMinutes / defaultDuration);
  
  return {
    totalAppointments: total,
    absences,
    fitIns,
    freeSlots: Math.max(0, totalSlots - occupiedSlots),
    occupancyRate: totalAvailableMinutes > 0 
      ? Math.round((occupiedMinutes / totalAvailableMinutes) * 100) 
      : 0,
  } as AgendaStats;
}

// ============= AGENDA INSIGHTS =============
export function useAgendaInsights(
  appointments: Appointment[], 
  professionals: Professional[],
  selectedDate: Date
): AgendaInsight[] {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const todayAppointments = appointments.filter(a => a.scheduled_date === dateStr);
  const insights: AgendaInsight[] = [];
  
  // Check for idle professionals (less than 3 appointments)
  professionals.forEach(prof => {
    const profAppointments = todayAppointments.filter(a => a.professional_id === prof.id);
    if (profAppointments.length === 0) {
      insights.push({
        id: `idle-${prof.id}`,
        type: "warning",
        title: "Agenda Vazia",
        description: `${prof.full_name} não tem agendamentos para hoje.`,
        recommendation: "Considere abrir horários de encaixe ou oferecer horários disponíveis.",
        action: {
          label: "Ver agenda",
          filters: { professionalId: prof.id },
        },
      });
    } else if (profAppointments.length < 3) {
      insights.push({
        id: `low-${prof.id}`,
        type: "info",
        title: "Baixa Ocupação",
        description: `${prof.full_name} tem apenas ${profAppointments.length} agendamento(s) hoje.`,
        recommendation: "Considere estratégias de captação ou horários de encaixe.",
        action: {
          label: "Ver agenda",
          filters: { professionalId: prof.id },
        },
      });
    }
  });
  
  // Check for high number of absences
  const absenceCount = todayAppointments.filter(a => a.status === "faltou").length;
  if (absenceCount >= 2) {
    insights.push({
      id: "high-absences",
      type: "warning",
      title: "Alto Índice de Faltas",
      description: `${absenceCount} paciente(s) faltaram hoje.`,
      recommendation: "Considere implementar confirmação por WhatsApp e política de remarcação.",
    });
  }
  
  // Check for many fit-ins
  const fitInsCount = todayAppointments.filter(a => a.is_fit_in).length;
  if (fitInsCount > 3) {
    insights.push({
      id: "many-fitins",
      type: "info",
      title: "Muitos Encaixes",
      description: `${fitInsCount} encaixes foram realizados hoje.`,
      recommendation: "Avalie se a quantidade de horários regulares está adequada.",
    });
  }
  
  // Pending appointments (not confirmed)
  const pending = todayAppointments.filter(a => a.status === "nao_confirmado").length;
  if (pending > 0) {
    insights.push({
      id: "pending-confirmation",
      type: "suggestion",
      title: "Aguardando Confirmação",
      description: `${pending} agendamento(s) ainda não foram confirmados.`,
      recommendation: "Envie lembretes de confirmação para reduzir faltas.",
      action: {
        label: "Ver pendentes",
        filters: { status: "nao_confirmado" },
      },
    });
  }
  
  // If no insights, show positive message
  if (insights.length === 0 && todayAppointments.length > 0) {
    insights.push({
      id: "all-good",
      type: "info",
      title: "Agenda Saudável",
      description: "Todos os indicadores estão normais para hoje.",
      recommendation: "Continue monitorando a taxa de ocupação e confirmações.",
    });
  }
  
  return insights;
}

// ============= SCHEDULE BLOCKS =============
function useScheduleBlocksForPeriod(rangeStart: Date, rangeEnd: Date) {
  const startStr = format(rangeStart, "yyyy-MM-dd");
  const endStr = format(rangeEnd, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["schedule-blocks", startStr, endStr],
    queryFn: async (): Promise<ScheduleBlock[]> => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("id, clinic_id, professional_id, title, reason, start_date, end_date, start_time, end_time, all_day")
        .lte("start_date", endStr)
        .gte("end_date", startStr);

      if (error) throw error;
      return (data || []) as ScheduleBlock[];
    },
  });
}

// ============= COMBINED HOOK FOR AGENDA PAGE =============
export function useAgendaRealData(selectedDate: Date, viewMode: "daily" | "weekly" | "monthly" = "daily") {
  // Get clinic ID using react-query (stable hook order)
  const { data: clinicId } = useClinicId();
  
  // Fetch all base data
  const { data: professionals = [], isLoading: profLoading } = useProfessionals();
  const { data: patients = [], isLoading: patientsLoading } = usePatientsList();
  const { data: rooms = [], isLoading: roomsLoading } = useRoomsList();
  const { data: specialties = [], isLoading: specialtiesLoading } = useSpecialtiesList(clinicId || undefined);
  const { data: insurances = [], isLoading: insurancesLoading } = useInsurancesList();
  
  // Fetch schedules
  const { data: clinicSchedule = null, isLoading: clinicScheduleLoading } = useClinicSchedule();
  const { data: professionalSchedulesMap = new Map(), isLoading: profSchedulesLoading } = useProfessionalSchedulesMap();
  
  // Calculate date range
  let rangeStart = selectedDate;
  let rangeEnd = selectedDate;
  
  if (viewMode === "weekly") {
    rangeStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  } else if (viewMode === "monthly") {
    rangeStart = startOfMonth(selectedDate);
    rangeEnd = endOfMonth(selectedDate);
  }
  
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = 
    useAppointmentsForPeriod(rangeStart, rangeEnd, viewMode);
  
  const { data: scheduleBlocks = [], isLoading: blocksLoading } = 
    useScheduleBlocksForPeriod(rangeStart, rangeEnd);
  
  // Calculate stats and insights from real data (now with schedules)
  const stats = useAgendaStats(selectedDate, appointments, professionals, clinicSchedule, professionalSchedulesMap);
  const insights = useAgendaInsights(appointments, professionals, selectedDate);
  
  const isLoading = profLoading || patientsLoading || roomsLoading || 
                    specialtiesLoading || insurancesLoading || appointmentsLoading ||
                    clinicScheduleLoading || profSchedulesLoading || blocksLoading;
  
  // Build professional schedules map for AppointmentDialog
  const professionalSchedules = new Map<string, { useClinicDefault: boolean; workingDays: WeekSchedule }>();
  professionals.forEach(prof => {
    const config = professionalSchedulesMap.get(prof.id);
    if (config) {
      professionalSchedules.set(prof.id, {
        useClinicDefault: config.use_clinic_default,
        workingDays: config.working_days,
      });
    } else {
      professionalSchedules.set(prof.id, {
        useClinicDefault: true,
        workingDays: clinicSchedule || getDefaultWeekSchedule(),
      });
    }
  });
  
  return {
    professionals,
    patients,
    rooms,
    specialties,
    insurances,
    appointments,
    scheduleBlocks,
    stats,
    insights,
    isLoading,
    refetchAppointments,
    // New: schedule data for conflict detection
    clinicSchedule,
    professionalSchedules,
  };
}
