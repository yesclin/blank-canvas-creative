import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface SessionEvolution {
  numero_sessao: number | null;
  evolucao_caso: string | null;
  data_sessao: string;
}

interface EvolucaoEmocionalChartProps {
  sessoes: SessionEvolution[];
}

const EVOLUCAO_MAP: Record<string, number> = {
  'melhorando': 1,
  'estavel': 0,
  'estável': 0,
  'piorando': -1,
};

const EVOLUCAO_LABEL: Record<number, string> = {
  1: 'Melhorando',
  0: 'Estável',
  [-1]: 'Piorando',
};

export function EvolucaoEmocionalChart({ sessoes }: EvolucaoEmocionalChartProps) {
  const data = sessoes
    .filter(s => s.evolucao_caso)
    .sort((a, b) => (a.numero_sessao || 0) - (b.numero_sessao || 0))
    .map(s => ({
      name: `S${s.numero_sessao || '?'}`,
      valor: EVOLUCAO_MAP[s.evolucao_caso?.toLowerCase() || ''] ?? null,
    }))
    .filter(d => d.valor !== null);

  if (data.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Registre ao menos 2 sessões com avaliação de evolução para gerar o gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  const lastValue = data[data.length - 1]?.valor ?? 0;
  const trend = lastValue > 0 ? 'positive' : lastValue < 0 ? 'negative' : 'neutral';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    const val = payload[0].value;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
        <p className="font-medium">{label}</p>
        <p className={val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-yellow-600'}>
          {EVOLUCAO_LABEL[val] || 'N/A'}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução do Caso
          </CardTitle>
          <Badge
            variant="outline"
            className={
              trend === 'positive'
                ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400'
                : trend === 'negative'
                ? 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
                : 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400'
            }
          >
            {trend === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend === 'negative' && <TrendingDown className="h-3 w-3 mr-1" />}
            {trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
            Última: {EVOLUCAO_LABEL[lastValue] || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[-1.5, 1.5]}
                ticks={[-1, 0, 1]}
                tickFormatter={(v) => EVOLUCAO_LABEL[v] || ''}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Melhorando</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Estável</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Piorando</span>
        </div>
      </CardContent>
    </Card>
  );
}
