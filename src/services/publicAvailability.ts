import { supabase } from "@/integrations/supabase/client";
import { addDays, format, startOfDay } from "date-fns";

const PUBLIC_BOOKING_TIMEZONE = "America/Sao_Paulo";

const DEFAULT_PUBLIC_WEEK_SCHEDULE: Record<string, any> = {
  seg: { enabled: true, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  ter: { enabled: true, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  qua: { enabled: true, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  qui: { enabled: true, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  sex: { enabled: true, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  sab: { enabled: false, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
  dom: { enabled: false, open: "08:00", close: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
};

export interface PublicSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface PublicAvailabilityParams {
  clinicId: string;
  professionalId: string;
  specialtyId?: string;
  procedureId?: string;
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

interface PublicProcedureRow {
  id: string;
  clinic_id: string;
  specialty_id: string | null;
  is_active: boolean;
  duration_minutes: number | null;
}

type SlotRemovalReason = {
  slot: PublicSlot;
  reason: string;
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
  const {
    clinicId,
    professionalId,
    specialtyId,
    procedureId,
    dateStart,
    dateEnd,
    durationMinutes,
    minAdvanceHours = 2,
  } = params;

  const startStr = formatSaoPauloDate(dateStart);
  const endStr = formatSaoPauloDate(dateEnd);

  const { data: clinicStatus } = await supabase
    .from("public_clinic_booking" as any)
    .select("id, public_booking_enabled")
    .eq("id", clinicId)
    .maybeSingle();

  const { data: publicProfessionals, error: publicProfessionalsErr } = await supabase.rpc("get_public_professionals", {
    _clinic_id: clinicId,
    _specialty_id: null,
  });
  const professionalIsPublicAndActive = (publicProfessionals || []).some((professional: any) => professional.id === professionalId);

  let procedure: PublicProcedureRow | null = null;
  let procedureLookupFailed = false;
  if (procedureId) {
    const { data: procedureRows, error: procedureErr } = await (supabase as any).rpc("get_public_procedures", {
      _clinic_id: clinicId,
      _specialty_id: specialtyId || null,
      _professional_id: professionalId || null,
    });

    if (procedureErr) {
      console.error("[PublicAvail] procedure lookup error:", procedureErr);
      procedureLookupFailed = true;
    }
    const procedureData = (procedureRows || []).find((item: any) => item.id === procedureId);
    procedure = procedureData
      ? {
          id: procedureData.id,
          clinic_id: clinicId,
          specialty_id: procedureData.specialty_id,
          is_active: true,
          duration_minutes: procedureData.duration_minutes,
        }
      : null;
  }

  // 1. Fetch effective schedule via RPC (handles RLS + professional/clinic fallback)
  const { data: effectiveRows, error: effErr } = await supabase.rpc(
    "get_public_effective_schedule",
    { _clinic_id: clinicId, _professional_id: professionalId }
  );

  const effective = (Array.isArray(effectiveRows) ? effectiveRows[0] : effectiveRows) as EffectiveScheduleRow | undefined;
  console.log("[PublicAvail] effective_schedule:", {
    clinicId,
    professionalId,
    specialtyId,
    procedureId,
    source: effective?.source,
    error: effErr?.message,
    hasWorkingDays: !!effective?.working_days,
    publicBookingEnabled: clinicStatus?.public_booking_enabled,
    professionalIsPublicAndActive,
    publicProfessionalsError: publicProfessionalsErr?.message,
    procedure,
  });

  if (effErr) {
    console.error("[PublicAvail] effective_schedule error:", effErr);
  }

  if (!clinicStatus?.public_booking_enabled || !professionalIsPublicAndActive) {
    console.log("PUBLIC BOOKING FINAL DEBUG", {
      clinicId,
      professionalId,
      specialtyId,
      procedureId,
      selectedDate: startStr,
      weekday: getSaoPauloWeekday(startStr),
      professionalSchedule: null,
      clinicSchedule: null,
      fallbackScheduleUsed: false,
      generatedSlots: [],
      appointments: [],
      blocks: [],
      publicBookingEnabled: !!clinicStatus?.public_booking_enabled,
      timezone: PUBLIC_BOOKING_TIMEZONE,
      finalAvailableSlots: [],
      validation: {
        clinicExists: !!clinicStatus,
        publicBookingEnabled: !!clinicStatus?.public_booking_enabled,
        professionalIsPublicAndActive,
        publicProfessionalsError: publicProfessionalsErr?.message,
      },
    });
    return { slots: [], emptyReason: "all_blocked" };
  }

  if (procedureId) {
    const procedureValid = procedureLookupFailed || (!!procedure
      && procedure.clinic_id === clinicId
      && procedure.is_active === true
      && (!specialtyId || !procedure.specialty_id || procedure.specialty_id === specialtyId));

    if (!procedureValid) {
      console.log("PUBLIC BOOKING FINAL DEBUG", {
        clinicId,
        professionalId,
        specialtyId,
        procedureId,
        selectedDate: startStr,
        weekday: getSaoPauloWeekday(startStr),
        professionalSchedule: null,
        clinicSchedule: null,
        fallbackScheduleUsed: false,
        generatedSlots: [],
        appointments: [],
        blocks: [],
        publicBookingEnabled: !!clinicStatus?.public_booking_enabled,
        timezone: PUBLIC_BOOKING_TIMEZONE,
        finalAvailableSlots: [],
        validation: {
          procedureExists: !!procedure,
          procedureClinicMatches: procedure?.clinic_id === clinicId,
          procedureSpecialtyMatches: !specialtyId || procedure?.specialty_id === specialtyId,
          procedureActive: !!procedure?.is_active,
        },
      });
      return { slots: [], emptyReason: "all_blocked" };
    }
  }

  const effectiveSchedule = effective?.working_days
    ? effective
    : ({
        working_days: DEFAULT_PUBLIC_WEEK_SCHEDULE,
        default_duration_minutes: 30,
        source: "client_default_week",
      } satisfies EffectiveScheduleRow);

  const workingDays = normalizeWeekSchedule(effectiveSchedule.working_days);
  const scheduleHasAnyPeriods = hasAnyEnabledPeriod(workingDays);
  const defaultDuration = durationMinutes || procedure?.duration_minutes || effectiveSchedule.default_duration_minutes || 30;
  const fallbackUsed = !effectiveSchedule.source?.startsWith("professional");

  // 2. Fetch schedule blocks
  const { data: blocks, error: blocksErr } = await supabase
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

  if (blocksErr) console.error("[PublicAvail] schedule_blocks error:", blocksErr);
  console.log("[PublicAvail] booked_slots:", { count: bookedSlots?.length, error: bookedErr?.message });

  // Build daily schedule from WeekSchedule (seg..dom)
  const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const scheduleByDay = new Map<number, { startTime: string; endTime: string; slotDuration: number }[]>();

  dayKeys.forEach((key, idx) => {
    const dayPeriods = normalizeDayPeriods(workingDays?.[key], defaultDuration);
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

  const minTime = new Date(Date.now() + (minAdvanceHours || 0) * 60 * 60 * 1000);

  const slots: PublicSlot[] = [];
  let currentDateStr = startStr;

  while (currentDateStr <= endStr) {
    const dateStr = currentDateStr;
    const dayOfWeek = getSaoPauloWeekday(dateStr);

    const daySchedules = scheduleByDay.get(dayOfWeek);
    const availableSlotsForDebug: PublicSlot[] = [];
    const generatedSlotsForDebug: PublicSlot[] = [];
    const removalReasonsForDebug: SlotRemovalReason[] = [];
    if (daySchedules) {
      for (const sched of daySchedules) {
        const slotDuration = sched.slotDuration;
        const daySlots = generateSlotsForPeriod(
          dateStr,
          sched.startTime,
          sched.endTime,
          slotDuration
        );
        generatedSlotsForDebug.push(...daySlots);

        for (const slot of daySlots) {
          // Check minimum advance
          const slotDateTime = saoPauloSlotToDate(slot.date, slot.startTime);
          if (slotDateTime < minTime) {
            removalReasonsForDebug.push({ slot, reason: "antecedência mínima" });
            continue;
          }

          // Check blocks
          const blockReason = getBlockedSlotReason(dateStr, slot.startTime, slot.endTime, blocks as ScheduleBlock[] || []);
          if (blockReason) {
            removalReasonsForDebug.push({ slot, reason: blockReason });
            continue;
          }

          // Check conflicts with booked
          const dayBooked = bookedByDate.get(dateStr) || [];
          if (hasConflict(slot.startTime, slot.endTime, dayBooked)) {
            removalReasonsForDebug.push({ slot, reason: "agendamento existente" });
            continue;
          }

          slots.push(slot);
          availableSlotsForDebug.push(slot);
          removalReasonsForDebug.push({ slot, reason: "disponível" });
        }
      }
    } else if (scheduleHasAnyPeriods) {
      removalReasonsForDebug.push({
        slot: { date: dateStr, startTime: "--:--", endTime: "--:--" },
        reason: "fora do expediente / dia sem atendimento",
      });
    } else {
      removalReasonsForDebug.push({
        slot: { date: dateStr, startTime: "--:--", endTime: "--:--" },
        reason: "sem configuração válida de expediente; fallback padrão não aplicado pelo banco",
      });
    }

    const finalDebugPayload = {
      clinicId,
      professionalId,
      specialtyId,
      procedureId,
      selectedDate: dateStr,
      weekday: dayOfWeek,
      professionalSchedule: effectiveSchedule.source?.startsWith("professional") ? workingDays : null,
      clinicSchedule: fallbackUsed ? workingDays : null,
      fallbackScheduleUsed: fallbackUsed,
      generatedSlots: generatedSlotsForDebug,
      appointments: bookedByDate.get(dateStr) || [],
      blocks: blocks || [],
      publicBookingEnabled: !!clinicStatus?.public_booking_enabled,
      timezone: PUBLIC_BOOKING_TIMEZONE,
      finalAvailableSlots: availableSlotsForDebug,
    };

    console.log("PUBLIC BOOKING FINAL DEBUG", finalDebugPayload);

    if (availableSlotsForDebug.length === 0) {
      removalReasonsForDebug.forEach(({ slot, reason }) => {
        const label = slot.startTime === "--:--" ? dateStr : `slot ${slot.startTime}`;
        console.log(`${label} removido por ${reason}`);
      });
    } else {
      removalReasonsForDebug
        .filter(({ reason }) => reason !== "disponível")
        .forEach(({ slot, reason }) => console.log(`slot ${slot.startTime} removido por ${reason}`));
      availableSlotsForDebug.forEach((slot) => console.log(`slot ${slot.startTime} disponível`));
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1);
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
  if (!rawWorkingDays) return DEFAULT_PUBLIC_WEEK_SCHEDULE;

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

  if (Object.keys(rawWorkingDays).length === 0) return DEFAULT_PUBLIC_WEEK_SCHEDULE;

  return rawWorkingDays;
}

function hasAnyEnabledPeriod(workingDays: Record<string, any>): boolean {
  return ["dom", "seg", "ter", "qua", "qui", "sex", "sab"].some((dayKey) =>
    normalizeDayPeriods(workingDays?.[dayKey], 30).length > 0
  );
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

function getBlockedSlotReason(
  date: string,
  startTime: string,
  endTime: string,
  blocks: ScheduleBlock[]
): string | null {
  for (const block of blocks) {
    if (date < block.start_date || date > block.end_date) continue;
    if (block.all_day) return "bloqueio de agenda";
    if (block.start_time && block.end_time) {
      if (startTime < block.end_time && endTime > block.start_time) {
        return "bloqueio de agenda";
      }
    }
  }
  return null;
}

function hasConflict(startTime: string, endTime: string, booked: BookedSlot[]): boolean {
  for (const b of booked) {
    const bStart = b.start_time.substring(0, 5);
    const bEnd = b.end_time.substring(0, 5);
    if (startTime < bEnd && endTime > bStart) return true;
  }
  return false;
}

function getSaoPauloWeekday(dateStr: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLIC_BOOKING_TIMEZONE,
    weekday: "short",
  }).format(new Date(`${dateStr}T12:00:00-03:00`));

  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[weekday] ?? 0;
}

function saoPauloSlotToDate(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00-03:00`);
}

function formatSaoPauloDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PUBLIC_BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDaysToDateString(dateStr: string, amount: number): string {
  const next = addDays(new Date(`${dateStr}T12:00:00-03:00`), amount);
  return format(next, "yyyy-MM-dd");
}
