import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserInvitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface SendInviteData {
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
  // Professional data
  isProfessional?: boolean;
  professionalType?: string;
  registrationNumber?: string;
  specialtyIds?: string[];
}

export function useUserInvitations(clinicId: string | null) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("id, email, full_name, role, status, created_at, expires_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  const sendInvite = useCallback(async (data: SendInviteData): Promise<boolean> => {
    setIsSending(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("send-invite", {
        body: data,
      });

      if (error) {
        throw new Error(error.message || "Erro ao enviar convite");
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Convite enviado com sucesso!");
      await fetchInvitations();
      return true;
    } catch (err: any) {
      console.error("Error sending invite:", err);
      toast.error(err.message || "Erro ao enviar convite");
      return false;
    } finally {
      setIsSending(false);
    }
  }, [fetchInvitations]);

  const cancelInvite = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("user_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Convite cancelado");
      await fetchInvitations();
      return true;
    } catch (err: any) {
      console.error("Error cancelling invite:", err);
      toast.error("Erro ao cancelar convite");
      return false;
    }
  }, [fetchInvitations]);

  const resendInvite = useCallback(async (invitation: UserInvitation): Promise<boolean> => {
    // Cancel the old one first
    await cancelInvite(invitation.id);

    // Send a new one
    return sendInvite({
      email: invitation.email,
      fullName: invitation.full_name,
      role: invitation.role,
    });
  }, [cancelInvite, sendInvite]);

  const pendingInvitations = invitations.filter(i => i.status === "pending");

  return {
    invitations,
    pendingInvitations,
    isLoading,
    isSending,
    fetchInvitations,
    sendInvite,
    cancelInvite,
    resendInvite,
  };
}
