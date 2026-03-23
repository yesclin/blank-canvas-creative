import { Building2, FileCheck, DollarSign, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import type { InsuranceReportData } from '@/types/relatorios';

interface InsuranceReportsProps {
  insuranceReport: InsuranceReportData[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const chartConfig = {
  totalRevenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  appointmentCount: { label: 'Atendimentos', color: 'hsl(var(--accent))' },
};

export function InsuranceReports({ insuranceReport }: InsuranceReportsProps) {
  const totalAtendimentos = insuranceReport.reduce((acc, i) => acc + i.appointmentCount, 0);
  const totalFaturamento = insuranceReport.reduce((acc, i) => acc + i.totalRevenue, 0);
  const ticketMedio = Math.round(totalFaturamento / totalAtendimentos);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Convênios Ativos', value: insuranceReport.length, format: 'number', icon: <Building2 className="h-5 w-5" /> },
          { title: 'Total Atendimentos', value: totalAtendimentos, format: 'number', variation: 5, icon: <FileCheck className="h-5 w-5" /> },
          { title: 'Faturamento Convênios', value: totalFaturamento, format: 'currency', variation: 8, icon: <DollarSign className="h-5 w-5" /> },
          { title: 'Ticket Médio', value: ticketMedio, format: 'currency', icon: <Stethoscope className="h-5 w-5" /> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Faturamento por Convênio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faturamento por Convênio</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={insuranceReport} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="insuranceName" type="category" width={100} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Faturamento" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Atendimentos por Convênio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos por Convênio</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={insuranceReport} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="insuranceName" type="category" width={100} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="appointmentCount" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Atendimentos" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Convênios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Valor Médio</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insuranceReport.sort((a, b) => b.totalRevenue - a.totalRevenue).map((ins) => (
                <TableRow key={ins.insuranceId}>
                  <TableCell className="font-medium">{ins.insuranceName}</TableCell>
                  <TableCell className="text-right">{ins.appointmentCount}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(ins.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ins.averageValue)}</TableCell>
                  <TableCell className="text-right">
                    {Math.round((ins.totalRevenue / totalFaturamento) * 100)}%
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
