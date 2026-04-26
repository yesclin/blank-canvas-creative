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

      // Network / preflight / non-2xx: surface the real cause from the
      // FunctionsHttpError context body instead of the generic
      // "Failed to send a request to the Edge Function".
      if (error) {
        let detail = error.message;
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          } catch {
            try {
              const text = await ctx.text();
              if (text) detail = text;
            } catch { /* ignore */ }
          }
        }
        console.error("[send-invite] erro:", error, "detalhe:", detail);
        throw new Error(detail || "Erro ao enviar convite");
      }

      if (result?.error) {
        console.error("[send-invite] erro de domínio:", result.error);
        throw new Error(result.error);
      }

      // Email failed but invitation was created — show copyable link.
      if (result?.warning === "email_delivery_failed" && result?.accept_url) {
        toast.warning("Convite criado, mas o email falhou", {
          description: `Copie o link e envie manualmente: ${result.accept_url}`,
          duration: 15000,
          action: {
            label: "Copiar link",
            onClick: () => {
              navigator.clipboard.writeText(result.accept_url).then(
                () => toast.success("Link copiado"),
                () => toast.error("Não foi possível copiar")
              );
            },
          },
        });
        await fetchInvitations();
        return true;
      }

      toast.success("Convite enviado com sucesso!");
      await fetchInvitations();
      return true;
    } catch (err: any) {
      console.error("[send-invite] erro:", err);
      toast.error("Erro ao enviar convite", {
        description: err?.message || "Tente novamente em instantes.",
      });
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
