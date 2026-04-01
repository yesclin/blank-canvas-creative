import { useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PatientDataStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const professionalId = searchParams.get("professional") || "";
  const specialtyId = searchParams.get("specialty") || "";
  const dateStr = searchParams.get("date") || "";
  const startTime = searchParams.get("start") || "";
  const endTime = searchParams.get("end") || "";

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    cpf: "",
    birth_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.full_name.trim()) { toast.error("Nome completo é obrigatório"); return false; }
    if (!form.phone.trim()) { toast.error("Telefone é obrigatório"); return false; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Telefone inválido"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Re-check slot availability
      const { data: available } = await supabase.rpc("check_slot_available", {
        _clinic_id: clinic.id,
        _professional_id: professionalId,
        _scheduled_date: dateStr,
        _start_time: startTime,
        _end_time: endTime,
      });

      if (!available) {
        toast.error("Este horário acabou de ser ocupado. Por favor, escolha outro.");
        navigate(`/agendar/${clinic.slug}/horarios?professional=${professionalId}&specialty=${specialtyId}`);
        return;
      }

      // 2. Find or create patient
      const { data: patientId, error: patErr } = await supabase.rpc("find_or_create_public_patient", {
        _clinic_id: clinic.id,
        _full_name: form.full_name.trim(),
        _phone: form.phone.replace(/\D/g, ""),
        _email: form.email.trim() || null,
        _cpf: form.cpf.replace(/\D/g, "") || null,
        _birth_date: form.birth_date || null,
      });

      if (patErr || !patientId) {
        throw new Error("Erro ao registrar dados do paciente.");
      }

      // 3. Calculate duration
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);

      // 4. Generate booking reference
      const bookingRef = `PUB-${Date.now().toString(36).toUpperCase()}`;

      const settings = clinic.public_booking_settings || {};
      const initialStatus = settings.initial_status || "nao_confirmado";

      // 5. Create appointment
      const { error: apptErr } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          professional_id: professionalId,
          specialty_id: specialtyId || null,
          scheduled_date: dateStr,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status: initialStatus,
          created_source: "public_patient",
          booking_reference: bookingRef,
          appointment_type: "consulta",
          care_mode: "presencial",
          notes: "Agendamento realizado pelo link público da clínica.",
        });

      if (apptErr) {
        console.error("Appointment creation error:", apptErr);
        if (apptErr.message?.includes("row-level security")) {
          throw new Error("Agendamento online não está habilitado nesta clínica.");
        }
        throw new Error("Não foi possível criar o agendamento. Tente novamente.");
      }

      // 6. Navigate to confirmation
      const params = new URLSearchParams();
      params.set("ref", bookingRef);
      params.set("name", form.full_name);
      params.set("date", dateStr);
      params.set("start", startTime);
      params.set("end", endTime);
      navigate(`/agendar/${clinic.slug}/confirmacao?${params.toString()}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format display date
  let displayDate = dateStr;
  try {
    const d = new Date(dateStr + "T12:00:00");
    displayDate = format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Seus dados</h2>
        <p className="text-muted-foreground text-sm">Preencha suas informações para confirmar o agendamento</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border bg-primary/5 p-4 space-y-1 text-sm">
        <p><strong>Data:</strong> {displayDate}</p>
        <p><strong>Horário:</strong> {startTime} — {endTime}</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={form.cpf}
              onChange={(e) => updateField("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4" size="lg">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Confirmar Agendamento
        </Button>
      </div>
    </div>
  );
}
