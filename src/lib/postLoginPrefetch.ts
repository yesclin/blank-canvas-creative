/**
 * Pré-carregamento pós-login.
 *
 * Objetivo: assim que o usuário entra, disparar EM PARALELO as queries que
 * praticamente toda tela do app usa (specialties, procedures, professionals,
 * rooms, payment methods, insurances) e gravá-las no cache do React Query
 * com o MESMO queryKey que os hooks consomem. Resultado: ao abrir Agenda,
 * Pacientes, Atendimento ou Configurações pela primeira vez, os dados já
 * estão prontos — nada de "loading global" em navegação simples.
 *
 * Tudo passa por `Promise.allSettled`: se uma falhar, o redirect não trava.
 */
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE = 5 * 60_000;

type PrefetchInput = {
  queryClient: QueryClient;
  userId: string;
  clinicId: string;
};

export async function prefetchEssentialClinicData({ queryClient, userId, clinicId }: PrefetchInput) {
  const tasks: Array<Promise<unknown>> = [
    queryClient.prefetchQuery({
      queryKey: ["specialties-list", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("specialties")
          .select("id, clinic_id, name, description, color, is_active")
          .eq("is_active", true)
          .eq("clinic_id", clinicId)
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["procedures", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("procedures")
          .select("id, name, price, duration_minutes, clinic_id, is_active")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["professionals", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("professionals")
          .select("id, clinic_id, user_id, full_name, email, phone, specialty_id, registration_number, avatar_url, color, is_active")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("full_name");
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["rooms-list", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("rooms")
          .select("id, clinic_id, name, is_active")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["insurances-list", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("insurances")
          .select("id, clinic_id, name, ans_code, is_active")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["payment-methods", clinicId],
      staleTime: STALE,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
    }),
  ];

  await Promise.allSettled(tasks);
}
