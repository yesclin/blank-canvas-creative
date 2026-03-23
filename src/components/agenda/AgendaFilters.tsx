import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { 
  Professional, 
  Specialty, 
  Room, 
  Insurance,
  AgendaFilters as FiltersType,
  ViewMode,
  GroupBy,
  AppointmentStatus,
  AppointmentType,
  PaymentType
} from "@/types/agenda";
import { statusLabels, typeLabels } from "@/types/agenda";

interface AgendaFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  professionals: Professional[];
  specialties: Specialty[];
  rooms: Room[];
  insurances: Insurance[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function AgendaFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  professionals,
  specialties,
  rooms,
  insurances,
  selectedDate,
  onDateChange,
}: AgendaFiltersProps) {
  const activeFiltersCount = [
    filters.professionalId,
    filters.specialtyId,
    filters.roomId,
    filters.appointmentType,
    filters.paymentType,
    filters.status,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      professionalId: undefined,
      specialtyId: undefined,
      roomId: undefined,
      appointmentType: undefined,
      paymentType: undefined,
      status: undefined,
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    switch (viewMode) {
      case 'daily':
        onDateChange(addDays(selectedDate, offset));
        break;
      case 'weekly':
        onDateChange(addDays(selectedDate, offset * 7));
        break;
      case 'monthly':
        onDateChange(addDays(selectedDate, offset * 30));
        break;
      default:
        onDateChange(addDays(selectedDate, offset));
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation & View Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            {(['daily', 'weekly', 'monthly', 'timeline'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none border-0",
                  viewMode !== mode && "hover:bg-muted"
                )}
                onClick={() => onViewModeChange(mode)}
              >
                {mode === 'daily' && 'Dia'}
                {mode === 'weekly' && 'Semana'}
                {mode === 'monthly' && 'Mês'}
                {mode === 'timeline' && 'Timeline'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouping & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Agrupar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">Agenda Geral</SelectItem>
            <SelectItem value="professional">Por Profissional</SelectItem>
            <SelectItem value="room">Por Sala</SelectItem>
            <SelectItem value="specialty">Por Especialidade</SelectItem>
            <SelectItem value="type">Por Tipo</SelectItem>
            <SelectItem value="status">Por Status</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.professionalId || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, professionalId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.specialtyId || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, specialtyId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {specialties.map((spec) => (
              <SelectItem key={spec.id} value={spec.id}>
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.roomId || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, roomId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as salas</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.appointmentType || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, appointmentType: v === 'all' ? undefined : v as AppointmentType })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.paymentType || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, paymentType: v === 'all' ? undefined : v as PaymentType })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="convenio">Convênio</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.status || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? undefined : v as AppointmentStatus })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Limpar ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  );
}
