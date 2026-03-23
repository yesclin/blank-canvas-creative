import { User, DollarSign, Calendar, Target, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import type { ProfessionalPerformance } from '@/types/relatorios';

interface ProfessionalReportsProps {
  professionalPerformance: ProfessionalPerformance[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const chartConfig = {
  totalRevenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  appointmentsRealized: { label: 'Atendimentos', color: 'hsl(var(--accent))' },
};

export function ProfessionalReports({ professionalPerformance }: ProfessionalReportsProps) {
  const totalAtendimentos = professionalPerformance.reduce((acc, p) => acc + p.appointmentsRealized, 0);
  const totalFaturamento = professionalPerformance.reduce((acc, p) => acc + p.totalRevenue, 0);
  const totalComissao = professionalPerformance.reduce((acc, p) => acc + (p.commission || 0), 0);
  const mediaOcupacao = Math.round(professionalPerformance.reduce((acc, p) => acc + p.occupancyRate, 0) / professionalPerformance.length);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Total Atendimentos', value: totalAtendimentos, format: 'number', variation: 6, icon: <Calendar className="h-5 w-5" /> },
          { title: 'Faturamento Total', value: totalFaturamento, format: 'currency', variation: 10, icon: <DollarSign className="h-5 w-5" /> },
          { title: 'Comissões a Pagar', value: totalComissao, format: 'currency', icon: <Percent className="h-5 w-5" /> },
          { title: 'Ocupação Média', value: mediaOcupacao, format: 'percentage', icon: <Target className="h-5 w-5" /> },
        ]}
      />

      {/* Cards por Profissional */}
      <div className="grid gap-4 md:grid-cols-2">
        {professionalPerformance.map((prof) => (
          <Card key={prof.professionalId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{prof.professionalName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-primary">{prof.occupancyRate}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={prof.occupancyRate} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{prof.appointmentsRealized}</p>
                  <p className="text-xs text-muted-foreground">Atendimentos</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(prof.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(prof.averageTicket)}</p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>

              {prof.commission && (
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Comissão (30%)</span>
                  <span className="font-semibold text-green-600">{formatCurrency(prof.commission)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={professionalPerformance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="professionalName" className="text-xs" />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
              <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Ocupação</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionalPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue).map((prof) => (
                <TableRow key={prof.professionalId}>
                  <TableCell className="font-medium">{prof.professionalName}</TableCell>
                  <TableCell className="text-muted-foreground">{prof.specialty}</TableCell>
                  <TableCell className="text-right">{prof.appointmentsRealized}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(prof.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(prof.averageTicket)}</TableCell>
                  <TableCell className="text-right">{prof.occupancyRate}%</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {prof.commission ? formatCurrency(prof.commission) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
