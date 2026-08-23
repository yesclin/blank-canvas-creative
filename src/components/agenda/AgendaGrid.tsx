import { useMemo, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppointmentCard } from './AppointmentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Appointment, ViewMode, GroupBy, Professional, Room, Specialty, ScheduleBlock } from '@/types/agenda';
import {
  getBlocksForDay,
  blockBandTitle,
  blockDisplayTitle,
  blockMinuteRange,
  isClinicWideBlock,
} from './scheduleBlockUtils';

const SNAP_MIN = 15;
const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export interface SlotClickData {
  date: Date;
  time: string;
  professionalId?: string;
}

interface AgendaGridProps {
  appointments: Appointment[];
  scheduleBlocks?: ScheduleBlock[];
  viewMode: ViewMode;
  groupBy: GroupBy;
  selectedDate: Date;
  professionals: Professional[];
  rooms: Room[];
  specialties: Specialty[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
  onReschedule?: (appointment: Appointment) => void;
  onLaunchSale?: (appointment: Appointment) => void;
  onSlotClick?: (data: SlotClickData) => void;
  /** Profissional em foco (aba selecionada), para escopo visual dos bloqueios */
  selectedProfessionalId?: string;
  onBlockClick?: (block: ScheduleBlock) => void;
}

const SLOT_MIN = 30;
const SLOT_PX = 74;
const PX_PER_MIN = SLOT_PX / SLOT_MIN;
const MIN_CARD_HEIGHT = 44;
const DAY_START_HOUR = 8;
const DAY_START_MIN = DAY_START_HOUR * 60;

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = DAY_START_HOUR + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const TOTAL_HEIGHT = timeSlots.length * SLOT_PX;

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function AgendaGrid({
  appointments,
  scheduleBlocks = [],
  viewMode,
  groupBy,
  selectedDate,
  professionals,
  rooms,
  specialties,
  onAppointmentClick,
  onStatusChange,
  onReschedule,
  onLaunchSale,
  onSlotClick,
  selectedProfessionalId,
  onBlockClick,
}: AgendaGridProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    if (viewMode === 'daily') {
      filtered = filtered.filter(a => a.scheduled_date === format(selectedDate, 'yyyy-MM-dd'));
    } else if (viewMode === 'weekly') {
      const weekStart = format(weekDays[0], 'yyyy-MM-dd');
      const weekEnd = format(weekDays[6], 'yyyy-MM-dd');
      filtered = filtered.filter(a => a.scheduled_date >= weekStart && a.scheduled_date <= weekEnd);
    }
    
    return filtered;
  }, [appointments, viewMode, selectedDate, weekDays]);

  const groupedAppointments = useMemo(() => {
    if (groupBy === 'general') {
      return { 'Agenda Geral': filteredAppointments };
    }

    const groups: Record<string, Appointment[]> = {};

    // Pre-populate with all professionals so empty columns still render
    if (groupBy === 'professional') {
      professionals.forEach(p => {
        groups[p.full_name] = [];
      });
    }
    
    filteredAppointments.forEach(apt => {
      let key: string;
      switch (groupBy) {
        case 'professional':
          key = apt.professional?.full_name || 'Sem profissional';
          break;
        case 'room':
          key = apt.room?.name || 'Sem sala';
          break;
        case 'specialty':
          key = apt.specialty?.name || 'Sem especialidade';
          break;
        case 'type':
          key = apt.appointment_type;
          break;
        case 'status':
          key = apt.status;
          break;
        default:
          key = 'Outros';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });

    // If still empty (no professionals loaded), ensure at least one column
    if (Object.keys(groups).length === 0) {
      groups['Agenda Geral'] = filteredAppointments;
    }
    
    return groups;
  }, [filteredAppointments, groupBy, professionals]);

  // Build a map from professional name -> professional id for slot clicks
  const professionalNameToId = useMemo(() => {
    const map: Record<string, string> = {};
    professionals.forEach(p => {
      map[p.full_name] = p.id;
    });
    return map;
  }, [professionals]);

  // Check if a time slot is blocked for a given date and optional professional
  const isSlotBlocked = useCallback((date: Date, time: string, professionalId?: string): ScheduleBlock | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeMinutes = parseInt(time.slice(0, 2)) * 60 + parseInt(time.slice(3, 5));

    for (const block of scheduleBlocks) {
      // Check date range
      if (dateStr < block.start_date || dateStr > block.end_date) continue;

      // Check professional scope
      if (block.professional_id && professionalId && block.professional_id !== professionalId) continue;

      // All day block
      if (block.all_day) return block;

      // Check time range
      if (block.start_time && block.end_time) {
        const blockStart = parseInt(block.start_time.slice(0, 2)) * 60 + parseInt(block.start_time.slice(3, 5));
        const blockEnd = parseInt(block.end_time.slice(0, 2)) * 60 + parseInt(block.end_time.slice(3, 5));
        if (timeMinutes >= blockStart && timeMinutes < blockEnd) return block;
      }
    }
    return null;
  }, [scheduleBlocks]);

  // Check if a time slot is in the past
  const isSlotInPast = useCallback((date: Date, time: string): boolean => {
    const now = new Date();
    if (isBefore(startOfDay(date), startOfDay(now))) return true;
    if (isToday(date)) {
      const [h, m] = time.split(":").map(Number);
      const slotTime = new Date(date);
      slotTime.setHours(h, m, 0, 0);
      return isBefore(slotTime, now);
    }
    return false;
  }, []);

  // Compute the clicked time from the Y position within a day column container,
  // snapping to SNAP_MIN. Returns null if the click was on an interactive child
  // (appointment card) that already handled the event.
  const computeClickedTime = useCallback((e: ReactMouseEvent<HTMLDivElement>): string | null => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top + container.scrollTop;
    const rawMinutes = y / PX_PER_MIN;
    const snapped = Math.max(0, Math.floor(rawMinutes / SNAP_MIN) * SNAP_MIN);
    const totalMin = DAY_START_MIN + snapped;
    const maxMin = DAY_START_MIN + timeSlots.length * SLOT_MIN - SNAP_MIN;
    return minutesToTime(Math.min(totalMin, maxMin));
  }, []);

  const handleColumnClick = useCallback(
    (
      e: ReactMouseEvent<HTMLDivElement>,
      date: Date,
      professionalId?: string,
    ) => {
      if (!onSlotClick) return;
      const time = computeClickedTime(e);
      if (!time) return;
      if (isSlotInPast(date, time)) {
        toast.error('Horário indisponível — tempo já decorrido.');
        return;
      }
      const block = isSlotBlocked(date, time, professionalId);
      if (block) {
        toast.error('Este horário está bloqueado para agendamentos.');
        return;
      }
      onSlotClick({ date, time, professionalId });
    },
    [onSlotClick, computeClickedTime, isSlotInPast, isSlotBlocked],
  );

  // Render a past slot cell
  const renderPastSlot = (time: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-full min-h-[44px] flex items-center justify-center bg-muted/30 cursor-not-allowed">
            <span className="text-xs text-muted-foreground/50">{time}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Horário indisponível — tempo já decorrido</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Render a blocked slot cell
  const renderBlockedSlot = (block: ScheduleBlock) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-full min-h-[44px] flex items-center justify-center gap-1 bg-muted/60 cursor-not-allowed">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{block.title}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Horário bloqueado</p>
          <p className="text-xs text-muted-foreground">{block.title}{block.reason ? ` — ${block.reason}` : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Render a clickable empty slot cell
  const renderEmptySlot = (date: Date, time: string, professionalId?: string) => {
    if (!onSlotClick) return null;
    return (
      <button
        type="button"
        onClick={() => onSlotClick({ date, time, professionalId })}
        className="w-full h-full min-h-[44px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
        aria-label={`Agendar às ${time}`}
      >
        <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/5 rounded-md px-2 py-1 border border-dashed border-primary/30">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Agendar</span>
        </div>
      </button>
    );
  };

  const professionalNameById = useMemo(() => {
    const map: Record<string, string> = {};
    professionals.forEach(p => { map[p.id] = p.full_name; });
    return map;
  }, [professionals]);

  const DAY_END_MIN = DAY_START_MIN + timeSlots.length * SLOT_MIN;

  /** Faixas visuais dos bloqueios já cadastrados (visões Dia/Semana) */
  const renderBlockBands = (date: Date, professionalId?: string) => {
    const scopedProfessionalId = professionalId || selectedProfessionalId;
    const blocks = getBlocksForDay(scheduleBlocks, date, {
      professionalId: scopedProfessionalId,
      includeIndividual: !scopedProfessionalId,
    });
    if (blocks.length === 0) return null;

    return blocks.map(block => {
      const { startMin, endMin } = blockMinuteRange(block, DAY_START_MIN, DAY_END_MIN);
      if (endMin <= startMin) return null;
      const top = (startMin - DAY_START_MIN) * PX_PER_MIN;
      const height = Math.max(28, (endMin - startMin) * PX_PER_MIN);
      const profName = block.professional_id ? professionalNameById[block.professional_id] : undefined;
      const clinicWide = isClinicWideBlock(block);
      const showName = !!block.professional_id && !scopedProfessionalId;

      return (
        <button
          key={`block-${block.id}-${format(date, 'yyyy-MM-dd')}`}
          type="button"
          onClick={(e) => { e.stopPropagation(); onBlockClick?.(block); }}
          title={`${blockBandTitle(block, profName)}${block.reason ? ` — ${block.reason}` : ''}`}
          className={cn(
            'absolute left-0 right-0 z-[10] px-2 py-1 text-left overflow-hidden border-y cursor-pointer',
            clinicWide
              ? 'bg-destructive/15 border-destructive/40 hover:bg-destructive/20'
              : 'bg-muted/70 border-border hover:bg-muted',
            !clinicWide && 'border-l-4 border-l-muted-foreground/40',
          )}
          style={{
            top,
            height,
            backgroundImage:
              'repeating-linear-gradient(135deg, hsl(var(--muted-foreground) / 0.08) 0 6px, transparent 6px 12px)',
          }}
        >
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="truncate">{blockBandTitle(block, showName ? profName : undefined)}</span>
          </span>
          <span className="block text-[11px] text-muted-foreground truncate">
            {block.title}{block.reason ? ` — ${block.reason}` : ''}
          </span>
        </button>
      );
    });
  };



  // Daily View
  if (viewMode === 'daily') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: groupBy !== 'general' ? `80px repeat(${Object.keys(groupedAppointments).length}, minmax(200px, 1fr))` : '80px 1fr' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {Object.keys(groupedAppointments).map(group => {
              const headerProfId = groupBy === 'professional' ? professionalNameToId[group] : undefined;
              const headerColor = headerProfId
                ? resolveProfessionalColor(professionalColorById[headerProfId], headerProfId)
                : undefined;
              return (
                <div key={group} className="sticky top-0 z-20 bg-muted border-b border-l p-2 text-center text-sm font-medium truncate">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    {headerColor && (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: headerColor }}
                      />
                    )}
                    <span className="truncate">{group}</span>
                  </span>
                </div>
              );
            })}

            {/* Time labels column */}
            <div className="relative bg-muted/30" style={{ height: TOTAL_HEIGHT }}>
              {timeSlots.map((time, i) => (
                <div
                  key={`time-${time}`}
                  className="absolute left-0 right-0 border-b text-xs text-muted-foreground text-center px-2 flex items-start justify-center pt-1"
                  style={{ top: i * SLOT_PX, height: SLOT_PX }}
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Group columns with minute-precise appointments */}
            {Object.entries(groupedAppointments).map(([group, apts]) => {
              const profId = groupBy === 'professional' ? professionalNameToId[group] : undefined;
              return (
                <div
                  key={group}
                  className={cn(
                    "relative border-l overflow-hidden",
                    onSlotClick && "cursor-pointer"
                  )}
                  style={{ height: TOTAL_HEIGHT }}
                  onClick={onSlotClick ? (e) => handleColumnClick(e, selectedDate, profId) : undefined}
                >
                  {/* Layer 1: 30-min slot backgrounds (visual + block/past tinting) */}
                  {timeSlots.map((time, i) => {
                    const pastSlot = isSlotInPast(selectedDate, time);
                    const block = !pastSlot ? isSlotBlocked(selectedDate, time, profId) : null;
                    return (
                      <div
                        key={`${group}-${time}`}
                        className={cn(
                          "absolute left-0 right-0 border-b z-[1] overflow-hidden pointer-events-none",
                          pastSlot && "bg-muted/30",
                          block && "bg-muted/40",
                          !pastSlot && !block && onSlotClick && "hover:bg-primary/5 transition-colors"
                        )}
                        style={{ top: i * SLOT_PX, height: SLOT_PX }}
                        title={block ? `${block.title}${block.reason ? ` — ${block.reason}` : ''}` : pastSlot ? 'Horário já passou' : undefined}
                      />
                    );
                  })}
                  {/* Layer 1b: faixas visuais de bloqueio */}
                  {renderBlockBands(selectedDate, profId)}
                  {/* Layer 2: Appointments positioned by minute (z-20) */}

                  {apts.map(apt => {
                    const startStr = apt.start_time?.slice(0, 5);
                    const endStr = apt.end_time?.slice(0, 5);
                    if (!startStr) return null;
                    const startMin = toMinutes(startStr);
                    const endMin = endStr
                      ? toMinutes(endStr)
                      : startMin + (apt.duration_minutes || 30);
                    const top = (startMin - DAY_START_MIN) * PX_PER_MIN;
                    const height = Math.max(MIN_CARD_HEIGHT, (endMin - startMin) * PX_PER_MIN - 2);
                    if (top + height <= 0 || top >= TOTAL_HEIGHT) return null;
                    return (
                      <div
                        key={apt.id}
                        className="absolute left-1 right-1 z-20"
                        style={{ top, height }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AppointmentCard
                          appointment={apt}
                          compact
                          onClick={onAppointmentClick}
                          onStatusChange={onStatusChange}
                          onReschedule={onReschedule}
                          onLaunchSale={onLaunchSale}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Weekly View
  if (viewMode === 'weekly') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-8">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={cn(
                  "sticky top-0 z-30 bg-muted border-b border-l p-2 text-center",
                  isSameDay(day, new Date()) && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}

            {/* Time labels column */}
            <div className="relative bg-muted/30" style={{ height: TOTAL_HEIGHT }}>
              {timeSlots.filter((_, i) => i % 2 === 0).map((time) => {
                const i = timeSlots.indexOf(time);
                return (
                  <div
                    key={`wtime-${time}`}
                    className="absolute left-0 right-0 border-b text-xs text-muted-foreground text-center px-2 flex items-start justify-center pt-1"
                    style={{ top: i * SLOT_PX, height: SLOT_PX * 2 }}
                  >
                    {time}
                  </div>
                );
              })}
            </div>

            {/* Day columns with minute-precise appointments */}
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = filteredAppointments.filter(a => a.scheduled_date === dayStr);
              const isWeekend = [0, 6].includes(day.getDay());
              return (
                <div
                  key={`wcol-${dayStr}`}
                  className={cn(
                    "relative border-l overflow-hidden",
                    isWeekend && "bg-muted/20",
                    onSlotClick && "cursor-pointer"
                  )}
                  style={{ height: TOTAL_HEIGHT }}
                  onClick={onSlotClick ? (e) => handleColumnClick(e, day) : undefined}
                >
                  {/* Layer 1: 30-min slot backgrounds (visual only) */}
                  {timeSlots.map((time, i) => {
                    const pastSlot = isSlotInPast(day, time);
                    const rawBlock = !pastSlot ? isSlotBlocked(day, time, selectedProfessionalId) : null;
                    // Sem profissional em foco, só escurece a coluna em bloqueio geral da clínica
                    const block = rawBlock && (selectedProfessionalId || isClinicWideBlock(rawBlock)) ? rawBlock : null;
                    return (
                      <div
                        key={`${dayStr}-${time}`}
                        className={cn(
                          "absolute left-0 right-0 border-b z-[1] pointer-events-none",
                          pastSlot && "bg-muted/30",
                          block && "bg-muted/40",
                          !pastSlot && !block && onSlotClick && "hover:bg-primary/5 transition-colors"
                        )}
                        style={{ top: i * SLOT_PX, height: SLOT_PX }}
                        title={block ? `${block.title}${block.reason ? ` — ${block.reason}` : ''}` : undefined}
                      />
                    );
                  })}
                  {/* Layer 1b: faixas visuais de bloqueio */}
                  {renderBlockBands(day)}
                  {/* Layer 2: Appointments */}

                  {dayAppointments.map(apt => {
                    const startStr = apt.start_time?.slice(0, 5);
                    const endStr = apt.end_time?.slice(0, 5);
                    if (!startStr) return null;
                    const startMin = toMinutes(startStr);
                    const endMin = endStr
                      ? toMinutes(endStr)
                      : startMin + (apt.duration_minutes || 30);
                    const top = (startMin - DAY_START_MIN) * PX_PER_MIN;
                    const height = Math.max(MIN_CARD_HEIGHT, (endMin - startMin) * PX_PER_MIN - 2);
                    if (top + height <= 0 || top >= TOTAL_HEIGHT) return null;
                    return (
                      <div
                        key={apt.id}
                        className="absolute left-1 right-1 z-20"
                        style={{ top, height }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AppointmentCard
                          appointment={apt}
                          compact
                          onClick={onAppointmentClick}
                          onStatusChange={onStatusChange}
                          onReschedule={onReschedule}
                          onLaunchSale={onLaunchSale}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }


  // Monthly View
  if (viewMode === 'monthly') {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthDays = Array.from({ length: 35 }, (_, i) => {
      const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      return addDays(weekStart, i);
    });

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {/* Header */}
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="bg-muted border-b p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {monthDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayAppointments = filteredAppointments.filter(a => a.scheduled_date === dayStr);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isDayToday = isSameDay(day, new Date());
            const isPastDay = isBefore(startOfDay(day), startOfDay(new Date()));
            
            return (
              <div 
                key={dayStr}
                className={cn(
                  "border-b border-l p-2 min-h-[100px] group relative",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isPastDay && "bg-muted/20 cursor-not-allowed",
                  !isPastDay && onSlotClick && "cursor-pointer hover:bg-primary/5 transition-colors"
                )}
                onClick={!isPastDay && onSlotClick ? () => onSlotClick({ date: day, time: '08:00' }) : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isDayToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {!isPastDay && onSlotClick && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
                {/* Bloqueios do dia (badges discretos) */}
                {getBlocksForDay(scheduleBlocks, day, {
                  professionalId: selectedProfessionalId,
                  includeIndividual: !selectedProfessionalId,
                }).slice(0, 2).map(block => {
                  const profName = block.professional_id ? professionalNameById[block.professional_id] : undefined;
                  const clinicWide = isClinicWideBlock(block);
                  return (
                    <button
                      key={`mblock-${block.id}-${dayStr}`}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onBlockClick?.(block); }}
                      title={`${block.title}${block.reason ? ` — ${block.reason}` : ''}`}
                      className={cn(
                        'w-full flex items-center gap-1 text-[11px] p-1 mb-1 rounded truncate text-left',
                        clinicWide
                          ? 'bg-destructive/15 text-destructive hover:bg-destructive/20'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{blockDisplayTitle(block, profName)}</span>
                    </button>
                  );
                })}

                {dayAppointments.slice(0, 3).map(apt => (
                  <div 
                    key={apt.id}
                    className="text-xs p-1 mb-1 rounded bg-primary/10 truncate cursor-pointer hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(apt);
                    }}
                  >
                    {apt.start_time.slice(0, 5)} {apt.patient?.full_name?.split(' ')[0]}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Timeline View
  return (
    <div className="space-y-4">
      {Object.entries(groupedAppointments).map(([group, apts]) => (
        <div key={group} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">{group}</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-3 pl-8">
              {apts
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(apt => (
                  <div key={apt.id} className="relative">
                    <div className="absolute -left-8 top-4 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    <AppointmentCard
                      appointment={apt}
                      onClick={onAppointmentClick}
                      onStatusChange={onStatusChange}
                      onReschedule={onReschedule}
                      onLaunchSale={onLaunchSale}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
