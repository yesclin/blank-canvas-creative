import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Appointment, Professional } from '@/types/agenda';
import { WeekSchedule } from '@/components/config/EnhancedWorkingHoursCard';

// =============================================
// TYPES
// =============================================

export type ConflictSeverity = 'critical' | 'warning';

export interface ScheduleConflict {
  id: string;
  type: 'overlap' | 'outside_hours' | 'during_block' | 'during_break' | 'fit_in_overlap' | 'past_date' | 'inactive_specialty';
  severity: ConflictSeverity;
  message: string;
  details?: string;
  conflictingAppointment?: Appointment;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  hasCriticalConflict: boolean;
  hasWarningConflict: boolean;
  conflicts: ScheduleConflict[];
  canSaveWithConfirmation: boolean;
  canSave: boolean;
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

function formatTimeForDisplay(time: string): string {
  return time.slice(0, 5);
}

// =============================================
// MAIN HOOK
// =============================================

export interface UseConflictDetectionParams {
  professionalId: string;
  scheduledDate: Date;
  startTime: string;
  durationMinutes: number;
  existingAppointments: Appointment[];
  clinicSchedule: WeekSchedule | null;
  professionalSchedule: WeekSchedule | null;
  useClinicDefault: boolean;
  editingAppointmentId?: string; // Exclude this appointment when checking for overlaps
  isFitIn?: boolean;
  selectedSpecialtyId?: string;
  activeSpecialtyIds?: string[];
}

export function useConflictDetection({
  professionalId,
  scheduledDate,
  startTime,
  durationMinutes,
  existingAppointments,
  clinicSchedule,
  professionalSchedule,
  useClinicDefault,
  editingAppointmentId,
  isFitIn = false,
  selectedSpecialtyId,
  activeSpecialtyIds,
}: UseConflictDetectionParams): ConflictCheckResult {
  return useMemo(() => {
    const conflicts: ScheduleConflict[] = [];
    
    if (!professionalId || !scheduledDate || !startTime || !durationMinutes) {
      return {
        hasConflict: false,
        hasCriticalConflict: false,
        hasWarningConflict: false,
        conflicts: [],
        canSaveWithConfirmation: true,
        canSave: true,
      };
    }

    // 0. Check past date/time (CRITICAL)
    // Normalize both dates to YYYY-MM-DD integers to avoid timezone pitfalls
    const now = new Date();
    const todayInt = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const schedInt = scheduledDate.getFullYear() * 10000 + (scheduledDate.getMonth() + 1) * 100 + scheduledDate.getDate();

    console.debug('[ConflictDetection] date check', { todayInt, schedInt, startTime });
    
    if (schedInt < todayInt) {
      conflicts.push({
        id: 'past_date',
        type: 'past_date',
        severity: 'critical',
        message: 'Data no passado',
        details: 'Não é possível agendar em uma data que já passou. Selecione uma data futura.',
      });
    } else if (schedInt === todayInt) {
      const [h, m] = startTime.split(':').map(Number);
      const slotMinutes = h * 60 + (m || 0);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes < nowMinutes) {
        conflicts.push({
          id: 'past_time',
          type: 'past_date',
          severity: 'critical',
          message: 'Horário já passou',
          details: 'Não é possível agendar em um horário que já passou hoje. Selecione um horário futuro.',
        });
      }
    }

    // 0b. Check inactive specialty (CRITICAL)
    if (selectedSpecialtyId && activeSpecialtyIds && activeSpecialtyIds.length > 0) {
      if (!activeSpecialtyIds.includes(selectedSpecialtyId)) {
        conflicts.push({
          id: 'inactive_specialty',
          type: 'inactive_specialty',
          severity: 'critical',
          message: 'Especialidade inativa',
          details: 'A especialidade selecionada não está ativa. Selecione outra especialidade.',
        });
      }
    }
    
    const dateStr = format(scheduledDate, 'yyyy-MM-dd');
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    
    // 1. Check working hours
    const schedule = useClinicDefault || !professionalSchedule 
      ? clinicSchedule 
      : professionalSchedule;
    
    if (schedule) {
      const dayOfWeek = scheduledDate.getDay();
      const dayKey = dayKeyMap[dayOfWeek];
      const daySchedule = schedule[dayKey];

      console.debug('[ConflictDetection] schedule check', {
        dayOfWeek, dayKey,
        daySchedule,
        scheduleSource: useClinicDefault ? 'clinic' : 'professional',
      });
      
      // Only flag as day off if `enabled` is explicitly false (not undefined/missing)
      if (daySchedule && daySchedule.enabled === false) {
        conflicts.push({
          id: 'day_off',
          type: 'outside_hours',
          severity: 'critical',
          message: 'Profissional não atende neste dia',
          details: 'Este dia está configurado como folga para o profissional.',
        });
      } else if (daySchedule?.enabled) {
        const workStart = timeToMinutes(daySchedule.open);
        const workEnd = timeToMinutes(daySchedule.close);
        
        // Check if appointment is outside working hours
        if (startMinutes < workStart || endMinutes > workEnd) {
          const isCompletelyOutside = endMinutes <= workStart || startMinutes >= workEnd;
          conflicts.push({
            id: 'outside_hours',
            type: 'outside_hours',
            severity: isCompletelyOutside ? 'critical' : 'warning',
            message: isCompletelyOutside 
              ? 'Horário fora do expediente' 
              : 'Horário ultrapassa o expediente',
            details: `O horário de atendimento é das ${formatTimeForDisplay(daySchedule.open)} às ${formatTimeForDisplay(daySchedule.close)}.`,
          });
        }
        
        // Check lunch break
        if (daySchedule.hasLunch && daySchedule.lunchStart && daySchedule.lunchEnd) {
          const breakStart = timeToMinutes(daySchedule.lunchStart);
          const breakEnd = timeToMinutes(daySchedule.lunchEnd);
          
          // Check if appointment overlaps with break
          if (startMinutes < breakEnd && endMinutes > breakStart) {
            conflicts.push({
              id: 'during_break',
              type: 'during_break',
              severity: 'warning',
              message: 'Horário durante intervalo',
              details: `O intervalo é das ${formatTimeForDisplay(daySchedule.lunchStart)} às ${formatTimeForDisplay(daySchedule.lunchEnd)}.`,
            });
          }
        }
      }
    }
    
    // 2. Check for overlapping appointments
    const dateAppointments = existingAppointments.filter(apt =>
      apt.professional_id === professionalId &&
      apt.scheduled_date === dateStr &&
      apt.id !== editingAppointmentId &&
      !['cancelado', 'faltou'].includes(apt.status)
    );
    
    for (const apt of dateAppointments) {
      const aptStart = timeToMinutes(apt.start_time);
      const aptEnd = timeToMinutes(apt.end_time);
      
      // Check overlap
      if (startMinutes < aptEnd && endMinutes > aptStart) {
        const patientName = apt.patient?.full_name || 'outro paciente';
        const aptStartFormatted = formatTimeForDisplay(apt.start_time);
        const aptEndFormatted = formatTimeForDisplay(apt.end_time);
        
        // Fit-in overlaps are warnings for admin, otherwise critical
        const isFitInConflict = isFitIn || apt.is_fit_in;
        
        conflicts.push({
          id: `overlap_${apt.id}`,
          type: isFitInConflict ? 'fit_in_overlap' : 'overlap',
          severity: isFitInConflict ? 'warning' : 'critical',
          message: `Conflito com ${patientName}`,
          details: `Horário das ${aptStartFormatted} às ${aptEndFormatted}`,
          conflictingAppointment: apt,
        });
      }
    }
    
    // Analyze results
    const hasCriticalConflict = conflicts.some(c => c.severity === 'critical');
    const hasWarningConflict = conflicts.some(c => c.severity === 'warning');
    
    return {
      hasConflict: conflicts.length > 0,
      hasCriticalConflict,
      hasWarningConflict,
      conflicts,
      canSaveWithConfirmation: !hasCriticalConflict && hasWarningConflict,
      canSave: !hasCriticalConflict && !hasWarningConflict,
    };
  }, [
    professionalId,
    scheduledDate,
    startTime,
    durationMinutes,
    existingAppointments,
    clinicSchedule,
    professionalSchedule,
    useClinicDefault,
    editingAppointmentId,
    isFitIn,
    selectedSpecialtyId,
    activeSpecialtyIds,
  ]);
}
