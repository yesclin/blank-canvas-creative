import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import type { Room } from "@/types/agenda";

/**
 * Salas da clínica — reutiliza as tabelas existentes `rooms` e
 * `professional_authorized_rooms` (sem criar estruturas duplicadas).
 * Todo acesso é isolado por clinic_id (além da RLS já existente).
 */
export function useClinicRooms(includeInactive = true) {
  const { scope } = useActiveClinicScope();
  const clinicId = scope.clinicId;

  return useQuery({
    queryKey: ["clinic-rooms", clinicId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("id, clinic_id, name, description, is_active")
        .eq("clinic_id", clinicId!)
        .order("name");

      if (!includeInactive) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Room[];
    },
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export interface RoomAuthorizationRow {
  id: string;
  room_id: string;
  professional_id: string;
}

/**
 * Autorizações de profissionais por sala (todas as salas da clínica atual).
 * Sala sem nenhuma autorização = liberada para todos os profissionais.
 */
export function useRoomAuthorizations() {
  const { scope } = useActiveClinicScope();
  const clinicId = scope.clinicId;

  return useQuery({
    queryKey: ["room-authorizations", clinicId],
    queryFn: async () => {
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .eq("clinic_id", clinicId!);
      if (roomsError) throw roomsError;

      const roomIds = (rooms || []).map((r) => r.id);
      if (!roomIds.length) return [] as RoomAuthorizationRow[];

      const { data, error } = await supabase
        .from("professional_authorized_rooms")
        .select("id, room_id, professional_id")
        .in("room_id", roomIds);
      if (error) throw error;
      return (data || []) as RoomAuthorizationRow[];
    },
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

/** Mapa room_id -> professional_ids autorizados (vazio = todos permitidos) */
export function buildRoomAuthorizationMap(rows: RoomAuthorizationRow[] = []) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.room_id) || [];
    list.push(row.professional_id);
    map.set(row.room_id, list);
  }
  return map;
}

export function useManageClinicRooms() {
  const queryClient = useQueryClient();
  const { scope } = useActiveClinicScope();
  const clinicId = scope.clinicId;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["clinic-rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room-authorizations"] });
    queryClient.invalidateQueries({ queryKey: ["rooms-list"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const createRoom = useMutation({
    mutationFn: async (payload: { name: string; description?: string | null; is_active?: boolean }) => {
      if (!clinicId) throw new Error("Clínica não identificada");
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          clinic_id: clinicId,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          is_active: payload.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Sala cadastrada");
    },
    onError: (error: Error) => toast.error("Erro ao cadastrar sala: " + error.message),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string | null; is_active?: boolean }) => {
      if (!clinicId) throw new Error("Clínica não identificada");
      const { error } = await supabase
        .from("rooms")
        .update({
          ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
          ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
          ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Sala atualizada");
    },
    onError: (error: Error) => toast.error("Erro ao atualizar sala: " + error.message),
  });

  /**
   * Exclusão segura: só remove se nenhum agendamento (histórico) usa a sala.
   * Caso contrário orienta a inativação, preservando o histórico.
   */
  const deleteRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!clinicId) throw new Error("Clínica não identificada");

      const { count, error: countError } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("room_id", roomId);
      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        throw new Error("ROOM_IN_USE");
      }

      await supabase.from("professional_authorized_rooms").delete().eq("room_id", roomId);

      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId)
        .eq("clinic_id", clinicId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Sala excluída");
    },
    onError: (error: Error) => {
      if (error.message === "ROOM_IN_USE") {
        toast.error("Esta sala possui agendamentos no histórico. Inative a sala em vez de excluir.");
        return;
      }
      toast.error("Erro ao excluir sala: " + error.message);
    },
  });

  const setRoomProfessionals = useMutation({
    mutationFn: async ({ roomId, professionalIds }: { roomId: string; professionalIds: string[] }) => {
      const { data: current, error: currentError } = await supabase
        .from("professional_authorized_rooms")
        .select("id, professional_id")
        .eq("room_id", roomId);
      if (currentError) throw currentError;

      const currentIds = (current || []).map((r) => r.professional_id);
      const toAdd = professionalIds.filter((id) => !currentIds.includes(id));
      const toRemove = (current || []).filter((r) => !professionalIds.includes(r.professional_id));

      if (toRemove.length) {
        const { error } = await supabase
          .from("professional_authorized_rooms")
          .delete()
          .in("id", toRemove.map((r) => r.id));
        if (error) throw error;
      }

      if (toAdd.length) {
        const { error } = await supabase
          .from("professional_authorized_rooms")
          .insert(toAdd.map((professional_id) => ({ room_id: roomId, professional_id })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Profissionais autorizados atualizados");
    },
    onError: (error: Error) => toast.error("Erro ao salvar autorizações: " + error.message),
  });

  return { createRoom, updateRoom, deleteRoom, setRoomProfessionals };
}
