import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export type AppointmentStatus = 
  | "nao_confirmado"
  | "confirmado"
  | "chegou"
  | "em_atendimento"
  | "finalizado"
  | "faltou"
  | "cancelado";

export type AppointmentType = "consulta" | "retorno" | "procedimento";

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  room_id: string | null;
  specialty_id: string | null;
  insurance_id: string | null;
  procedure_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  is_first_visit: boolean;
  is_return: boolean;
  has_pending_payment: boolean;
  is_fit_in: boolean;
  notes: string | null;
  payment_type: string | null;
  arrived_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  patients?: { id: string; full_name: string; phone: string | null; has_clinical_alert: boolean; clinical_alert_text: string | null };
  professionals?: { id: string; full_name: string; color: string | null };
  rooms?: { id: string; name: string } | null;
  specialties?: { id: string; name: string; color: string | null } | null;
  insurances?: { id: string; name: string } | null;
  procedures?: { id: string; name: string } | null;
}

export interface AppointmentFormData {
  patient_id: string;
  professional_id: string;
  scheduled_date: Date;
  start_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  payment_type: string;
  specialty_id?: string;
  room_id?: string;
  insurance_id?: string;
  procedure_id?: string;
  notes?: string;
  is_fit_in?: boolean;
  is_first_visit?: boolean;
  is_return?: boolean;
}

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

// Fetch appointments for a date range
export function useAppointments(startDate: Date, endDate?: Date) {
  const start = format(startDate, "yyyy-MM-dd");
  const end = endDate ? format(endDate, "yyyy-MM-dd") : start;
  
  return useQuery({
    queryKey: ["appointments", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          procedure_cost,
          patients!inner(id, full_name, phone, has_clinical_alert, clinical_alert_text),
          professionals!inner(id, full_name, color),
          rooms(id, name),
          specialties(id, name, color),
          insurances(id, name),
          procedures(id, name)
        `)
        .gte("scheduled_date", start)
        .lte("scheduled_date", end)
        .order("scheduled_date")
        .order("start_time");
      
      if (error) throw error;
      return data as Appointment[];
    },
  });
}

// Fetch today's appointments
export function useTodayAppointments() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["appointments", "today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          procedure_cost,
          patients!inner(id, full_name, phone, has_clinical_alert, clinical_alert_text),
          professionals!inner(id, full_name, color),
          rooms(id, name),
          specialties(id, name, color),
          insurances(id, name),
          procedures(id, name)
        `)
        .eq("scheduled_date", today)
        .order("start_time");
      
      if (error) throw error;
      return data as Appointment[];
    },
  });
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const clinicId = await getClinicId();
      const endTime = calculateEndTime(data.start_time, data.duration_minutes);
      
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinicId,
          patient_id: data.patient_id,
          professional_id: data.professional_id,
          scheduled_date: format(data.scheduled_date, "yyyy-MM-dd"),
          start_time: data.start_time,
          end_time: endTime,
          duration_minutes: data.duration_minutes,
          appointment_type: data.appointment_type,
          payment_type: data.payment_type,
          specialty_id: data.specialty_id || null,
          room_id: data.room_id || null,
          insurance_id: data.insurance_id || null,
          procedure_id: data.procedure_id || null,
          notes: data.notes || null,
          is_fit_in: data.is_fit_in || false,
          is_first_visit: data.is_first_visit || false,
          is_return: data.is_return || data.appointment_type === "retorno",
          status: "nao_confirmado",
        })
        .select()
        .single();
      
      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating appointment:", error);
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });
}

// Update appointment status
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const updates: Record<string, unknown> = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      // Set timestamps based on status
      if (status === "chegou") {
        updates.arrived_at = new Date().toISOString();
      } else if (status === "em_atendimento") {
        updates.started_at = new Date().toISOString();
      } else if (status === "finalizado") {
        updates.finished_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;

      // Process product consumption and record historical cost when finalizing procedure
      // The RPC function process_procedure_product_consumption handles:
      // 1. Stock deduction (stock_movements)
      // 2. Material consumption tracking (material_consumption)
      // 3. Historical cost storage on appointment (procedure_cost)
      if (status === "finalizado") {
        interface ConsumptionResult {
          success: boolean;
          error?: string;
          message?: string;
          processed_count?: number;
          total_cost?: number;
          alerts_count?: number;
        }
        
        const { data: consumptionResult, error: consumptionError } = await supabase
          .rpc("process_procedure_product_consumption", { p_appointment_id: id }) as { 
            data: ConsumptionResult | null; 
            error: Error | null 
          };
        
        if (consumptionError) {
          console.error("Error processing product consumption:", consumptionError);
          // Don't throw - status update succeeded, just log the consumption error
        } else if (consumptionResult && !consumptionResult.success) {
          console.error("Product consumption failed:", consumptionResult.error);
        } else if (consumptionResult?.processed_count && consumptionResult.processed_count > 0) {
          console.log(`Procedure cost recorded: R$ ${consumptionResult.total_cost?.toFixed(2)} (${consumptionResult.processed_count} items)`);
        }
      }

      return { id, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      
      const statusLabels: Record<AppointmentStatus, string> = {
        nao_confirmado: "Não confirmado",
        confirmado: "Confirmado",
        chegou: "Chegou",
        em_atendimento: "Em atendimento",
        finalizado: "Finalizado",
        faltou: "Faltou",
        cancelado: "Cancelado",
      };
      
      toast.success(`Status atualizado para: ${statusLabels[result.status]}`);
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "cancelado", 
          cancellation_reason: reason || null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento cancelado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar agendamento: " + error.message);
    },
  });
}

// Reschedule appointment (update only date/time/duration/room)
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduled_date, start_time, duration_minutes, room_id }: {
      id: string;
      scheduled_date: Date;
      start_time: string;
      duration_minutes: number;
      room_id?: string | null;
    }) => {
      const endTime = calculateEndTime(start_time, duration_minutes);

      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_date: format(scheduled_date, "yyyy-MM-dd"),
          start_time,
          end_time: endTime,
          duration_minutes,
          room_id: room_id || null,
          status: "nao_confirmado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento reagendado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao reagendar: " + error.message);
    },
  });
}

// Fetch rooms for dropdown
export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

// NOTE: useSpecialties is now centralized in src/hooks/useSpecialties.ts
// Use that hook instead for clinic-filtered active specialties.

// Fetch procedures for dropdown
export function useProcedures() {
  return useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name, duration_minutes, price")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

// Get agenda stats
export function useAgendaStats(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["agenda-stats", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("status, is_fit_in")
        .eq("scheduled_date", dateStr);
      
      if (error) throw error;
      
      const totalAppointments = data.length;
      const absences = data.filter(a => a.status === "faltou").length;
      const fitIns = data.filter(a => a.is_fit_in).length;
      const completed = data.filter(a => a.status === "finalizado").length;
      const canceled = data.filter(a => a.status === "cancelado").length;
      
      // Assuming 24 slots per day (8h-18h with 30min slots for 3 professionals)
      const totalSlots = 24;
      const occupiedSlots = totalAppointments - canceled;
      
      return {
        totalAppointments,
        absences,
        fitIns,
        completed,
        freeSlots: Math.max(0, totalSlots - occupiedSlots),
        occupancyRate: Math.round((occupiedSlots / totalSlots) * 100),
      };
    },
  });
}
