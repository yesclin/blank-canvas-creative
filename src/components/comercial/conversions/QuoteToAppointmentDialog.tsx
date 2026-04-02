import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarPlus } from "lucide-react";
import { useConvertQuoteToAppointment, type QuoteToAppointmentData } from "@/hooks/crm/useConversions";
import { useCrmProfessionals, useCrmSpecialties } from "@/hooks/crm/useCrmOptions";
import type { CrmQuote } from "@/types/quote";

interface QuoteToAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: CrmQuote | null;
}

export function QuoteToAppointmentDialog({ open, onOpenChange, quote }: QuoteToAppointmentDialogProps) {
  const convert = useConvertQuoteToAppointment();
  const { data: professionals } = useCrmProfessionals();
  const { data: specialties } = useCrmSpecialties();

  const [form, setForm] = useState({
    scheduledDate: "",
    startTime: "09:00",
    durationMinutes: "30",
    professionalId: "",
    specialtyId: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (!quote) return null;

  const patientId = quote.patient_id;
  const patientName = quote.patient?.full_name || quote.lead?.name || "—";

  // Calculate end time from start + duration
  const calcEndTime = () => {
    const [h, m] = form.startTime.split(":").map(Number);
    const dur = parseInt(form.durationMinutes) || 30;
    const totalMin = h * 60 + m + dur;
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  };

  const canSubmit = !!patientId && !!form.professionalId && !!form.scheduledDate && !!form.startTime;

  const handleSubmit = async () => {
    if (!canSubmit || !patientId) return;

    const payload: QuoteToAppointmentData = {
      quoteId: quote.id,
      opportunityId: quote.opportunity_id || undefined,
      patientId,
      professionalId: form.professionalId,
      specialtyId: form.specialtyId || undefined,
      procedureId: quote.items?.[0]?.procedure_id || undefined,
      scheduledDate: form.scheduledDate,
      startTime: form.startTime,
      endTime: calcEndTime(),
      durationMinutes: parseInt(form.durationMinutes) || 30,
      expectedValue: Number(quote.final_value) || undefined,
      notes: form.notes.trim() || undefined,
    };

    await convert.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" /> Converter em Agendamento
          </DialogTitle>
          <DialogDescription>
            Criar agendamento a partir do orçamento <strong>{quote.quote_number}</strong>.
          </DialogDescription>
        </DialogHeader>

        {!patientId ? (
          <div className="text-sm text-destructive py-4">
            Este orçamento não possui um paciente vinculado. Converta o lead em paciente primeiro.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Paciente</Label>
              <p className="text-sm font-medium">{patientName}</p>
            </div>

            <div>
              <Label>Profissional *</Label>
              <Select value={form.professionalId} onValueChange={v => set("professionalId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(professionals || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Especialidade</Label>
              <Select value={form.specialtyId} onValueChange={v => set("specialtyId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" min={5} max={480} value={form.durationMinutes} onChange={e => set("durationMinutes", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Valor: R$ {Number(quote.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Label>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} maxLength={1000} placeholder={`Ref. orçamento ${quote.quote_number}`} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {patientId && (
            <Button onClick={handleSubmit} disabled={!canSubmit || convert.isPending}>
              {convert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Agendamento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
