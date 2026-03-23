import { Calendar, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import type {
  AppointmentReportData,
  AttendanceByProfessional,
  AttendanceBySpecialty,
} from '@/types/relatorios';

interface AppointmentReportsProps {
  appointmentData: AppointmentReportData[];
  attendanceByProfessional: AttendanceByProfessional[];
  attendanceBySpecialty: AttendanceBySpecialty[];
  totals: {
    atendimentos: number;
    realizados: number;
    faltas: number;
    taxaOcupacao: number;
    taxaFaltas: number;
  };
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  realizados: { label: 'Realizados', color: '#10b981' },
  cancelados: { label: 'Cancelados', color: '#f59e0b' },
  faltas: { label: 'Faltas', color: '#ef4444' },
};

export function AppointmentReports({
  appointmentData,
  attendanceByProfessional,
  attendanceBySpecialty,
  totals,
}: AppointmentReportsProps) {
  const cancelados = appointmentData.reduce((acc, d) => acc + d.cancelados, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Total de Atendimentos', value: totals.atendimentos, format: 'number', icon: <Calendar className="h-5 w-5" /> },
          { title: 'Realizados', value: totals.realizados, format: 'number', variation: 5, icon: <CheckCircle className="h-5 w-5" /> },
          { title: 'Taxa de Ocupação', value: totals.taxaOcupacao, format: 'percentage', icon: <Clock className="h-5 w-5" /> },
          { title: 'Taxa de Faltas', value: totals.taxaFaltas, format: 'percentage', variation: -2, icon: <AlertTriangle className="h-5 w-5" /> },
        ]}
      />

      <Tabs defaultValue="evolucao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="profissional">Por Profissional</TabsTrigger>
          <TabsTrigger value="especialidade">Por Especialidade</TabsTrigger>
        </TabsList>

        {/* Evolução dos Atendimentos */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atendimentos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="realizados" stackId="a" fill="#10b981" name="Realizados" />
                  <Bar dataKey="cancelados" stackId="a" fill="#f59e0b" name="Cancelados" />
                  <Bar dataKey="faltas" stackId="a" fill="#ef4444" name="Faltas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Profissional */}
        <TabsContent value="profissional">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atendimentos por Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {attendanceByProfessional.map((prof) => (
                  <div key={prof.professionalId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prof.professionalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {prof.realized} realizados • {prof.cancelled} cancelados • {prof.noShow} faltas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{prof.occupancyRate}%</p>
                        <p className="text-xs text-muted-foreground">ocupação</p>
                      </div>
                    </div>
                    <Progress value={prof.occupancyRate} className="h-2" />
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-center">Realizados</TableHead>
                      <TableHead className="text-center">Cancelados</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-center">Ocupação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceByProfessional.map((prof) => (
                      <TableRow key={prof.professionalId}>
                        <TableCell className="font-medium">{prof.professionalName}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {prof.realized}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-yellow-600">
                            <XCircle className="h-4 w-4" />
                            {prof.cancelled}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            {prof.noShow}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{prof.occupancyRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Especialidade */}
        <TabsContent value="especialidade">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atendimentos por Especialidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceBySpecialty}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="specialtyName"
                        label={({ specialtyName, percentage }) => `${specialtyName}: ${percentage}%`}
                        labelLine={false}
                      >
                        {attendanceBySpecialty.map((_, index) => (
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
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-right">Atendimentos</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceBySpecialty.map((spec, index) => (
                      <TableRow key={spec.specialtyId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {spec.specialtyName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{spec.count}</TableCell>
                        <TableCell className="text-right">{spec.percentage}%</TableCell>
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
