import { MessageSquare, Send, CheckCheck, Eye, Percent } from 'lucide-react';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, ResponsiveContainer } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import type { CommunicationReportData } from '@/types/relatorios';

interface CommunicationReportsProps {
  communicationData: CommunicationReportData[];
}

const chartConfig = {
  enviadas: { label: 'Enviadas', color: 'hsl(var(--primary))' },
  confirmadas: { label: 'Confirmadas', color: '#10b981' },
  taxaConfirmacao: { label: 'Taxa de Confirmação', color: 'hsl(var(--accent))' },
};

export function CommunicationReports({ communicationData }: CommunicationReportsProps) {
  const totalEnviadas = communicationData.reduce((acc, d) => acc + d.enviadas, 0);
  const totalConfirmadas = communicationData.reduce((acc, d) => acc + d.confirmadas, 0);
  const taxaMedia = Math.round((totalConfirmadas / totalEnviadas) * 100);
  const melhorSemana = communicationData.reduce((prev, curr) => 
    curr.taxaConfirmacao > prev.taxaConfirmacao ? curr : prev
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Mensagens Enviadas', value: totalEnviadas, format: 'number', variation: 15, icon: <Send className="h-5 w-5" /> },
          { title: 'Confirmações', value: totalConfirmadas, format: 'number', variation: 12, icon: <CheckCheck className="h-5 w-5" /> },
          { title: 'Taxa de Confirmação', value: taxaMedia, format: 'percentage', icon: <Percent className="h-5 w-5" /> },
          { title: 'Melhor Performance', value: `${melhorSemana.taxaConfirmacao}%`, icon: <Eye className="h-5 w-5" /> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução de Envios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensagens por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={communicationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="enviadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Enviadas" />
                <Bar dataKey="confirmadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Confirmadas" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Taxa de Confirmação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Confirmação</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={communicationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                <Line 
                  type="monotone" 
                  dataKey="taxaConfirmacao" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3} 
                  dot={{ fill: 'hsl(var(--accent))' }} 
                  name="Taxa de Confirmação" 
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Enviadas</TableHead>
                <TableHead className="text-right">Confirmadas</TableHead>
                <TableHead className="text-right">Taxa de Confirmação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communicationData.map((data) => (
                <TableRow key={data.period}>
                  <TableCell className="font-medium">{data.period}</TableCell>
                  <TableCell className="text-right">{data.enviadas}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">{data.confirmadas}</TableCell>
                  <TableCell className="text-right">
                    <span className={data.taxaConfirmacao >= taxaMedia ? 'text-green-600 font-bold' : 'text-muted-foreground'}>
                      {data.taxaConfirmacao}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights de Comunicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-800 dark:text-green-400">✓ Taxa de confirmação acima da média</p>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                Sua taxa de {taxaMedia}% está acima da média do mercado (65%)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="font-medium text-blue-800 dark:text-blue-400">💡 Dica de otimização</p>
              <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                Envie lembretes 24h antes para aumentar a taxa de comparecimento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
