import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ChevronRight,
  CalendarDays,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ───

interface SessionInput {
  numero_sessao: number | null;
  data_sessao: string;
  evolucao_caso: string | null;
  risco_atual: string | null;
  adesao_terapeutica: string | null;
  profissional_nome?: string;
  id?: string;
}

interface TrendResult {
  label: 'melhora' | 'estavel' | 'piora';
  sum: number;
  windowSize: number;
  sessions: SessionInput[];
}

type AlertStatus = 'normal' | 'regressao' | 'crise';

interface AnalysisResult {
  shortTrend: TrendResult | null;
  longTrend: TrendResult | null;
  alertStatus: AlertStatus;
  alertReasons: string[];
  lastSessionDate: string | null;
  totalSessions: number;
}

// ─── Maps ───

const EVOLUCAO_MAP: Record<string, number> = {
  melhorando: 1, estavel: 0, 'estável': 0, piorando: -1,
};

const RISCO_MAP: Record<string, number> = {
  ausente: 0, baixo: 1, moderado: 2, alto: 3,
};

// ─── Analysis logic ───

function computeTrend(sessions: SessionInput[], windowSize: number): TrendResult | null {
  const withEvol = sessions
    .filter(s => s.evolucao_caso && EVOLUCAO_MAP[s.evolucao_caso.toLowerCase().trim()] !== undefined)
    .slice(-windowSize);

  if (withEvol.length < Math.min(windowSize, 3)) return null;

  const sum = withEvol.reduce((acc, s) => {
    return acc + (EVOLUCAO_MAP[s.evolucao_caso!.toLowerCase().trim()] ?? 0);
  }, 0);

  let label: TrendResult['label'];
  if (sum >= 2) label = 'melhora';
  else if (sum <= -2) label = 'piora';
  else label = 'estavel';

  return { label, sum, windowSize: withEvol.length, sessions: withEvol };
}

function detectAlerts(sessions: SessionInput[]): { status: AlertStatus; reasons: string[] } {
  const reasons: string[] = [];
  let isCrisis = false;
  let isRegression = false;

  const sorted = [...sessions].sort((a, b) =>
    new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime()
  );

  const last2 = sorted.slice(-2);
  const last3 = sorted.slice(-3);

  // ─── CRISIS detection ───
  // A) risco_atual = "Alto" in any of last 2
  const highRiskInLast2 = last2.some(s => {
    const r = s.risco_atual?.toLowerCase().trim();
    return r === 'alto';
  });
  if (highRiskInLast2) {
    isCrisis = true;
    reasons.push('Risco alto registrado nas últimas 2 sessões');
  }

  // B) 3 consecutive "Piorando"
  if (last3.length >= 3) {
    const all3Piorando = last3.every(s =>
      s.evolucao_caso?.toLowerCase().trim() === 'piorando'
    );
    if (all3Piorando) {
      isCrisis = true;
      reasons.push('3 sessões consecutivas com evolução "Piorando"');
    }
  }

  if (isCrisis) return { status: 'crise', reasons };

  // ─── REGRESSION detection ───
  // A) 2 consecutive "Piorando"
  for (let i = sorted.length - 1; i >= 1; i--) {
    const curr = sorted[i].evolucao_caso?.toLowerCase().trim();
    const prev = sorted[i - 1].evolucao_caso?.toLowerCase().trim();
    if (curr === 'piorando' && prev === 'piorando') {
      isRegression = true;
      reasons.push('2 sessões consecutivas com evolução "Piorando"');
      break;
    }
  }

  // B) Sum of last 3 sessions <= -2
  const last3Evol = last3
    .map(s => EVOLUCAO_MAP[s.evolucao_caso?.toLowerCase().trim() || ''] ?? null)
    .filter((v): v is number => v !== null);
  if (last3Evol.length >= 2) {
    const sum = last3Evol.reduce((a, b) => a + b, 0);
    if (sum <= -2) {
      isRegression = true;
      if (!reasons.some(r => r.includes('soma'))) {
        reasons.push(`Soma das últimas ${last3Evol.length} sessões = ${sum} (≤ -2)`);
      }
    }
  }

  // C) Risk increase in 2 consecutive sessions
  for (let i = sorted.length - 1; i >= 1; i--) {
    const currRisk = RISCO_MAP[sorted[i].risco_atual?.toLowerCase().trim() || ''] ?? null;
    const prevRisk = RISCO_MAP[sorted[i - 1].risco_atual?.toLowerCase().trim() || ''] ?? null;
    if (currRisk !== null && prevRisk !== null && currRisk > prevRisk) {
      isRegression = true;
      reasons.push('Aumento de nível de risco entre sessões consecutivas');
      break;
    }
  }

  if (isRegression) return { status: 'regressao', reasons };

  return { status: 'normal', reasons: [] };
}

function analyze(sessions: SessionInput[]): AnalysisResult {
  const sorted = [...sessions].sort((a, b) =>
    new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime()
  );

  const shortTrend = computeTrend(sorted, 3);
  const longTrend = sorted.length >= 5 ? computeTrend(sorted, 5) : null;
  const { status: alertStatus, reasons: alertReasons } = detectAlerts(sorted);
  const lastSessionDate = sorted.length > 0 ? sorted[sorted.length - 1].data_sessao : null;

  return {
    shortTrend,
    longTrend,
    alertStatus,
    alertReasons,
    lastSessionDate,
    totalSessions: sorted.length,
  };
}

// ─── UI Helpers ───

function TrendBadge({ trend }: { trend: TrendResult }) {
  const config = {
    melhora: { icon: TrendingUp, label: 'Tendência de melhora', className: 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700 dark:text-green-400' },
    estavel: { icon: Minus, label: 'Tendência estável/oscilante', className: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 text-yellow-700 dark:text-yellow-400' },
    piora: { icon: TrendingDown, label: 'Tendência de piora', className: 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-700 dark:text-red-400' },
  }[trend.label];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`text-xs gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function AlertBadge({ status, reasons }: { status: AlertStatus; reasons: string[] }) {
  if (status === 'normal') {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Activity className="h-3 w-3" />
        Normal
      </Badge>
    );
  }

  if (status === 'crise') {
    return (
      <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
        <ShieldAlert className="h-3 w-3" />
        Crise
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs gap-1 bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3" />
      Regressão
    </Badge>
  );
}

// ─── Session list dialog ───

function SessionListDialog({
  open,
  onOpenChange,
  sessions,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessions: SessionInput[];
  title: string;
}) {
  const fmtDate = (d: string) => {
    try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {sessions.map((s, i) => {
            const evol = s.evolucao_caso || '—';
            const risco = s.risco_atual || '—';
            return (
              <div key={s.id || i} className="flex items-center justify-between p-2 rounded-md border text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">Sessão {s.numero_sessao || '?'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {fmtDate(s.data_sessao)}
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs">Evolução: <span className="font-medium">{evol}</span></p>
                  <p className="text-xs">Risco: <span className="font-medium">{risco}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───

interface AnaliseTendenciaPsicologiaProps {
  sessoes: SessionInput[];
}

export function AnaliseTendenciaPsicologia({ sessoes }: AnaliseTendenciaPsicologiaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSessions, setDialogSessions] = useState<SessionInput[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');

  const analysis = useMemo(() => analyze(sessoes), [sessoes]);

  const { shortTrend, longTrend, alertStatus, alertReasons, lastSessionDate, totalSessions } = analysis;

  // Need at least 3 sessions to show anything
  if (totalSessions < 3 || !shortTrend) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
          <p>Registre ao menos 3 sessões com avaliação de evolução para visualizar a análise de tendência.</p>
        </CardContent>
      </Card>
    );
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
  };

  const openSessionList = (sessions: SessionInput[], title: string) => {
    setDialogSessions(sessions);
    setDialogTitle(title);
    setDialogOpen(true);
  };

  const borderClass = alertStatus === 'crise'
    ? 'border-destructive/50 bg-destructive/5'
    : alertStatus === 'regressao'
    ? 'border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/10'
    : '';

  return (
    <>
      <Card className={borderClass}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Análise de Tendência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status and trends row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Alert status */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Estado</p>
              <AlertBadge status={alertStatus} reasons={alertReasons} />
            </div>

            {/* Short trend */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Tendência ({shortTrend.windowSize} sessões)
              </p>
              <TrendBadge trend={shortTrend} />
            </div>

            {/* Long trend */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Tendência ({longTrend?.windowSize || 5} sessões)
              </p>
              {longTrend ? (
                <TrendBadge trend={longTrend} />
              ) : (
                <span className="text-xs text-muted-foreground">Insuficiente</span>
              )}
            </div>

            {/* Last update */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Última sessão</p>
              <span className="text-xs font-medium">{fmtDate(lastSessionDate)}</span>
            </div>
          </div>

          {/* Alert reasons */}
          {alertReasons.length > 0 && (
            <div className={`p-2 rounded-md text-xs space-y-1 ${
              alertStatus === 'crise'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-amber-100/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
            }`}>
              {alertReasons.map((r, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  {r}
                </p>
              ))}
            </div>
          )}

          {/* Session links */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => openSessionList(shortTrend.sessions, `Sessões usadas — Janela Curta (${shortTrend.windowSize})`)}
            >
              Ver sessões (curta)
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
            {longTrend && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => openSessionList(longTrend.sessions, `Sessões usadas — Janela Longa (${longTrend.windowSize})`)}
              >
                Ver sessões (longa)
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <SessionListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sessions={dialogSessions}
        title={dialogTitle}
      />
    </>
  );
}
