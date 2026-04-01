import { supabase } from "@/integrations/supabase/client";
import { addDays, format, parse, isBefore, addMinutes, startOfDay } from "date-fns";

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

export interface PublicAvailabilityResult {
  slots: PublicSlot[];
  debugInfo?: string;
  emptyReason?: "no_schedules" | "all_blocked" | "config_error" | null;
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
  working_days: any;
  default_duration_minutes: number;
}

// Map working_days strings to JS getDay() values
const dayNameToIndex: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

/**
 * Calculate available public slots for a professional in a date range.
 * Falls back to clinic_schedule_config when professional_schedules is empty.
 */
export async function getPublicProfessionalAvailability(
  params: PublicAvailabilityParams
): Promise<PublicSlot[]> {
  const result = await getPublicAvailabilityWithDetails(params);
  return result.slots;
}

export async function getPublicAvailabilityWithDetails(
  params: PublicAvailabilityParams
): Promise<PublicAvailabilityResult> {
  const { clinicId, professionalId, dateStart, dateEnd, durationMinutes, minAdvanceHours = 2 } = params;

  const startStr = format(dateStart, "yyyy-MM-dd");
  const endStr = format(dateEnd, "yyyy-MM-dd");

  // 1. Fetch professional schedules
  const { data: schedules, error: schedErr } = await supabase
    .from("professional_schedules")
    .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active")
    .eq("clinic_id", clinicId)
    .eq("professional_id", professionalId)
    .eq("is_active", true);

  console.log("[PublicAvail] professional_schedules:", { clinicId, professionalId, count: schedules?.length, error: schedErr?.message });

  // 2. Fetch clinic schedule config (always needed as fallback)
  const { data: clinicConfig, error: configErr } = await supabase
    .from("clinic_schedule_config")
    .select("start_time, end_time, working_days, default_duration_minutes")
    .eq("clinic_id", clinicId)
    .single();

  console.log("[PublicAvail] clinic_schedule_config:", { found: !!clinicConfig, error: configErr?.message, config: clinicConfig });

  const hasProSchedules = schedules && schedules.length > 0;
  const hasClinicConfig = !!clinicConfig;

  // If neither exists, can't calculate
  if (!hasProSchedules && !hasClinicConfig) {
    console.warn("[PublicAvail] No schedules and no clinic config found");
    return { slots: [], emptyReason: "no_schedules" };
  }

  // 3. Fetch schedule blocks
  const { data: blocks } = await supabase
    .from("schedule_blocks")
    .select("start_date, end_date, start_time, end_time, all_day, professional_id")
    .eq("clinic_id", clinicId)
    .or(`professional_id.eq.${professionalId},professional_id.is.null`)
    .lte("start_date", endStr)
    .gte("end_date", startStr);

  console.log("[PublicAvail] schedule_blocks:", { count: blocks?.length });

  // 4. Fetch booked slots via security definer function
  const { data: bookedSlots, error: bookedErr } = await supabase
    .rpc("get_booked_slots", {
      _clinic_id: clinicId,
      _professional_id: professionalId,
      _date_start: startStr,
      _date_end: endStr,
    });

  console.log("[PublicAvail] booked_slots:", { count: bookedSlots?.length, error: bookedErr?.message });

  // Build schedule lookup
  // If professional has schedules, use them. Otherwise, derive from clinic config.
  const scheduleByDay = new Map<number, { startTime: string; endTime: string; slotDuration: number }[]>();

  if (hasProSchedules) {
    for (const s of (schedules as ProfessionalSchedule[])) {
      const existing = scheduleByDay.get(s.day_of_week) || [];
      existing.push({
        startTime: s.start_time,
        endTime: s.end_time,
        slotDuration: s.slot_duration_minutes || clinicConfig?.default_duration_minutes || 30,
      });
      scheduleByDay.set(s.day_of_week, existing);
    }
  } else if (hasClinicConfig) {
    // Fallback: use clinic config working days
    const workingDays = parseWorkingDays(clinicConfig.working_days);
    console.log("[PublicAvail] Using clinic config fallback, working days:", workingDays);
    for (const dayIndex of workingDays) {
      scheduleByDay.set(dayIndex, [{
        startTime: clinicConfig.start_time,
        endTime: clinicConfig.end_time,
        slotDuration: durationMinutes || clinicConfig.default_duration_minutes || 30,
      }]);
    }
  }

  console.log("[PublicAvail] scheduleByDay keys:", Array.from(scheduleByDay.keys()));

  // Build booked lookup
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

  while (current <= end) {
    const dateStr = format(current, "yyyy-MM-dd");
    const dayOfWeek = current.getDay();

    const daySchedules = scheduleByDay.get(dayOfWeek);
    if (daySchedules) {
      for (const sched of daySchedules) {
        const slotDuration = durationMinutes || sched.slotDuration;
        const daySlots = generateSlotsForPeriod(
          dateStr,
          sched.startTime,
          sched.endTime,
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

  console.log("[PublicAvail] Total slots generated:", slots.length);

  const emptyReason = slots.length === 0
    ? (!hasProSchedules && !hasClinicConfig ? "no_schedules" : "all_blocked")
    : null;

  return { slots, emptyReason };
}

/**
 * Parse working_days from clinic config (can be array of strings like ["seg","ter",...] or numbers)
 */
function parseWorkingDays(workingDays: any): number[] {
  if (!workingDays) return [1, 2, 3, 4, 5]; // default Mon-Fri
  if (Array.isArray(workingDays)) {
    return workingDays.map((d: any) => {
      if (typeof d === "number") return d;
      if (typeof d === "string") return dayNameToIndex[d.toLowerCase()] ?? -1;
      return -1;
    }).filter((d: number) => d >= 0);
  }
  return [1, 2, 3, 4, 5];
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
