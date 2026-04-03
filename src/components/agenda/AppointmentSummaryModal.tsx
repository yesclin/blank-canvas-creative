import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  User,
  Stethoscope,
  FileText,
  Image,
  AlertTriangle,
  FileCheck,
  Package,
  DollarSign,
  FolderOpen,
  Calendar,
  Timer,
  Pause,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SessionSummary } from "@/hooks/useAppointmentSession";
import { cn } from "@/lib/utils";

interface AppointmentSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SessionSummary | null;
  patientId?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AppointmentSummaryModal({
  open,
  onOpenChange,
  summary,
  patientId,
}: AppointmentSummaryModalProps) {
  const navigate = useNavigate();

  if (!summary) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Resumo do Atendimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* ── Header ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{summary.patient_name}</p>
                <p className="text-xs text-muted-foreground">{summary.professional_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoItem icon={Calendar} label="Data" value={formatDate(summary.scheduled_date)} />
              <InfoItem icon={Stethoscope} label="Especialidade" value={summary.specialty_name || "—"} />
              {summary.procedure_name && (
                <InfoItem icon={FileText} label="Procedimento" value={summary.procedure_name} className="col-span-2" />
              )}
            </div>

            <Separator />

            {/* Time block */}
            <div className="grid grid-cols-3 gap-2">
              <TimeCard label="Início" value={formatTimestamp(summary.started_at)} />
              <TimeCard label="Término" value={formatTimestamp(summary.finished_at)} />
              <TimeCard label="Duração" value={formatDuration(summary.effective_seconds)} highlight />
            </div>

            {summary.paused_seconds > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pause className="h-3 w-3" />
                Tempo em pausa: {formatDuration(summary.paused_seconds)}
              </div>
            )}
          </div>

          {/* ── Clinical Summary ── */}
          <Section title="Resumo Clínico" icon={Stethoscope}>
            <div className="grid grid-cols-2 gap-2">
              <CountCard icon={FileText} label="Anamneses" count={summary.anamnesis_count} />
              <CountCard icon={Activity} label="Evoluções" count={summary.evolutions_count} />
              <CountCard icon={Image} label="Mídias" count={summary.media_count} />
              <CountCard icon={FileCheck} label="Documentos" count={summary.clinical_documents_count} />
              <CountCard icon={AlertTriangle} label="Alertas" count={summary.alerts_count} />
              <CountCard icon={FileCheck} label="Termos" count={summary.consents_count} />
            </div>

            {summary.anamnesis_templates.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Modelos utilizados</p>
                <div className="flex flex-wrap gap-1">
                  {summary.anamnesis_templates.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {summary.evolution_notes.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Notas clínicas</p>
                <div className="space-y-1">
                  {summary.evolution_notes.map((n, i) => (
                    <p key={i} className="text-xs text-foreground/80 bg-muted/50 rounded p-2 line-clamp-2">{n}</p>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── Financial ── */}
          <Section title="Financeiro" icon={DollarSign}>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Previsto</p>
                <p className="text-xs font-semibold">{formatCurrency(summary.amount_expected)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Recebido</p>
                <p className="text-xs font-semibold text-green-600">{formatCurrency(summary.amount_received)}</p>
              </div>
              <div className={cn(
                "rounded-lg p-2 text-center",
                (summary.amount_expected - summary.amount_received) > 0 ? "bg-destructive/5" : "bg-muted/50"
              )}>
                <p className="text-[10px] text-muted-foreground">Pendente</p>
                <p className={cn(
                  "text-xs font-semibold",
                  (summary.amount_expected - summary.amount_received) > 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {formatCurrency(Math.max(0, summary.amount_expected - summary.amount_received))}
                </p>
              </div>
            </div>
          </Section>

          {/* ── Notes ── */}
          {summary.notes && (
            <Section title="Observações" icon={FileText}>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{summary.notes}</p>
            </Section>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-2">
            {patientId && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/app/prontuario/${patientId}`);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Abrir Prontuário
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, className }: { icon: typeof Clock; label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TimeCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg p-2 text-center",
      highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
    )}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function CountCard({ icon: Icon, label, count }: { icon: typeof Clock; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{count}</p>
      </div>
    </div>
  );
}
