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

interface EffectiveScheduleRow {
  working_days: Record<string, any>;
  default_duration_minutes: number;
  source: string;
}

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

  // 1. Fetch effective schedule via RPC (handles RLS + professional/clinic fallback)
  const { data: effectiveRows, error: effErr } = await supabase.rpc(
    "get_public_effective_schedule",
    { _clinic_id: clinicId, _professional_id: professionalId }
  );

  const effective = (Array.isArray(effectiveRows) ? effectiveRows[0] : effectiveRows) as EffectiveScheduleRow | undefined;
  console.log("[PublicAvail] effective_schedule:", {
    clinicId,
    professionalId,
    source: effective?.source,
    error: effErr?.message,
    hasWorkingDays: !!effective?.working_days,
  });

  if (effErr) {
    console.error("[PublicAvail] effective_schedule error:", effErr);
    return { slots: [], emptyReason: "config_error" };
  }

  if (!effective?.working_days) {
    return { slots: [], emptyReason: "no_schedules" };
  }

  const workingDays = normalizeWeekSchedule(effective.working_days);
  const defaultDuration = effective.default_duration_minutes || 30;
  const fallbackUsed = effective.source?.startsWith("clinic") ?? false;

  // 2. Fetch schedule blocks
  const { data: blocks } = await supabase
    .from("schedule_blocks")
    .select("start_date, end_date, start_time, end_time, all_day, professional_id")
    .eq("clinic_id", clinicId)
    .or(`professional_id.eq.${professionalId},professional_id.is.null`)
    .lte("start_date", endStr)
    .gte("end_date", startStr);

  // 3. Fetch booked slots via security definer function
  const { data: bookedSlots, error: bookedErr } = await supabase
    .rpc("get_booked_slots", {
      _clinic_id: clinicId,
      _professional_id: professionalId,
      _date_start: startStr,
      _date_end: endStr,
    });

  console.log("[PublicAvail] booked_slots:", { count: bookedSlots?.length, error: bookedErr?.message });

  // Build daily schedule from WeekSchedule (seg..dom)
  const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const scheduleByDay = new Map<number, { startTime: string; endTime: string; slotDuration: number }[]>();

  dayKeys.forEach((key, idx) => {
    const dayPeriods = normalizeDayPeriods(workingDays?.[key], durationMinutes || defaultDuration);
    if (dayPeriods.length > 0) {
      scheduleByDay.set(idx, dayPeriods);
    }
  });

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
    const availableSlotsForDebug: PublicSlot[] = [];
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
          availableSlotsForDebug.push(slot);
        }
      }
    }

    console.log("PUBLIC BOOKING AVAILABILITY DEBUG", {
      clinicId,
      professionalId,
      date: dateStr,
      weekday: dayOfWeek,
      professionalSchedule: effective.source?.startsWith("professional") ? workingDays : null,
      clinicSchedule: fallbackUsed ? workingDays : null,
      fallbackUsed,
      blocks: blocks || [],
      appointments: bookedByDate.get(dateStr) || [],
      availableSlots: availableSlotsForDebug,
    });

    current = addDays(current, 1);
  }

  console.log("[PublicAvail] Total slots generated:", slots.length);

  const emptyReason = slots.length === 0 ? "all_blocked" : null;

  return { slots, emptyReason };
}

function normalizeDayPeriods(
  dayConfig: any,
  slotDuration: number
): { startTime: string; endTime: string; slotDuration: number }[] {
  if (!dayConfig) return [];

  if (Array.isArray(dayConfig)) {
    return dayConfig.flatMap((period) => normalizeDayPeriods(period, slotDuration));
  }

  if (dayConfig.enabled === false) return [];

  const open = (dayConfig.open || dayConfig.startTime || dayConfig.start_time || "08:00").toString().substring(0, 5);
  const close = (dayConfig.close || dayConfig.endTime || dayConfig.end_time || "18:00").toString().substring(0, 5);

  if (!open || !close || open >= close) return [];

  if (dayConfig.hasLunch && dayConfig.lunchStart && dayConfig.lunchEnd) {
    const lunchStart = dayConfig.lunchStart.toString().substring(0, 5);
    const lunchEnd = dayConfig.lunchEnd.toString().substring(0, 5);

    if (lunchStart > open && lunchEnd < close && lunchStart < lunchEnd) {
      return [
        { startTime: open, endTime: lunchStart, slotDuration },
        { startTime: lunchEnd, endTime: close, slotDuration },
      ];
    }
  }

  return [{ startTime: open, endTime: close, slotDuration }];
}

function normalizeWeekSchedule(rawWorkingDays: Record<string, any>): Record<string, any> {
  if (!rawWorkingDays) return {};

  if (rawWorkingDays.schedule && typeof rawWorkingDays.schedule === "object") {
    return rawWorkingDays.schedule;
  }

  if (Array.isArray(rawWorkingDays.working_days)) {
    const enabledDays = new Set(rawWorkingDays.working_days);
    const open = rawWorkingDays.open_time || rawWorkingDays.open || "08:00";
    const close = rawWorkingDays.close_time || rawWorkingDays.close || "18:00";
    const lunchStart = rawWorkingDays.lunch_start || rawWorkingDays.lunchStart || "12:00";
    const lunchEnd = rawWorkingDays.lunch_end || rawWorkingDays.lunchEnd || "13:00";

    return ["dom", "seg", "ter", "qua", "qui", "sex", "sab"].reduce<Record<string, any>>((acc, dayKey) => {
      acc[dayKey] = {
        enabled: enabledDays.has(dayKey),
        open,
        close,
        hasLunch: true,
        lunchStart,
        lunchEnd,
      };
      return acc;
    }, {});
  }

  return rawWorkingDays;
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
