import { useMemo } from 'react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Appointment, Professional } from '@/types/agenda';
import { WeekSchedule, DaySchedule, getDefaultWeekSchedule } from '@/components/config/EnhancedWorkingHoursCard';

// =============================================
// TYPES
// =============================================

export interface IdleAlertConfig {
  enabled: boolean;
  minIdleHours: number; // Minimum hours free to trigger alert
  minContinuousMinutes: number; // Minimum continuous minutes free
  minOccupancyPercent: number; // Below this, trigger alert
}

export const DEFAULT_IDLE_ALERT_CONFIG: IdleAlertConfig = {
  enabled: true,
  minIdleHours: 2, // 2 hours
  minContinuousMinutes: 60, // 60 minutes
  minOccupancyPercent: 60, // 60%
};

export interface IdlePeriod {
  start: string; // HH:mm
  end: string; // HH:mm
  durationMinutes: number;
}

export interface ProfessionalIdleAlert {
  professional: Professional;
  date: Date;
  dateLabel: string;
  totalIdleMinutes: number;
  totalWorkingMinutes: number;
  occupancyPercent: number;
  idlePeriods: IdlePeriod[];
  alertType: 'low_occupancy' | 'long_idle_period' | 'many_free_hours';
  message: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

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

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getWorkingHoursForDay(
  date: Date,
  clinicSchedule: WeekSchedule | null,
  professionalSchedule: WeekSchedule | null,
  useClinicDefault: boolean
): { start: number; end: number; breakStart?: number; breakEnd?: number } | null {
  const dayOfWeek = date.getDay();
  const dayKey = dayKeyMap[dayOfWeek];
  
  const schedule = useClinicDefault || !professionalSchedule 
    ? clinicSchedule 
    : professionalSchedule;
    
  if (!schedule) return null;
  
  const daySchedule = schedule[dayKey];
  if (!daySchedule?.enabled || !daySchedule.open || !daySchedule.close) return null;
  
  return {
    start: timeToMinutes(daySchedule.open),
    end: timeToMinutes(daySchedule.close),
    breakStart: daySchedule.hasLunch && daySchedule.lunchStart ? timeToMinutes(daySchedule.lunchStart) : undefined,
    breakEnd: daySchedule.hasLunch && daySchedule.lunchEnd ? timeToMinutes(daySchedule.lunchEnd) : undefined,
  };
}

function calculateIdlePeriods(
  workingHours: { start: number; end: number; breakStart?: number; breakEnd?: number },
  appointments: Appointment[]
): IdlePeriod[] {
  const idlePeriods: IdlePeriod[] = [];
  
  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort((a, b) => 
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
  
  // Build busy periods from appointments
  const busyPeriods = sortedAppointments
    .filter(apt => !['cancelado', 'faltou'].includes(apt.status))
    .map(apt => ({
      start: timeToMinutes(apt.start_time),
      end: timeToMinutes(apt.end_time),
    }));
  
  // Add lunch break as busy period if exists
  if (workingHours.breakStart !== undefined && workingHours.breakEnd !== undefined) {
    busyPeriods.push({
      start: workingHours.breakStart,
      end: workingHours.breakEnd,
    });
  }
  
  // Sort busy periods
  busyPeriods.sort((a, b) => a.start - b.start);
  
  // Find gaps
  let currentTime = workingHours.start;
  
  for (const busy of busyPeriods) {
    if (busy.start > currentTime) {
      const gap = busy.start - currentTime;
      if (gap >= 15) { // Only count gaps of 15+ minutes
        idlePeriods.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(busy.start),
          durationMinutes: gap,
        });
      }
    }
    currentTime = Math.max(currentTime, busy.end);
  }
  
  // Check gap after last appointment
  if (currentTime < workingHours.end) {
    const gap = workingHours.end - currentTime;
    if (gap >= 15) {
      idlePeriods.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(workingHours.end),
        durationMinutes: gap,
      });
    }
  }
  
  return idlePeriods;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'hoje';
  if (isTomorrow(date)) return 'amanhã';
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

// =============================================
// MAIN HOOK
// =============================================

export interface UseIdleAgendaAlertsParams {
  professionals: Professional[];
  appointments: Appointment[];
  clinicSchedule: WeekSchedule | null;
  professionalSchedules?: Map<string, { useClinicDefault: boolean; workingDays: WeekSchedule }>;
  config?: Partial<IdleAlertConfig>;
  date?: Date;
  daysToCheck?: number; // How many days to check (default 1 = today only)
}

export function useIdleAgendaAlerts({
  professionals,
  appointments,
  clinicSchedule,
  professionalSchedules = new Map(),
  config = {},
  date = new Date(),
  daysToCheck = 1,
}: UseIdleAgendaAlertsParams) {
  const effectiveConfig: IdleAlertConfig = {
    ...DEFAULT_IDLE_ALERT_CONFIG,
    ...config,
  };

  const alerts = useMemo((): ProfessionalIdleAlert[] => {
    if (!effectiveConfig.enabled || !clinicSchedule) return [];
    
    const result: ProfessionalIdleAlert[] = [];
    
    // Check each day in range
    for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
      const checkDate = addDays(date, dayOffset);
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');
      
      // Check each professional
      for (const professional of professionals) {
        if (!professional.is_active) continue;
        
        // Get schedule config
        const scheduleConfig = professionalSchedules.get(professional.id);
        const useClinicDefault = scheduleConfig?.useClinicDefault ?? true;
        const professionalSchedule = scheduleConfig?.workingDays ?? null;
        
        // Get working hours for this day
        const workingHours = getWorkingHoursForDay(
          checkDate,
          clinicSchedule,
          professionalSchedule,
          useClinicDefault
        );
        
        if (!workingHours) continue; // Professional doesn't work this day
        
        // Get appointments for this professional on this day
        const profAppointments = appointments.filter(apt =>
          apt.professional_id === professional.id &&
          apt.scheduled_date === checkDateStr
        );
        
        // Calculate idle periods
        const idlePeriods = calculateIdlePeriods(workingHours, profAppointments);
        
        // Calculate totals
        const totalWorkingMinutes = workingHours.end - workingHours.start;
        const lunchMinutes = (workingHours.breakEnd || 0) - (workingHours.breakStart || 0);
        const effectiveWorkingMinutes = totalWorkingMinutes - lunchMinutes;
        const totalIdleMinutes = idlePeriods.reduce((sum, p) => sum + p.durationMinutes, 0);
        const occupiedMinutes = effectiveWorkingMinutes - totalIdleMinutes;
        const occupancyPercent = effectiveWorkingMinutes > 0 
          ? Math.round((occupiedMinutes / effectiveWorkingMinutes) * 100) 
          : 0;
        
        // Check if alert should be triggered
        const longestIdlePeriod = Math.max(...idlePeriods.map(p => p.durationMinutes), 0);
        const totalIdleHours = totalIdleMinutes / 60;
        
        let alertType: ProfessionalIdleAlert['alertType'] | null = null;
        let message = '';
        
        // Priority: low occupancy > many free hours > long idle period
        if (occupancyPercent < effectiveConfig.minOccupancyPercent) {
          alertType = 'low_occupancy';
          message = `Ocupação de apenas ${occupancyPercent}% ${getDateLabel(checkDate)}.`;
        } else if (totalIdleHours >= effectiveConfig.minIdleHours) {
          alertType = 'many_free_hours';
          const hours = Math.floor(totalIdleHours);
          const mins = Math.round((totalIdleHours - hours) * 60);
          message = `Possui ${hours}h${mins > 0 ? mins + 'min' : ''} livre ${getDateLabel(checkDate)}.`;
        } else if (longestIdlePeriod >= effectiveConfig.minContinuousMinutes) {
          alertType = 'long_idle_period';
          const longestPeriod = idlePeriods.find(p => p.durationMinutes === longestIdlePeriod);
          message = longestPeriod 
            ? `Período livre das ${longestPeriod.start} às ${longestPeriod.end} ${getDateLabel(checkDate)}.`
            : `Período contínuo de ${longestIdlePeriod}min livre ${getDateLabel(checkDate)}.`;
        }
        
        if (alertType) {
          result.push({
            professional,
            date: checkDate,
            dateLabel: getDateLabel(checkDate),
            totalIdleMinutes,
            totalWorkingMinutes: effectiveWorkingMinutes,
            occupancyPercent,
            idlePeriods,
            alertType,
            message,
          });
        }
      }
    }
    
    // Sort by severity (low occupancy first, then by idle minutes descending)
    return result.sort((a, b) => {
      const typePriority = { low_occupancy: 0, many_free_hours: 1, long_idle_period: 2 };
      const priorityDiff = typePriority[a.alertType] - typePriority[b.alertType];
      if (priorityDiff !== 0) return priorityDiff;
      return b.totalIdleMinutes - a.totalIdleMinutes;
    });
  }, [
    professionals,
    appointments,
    clinicSchedule,
    professionalSchedules,
    effectiveConfig,
    date,
    daysToCheck,
  ]);

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    config: effectiveConfig,
  };
}
