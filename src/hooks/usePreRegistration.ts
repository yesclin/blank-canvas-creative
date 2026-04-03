import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function usePreRegistrationLink(appointmentId?: string | null) {
  return useQuery({
    queryKey: ["pre-registration-link", appointmentId],
    enabled: !!appointmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_pre_registration_links")
        .select("*")
        .eq("appointment_id", appointmentId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePreRegistrationLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      appointmentId,
      patientId,
      patientName,
      patientPhone,
      patientEmail,
    }: {
      clinicId: string;
      appointmentId?: string;
      patientId?: string;
      patientName?: string;
      patientPhone?: string;
      patientEmail?: string;
    }) => {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("patient_pre_registration_links")
        .insert({
          clinic_id: clinicId,
          appointment_id: appointmentId || null,
          patient_id: patientId || null,
          token,
          full_name: patientName || null,
          phone: patientPhone || null,
          email: patientEmail || null,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pre-registration-link", variables.appointmentId] });
      toast.success("Link de pré-cadastro gerado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao gerar link de pré-cadastro");
    },
  });
}

export function usePublicPreRegistration(token?: string) {
  return useQuery({
    queryKey: ["public-pre-registration", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pre_registration_by_token", {
        _token: token!,
      });
      if (error) throw error;
      return data as {
        id: string;
        clinic_id: string;
        patient_id: string | null;
        appointment_id: string | null;
        token: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
        status: string;
        expires_at: string;
        submitted_at: string | null;
        clinic_name: string;
        clinic_logo: string | null;
      } | null;
    },
  });
}

export function useSubmitPreRegistration() {
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: Record<string, any> }) => {
      const { data: result, error } = await supabase.rpc("submit_pre_registration", {
        _token: token,
        _data: data,
      });
      if (error) throw error;
      const res = result as { success: boolean; error?: string; patient_id?: string };
      if (!res.success) throw new Error(res.error || "Erro ao enviar pré-cadastro");
      return res;
    },
  });
}

export function getPreRegistrationUrl(token: string): string {
  return `${window.location.origin}/pre-cadastro/${token}`;
}
