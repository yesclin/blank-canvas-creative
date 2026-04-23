/**
 * SignatureAuditTrailDrawer
 *
 * Reusable drawer that shows the full audit trail of an Assinatura Avançada
 * YesClin for any signed document (consolidated_document, evolution, anamnesis).
 *
 * Sources of truth:
 *  - `medical_record_signatures` → evidence (hash, IP, UA, snapshot, method)
 *  - `medical_signature_events`  → timeline (signature_requested → signed)
 *
 * Used by Prontuário and Atendimento — single component, identical UX.
 */
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Clock,
  Globe,
  Monitor,
  Hash,
  PenTool,
  ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  User,
  KeyRound,
  Lock,
  FileText,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SignatureAuditTrailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string | null;
  clinicId: string | null;
}

interface SignatureRow {
  id: string;
  record_id: string;
  record_type: string;
  signed_at: string;
  signed_by_name: string | null;
  signature_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  sign_method: string | null;
  signature_level: string | null;
  evidence_snapshot: any;
  handwritten_path: string | null;
}

interface EventRow {
  id: string;
  event_type: string;
  metadata: any;
  created_at: string;
}

const EVENT_LABELS: Record<string, { label: string; icon: any; tone: string }> = {
  signature_requested: { label: "Documento aberto para assinatura", icon: FileText, tone: "text-muted-foreground" },
  reauth_passed: { label: "Identidade validada por senha", icon: KeyRound, tone: "text-blue-600" },
  reauth_failed: { label: "Falha na reautenticação", icon: AlertTriangle, tone: "text-destructive" },
  document_hashed: { label: "Hash SHA-256 do documento gerado", icon: Hash, tone: "text-blue-600" },
  document_signed: { label: "Documento assinado e travado", icon: Lock, tone: "text-green-600" },
  pdf_generated: { label: "PDF assinado gerado", icon: FileCheck, tone: "text-muted-foreground" },
  public_validation_viewed: { label: "Validação pública consultada", icon: Globe, tone: "text-muted-foreground" },
  signature_revoked: { label: "Assinatura revogada", icon: AlertTriangle, tone: "text-destructive" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return d;
  }
}

function methodLabel(m?: string | null) {
  switch (m) {
    case "saved_signature":
      return "Assinatura salva";
    case "handwritten":
      return "Assinatura manuscrita";
    case "password_reauth":
      return "Reautenticação por senha";
    default:
      return m || "—";
  }
}

export function SignatureAuditTrailDrawer({
  open,
  onOpenChange,
  recordId,
  clinicId,
}: SignatureAuditTrailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<SignatureRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!open || !recordId || !clinicId) {
      setSignature(null);
      setEvents([]);
      setEvidenceUrl(null);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const { data: sig } = await supabase
          .from("medical_record_signatures")
          .select("*")
          .eq("record_id", recordId)
          .eq("clinic_id", clinicId)
          .eq("is_revoked", false)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        setSignature(sig as SignatureRow | null);

        if (sig?.id) {
          const { data: evts } = await supabase
            .from("medical_signature_events")
            .select("id, event_type, metadata, created_at")
            .eq("signature_id", sig.id)
            .eq("clinic_id", clinicId)
            .order("created_at", { ascending: true });
          if (!cancelled) setEvents((evts as EventRow[]) || []);
        }

        // Resolve handwritten signature image (private bucket → signed URL)
        const path =
          (sig as SignatureRow)?.handwritten_path ||
          (sig as SignatureRow)?.evidence_snapshot?.handwritten_path ||
          null;
        if (path) {
          const { data: u } = await supabase.storage
            .from("signature-evidence")
            .createSignedUrl(path, 60 * 30);
          if (!cancelled) setEvidenceUrl(u?.signedUrl || null);
        } else if ((sig as SignatureRow)?.evidence_snapshot?.signature_data_url) {
          if (!cancelled)
            setEvidenceUrl((sig as SignatureRow).evidence_snapshot.signature_data_url);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, recordId, clinicId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Trilha de Auditoria
          </SheetTitle>
          <SheetDescription>
            Evidências e timeline da Assinatura Avançada YesClin.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!loading && !signature && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sem trilha disponível</AlertTitle>
            <AlertDescription>
              Este documento ainda não foi assinado ou a trilha não pôde ser carregada.
            </AlertDescription>
          </Alert>
        )}

        {!loading && signature && (
          <div className="mt-4 space-y-5">
            {/* Status banner */}
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Documento assinado
                </p>
                <p className="text-xs text-muted-foreground">
                  Assinado em {fmtDate(signature.signed_at)}
                </p>
              </div>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Lock className="h-2.5 w-2.5" /> Travado
              </Badge>
            </div>

            {/* Evidências */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                Evidências coletadas
              </h4>
              <div className="rounded-lg border divide-y text-sm">
                <EvidenceRow
                  icon={User}
                  label="Signatário"
                  value={signature.signed_by_name || "—"}
                />
                <EvidenceRow
                  icon={PenTool}
                  label="Modo de assinatura"
                  value={methodLabel(signature.sign_method)}
                />
                <EvidenceRow
                  icon={Shield}
                  label="Nível"
                  value={
                    signature.signature_level === "advanced"
                      ? "Assinatura Avançada YesClin"
                      : signature.signature_level || "—"
                  }
                />
                <EvidenceRow
                  icon={Clock}
                  label="Carimbo de tempo"
                  value={fmtDate(signature.signed_at)}
                />
                <EvidenceRow
                  icon={Globe}
                  label="IP do signatário"
                  value={signature.ip_address || "—"}
                />
                <EvidenceRow
                  icon={Monitor}
                  label="Dispositivo"
                  value={signature.user_agent || "—"}
                  mono
                />
                <EvidenceRow
                  icon={Hash}
                  label="Hash SHA-256"
                  value={signature.signature_hash || "—"}
                  mono
                  breakAll
                />
              </div>
            </section>

            {/* Assinatura usada */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Assinatura utilizada no ato
              </h4>
              <div className="rounded-lg border bg-white p-3 flex items-center justify-center min-h-[120px]">
                {evidenceUrl ? (
                  <img
                    src={evidenceUrl}
                    alt="Assinatura utilizada"
                    className="max-h-[140px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Snapshot de assinatura não disponível
                  </span>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Timeline do processo
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">
                  Nenhum evento registrado.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-3">
                  {events.map((evt) => {
                    const meta = EVENT_LABELS[evt.event_type] || {
                      label: evt.event_type,
                      icon: FileText,
                      tone: "text-muted-foreground",
                    };
                    const Icon = meta.icon;
                    return (
                      <li key={evt.id} className="ml-4">
                        <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background border">
                          <Icon className={`h-2.5 w-2.5 ${meta.tone}`} />
                        </span>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtDate(evt.created_at)}
                        </p>
                        {evt.metadata?.hash_preview && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            hash: {evt.metadata.hash_preview}…
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <Separator />
            <p className="text-[10px] text-muted-foreground">
              Trilha imutável (append-only) — base para verificação de integridade
              e não-repúdio do documento assinado.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  value,
  mono,
  breakAll,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={`text-xs ${mono ? "font-mono" : ""} ${
            breakAll ? "break-all" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
