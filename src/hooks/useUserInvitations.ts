import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TimeoutError, withTimeout } from "@/lib/asyncTimeout";

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
      const { data, error } = await withTimeout<any>(supabase
        .from("user_invitations")
        .select("id, email, full_name, role, status, created_at, expires_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false }));

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
      console.error("[send-invite] erro ao listar convites:", err);
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

    try {
      const { data: result, error } = await withTimeout<any>(
        supabase.functions.invoke("send-invite", { body: data }),
        15000,
        "Tempo esgotado ao enviar convite. Tente novamente ou copie o link manualmente."
      );

      // Extract correlation ids when present (server should return one of these).
      const corrId =
        result?.requestId ??
        result?.request_id ??
        result?.correlationId ??
        result?.correlation_id ??
        null;
      if (corrId) {
        console.log("[send-invite] correlationId:", corrId);
      }
      console.log("[send-invite] response:", { result, error });

      // Network / preflight / non-2xx: surface the real cause from the
      // FunctionsHttpError context body instead of the generic
      // "Failed to send a request to the Edge Function".
      if (error) {
        let detail: string = error.message;
        let errorPayload: any = null;
        let errorCorrId: string | null = null;
        let httpStatus: number | null = null;
        const ctx = (error as any).context;
        if (ctx) {
          httpStatus = ctx.status ?? ctx.response?.status ?? null;
          if (typeof ctx.json === "function") {
            try {
              errorPayload = await ctx.json();
              if (errorPayload?.error) detail = errorPayload.error;
              errorCorrId =
                errorPayload?.requestId ??
                errorPayload?.request_id ??
                errorPayload?.correlationId ??
                errorPayload?.correlation_id ??
                null;
            } catch {
              try {
                const text = await ctx.text();
                if (text) {
                  detail = text;
                  errorPayload = { raw: text };
                }
              } catch { /* ignore */ }
            }
          }
        }
        // Structured log so the dev can grep for the correlation id quickly.
        console.error("[send-invite] error:", {
          message: error.message,
          httpStatus,
          correlationId: errorCorrId,
          payload: errorPayload,
          raw: error,
        });

        const richError = new Error(detail || "Erro ao enviar convite");
        (richError as any).payload = errorPayload;
        (richError as any).correlationId = errorCorrId;
        (richError as any).httpStatus = httpStatus;
        throw richError;
      }

      if (result?.error) {
        console.error("[send-invite] error de domínio:", {
          error: result.error,
          correlationId: corrId,
          payload: result,
        });
        const richError = new Error(result.error);
        (richError as any).payload = result;
        (richError as any).correlationId = corrId;
        throw richError;
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
          description: `Link de aceite (copie e envie manualmente):\n${result.accept_url}`,
          duration: 30000,
          closeButton: true,
          action: {
            label: "Copiar link",
            onClick: () => {
              navigator.clipboard.writeText(result.accept_url).then(
                () => toast.success("Link de aceite copiado"),
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
      const correlationId = err?.correlationId ?? null;
      const httpStatus = err?.httpStatus ?? null;
      const payload = err?.payload ?? null;
      const timedOut = err instanceof TimeoutError;

      console.error("[send-invite] error:", {
        message: err?.message,
        correlationId,
        httpStatus,
        payload,
        raw: err,
      });

      // Build a compact, copy-friendly summary for the toast description.
      const summaryLines: string[] = [];
      if (err?.message) summaryLines.push(err.message);
      if (httpStatus) summaryLines.push(`HTTP ${httpStatus}`);
      if (correlationId) summaryLines.push(`ID: ${correlationId}`);
      if (payload && typeof payload === "object") {
        const compact = JSON.stringify(payload);
        summaryLines.push(
          compact.length > 240 ? `Payload: ${compact.slice(0, 240)}…` : `Payload: ${compact}`
        );
      }
      const description = summaryLines.length > 0
        ? summaryLines.join("\n")
        : "Tente novamente em instantes.";

      toast.error(
        timedOut ? "Tempo esgotado ao enviar convite" : "Erro ao enviar convite",
        {
          description,
          duration: 12000,
          closeButton: true,
          ...(correlationId
            ? {
                action: {
                  label: "Copiar ID",
                  onClick: () => {
                    navigator.clipboard.writeText(correlationId).then(
                      () => toast.success("ID de correlação copiado"),
                      () => toast.error("Não foi possível copiar")
                    );
                  },
                },
              }
            : {}),
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
