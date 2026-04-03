import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Link2, Send, RefreshCw, CheckCircle2, Clock, Eye, FileText, AlertTriangle } from "lucide-react";
import { usePreRegistrationLink, useCreatePreRegistrationLink, getPreRegistrationUrl } from "@/hooks/usePreRegistration";
import { toast } from "sonner";

interface PreRegistrationSectionProps {
  appointmentId: string;
  clinicId: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviado", icon: Send, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  opened: { label: "Visualizado", icon: Eye, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  submitted: { label: "Preenchido", icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  expired: { label: "Expirado", icon: AlertTriangle, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  canceled: { label: "Cancelado", icon: AlertTriangle, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function PreRegistrationSection({
  appointmentId,
  clinicId,
  patientId,
  patientName,
  patientPhone,
  patientEmail,
}: PreRegistrationSectionProps) {
  const { data: link, isLoading } = usePreRegistrationLink(appointmentId);
  const createLink = useCreatePreRegistrationLink();

  const handleGenerate = () => {
    createLink.mutate({
      clinicId,
      appointmentId,
      patientId,
      patientName,
      patientPhone,
      patientEmail,
    });
  };

  const handleCopy = () => {
    if (!link) return;
    const url = getPreRegistrationUrl(link.token);
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleWhatsApp = () => {
    if (!link) return;
    const url = getPreRegistrationUrl(link.token);
    const phone = patientPhone?.replace(/\D/g, "") || "";
    const message = encodeURIComponent(
      `Olá${patientName ? `, ${patientName.split(" ")[0]}` : ""}! Para agilizar seu atendimento, preencha seu pré-cadastro pelo link:\n${url}`
    );
    const waUrl = phone
      ? `https://wa.me/55${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(waUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const isExpired = link && new Date(link.expires_at) < new Date();
  const effectiveStatus = isExpired && link.status === "pending" ? "expired" : link?.status;
  const config = effectiveStatus ? statusConfig[effectiveStatus] : null;
  const canRegenerate = !link || effectiveStatus === "expired" || effectiveStatus === "canceled";

  return (
    <div className="space-y-2">
      {link && config ? (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-[10px] gap-1 ${config.color}`}>
              <config.icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {link.expires_at && (
              <span className="text-[10px] text-muted-foreground">
                Expira: {new Date(link.expires_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          {effectiveStatus !== "submitted" && (
            <div className="grid grid-cols-3 gap-1.5">
              {!canRegenerate && (
                <>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={handleCopy}>
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={handleWhatsApp}>
                    <Send className="h-3 w-3" /> WhatsApp
                  </Button>
                </>
              )}
              {canRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7 col-span-3"
                  onClick={handleGenerate}
                  disabled={createLink.isPending}
                >
                  {createLink.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Regerar Link
                </Button>
              )}
            </div>
          )}

          {effectiveStatus === "submitted" && link.submitted_at && (
            <p className="text-[10px] text-green-600">
              Preenchido em {new Date(link.submitted_at).toLocaleString("pt-BR")}
            </p>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs w-full h-8"
          onClick={handleGenerate}
          disabled={createLink.isPending}
        >
          {createLink.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          Gerar Link de Pré-cadastro
        </Button>
      )}
    </div>
  );
}
