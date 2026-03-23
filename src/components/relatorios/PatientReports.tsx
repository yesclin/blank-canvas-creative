import { Users, UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import type {
  PatientReportData,
  PatientRetention,
  PatientByInsurance,
} from '@/types/relatorios';

interface PatientReportsProps {
  patientData: PatientReportData[];
  patientRetention: PatientRetention[];
  patientsByInsurance: PatientByInsurance[];
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  novos: { label: 'Novos', color: 'hsl(var(--primary))' },
  ativos: { label: 'Ativos', color: '#10b981' },
  retornos: { label: 'Retornos', color: '#8b5cf6' },
};

export function PatientReports({
  patientData,
  patientRetention,
  patientsByInsurance,
}: PatientReportsProps) {
  const totalNovos = patientData.reduce((acc, d) => acc + d.novos, 0);
  const totalAtivos = patientData[patientData.length - 1]?.ativos || 0;
  const totalRetornos = patientData.reduce((acc, d) => acc + d.retornos, 0);
  const avgRetention = Math.round(patientRetention.reduce((acc, d) => acc + d.retentionRate, 0) / patientRetention.length);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Novos Pacientes', value: totalNovos, format: 'number', variation: 12, icon: <UserPlus className="h-5 w-5" /> },
          { title: 'Pacientes Ativos', value: totalAtivos, format: 'number', icon: <Users className="h-5 w-5" /> },
          { title: 'Retornos', value: totalRetornos, format: 'number', variation: 8, icon: <RefreshCw className="h-5 w-5" /> },
          { title: 'Taxa de Retenção', value: avgRetention, format: 'percentage', variation: 3, icon: <UserCheck className="h-5 w-5" /> },
        ]}
      />

      <Tabs defaultValue="evolucao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="retencao">Retenção</TabsTrigger>
          <TabsTrigger value="convenio">Por Convênio</TabsTrigger>
        </TabsList>

        {/* Evolução de Pacientes */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area type="monotone" dataKey="novos" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Novos" />
                  <Area type="monotone" dataKey="retornos" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Retornos" />
                </AreaChart>
              </ChartContainer>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Novos</TableHead>
                      <TableHead className="text-right">Ativos</TableHead>
                      <TableHead className="text-right">Inativos</TableHead>
                      <TableHead className="text-right">Retornos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientData.map((data) => (
                      <TableRow key={data.period}>
                        <TableCell className="font-medium">{data.period}</TableCell>
                        <TableCell className="text-right text-primary font-semibold">{data.novos}</TableCell>
                        <TableCell className="text-right text-green-600">{data.ativos}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{data.inativos}</TableCell>
                        <TableCell className="text-right text-purple-600">{data.retornos}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retenção */}
        <TabsContent value="retencao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Retenção de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <LineChart data={patientRetention}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                  <Legend />
                  <Line type="monotone" dataKey="retentionRate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} name="Taxa de Retenção" />
                </LineChart>
              </ChartContainer>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Novos</TableHead>
                      <TableHead className="text-right">Retornantes</TableHead>
                      <TableHead className="text-right">Taxa de Retenção</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientRetention.map((data) => (
                      <TableRow key={data.month}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell className="text-right">{data.newPatients}</TableCell>
                        <TableCell className="text-right">{data.returningPatients}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{data.retentionRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Convênio */}
        <TabsContent value="convenio">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pacientes por Convênio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patientsByInsurance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="patientCount"
                        nameKey="insuranceName"
                        label={({ insuranceName, percentage }) => `${insuranceName}: ${percentage}%`}
                        labelLine={false}
                      >
                        {patientsByInsurance.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Convênio</TableHead>
                      <TableHead className="text-right">Pacientes</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsByInsurance.map((ins, index) => (
                      <TableRow key={ins.insuranceId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {ins.insuranceName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{ins.patientCount}</TableCell>
                        <TableCell className="text-right">{ins.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
