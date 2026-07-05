import { CheckCircle2, Circle, AlertTriangle, ClipboardList, ShieldAlert, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProcedureRequirementsData } from "@/hooks/useProcedureRequirements";

interface Props {
  data: ProcedureRequirementsData | undefined;
  isLoading?: boolean;
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const map: Record<string, string> = {
    consulta: "Consulta",
    retorno: "Retorno",
    procedimento: "Procedimento",
    sessao: "Sessão",
    pacote: "Pacote",
    avaliacao: "Avaliação",
    exame: "Exame",
  };
  return <Badge variant="outline" className="text-[10px]">{map[type] ?? type}</Badge>;
}

function Block({ icon: Icon, title, content, tone = "default" }: {
  icon: typeof Info;
  title: string;
  content: string | null;
  tone?: "default" | "warn" | "danger";
}) {
  if (!content) return null;
  const toneClass =
    tone === "danger" ? "border-destructive/30 bg-destructive/5"
    : tone === "warn" ? "border-amber-300/40 bg-amber-50 dark:bg-amber-950/20"
    : "border-border bg-muted/40";
  return (
    <div className={cn("rounded-md border p-2.5", toneClass)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80">{content}</p>
    </div>
  );
}

export function ProcedureRequirementsPanel({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card><CardContent className="py-4 text-xs text-muted-foreground">Carregando procedimento…</CardContent></Card>
    );
  }
  if (!data?.procedure) return null;

  const p = data.procedure;
  const hasAnyInfo =
    p.protocol_notes || p.pre_procedure_care || p.post_procedure_care ||
    p.contraindications || p.possible_intercurrences;
  const hasRequirements = data.requirements.length > 0;

  return (
    <Card className={cn(data.hasBlockingPending && "border-amber-400/50")}>
      <CardContent className="py-3 px-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ClipboardList className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{p.name}</p>
          <TypeBadge type={p.type} />
          {p.uses_sessions && <Badge variant="secondary" className="text-[10px]">Sessões</Badge>}
        </div>

        {hasAnyInfo && (
          <div className="grid gap-2">
            <Block icon={Info} title="Protocolo / Instruções" content={p.protocol_notes} />
            <Block icon={Info} title="Cuidados pré" content={p.pre_procedure_care} />
            <Block icon={Info} title="Cuidados pós" content={p.post_procedure_care} />
            <Block icon={ShieldAlert} title="Contraindicações" content={p.contraindications} tone="warn" />
            <Block icon={AlertTriangle} title="Possíveis intercorrências" content={p.possible_intercurrences} tone="danger" />
          </div>
        )}

        {hasRequirements && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Requisitos para finalizar
            </p>
            <ul className="space-y-1">
              {data.requirements.map((r) => (
                <li key={r.key} className="flex items-start gap-2 text-xs">
                  {r.satisfied
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    : <Circle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <span className={cn("font-medium", r.satisfied ? "text-foreground" : "text-amber-700 dark:text-amber-400")}>
                      {r.label}
                    </span>
                    {!r.satisfied && r.helperText && (
                      <p className="text-[11px] text-muted-foreground">{r.helperText}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {data.hasBlockingPending && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                Complete os requisitos acima para finalizar o atendimento.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProcedureRequirementsPanel;
