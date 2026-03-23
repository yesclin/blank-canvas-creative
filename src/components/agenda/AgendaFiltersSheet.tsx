import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Check, RotateCcw } from "lucide-react";
import type {
  Professional,
  Specialty,
  Room,
  AgendaFilters as FiltersType,
  AppointmentStatus,
  AppointmentType,
} from "@/types/agenda";
import { statusLabels, typeLabels } from "@/types/agenda";

interface AgendaFiltersSheetProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  professionals: Professional[];
  specialties: Specialty[];
  rooms: Room[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AgendaFiltersSheet({
  filters,
  onFiltersChange,
  professionals,
  specialties,
  rooms,
  open,
  onOpenChange,
}: AgendaFiltersSheetProps) {
  // Local state for draft filters
  const [draftFilters, setDraftFilters] = useState(filters);

  // Sync draft with actual filters when sheet opens
  useEffect(() => {
    if (open) {
      setDraftFilters(filters);
    }
  }, [open, filters]);

  const activeFiltersCount = [
    filters.professionalId,
    filters.specialtyId,
    filters.roomId,
    filters.appointmentType,
    filters.status,
  ].filter(Boolean).length;

  const draftFiltersCount = [
    draftFilters.professionalId,
    draftFilters.specialtyId,
    draftFilters.roomId,
    draftFilters.appointmentType,
    draftFilters.status,
  ].filter(Boolean).length;

  const clearDraftFilters = () => {
    setDraftFilters({
      ...draftFilters,
      professionalId: undefined,
      specialtyId: undefined,
      roomId: undefined,
      appointmentType: undefined,
      status: undefined,
    });
  };

  const applyFilters = () => {
    onFiltersChange(draftFilters);
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    setDraftFilters(filters);
    onOpenChange?.(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros da Agenda
          </SheetTitle>
          <SheetDescription>
            Configure os filtros e clique em Aplicar para visualizar
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Professional */}
          <div className="space-y-2">
            <Label htmlFor="filter-professional">Profissional</Label>
            <Select
              value={draftFilters.professionalId || "all"}
              onValueChange={(v) =>
                setDraftFilters({
                  ...draftFilters,
                  professionalId: v === "all" ? undefined : v,
                })
              }
            >
              <SelectTrigger id="filter-professional">
                <SelectValue placeholder="Todos os profissionais" />
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
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label htmlFor="filter-specialty">Especialidade</Label>
            <Select
              value={draftFilters.specialtyId || "all"}
              onValueChange={(v) =>
                setDraftFilters({
                  ...draftFilters,
                  specialtyId: v === "all" ? undefined : v,
                })
              }
            >
              <SelectTrigger id="filter-specialty">
                <SelectValue placeholder="Todas as especialidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as especialidades</SelectItem>
                {specialties.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label htmlFor="filter-room">Sala</Label>
            <Select
              value={draftFilters.roomId || "all"}
              onValueChange={(v) =>
                setDraftFilters({
                  ...draftFilters,
                  roomId: v === "all" ? undefined : v,
                })
              }
            >
              <SelectTrigger id="filter-room">
                <SelectValue placeholder="Todas as salas" />
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
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="filter-type">Tipo de Atendimento</Label>
            <Select
              value={draftFilters.appointmentType || "all"}
              onValueChange={(v) =>
                setDraftFilters({
                  ...draftFilters,
                  appointmentType: v === "all" ? undefined : (v as AppointmentType),
                })
              }
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Todos os tipos" />
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
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={draftFilters.status || "all"}
              onValueChange={(v) =>
                setDraftFilters({
                  ...draftFilters,
                  status: v === "all" ? undefined : (v as AppointmentStatus),
                })
              }
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Todos os status" />
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
          </div>

          {/* Clear button */}
          {draftFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDraftFilters}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar todos os filtros
            </Button>
          )}
        </div>

        <SheetFooter className="border-t pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Aplicar
            {draftFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {draftFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
