import { useMemo } from "react";
import { format, addMinutes, parse, isToday, isBefore, addDays } from "date-fns";
import { WeekSchedule, DaySchedule, getDefaultWeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";
import type { Appointment } from "@/types/agenda";

export interface SlotSuggestion {
  time: string; // HH:mm format
  date: Date;
  label: string; // "Hoje 15:30" or "Amanhã 09:00"
}

interface ScheduleBlock {
  id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  professional_id: string | null;
}

interface UseSlotSuggestionsProps {
  professionalId: string | undefined;
  selectedDate: Date;
  durationMinutes: number;
  existingAppointments: Appointment[];
  clinicSchedule: WeekSchedule | null;
  professionalSchedule: WeekSchedule | null;
  useClinicDefault: boolean;
  scheduleBlocks?: ScheduleBlock[];
  maxSuggestions?: number;
}

// Map day index (0=Sunday) to WeekSchedule keys
const dayIndexToKey: Record<number, keyof WeekSchedule> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sab",
};

/**
 * Parse a time string "HH:mm" to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight back to "HH:mm" format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Get the effective schedule for a specific day
 */
function getDaySchedule(
  date: Date,
  clinicSchedule: WeekSchedule | null,
  professionalSchedule: WeekSchedule | null,
  useClinicDefault: boolean
): DaySchedule | null {
  const dayKey = dayIndexToKey[date.getDay()];
  const defaultSchedule = getDefaultWeekSchedule();
  
  // Determine which schedule to use
  let schedule: WeekSchedule;
  if (!useClinicDefault && professionalSchedule) {
    schedule = professionalSchedule;
  } else if (clinicSchedule) {
    schedule = clinicSchedule;
  } else {
    schedule = defaultSchedule;
  }

  const daySchedule = schedule[dayKey];
  
  // If the day is not enabled, return null
  if (!daySchedule?.enabled) {
    return null;
  }

  return daySchedule;
}

/**
 * Check if a time slot overlaps with any existing appointment
 */
function hasOverlap(
  slotStart: number,
  slotEnd: number,
  appointments: Appointment[]
): boolean {
  return appointments.some((apt) => {
    const aptStart = timeToMinutes(apt.start_time.slice(0, 5));
    const aptEnd = timeToMinutes(apt.end_time.slice(0, 5));
    // Overlap if slot starts before apt ends AND slot ends after apt starts
    return slotStart < aptEnd && slotEnd > aptStart;
  });
}

/**
 * Check if a time slot falls within a block
 */
function isBlocked(
  date: Date,
  slotStart: number,
  slotEnd: number,
  blocks: ScheduleBlock[],
  professionalId: string | undefined
): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  
  return blocks.some((block) => {
    // Check if block applies to this professional (null = all professionals)
    if (block.professional_id && block.professional_id !== professionalId) {
      return false;
    }

    // Check if date is within block range
    if (dateStr < block.start_date || dateStr > block.end_date) {
      return false;
    }

    // All-day block
    if (block.all_day) {
      return true;
    }

    // Time-specific block
    if (block.start_time && block.end_time) {
      const blockStart = timeToMinutes(block.start_time.slice(0, 5));
      const blockEnd = timeToMinutes(block.end_time.slice(0, 5));
      return slotStart < blockEnd && slotEnd > blockStart;
    }

    return false;
  });
}

/**
 * Check if slot is during lunch break
 */
function isDuringBreak(
  slotStart: number,
  slotEnd: number,
  daySchedule: DaySchedule
): boolean {
  if (!daySchedule.hasLunch || !daySchedule.lunchStart || !daySchedule.lunchEnd) {
    return false;
  }

  const lunchStart = timeToMinutes(daySchedule.lunchStart);
  const lunchEnd = timeToMinutes(daySchedule.lunchEnd);

  return slotStart < lunchEnd && slotEnd > lunchStart;
}

/**
 * Generate available time slots for a specific date
 */
function generateSlotsForDay(
  date: Date,
  durationMinutes: number,
  daySchedule: DaySchedule,
  appointmentsForDay: Appointment[],
  blocks: ScheduleBlock[],
  professionalId: string | undefined
): string[] {
  const slots: string[] = [];
  
  if (!daySchedule.open || !daySchedule.close) {
    return slots;
  }

  const openMinutes = timeToMinutes(daySchedule.open);
  const closeMinutes = timeToMinutes(daySchedule.close);
  
  // Slot interval (usually 15 or 30 minutes)
  const slotInterval = 30;

  // If it's today, start from now (rounded up to next slot)
  const now = new Date();
  let startMinutes = openMinutes;
  
  if (isToday(date)) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Round up to next slot interval
    const nextSlot = Math.ceil(currentMinutes / slotInterval) * slotInterval;
    startMinutes = Math.max(openMinutes, nextSlot);
  }

  // Generate slots
  for (let slotStart = startMinutes; slotStart + durationMinutes <= closeMinutes; slotStart += slotInterval) {
    const slotEnd = slotStart + durationMinutes;

    // Check if slot is during break
    if (isDuringBreak(slotStart, slotEnd, daySchedule)) {
      continue;
    }

    // Check if slot overlaps with existing appointments
    if (hasOverlap(slotStart, slotEnd, appointmentsForDay)) {
      continue;
    }

    // Check if slot is blocked
    if (isBlocked(date, slotStart, slotEnd, blocks, professionalId)) {
      continue;
    }

    slots.push(minutesToTime(slotStart));
  }

  return slots;
}

/**
 * Hook to calculate available slot suggestions for appointment scheduling
 */
export function useSlotSuggestions({
  professionalId,
  selectedDate,
  durationMinutes,
  existingAppointments,
  clinicSchedule,
  professionalSchedule,
  useClinicDefault,
  scheduleBlocks = [],
  maxSuggestions = 6,
}: UseSlotSuggestionsProps): {
  suggestions: SlotSuggestion[];
  isLoading: boolean;
  noSlotsAvailable: boolean;
} {
  const suggestions = useMemo(() => {
    if (!professionalId || durationMinutes <= 0) {
      return [];
    }

    const allSuggestions: SlotSuggestion[] = [];
    const daysToCheck = 7; // Check up to 7 days ahead

    for (let dayOffset = 0; dayOffset < daysToCheck && allSuggestions.length < maxSuggestions; dayOffset++) {
      const checkDate = addDays(selectedDate, dayOffset);
      
      // Skip past dates
      if (isBefore(checkDate, new Date()) && !isToday(checkDate)) {
        continue;
      }

      // Get schedule for this day
      const daySchedule = getDaySchedule(
        checkDate,
        clinicSchedule,
        professionalSchedule,
        useClinicDefault
      );

      if (!daySchedule) {
        continue;
      }

      // Filter appointments for this professional and day
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const appointmentsForDay = existingAppointments.filter(
        (apt) =>
          apt.professional_id === professionalId &&
          apt.scheduled_date === dateStr &&
          apt.status !== "cancelado" &&
          apt.status !== "faltou"
      );

      // Generate available slots
      const slots = generateSlotsForDay(
        checkDate,
        durationMinutes,
        daySchedule,
        appointmentsForDay,
        scheduleBlocks,
        professionalId
      );

      // Add slots to suggestions
      for (const time of slots) {
        if (allSuggestions.length >= maxSuggestions) {
          break;
        }

        let label: string;
        if (dayOffset === 0) {
          label = `Hoje ${time}`;
        } else if (dayOffset === 1) {
          label = `Amanhã ${time}`;
        } else {
          label = `${format(checkDate, "dd/MM")} ${time}`;
        }

        allSuggestions.push({
          time,
          date: checkDate,
          label,
        });
      }
    }

    return allSuggestions;
  }, [
    professionalId,
    selectedDate,
    durationMinutes,
    existingAppointments,
    clinicSchedule,
    professionalSchedule,
    useClinicDefault,
    scheduleBlocks,
    maxSuggestions,
  ]);

  return {
    suggestions,
    isLoading: false,
    noSlotsAvailable: professionalId !== undefined && durationMinutes > 0 && suggestions.length === 0,
  };
}
