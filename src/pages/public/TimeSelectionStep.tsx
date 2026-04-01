import { useState, useMemo } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { usePublicProfessionalAvailability } from "@/hooks/usePublicProfessionalAvailability";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, AlertCircle } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PublicSlot } from "@/services/publicAvailability";

export default function TimeSelectionStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const [searchParams] = useSearchParams();
  const professionalId = searchParams.get("professional") || "";
  const specialtyId = searchParams.get("specialty") || "";
  const navigate = useNavigate();

  const settings = clinic.public_booking_settings || {};
  const maxDays = settings.max_advance_days || 30;
  const minAdvanceHours = settings.min_advance_hours || 2;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);

  const dateStart = startOfDay(new Date());
  const dateEnd = addDays(dateStart, maxDays);

  const { data: result, isLoading } = usePublicProfessionalAvailability(
    professionalId
      ? {
          clinicId: clinic.id,
          professionalId,
          dateStart,
          dateEnd,
          minAdvanceHours,
        }
      : null
  );

  const slots = result?.slots || [];
  const emptyReason = result?.emptyReason;

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, PublicSlot[]>();
    for (const slot of slots) {
      const existing = map.get(slot.date) || [];
      existing.push(slot);
      map.set(slot.date, existing);
    }
    return map;
  }, [slots]);

  // Dates that have available slots
  const availableDates = useMemo(() => {
    return new Set(slotsByDate.keys());
  }, [slotsByDate]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const slotsForDay = selectedDateStr ? slotsByDate.get(selectedDateStr) || [] : [];

  const handleConfirm = () => {
    if (!selectedSlot) return;
    const params = new URLSearchParams();
    params.set("professional", professionalId);
    if (specialtyId) params.set("specialty", specialtyId);
    params.set("date", selectedSlot.date);
    params.set("start", selectedSlot.startTime);
    params.set("end", selectedSlot.endTime);
    navigate(`/agendar/${clinic.slug}/dados?${params.toString()}`);
  };

  if (!professionalId) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Profissional não selecionado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/agendar/${clinic.slug}`)}>
          Voltar
        </Button>
      </div>
    );
  }

  const renderEmptyState = () => {
    if (emptyReason === "no_schedules") {
      return (
        <div className="text-center py-12 space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-foreground font-medium">Este profissional ainda não possui horários configurados.</p>
          <p className="text-muted-foreground text-sm">Entre em contato com a clínica para mais informações.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      );
    }
    if (emptyReason === "all_blocked") {
      return (
        <div className="text-center py-12 space-y-3">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium">Não há horários disponíveis neste período.</p>
          <p className="text-muted-foreground text-sm">Tente novamente mais tarde ou escolha outro profissional.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      );
    }
    if (emptyReason === "config_error") {
      return (
        <div className="text-center py-12 space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">Não foi possível carregar a disponibilidade.</p>
          <p className="text-muted-foreground text-sm">Verifique a configuração da agenda da clínica.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Escolha data e horário</h2>
        <p className="text-muted-foreground text-sm">Selecione um dia e depois um horário disponível</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : emptyReason ? (
        renderEmptyState()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="rounded-xl border bg-card p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              disabled={(date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return !availableDates.has(dateStr);
              }}
              fromDate={new Date()}
              toDate={dateEnd}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </div>

          {/* Slots */}
          <div className="space-y-4">
            {selectedDate ? (
              slotsForDay.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    Horários disponíveis em{" "}
                    <span className="text-primary">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slotsForDay.map((slot) => (
                      <button
                        key={`${slot.date}-${slot.startTime}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          selectedSlot?.startTime === slot.startTime && selectedSlot?.date === slot.date
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhum horário disponível neste dia.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Selecione uma data no calendário.</p>
              </div>
            )}

            {selectedSlot && (
              <Button onClick={handleConfirm} className="w-full mt-4">
                Continuar com {selectedSlot.startTime} — {selectedSlot.endTime}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
