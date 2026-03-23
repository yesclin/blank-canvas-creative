import { useState, useMemo } from "react";
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Wallet,
  Loader2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeriodFilter = "current" | "last" | "last3";

export default function MeuFinanceiro() {
  const { professionalId, isLoading: permissionsLoading } = usePermissions();
  const [period, setPeriod] = useState<PeriodFilter>("current");

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "current":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  // Fetch professional's appointments with financial data
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["my-appointments-finance", professionalId, dateRange],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          start_time,
          status,
          expected_value,
          procedure_cost,
          payment_type,
          has_pending_payment,
          patient:patients(id, full_name),
          procedure:procedures(id, name),
          insurance:insurances(id, name)
        `)
        .eq("professional_id", professionalId)
        .gte("scheduled_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(dateRange.end, "yyyy-MM-dd"))
        .in("status", ["finalizado", "em_atendimento", "confirmado", "chegou"])
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });

  // Fetch transactions linked to this professional
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["my-transactions", professionalId, dateRange],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("finance_transactions")
        .select(`
          id,
          transaction_date,
          description,
          amount,
          type,
          payment_method,
          patient:patients(id, full_name)
        `)
        .eq("professional_id", professionalId)
        .eq("type", "entrada")
        .gte("transaction_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(dateRange.end, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });

  // Fetch fee calculations (commissions/repasses)
  const { data: feeCalculations = [], isLoading: feesLoading } = useQuery({
    queryKey: ["my-fee-calculations", professionalId, dateRange],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("insurance_fee_calculations")
        .select(`
          id,
          service_date,
          gross_value,
          professional_fee,
          status,
          payment_date,
          insurance:insurances(id, name),
          patient:patients(id, full_name)
        `)
        .eq("professional_id", professionalId)
        .gte("service_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("service_date", format(dateRange.end, "yyyy-MM-dd"))
        .order("service_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const completedAppointments = appointments.filter(a => a.status === "finalizado");
    const totalBilled = completedAppointments.reduce((sum, a) => sum + (a.expected_value || 0), 0);
    const pendingPayment = appointments.filter(a => a.has_pending_payment).length;
    const totalCommissions = feeCalculations.reduce((sum, f) => sum + (f.professional_fee || 0), 0);
    const paidCommissions = feeCalculations
      .filter(f => f.status === "pago")
      .reduce((sum, f) => sum + (f.professional_fee || 0), 0);
    const pendingCommissions = totalCommissions - paidCommissions;

    return {
      totalAppointments: completedAppointments.length,
      totalBilled,
      pendingPayment,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
    };
  }, [appointments, feeCalculations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      finalizado: { label: "Finalizado", variant: "default" },
      em_atendimento: { label: "Em Atendimento", variant: "secondary" },
      confirmado: { label: "Confirmado", variant: "outline" },
      chegou: { label: "Chegou", variant: "outline" },
      pago: { label: "Pago", variant: "default" },
      pendente: { label: "Pendente", variant: "secondary" },
      aguardando: { label: "Aguardando", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isLoading = permissionsLoading || appointmentsLoading || transactionsLoading || feesLoading;

  // If user is not a professional, show access denied
  if (!permissionsLoading && !professionalId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta área é exclusiva para profissionais. Você precisa estar vinculado a um registro de profissional para acessar seus dados financeiros.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Meu Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus atendimentos, faturamento e repasses
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês atual</SelectItem>
            <SelectItem value="last">Mês anterior</SelectItem>
            <SelectItem value="last3">Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">finalizados no período</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalBilled)}</div>
            <p className="text-xs text-muted-foreground">valor dos atendimentos</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repasses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.paidCommissions)}</div>
            <p className="text-xs text-muted-foreground">recebidos de convênios</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingCommissions)}</div>
            <p className="text-xs text-muted-foreground">repasses pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Atendimentos</TabsTrigger>
          <TabsTrigger value="transactions">Recebimentos</TabsTrigger>
          <TabsTrigger value="commissions">Repasses (Convênios)</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meus Atendimentos</CardTitle>
              <CardDescription>
                Lista de atendimentos realizados no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum atendimento encontrado no período.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {format(new Date(apt.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                          <span className="text-muted-foreground text-xs ml-1">
                            {apt.start_time?.slice(0, 5)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {apt.patient?.full_name || "-"}
                        </TableCell>
                        <TableCell>{apt.procedure?.name || "-"}</TableCell>
                        <TableCell>
                          {apt.insurance ? (
                            <Badge variant="outline">{apt.insurance.name}</Badge>
                          ) : (
                            <Badge variant="secondary">Particular</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(apt.expected_value || 0)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(apt.status)}
                          {apt.has_pending_payment && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meus Recebimentos</CardTitle>
              <CardDescription>
                Transações financeiras vinculadas aos seus atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum recebimento encontrado no período.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {format(new Date(tx.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{tx.patient?.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.payment_method || "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Repasses de Convênios</CardTitle>
              <CardDescription>
                Comissões e repasses dos atendimentos via convênio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeCalculations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum repasse encontrado no período.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Serviço</TableHead>
                      <TableHead>Convênio</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Valor Bruto</TableHead>
                      <TableHead>Seu Repasse</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeCalculations.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          {format(new Date(fee.service_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{fee.insurance?.name || "-"}</TableCell>
                        <TableCell>{fee.patient?.full_name || "-"}</TableCell>
                        <TableCell>{formatCurrency(fee.gross_value)}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatCurrency(fee.professional_fee)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(fee.status)}
                          {fee.payment_date && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {format(new Date(fee.payment_date), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
