import { supabase } from "@/integrations/supabase/client";
import { addDays, format, parse, isBefore, isAfter, addMinutes, startOfDay, isToday } from "date-fns";

export interface PublicSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface PublicAvailabilityParams {
  clinicId: string;
  professionalId: string;
  dateStart: Date;
  dateEnd: Date;
  durationMinutes?: number;
  minAdvanceHours?: number;
}

interface ProfessionalSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface ScheduleBlock {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  professional_id: string | null;
}

interface BookedSlot {
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

interface ClinicScheduleConfig {
  start_time: string;
  end_time: string;
  working_days: number[] | any;
  default_duration_minutes: number;
}

/**
 * Calculate available public slots for a professional in a date range.
 * This never exposes patient data or reasons for unavailability.
 */
export async function getPublicProfessionalAvailability(
  params: PublicAvailabilityParams
): Promise<PublicSlot[]> {
  const { clinicId, professionalId, dateStart, dateEnd, durationMinutes, minAdvanceHours = 2 } = params;

  // 1. Fetch professional schedules
  const { data: schedules, error: schedErr } = await supabase
    .from("professional_schedules")
    .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active")
    .eq("clinic_id", clinicId)
    .eq("professional_id", professionalId)
    .eq("is_active", true);

  if (schedErr || !schedules?.length) return [];

  // 2. Fetch clinic schedule config as fallback
  const { data: clinicConfig } = await supabase
    .from("clinic_schedule_config")
    .select("start_time, end_time, working_days, default_duration_minutes")
    .eq("clinic_id", clinicId)
    .single();

  // 3. Fetch schedule blocks
  const startStr = format(dateStart, "yyyy-MM-dd");
  const endStr = format(dateEnd, "yyyy-MM-dd");

  const { data: blocks } = await supabase
    .from("schedule_blocks")
    .select("start_date, end_date, start_time, end_time, all_day, professional_id")
    .eq("clinic_id", clinicId)
    .or(`professional_id.eq.${professionalId},professional_id.is.null`)
    .lte("start_date", endStr)
    .gte("end_date", startStr);

  // 4. Fetch booked slots via security definer function
  const { data: bookedSlots } = await supabase
    .rpc("get_booked_slots", {
      _clinic_id: clinicId,
      _professional_id: professionalId,
      _date_start: startStr,
      _date_end: endStr,
    });

  // Build lookup maps
  const scheduleByDay = new Map<number, ProfessionalSchedule[]>();
  for (const s of (schedules as ProfessionalSchedule[])) {
    const existing = scheduleByDay.get(s.day_of_week) || [];
    existing.push(s);
    scheduleByDay.set(s.day_of_week, existing);
  }

  const bookedByDate = new Map<string, BookedSlot[]>();
  for (const b of (bookedSlots as BookedSlot[] || [])) {
    const dateKey = b.scheduled_date;
    const existing = bookedByDate.get(dateKey) || [];
    existing.push(b);
    bookedByDate.set(dateKey, existing);
  }

  const now = new Date();
  const minTime = addMinutes(now, (minAdvanceHours || 0) * 60);

  const slots: PublicSlot[] = [];
  let current = startOfDay(dateStart);
  const end = startOfDay(dateEnd);

  while (!isAfter(current, end)) {
    const dateStr = format(current, "yyyy-MM-dd");
    // JS getDay: 0=Sun, but professional_schedules may use 0=Mon or 0=Sun
    // Supabase usually stores 0=Sunday, 1=Monday etc.
    const dayOfWeek = current.getDay();

    const daySchedules = scheduleByDay.get(dayOfWeek);
    if (daySchedules) {
      for (const sched of daySchedules) {
        const slotDuration = durationMinutes || sched.slot_duration_minutes || clinicConfig?.default_duration_minutes || 30;
        const daySlots = generateSlotsForPeriod(
          dateStr,
          sched.start_time,
          sched.end_time,
          slotDuration
        );

        for (const slot of daySlots) {
          // Check minimum advance
          const slotDateTime = parse(`${dateStr} ${slot.startTime}`, "yyyy-MM-dd HH:mm", new Date());
          if (isBefore(slotDateTime, minTime)) continue;

          // Check blocks
          if (isBlockedSlot(dateStr, slot.startTime, slot.endTime, blocks as ScheduleBlock[] || [])) continue;

          // Check conflicts with booked
          const dayBooked = bookedByDate.get(dateStr) || [];
          if (hasConflict(slot.startTime, slot.endTime, dayBooked)) continue;

          slots.push(slot);
        }
      }
    }

    current = addDays(current, 1);
  }

  return slots;
}

function generateSlotsForPeriod(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number
): PublicSlot[] {
  const slots: PublicSlot[] = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  let current = start;
  while (current + durationMinutes <= end) {
    slots.push({
      date,
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function isBlockedSlot(
  date: string,
  startTime: string,
  endTime: string,
  blocks: ScheduleBlock[]
): boolean {
  for (const block of blocks) {
    if (date < block.start_date || date > block.end_date) continue;

    if (block.all_day) return true;

    if (block.start_time && block.end_time) {
      if (startTime < block.end_time && endTime > block.start_time) {
        return true;
      }
    }
  }
  return false;
}

function hasConflict(startTime: string, endTime: string, booked: BookedSlot[]): boolean {
  for (const b of booked) {
    const bStart = b.start_time.substring(0, 5);
    const bEnd = b.end_time.substring(0, 5);
    if (startTime < bEnd && endTime > bStart) return true;
  }
  return false;
}
