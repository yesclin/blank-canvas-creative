import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, ShieldAlert, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot,
} from "recharts";

interface SessionData {
  numero_sessao: number | null;
  data_sessao: string;
  evolucao_caso: string | null;
  risco_atual: string | null;
  adesao_terapeutica: string | null;
  profissional_nome?: string;
}

interface GraficosEvolucaoPsicologiaProps {
  sessoes: SessionData[];
}

// ─── Value maps ───
const EVOLUCAO_MAP: Record<string, number> = {
  melhorando: 1, estavel: 0, 'estável': 0, piorando: -1,
};
const EVOLUCAO_LABEL: Record<number, string> = { 1: 'Melhorando', 0: 'Estável', [-1]: 'Piorando' };

const RISCO_MAP: Record<string, number> = {
  ausente: 0, baixo: 1, moderado: 2, alto: 3,
};
const RISCO_LABEL: Record<number, string> = { 0: 'Ausente', 1: 'Baixo', 2: 'Moderado', 3: 'Alto' };

const ENGAJAMENTO_MAP: Record<string, number> = {
  baixa: 1, baixo: 1, moderada: 2, moderado: 2, media: 2, 'média': 2, alta: 3, alto: 3, boa: 3,
};
const ENGAJAMENTO_LABEL: Record<number, string> = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };

function mapValue(raw: string | null | undefined, map: Record<string, number>): number | null {
  if (!raw) return null;
  return map[raw.toLowerCase().trim()] ?? null;
}

// ─── Custom risk dot (red for Alto) ───
function RiskDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload?.risco === 3) {
    return <circle cx={cx} cy={cy} r={6} fill="hsl(0 84% 60%)" stroke="hsl(0 84% 40%)" strokeWidth={2} />;
  }
  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />;
}

// ─── Shared tooltip ───
function ChartTooltip({ active, payload, label, labelMap }: any) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const val = payload[0].value;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">{point.data || ''}</p>
      {point.profissional && (
        <p className="text-muted-foreground text-xs">Prof: {point.profissional}</p>
      )}
      <p className="font-semibold">{labelMap[val] ?? 'N/A'}</p>
    </div>
  );
}

// ─── Single chart card ───
function ChartCard({
  title,
  icon: Icon,
  data,
  dataKey,
  domain,
  ticks,
  labelMap,
  lastValue,
  legendItems,
  customDot,
  referenceLine,
}: {
  title: string;
  icon: React.ElementType;
  data: any[];
  dataKey: string;
  domain: [number, number];
  ticks: number[];
  labelMap: Record<number, string>;
  lastValue: number | null;
  legendItems: { label: string; color: string }[];
  customDot?: any;
  referenceLine?: number;
}) {
  if (data.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Registre ao menos 2 sessões com esta avaliação para gerar o gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {lastValue !== null && (
            <Badge variant="outline" className="text-xs">
              Última: {labelMap[lastValue] ?? 'N/A'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                domain={domain}
                ticks={ticks}
                tickFormatter={(v) => labelMap[v] || ''}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltip labelMap={labelMap} />} />
              {referenceLine !== undefined && (
                <ReferenceLine y={referenceLine} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
              )}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={customDot || { r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-muted-foreground">
          {legendItems.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───
export function GraficosEvolucaoPsicologia({ sessoes }: GraficosEvolucaoPsicologiaProps) {
  const sorted = [...sessoes].sort((a, b) => (a.numero_sessao || 0) - (b.numero_sessao || 0));

  const evolucaoData = sorted
    .map((s) => {
      const val = mapValue(s.evolucao_caso, EVOLUCAO_MAP);
      if (val === null) return null;
      return {
        name: `S${s.numero_sessao || '?'}`,
        evolucao: val,
        data: s.data_sessao ? new Date(s.data_sessao).toLocaleDateString('pt-BR') : '',
        profissional: s.profissional_nome || '',
      };
    })
    .filter(Boolean);

  const riscoData = sorted
    .map((s) => {
      const val = mapValue(s.risco_atual, RISCO_MAP);
      if (val === null) return null;
      return {
        name: `S${s.numero_sessao || '?'}`,
        risco: val,
        data: s.data_sessao ? new Date(s.data_sessao).toLocaleDateString('pt-BR') : '',
        profissional: s.profissional_nome || '',
      };
    })
    .filter(Boolean);

  const engajamentoData = sorted
    .map((s) => {
      const val = mapValue(s.adesao_terapeutica, ENGAJAMENTO_MAP);
      if (val === null) return null;
      return {
        name: `S${s.numero_sessao || '?'}`,
        engajamento: val,
        data: s.data_sessao ? new Date(s.data_sessao).toLocaleDateString('pt-BR') : '',
        profissional: s.profissional_nome || '',
      };
    })
    .filter(Boolean);

  const hasAnyData = evolucaoData.length >= 2 || riscoData.length >= 2 || engajamentoData.length >= 2;

  if (!hasAnyData) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Registre ao menos 2 sessões com avaliações para visualizar os gráficos de evolução.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <ChartCard
        title="Evolução Geral por Sessão"
        icon={TrendingUp}
        data={evolucaoData}
        dataKey="evolucao"
        domain={[-1.5, 1.5]}
        ticks={[-1, 0, 1]}
        labelMap={EVOLUCAO_LABEL}
        lastValue={evolucaoData.length > 0 ? (evolucaoData[evolucaoData.length - 1] as any).evolucao : null}
        referenceLine={0}
        legendItems={[
          { label: 'Melhorando', color: '#22c55e' },
          { label: 'Estável', color: '#eab308' },
          { label: 'Piorando', color: '#ef4444' },
        ]}
      />

      <ChartCard
        title="Nível de Risco por Sessão"
        icon={ShieldAlert}
        data={riscoData}
        dataKey="risco"
        domain={[-0.5, 3.5]}
        ticks={[0, 1, 2, 3]}
        labelMap={RISCO_LABEL}
        lastValue={riscoData.length > 0 ? (riscoData[riscoData.length - 1] as any).risco : null}
        customDot={<RiskDot />}
        legendItems={[
          { label: 'Ausente', color: '#6b7280' },
          { label: 'Baixo', color: '#22c55e' },
          { label: 'Moderado', color: '#eab308' },
          { label: 'Alto', color: '#ef4444' },
        ]}
      />

      <ChartCard
        title="Engajamento por Sessão"
        icon={Zap}
        data={engajamentoData}
        dataKey="engajamento"
        domain={[0.5, 3.5]}
        ticks={[1, 2, 3]}
        labelMap={ENGAJAMENTO_LABEL}
        lastValue={engajamentoData.length > 0 ? (engajamentoData[engajamentoData.length - 1] as any).engajamento : null}
        legendItems={[
          { label: 'Baixo', color: '#ef4444' },
          { label: 'Médio', color: '#eab308' },
          { label: 'Alto', color: '#22c55e' },
        ]}
      />
    </div>
  );
}
