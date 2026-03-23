import { useState } from "react";
import { DollarSign, Search, Filter, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InsuranceFeeCalculation, FeeCalculationStatus, ConvenioFinancialSummary } from "@/types/convenios";
import { feeCalculationStatusLabels, feeCalculationStatusColors } from "@/types/convenios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeeCalculationListProps {
  feeCalculations: InsuranceFeeCalculation[];
  financialSummary: ConvenioFinancialSummary[];
  professionals: Array<{ id: string; name: string }>;
}

export function FeeCalculationList({ feeCalculations, financialSummary, professionals }: FeeCalculationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [professionalFilter, setProfessionalFilter] = useState<string>("all");

  const filteredCalculations = feeCalculations.filter((calc) => {
    const matchesSearch = 
      calc.guide_number?.toLowerCase().includes(search.toLowerCase()) ||
      calc.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      calc.professional_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || calc.status === statusFilter;
    const matchesProfessional = professionalFilter === "all" || calc.professional_id === professionalFilter;
    
    return matchesSearch && matchesStatus && matchesProfessional;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalPending = feeCalculations
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + c.gross_value, 0);

  const totalProfessionalFees = feeCalculations
    .filter(c => c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.professional_fee, 0);

  const totalClinicNet = feeCalculations
    .filter(c => c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.clinic_net_value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">valor bruto pendente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repasse Profissionais</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalProfessionalFees)}</div>
            <p className="text-xs text-muted-foreground">total de repasses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líquido Clínica</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalClinicNet)}</div>
            <p className="text-xs text-muted-foreground">valor retido pela clínica</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {feeCalculations.length > 0 
                ? Math.round((totalClinicNet / (totalClinicNet + totalProfessionalFees)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">retenção da clínica</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary by Insurance */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Convênio</CardTitle>
          <CardDescription>Visão financeira por operadora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialSummary.map((summary) => (
              <div key={summary.insuranceId} className="p-4 border rounded-lg space-y-3">
                <div className="font-medium">{summary.insuranceName}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Guias:</span>
                    <span className="ml-2 font-medium">{summary.totalGuides}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="ml-2 font-medium text-yellow-600">{summary.pendingPayments}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Solicitado:</span>
                    <span className="ml-2 font-medium">{formatCurrency(summary.totalRequested)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aprovado:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(summary.totalApproved)}</span>
                  </div>
                  {summary.totalGlosa > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Glosa:</span>
                      <span className="ml-2 font-medium text-red-600">{formatCurrency(summary.totalGlosa)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t flex justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Repasse:</span>
                    <span className="ml-2 font-medium">{formatCurrency(summary.totalProfessionalFees)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Líquido:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(summary.totalClinicNet)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Detalhamento de Repasses
          </CardTitle>
          <CardDescription>
            Cálculos de repasse por guia/atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar guia, paciente..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="calculado">Calculado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Profissionais</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guia</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Repasse Prof.</TableHead>
                <TableHead className="text-right">Líquido Clínica</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum cálculo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-mono">{calc.guide_number || '-'}</TableCell>
                    <TableCell>{calc.insurance_name}</TableCell>
                    <TableCell>{calc.patient_name}</TableCell>
                    <TableCell>{calc.professional_name || '-'}</TableCell>
                    <TableCell>
                      {format(parseISO(calc.service_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(calc.gross_value)}</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(calc.professional_fee)}
                      {calc.fee_type === 'percentage' && calc.fee_percentage && (
                        <span className="text-xs text-muted-foreground ml-1">({calc.fee_percentage}%)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(calc.clinic_net_value)}
                    </TableCell>
                    <TableCell>
                      <Badge className={feeCalculationStatusColors[calc.status]}>
                        {feeCalculationStatusLabels[calc.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
