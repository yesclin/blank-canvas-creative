import { useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppointmentCard } from './AppointmentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Appointment, ViewMode, GroupBy, Professional, Room, Specialty, ScheduleBlock } from '@/types/agenda';

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
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

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

  // Daily View
  if (viewMode === 'daily') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: groupBy !== 'general' ? `80px repeat(${Object.keys(groupedAppointments).length}, minmax(200px, 1fr))` : '80px 1fr' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {Object.keys(groupedAppointments).map(group => (
              <div key={group} className="sticky top-0 z-10 bg-muted border-b border-l p-2 text-center text-sm font-medium truncate">
                {group}
              </div>
            ))}
            
            {/* Time slots */}
            {timeSlots.map(time => (
              <>
                <div key={`time-${time}`} className="border-b p-2 text-xs text-muted-foreground text-center bg-muted/30">
                  {time}
                </div>
                {Object.entries(groupedAppointments).map(([group, apts]) => {
                  const slotAppointments = apts.filter(a => a.start_time.slice(0, 5) === time);
                  const isEmpty = slotAppointments.length === 0;
                  const profId = groupBy === 'professional' ? professionalNameToId[group] : undefined;
                  const pastSlot = isEmpty ? isSlotInPast(selectedDate, time) : false;
                  const block = isEmpty && !pastSlot ? isSlotBlocked(selectedDate, time, profId) : null;
                  
                  return (
                    <div
                      key={`${group}-${time}`}
                      className={cn(
                        "border-b border-l p-1 min-h-[60px] relative",
                        pastSlot && "bg-muted/30",
                        block && "bg-muted/40",
                        isEmpty && !block && !pastSlot && onSlotClick && "cursor-pointer hover:bg-primary/5 transition-colors"
                      )}
                      onClick={isEmpty && !block && !pastSlot && onSlotClick ? () => onSlotClick({ date: selectedDate, time, professionalId: profId }) : undefined}
                    >
                      {slotAppointments.length > 0 ? (
                        slotAppointments.map(apt => (
                          <AppointmentCard
                            key={apt.id}
                            appointment={apt}
                            compact
                            onClick={onAppointmentClick}
                            onStatusChange={onStatusChange}
                            onReschedule={onReschedule}
                            onLaunchSale={onLaunchSale}
                          />
                        ))
                      ) : block ? (
                        renderBlockedSlot(block)
                      ) : pastSlot ? (
                        renderPastSlot(time)
                      ) : (
                        renderEmptySlot(selectedDate, time, profId)
                      )}
                    </div>
                  );
                })}
              </>
            ))}
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
            <div className="sticky top-0 z-10 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {weekDays.map(day => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "sticky top-0 z-10 bg-muted border-b border-l p-2 text-center",
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
            
            {/* Time slots */}
            {timeSlots.filter((_, i) => i % 2 === 0).map(time => (
              <>
                <div key={`time-${time}`} className="border-b p-2 text-xs text-muted-foreground text-center bg-muted/30">
                  {time}
                </div>
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const slotAppointments = filteredAppointments.filter(
                    a => a.scheduled_date === dayStr && a.start_time.slice(0, 2) === time.slice(0, 2)
                  );
                  const isWeekend = [0, 6].includes(day.getDay());
                  const isEmpty = slotAppointments.length === 0;
                  const pastSlot = isEmpty ? isSlotInPast(day, time) : false;
                  const block = isEmpty && !pastSlot ? isSlotBlocked(day, time) : null;
                  
                  return (
                    <div 
                      key={`${dayStr}-${time}`} 
                      className={cn(
                        "border-b border-l p-1 min-h-[80px] relative",
                        isWeekend && "bg-muted/20",
                        pastSlot && "bg-muted/30",
                        block && "bg-muted/40",
                        isEmpty && !block && !pastSlot && onSlotClick && "cursor-pointer hover:bg-primary/5 transition-colors"
                      )}
                      onClick={isEmpty && !block && !pastSlot && onSlotClick ? () => onSlotClick({ date: day, time }) : undefined}
                    >
                      {slotAppointments.length > 0 ? (
                        <>
                          {slotAppointments.slice(0, 2).map(apt => (
                            <AppointmentCard
                              key={apt.id}
                              appointment={apt}
                              compact
                              onClick={onAppointmentClick}
                              onStatusChange={onStatusChange}
                              onReschedule={onReschedule}
                              onLaunchSale={onLaunchSale}
                            />
                          ))}
                          {slotAppointments.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center mt-1">
                              +{slotAppointments.length - 2} mais
                            </div>
                          )}
                        </>
                      ) : block ? (
                        renderBlockedSlot(block)
                      ) : pastSlot ? (
                        renderPastSlot(time)
                      ) : (
                        renderEmptySlot(day, time)
                      )}
                    </div>
                  );
                })}
              </>
            ))}
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
