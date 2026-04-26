import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InvitationDeliveryStatus =
  | "pending"
  | "sent"
  | "email_failed"
  | "accepted"
  | "expired"
  | "cancelled";

export interface UserInvitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  /** UI-only: derived delivery state (sent / email_failed) tracked in memory. */
  delivery_status?: InvitationDeliveryStatus;
  /** UI-only: accept URL kept locally so the admin can copy when email fails. */
  accept_url?: string;
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
  // When set, the edge function reuses the existing invitation (same token)
  // instead of creating a new one. Used by the "Reenviar convite" action.
  invitationId?: string;
}

export function useUserInvitations(clinicId: string | null) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // UI-only delivery metadata keyed by invitation id (resets on reload).
  const [deliveryMeta, setDeliveryMeta] = useState<
    Record<string, { delivery_status: InvitationDeliveryStatus; accept_url?: string }>
  >({});

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

      const now = Date.now();
      const enriched = (data || []).map((inv) => {
        const meta = deliveryMeta[inv.id];
        // Default delivery status: derive from db status + expiry
        let delivery: InvitationDeliveryStatus;
        if (inv.status === "accepted") delivery = "accepted";
        else if (inv.status === "cancelled") delivery = "cancelled";
        else if (inv.status === "expired") delivery = "expired";
        else if (inv.expires_at && new Date(inv.expires_at).getTime() < now) delivery = "expired";
        else if (meta?.delivery_status) delivery = meta.delivery_status;
        else delivery = "pending";

        return {
          ...inv,
          delivery_status: delivery,
          accept_url: meta?.accept_url,
        } as UserInvitation;
      });

      setInvitations(enriched);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, deliveryMeta]);

  const sendInvite = useCallback(async (data: SendInviteData): Promise<boolean> => {
    // Guard: prevent concurrent submissions even if the caller forgets.
    if (isSending) {
      console.warn("[send-invite] envio já em andamento, ignorando clique duplicado");
      return false;
    }

    setIsSending(true);
    console.log("[send-invite] payload:", data);

    // 15s hard timeout so the button can never get stuck on "Enviando...".
    const TIMEOUT_MS = 15000;
    let timedOut = false;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error(
          "Não foi possível enviar o convite. Tente novamente ou copie o link manualmente."
        ));
      }, TIMEOUT_MS);
    });

    try {
      const invokePromise = supabase.functions.invoke("send-invite", { body: data });

      const { data: result, error } = await Promise.race([
        invokePromise,
        timeoutPromise,
      ]) as { data: any; error: any };

      console.log("[send-invite] response:", { result, error });

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
        console.error("[send-invite] error:", error, "detalhe:", detail);
        throw new Error(detail || "Erro ao enviar convite");
      }

      if (result?.error) {
        console.error("[send-invite] error de domínio:", result.error);
        throw new Error(result.error);
      }

      // Email failed but invitation was created — show copyable link.
      if (result?.warning === "email_delivery_failed" && result?.accept_url) {
        if (result.invitation_id) {
          setDeliveryMeta((prev) => ({
            ...prev,
            [result.invitation_id]: {
              delivery_status: "email_failed",
              accept_url: result.accept_url,
            },
          }));
        }
        toast.warning("Convite criado, mas o e-mail não foi enviado", {
          description: `Copie o link manualmente: ${result.accept_url}`,
          duration: 20000,
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

      // Email sent successfully
      if (result?.invitation_id) {
        setDeliveryMeta((prev) => ({
          ...prev,
          [result.invitation_id]: {
            delivery_status: "sent",
            accept_url: result.accept_url,
          },
        }));
      }
      toast.success("Convite enviado com sucesso!");
      await fetchInvitations();
      return true;
    } catch (err: any) {
      console.error("[send-invite] error:", err);
      toast.error(
        timedOut ? "Tempo esgotado ao enviar convite" : "Erro ao enviar convite",
        {
          description: err?.message || "Tente novamente em instantes.",
        }
      );
      return false;
    } finally {
      setIsSending(false);
    }
  }, [fetchInvitations, isSending]);

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
    // Reuse the existing invitation (same token) — the edge function will
    // refresh expires_at if it has expired. We do NOT cancel the old one.
    return sendInvite({
      email: invitation.email,
      fullName: invitation.full_name,
      role: invitation.role,
      invitationId: invitation.id,
    });
  }, [sendInvite]);

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
