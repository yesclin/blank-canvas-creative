/**
 * NUTRIÇÃO - Gráficos de Evolução Antropométrica
 * 
 * Componente para visualização evolutiva de medidas corporais ao longo do tempo.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Scale, Activity, Ruler } from 'lucide-react';
import type { AvaliacaoNutricional } from '@/hooks/prontuario/nutricao';

interface AvaliacaoEvolutionChartProps {
  avaliacoes: AvaliacaoNutricional[];
}

interface ChartData {
  date: string;
  dateFormatted: string;
  weight_kg: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_right_cm: number | null;
  thigh_right_cm: number | null;
}

/**
 * Calcula a tendência entre primeiro e último valor
 */
function calculateTrend(data: ChartData[], field: keyof ChartData): { direction: 'up' | 'down' | 'stable'; value: number } {
  const validData = data.filter(d => d[field] !== null && d[field] !== undefined);
  if (validData.length < 2) return { direction: 'stable', value: 0 };
  
  const first = validData[0][field] as number;
  const last = validData[validData.length - 1][field] as number;
  const diff = last - first;
  
  if (Math.abs(diff) < 0.1) return { direction: 'stable', value: 0 };
  return { direction: diff > 0 ? 'up' : 'down', value: Math.abs(diff) };
}

function TrendIndicator({ trend, unit, invertColors = false }: { 
  trend: { direction: 'up' | 'down' | 'stable'; value: number }; 
  unit: string;
  invertColors?: boolean;
}) {
  if (trend.direction === 'stable') {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        Estável
      </Badge>
    );
  }
  
  const isPositive = invertColors 
    ? trend.direction === 'down' 
    : trend.direction === 'up';
  
  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${isPositive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
    >
      {trend.direction === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {trend.direction === 'up' ? '+' : '-'}{trend.value.toFixed(1)} {unit}
    </Badge>
  );
}

export function AvaliacaoEvolutionChart({ avaliacoes }: AvaliacaoEvolutionChartProps) {
  const [activeTab, setActiveTab] = useState('peso');
  
  // Preparar dados para os gráficos (ordem cronológica)
  const chartData: ChartData[] = [...avaliacoes]
    .reverse()
    .map(a => ({
      date: a.measurement_date,
      dateFormatted: format(parseISO(a.measurement_date), "dd/MM", { locale: ptBR }),
      weight_kg: a.weight_kg,
      bmi: a.bmi,
      body_fat_percent: a.body_fat_percent,
      muscle_mass_kg: a.muscle_mass_kg,
      waist_cm: a.waist_cm,
      hip_cm: a.hip_cm,
      chest_cm: a.chest_cm,
      arm_right_cm: a.arm_right_cm,
      thigh_right_cm: a.thigh_right_cm,
    }));

  if (chartData.length < 2) {
    return null; // Não mostrar gráficos com menos de 2 avaliações
  }

  // Calcular tendências
  const weightTrend = calculateTrend(chartData, 'weight_kg');
  const bmiTrend = calculateTrend(chartData, 'bmi');
  const fatTrend = calculateTrend(chartData, 'body_fat_percent');
  const waistTrend = calculateTrend(chartData, 'waist_cm');

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-1">{label}</p>
          {(payload as Array<{ name: string; value: number; color: string }>).map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(1) ?? '--'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Evolução Antropométrica
          </CardTitle>
          <Badge variant="secondary">{chartData.length} avaliações</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="peso" className="gap-1">
              <Scale className="h-3 w-3" />
              Peso
            </TabsTrigger>
            <TabsTrigger value="imc" className="gap-1">
              <Activity className="h-3 w-3" />
              IMC
            </TabsTrigger>
            <TabsTrigger value="composicao" className="gap-1">
              Composição
            </TabsTrigger>
            <TabsTrigger value="circunferencias" className="gap-1">
              <Ruler className="h-3 w-3" />
              Medidas
            </TabsTrigger>
          </TabsList>

          {/* Peso */}
          <TabsContent value="peso" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Evolução do peso corporal</p>
              <TrendIndicator trend={weightTrend} unit="kg" invertColors />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    unit=" kg"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="weight_kg"
                    name="Peso"
                    stroke="hsl(var(--primary))"
                    fill="url(#weightGradient)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* IMC */}
          <TabsContent value="imc" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Evolução do Índice de Massa Corporal</p>
              <TrendIndicator trend={bmiTrend} unit="kg/m²" invertColors />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="bmiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Faixas de referência do IMC */}
                  <Area
                    type="monotone"
                    dataKey="bmi"
                    name="IMC"
                    stroke="#10b981"
                    fill="url(#bmiGradient)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda IMC */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="bg-blue-50">{'< 18.5'}: Abaixo</Badge>
              <Badge variant="outline" className="bg-green-50">18.5-24.9: Normal</Badge>
              <Badge variant="outline" className="bg-yellow-50">25-29.9: Sobrepeso</Badge>
              <Badge variant="outline" className="bg-red-50">{'≥ 30'}: Obesidade</Badge>
            </div>
          </TabsContent>

          {/* Composição Corporal */}
          <TabsContent value="composicao" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Gordura corporal e massa muscular</p>
              <TrendIndicator trend={fatTrend} unit="%" invertColors />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    unit="%"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    unit=" kg"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="body_fat_percent"
                    name="Gordura (%)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="muscle_mass_kg"
                    name="Massa Muscular (kg)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Circunferências */}
          <TabsContent value="circunferencias" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Evolução das circunferências corporais</p>
              <TrendIndicator trend={waistTrend} unit="cm" invertColors />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    unit=" cm"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="waist_cm"
                    name="Cintura"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hip_cm"
                    name="Quadril"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chest_cm"
                    name="Tórax"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="arm_right_cm"
                    name="Braço D"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="thigh_right_cm"
                    name="Coxa D"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
