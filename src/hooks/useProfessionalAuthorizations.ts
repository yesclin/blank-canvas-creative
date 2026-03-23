import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";

export interface ProfessionalSchedule {
  id: string;
  professional_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AuthorizedProcedure {
  id: string;
  professional_id: string;
  procedure_id: string;
  clinic_id: string;
  procedure?: {
    id: string;
    name: string;
    specialty_id: string;
  };
}

export interface AuthorizedRoom {
  id: string;
  professional_id: string;
  room_id: string;
  clinic_id: string;
  room?: {
    id: string;
    name: string;
  };
}

// Day of week labels in Portuguese
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

/**
 * Hook to fetch professional's schedule (agenda_ativa)
 */
export function useProfessionalSchedule(professionalId: string | null) {
  return useQuery({
    queryKey: ["professional-schedule", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("professional_id", professionalId)
        .order("day_of_week");
      
      if (error) throw error;
      return data as ProfessionalSchedule[];
    },
    enabled: !!professionalId,
  });
}

/**
 * Hook to manage professional's schedule
 */
export function useManageProfessionalSchedule() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();

  const upsertSchedule = useMutation({
    mutationFn: async (schedule: Omit<ProfessionalSchedule, "id">) => {
      const { data, error } = await supabase
        .from("professional_schedules")
        .upsert({
          ...schedule,
          clinic_id: clinic?.id,
        }, {
          onConflict: "professional_id,day_of_week",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-schedule", variables.professional_id] 
      });
      toast.success("Horário atualizado");
    },
    onError: (error: Error) => {
      console.error("Error updating schedule:", error);
      toast.error("Erro ao atualizar horário");
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async ({ professionalId, dayOfWeek }: { professionalId: string; dayOfWeek: number }) => {
      const { error } = await supabase
        .from("professional_schedules")
        .delete()
        .eq("professional_id", professionalId)
        .eq("day_of_week", dayOfWeek);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-schedule", variables.professionalId] 
      });
      toast.success("Horário removido");
    },
    onError: (error: Error) => {
      console.error("Error deleting schedule:", error);
      toast.error("Erro ao remover horário");
    },
  });

  return { upsertSchedule, deleteSchedule };
}

/**
 * Hook to fetch professional's authorized procedures
 */
export function useProfessionalAuthorizedProcedures(professionalId: string | null) {
  return useQuery({
    queryKey: ["professional-authorized-procedures", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("professional_authorized_procedures")
        .select(`
          id,
          professional_id,
          procedure_id,
          clinic_id,
          procedure:procedures(id, name, specialty_id)
        `)
        .eq("professional_id", professionalId);
      
      if (error) throw error;
      return data as AuthorizedProcedure[];
    },
    enabled: !!professionalId,
  });
}

/**
 * Hook to manage professional's authorized procedures
 */
export function useManageAuthorizedProcedures() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();

  const addProcedure = useMutation({
    mutationFn: async ({ professionalId, procedureId }: { professionalId: string; procedureId: string }) => {
      const { data, error } = await supabase
        .from("professional_authorized_procedures")
        .insert({
          professional_id: professionalId,
          procedure_id: procedureId,
          clinic_id: clinic?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-authorized-procedures", variables.professionalId] 
      });
      toast.success("Procedimento autorizado");
    },
    onError: (error: Error) => {
      console.error("Error adding procedure:", error);
      if (error.message.includes("especialidade")) {
        toast.error("O procedimento não é da especialidade do profissional");
      } else {
        toast.error("Erro ao autorizar procedimento");
      }
    },
  });

  const removeProcedure = useMutation({
    mutationFn: async ({ professionalId, procedureId }: { professionalId: string; procedureId: string }) => {
      const { error } = await supabase
        .from("professional_authorized_procedures")
        .delete()
        .eq("professional_id", professionalId)
        .eq("procedure_id", procedureId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-authorized-procedures", variables.professionalId] 
      });
      toast.success("Autorização removida");
    },
    onError: (error: Error) => {
      console.error("Error removing procedure:", error);
      toast.error("Erro ao remover autorização");
    },
  });

  return { addProcedure, removeProcedure };
}

/**
 * Hook to fetch professional's authorized rooms
 */
export function useProfessionalAuthorizedRooms(professionalId: string | null) {
  return useQuery({
    queryKey: ["professional-authorized-rooms", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("professional_authorized_rooms")
        .select(`
          id,
          professional_id,
          room_id,
          clinic_id,
          room:rooms(id, name)
        `)
        .eq("professional_id", professionalId);
      
      if (error) throw error;
      return data as AuthorizedRoom[];
    },
    enabled: !!professionalId,
  });
}

/**
 * Hook to manage professional's authorized rooms
 */
export function useManageAuthorizedRooms() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();

  const addRoom = useMutation({
    mutationFn: async ({ professionalId, roomId }: { professionalId: string; roomId: string }) => {
      const { data, error } = await supabase
        .from("professional_authorized_rooms")
        .insert({
          professional_id: professionalId,
          room_id: roomId,
          clinic_id: clinic?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-authorized-rooms", variables.professionalId] 
      });
      toast.success("Sala autorizada");
    },
    onError: (error: Error) => {
      console.error("Error adding room:", error);
      toast.error("Erro ao autorizar sala");
    },
  });

  const removeRoom = useMutation({
    mutationFn: async ({ professionalId, roomId }: { professionalId: string; roomId: string }) => {
      const { error } = await supabase
        .from("professional_authorized_rooms")
        .delete()
        .eq("professional_id", professionalId)
        .eq("room_id", roomId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-authorized-rooms", variables.professionalId] 
      });
      toast.success("Autorização de sala removida");
    },
    onError: (error: Error) => {
      console.error("Error removing room:", error);
      toast.error("Erro ao remover autorização de sala");
    },
  });

  return { addRoom, removeRoom };
}

/**
 * Hook to check if professional can perform a procedure
 */
export function useCanPerformProcedure(professionalId: string | null, procedureId: string | null) {
  return useQuery({
    queryKey: ["can-perform-procedure", professionalId, procedureId],
    queryFn: async () => {
      if (!professionalId || !procedureId) return false;
      
      const { data, error } = await supabase
        .rpc("can_professional_perform_procedure", {
          _professional_id: professionalId,
          _procedure_id: procedureId,
        });
      
      if (error) {
        console.error("Error checking procedure authorization:", error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!professionalId && !!procedureId,
  });
}

/**
 * Hook to get procedures available for a professional based on their specialties
 */
export function useAvailableProceduresForProfessional(professionalId: string | null) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["available-procedures-for-professional", professionalId, clinic?.id],
    queryFn: async () => {
      if (!professionalId || !clinic?.id) return [];
      
      // First get the professional's specialties
      const { data: specialties, error: specError } = await supabase
        .from("professional_specialties")
        .select("specialty_id")
        .eq("professional_id", professionalId);
      
      if (specError) throw specError;
      if (!specialties?.length) return [];
      
      const specialtyIds = specialties.map(s => s.specialty_id);
      
      // Then get procedures for those specialties
      const { data: procedures, error: procError } = await supabase
        .from("procedures")
        .select("id, name, specialty_id, duration_minutes, price")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .in("specialty_id", specialtyIds)
        .order("name");
      
      if (procError) throw procError;
      return procedures;
    },
    enabled: !!professionalId && !!clinic?.id,
  });
}
