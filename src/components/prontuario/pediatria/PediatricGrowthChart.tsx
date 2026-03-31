import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart, Dot,
} from 'recharts';
import { Scale, Ruler, Baby, Activity } from 'lucide-react';
import type { GrowthMeasurement } from './CrescimentoDesenvolvimentoBlock';
import {
  WEIGHT_BOYS, WEIGHT_GIRLS,
  HEIGHT_BOYS, HEIGHT_GIRLS,
  HC_BOYS, HC_GIRLS,
  BMI_BOYS, BMI_GIRLS,
  type WHODataPoint,
} from './whoGrowthData';

interface PediatricGrowthChartProps {
  measurements: GrowthMeasurement[];
  gender: 'M' | 'F';
  currentAgeMonths: number;
}

function buildChartData(whoData: WHODataPoint[], measurements: GrowthMeasurement[], valueKey: keyof GrowthMeasurement) {
  // Build base from WHO data points
  const dataMap = new Map<number, any>();
  whoData.forEach(d => {
    dataMap.set(d.age_months, {
      age: d.age_months,
      p3: d.p3, p15: d.p15, p50: d.p50, p85: d.p85, p97: d.p97,
      value: null,
    });
  });

  // Overlay patient measurements
  measurements.forEach(m => {
    const val = m[valueKey] as number | undefined;
    if (val === undefined || val === null) return;
    const age = m.age_months;
    if (dataMap.has(age)) {
      dataMap.get(age)!.value = val;
    } else {
      // Interpolate WHO values for this age
      let lower = whoData[0], upper = whoData[whoData.length - 1];
      for (let i = 0; i < whoData.length - 1; i++) {
        if (age >= whoData[i].age_months && age <= whoData[i + 1].age_months) {
          lower = whoData[i]; upper = whoData[i + 1]; break;
        }
      }
      const ratio = upper.age_months === lower.age_months ? 0 :
        (age - lower.age_months) / (upper.age_months - lower.age_months);
      dataMap.set(age, {
        age,
        p3: +(lower.p3 + ratio * (upper.p3 - lower.p3)).toFixed(1),
        p15: +(lower.p15 + ratio * (upper.p15 - lower.p15)).toFixed(1),
        p50: +(lower.p50 + ratio * (upper.p50 - lower.p50)).toFixed(1),
        p85: +(lower.p85 + ratio * (upper.p85 - lower.p85)).toFixed(1),
        p97: +(lower.p97 + ratio * (upper.p97 - lower.p97)).toFixed(1),
        value: val,
      });
    }
  });

  return Array.from(dataMap.values()).sort((a, b) => a.age - b.age);
}

function formatAgeLabel(months: number) {
  if (months < 1) return 'RN';
  if (months < 24) return `${months}m`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y}a` : `${y}a${m}m`;
}

const PERCENTILE_COLORS = {
  p97: 'hsl(var(--destructive))',
  p85: 'hsl(var(--chart-4, 43 74% 66%))',
  p50: 'hsl(var(--chart-2, 173 58% 39%))',
  p15: 'hsl(var(--chart-4, 43 74% 66%))',
  p3: 'hsl(var(--destructive))',
};

function GrowthLineChart({ data, unit, title }: { data: any[]; unit: string; title: string }) {
  if (!data.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="age"
              tickFormatter={formatAgeLabel}
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              unit={unit === 'kg' ? '' : ''}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                    <div className="font-medium mb-1">{formatAgeLabel(label)}</div>
                    {payload.map((entry: any) => (
                      <div key={entry.dataKey} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">{entry.value !== null ? `${entry.value} ${unit}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {/* Percentile bands */}
            <Line type="monotone" dataKey="p97" stroke={PERCENTILE_COLORS.p97} strokeWidth={1} strokeDasharray="4 2" dot={false} name="P97" opacity={0.5} />
            <Line type="monotone" dataKey="p85" stroke={PERCENTILE_COLORS.p85} strokeWidth={1} strokeDasharray="4 2" dot={false} name="P85" opacity={0.5} />
            <Line type="monotone" dataKey="p50" stroke={PERCENTILE_COLORS.p50} strokeWidth={1.5} dot={false} name="P50" opacity={0.7} />
            <Line type="monotone" dataKey="p15" stroke={PERCENTILE_COLORS.p15} strokeWidth={1} strokeDasharray="4 2" dot={false} name="P15" opacity={0.5} />
            <Line type="monotone" dataKey="p3" stroke={PERCENTILE_COLORS.p3} strokeWidth={1} strokeDasharray="4 2" dot={false} name="P3" opacity={0.5} />
            {/* Patient data */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={(props: any) => {
                if (props.value === null || props.value === undefined) return <></>;
                return (
                  <Dot
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, fill: 'hsl(var(--primary))' }}
              name="Paciente"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PediatricGrowthChart({ measurements, gender, currentAgeMonths }: PediatricGrowthChartProps) {
  const isBoy = gender === 'M';
  const genderLabel = isBoy ? 'Menino' : 'Menina';
  const genderColor = isBoy ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';

  const weightData = useMemo(() =>
    buildChartData(isBoy ? WEIGHT_BOYS : WEIGHT_GIRLS, measurements, 'weight_kg'), [measurements, isBoy]);
  const heightData = useMemo(() =>
    buildChartData(isBoy ? HEIGHT_BOYS : HEIGHT_GIRLS, measurements, 'height_cm'), [measurements, isBoy]);
  const hcData = useMemo(() =>
    buildChartData(isBoy ? HC_BOYS : HC_GIRLS, measurements, 'head_circumference_cm'), [measurements, isBoy]);
  const bmiData = useMemo(() =>
    buildChartData(isBoy ? BMI_BOYS : BMI_GIRLS, measurements, 'bmi'), [measurements, isBoy]);

  const hasWeightMeasurements = measurements.some(m => m.weight_kg);
  const hasHeightMeasurements = measurements.some(m => m.height_cm);
  const hasHCMeasurements = measurements.some(m => m.head_circumference_cm);
  const hasBMIMeasurements = measurements.some(m => m.bmi);

  const showOver5Warning = currentAgeMonths > 60;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Curvas de Crescimento (OMS 0–5 anos)</CardTitle>
          <Badge className={genderColor}>{genderLabel}</Badge>
        </div>
        {showOver5Warning && (
          <p className="text-xs text-muted-foreground mt-1">
            ⚠ Criança com mais de 5 anos. As curvas exibidas são referência de 0 a 5 anos.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="peso">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="peso" className="text-xs gap-1"><Scale className="h-3 w-3" />Peso</TabsTrigger>
            <TabsTrigger value="altura" className="text-xs gap-1"><Ruler className="h-3 w-3" />Altura</TabsTrigger>
            <TabsTrigger value="pc" className="text-xs gap-1"><Baby className="h-3 w-3" />PC</TabsTrigger>
            <TabsTrigger value="imc" className="text-xs gap-1"><Activity className="h-3 w-3" />IMC</TabsTrigger>
          </TabsList>
          <TabsContent value="peso">
            <GrowthLineChart data={weightData} unit="kg" title="Peso por Idade" />
            {!hasWeightMeasurements && (
              <p className="text-sm text-muted-foreground text-center py-4">Registre medidas de peso para visualizar a posição na curva.</p>
            )}
          </TabsContent>
          <TabsContent value="altura">
            <GrowthLineChart data={heightData} unit="cm" title="Altura/Estatura por Idade" />
            {!hasHeightMeasurements && (
              <p className="text-sm text-muted-foreground text-center py-4">Registre medidas de altura para visualizar a posição na curva.</p>
            )}
          </TabsContent>
          <TabsContent value="pc">
            <GrowthLineChart data={hcData} unit="cm" title="Perímetro Cefálico por Idade" />
            {!hasHCMeasurements && (
              <p className="text-sm text-muted-foreground text-center py-4">Registre medidas de perímetro cefálico para visualizar a posição na curva.</p>
            )}
          </TabsContent>
          <TabsContent value="imc">
            <GrowthLineChart data={bmiData} unit="" title="IMC por Idade" />
            {!hasBMIMeasurements && (
              <p className="text-sm text-muted-foreground text-center py-4">Registre peso e altura para calcular e visualizar o IMC na curva.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
