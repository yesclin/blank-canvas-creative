import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, DollarSign, Calendar, Users, Building2, User, Package, MessageSquare, Briefcase, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportsRealData } from '@/hooks/useReportsRealData';
import { useSalesReport } from '@/hooks/useSalesReport';
import { useSalesReportOptions } from '@/hooks/useSalesReportOptions';
import { useSalesReportExport } from '@/hooks/useSalesReportExport';
import { useProductMarginReport } from '@/hooks/useProductMarginReport';
import { useProductMarginReportOptions } from '@/hooks/useProductMarginReportOptions';
import { useProductMarginReportExport } from '@/hooks/useProductMarginReportExport';
import { useProcedureCostReport } from '@/hooks/useProcedureCostReport';
import { ReportFiltersBar } from '@/components/relatorios/ReportFiltersBar';
import { SalesReportFilters } from '@/components/relatorios/SalesReportFilters';
import { ProductMarginFilters } from '@/components/relatorios/ProductMarginFilters';
import { FinancialReports } from '@/components/relatorios/FinancialReports';
import { AppointmentReports } from '@/components/relatorios/AppointmentReports';
import { PatientReports } from '@/components/relatorios/PatientReports';
import { InsuranceReports } from '@/components/relatorios/InsuranceReports';
import { ProfessionalReports } from '@/components/relatorios/ProfessionalReports';
import { StockReports } from '@/components/relatorios/StockReports';
import { CommunicationReports } from '@/components/relatorios/CommunicationReports';
import { ExecutiveReport } from '@/components/relatorios/ExecutiveReport';
import { SalesReports } from '@/components/relatorios/SalesReports';
import { ProductMarginReport } from '@/components/relatorios/ProductMarginReport';
import { ProcedureCostReport } from '@/components/relatorios/ProcedureCostReport';
import { ReportSkeleton } from '@/components/relatorios/ReportSkeleton';
import { ReportEmptyState } from '@/components/relatorios/ReportEmptyState';
import { toast } from 'sonner';
import type { ReportFilters } from '@/types/relatorios';
import type { SalesReportFilters as SalesFiltersType } from '@/types/salesReport';
import type { ProductMarginFilters as MarginFiltersType } from '@/types/productMarginReport';

const reportTabs = [
  { value: 'gerencial', label: 'Gerencial', icon: Briefcase },
  { value: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { value: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { value: 'custos', label: 'Custos', icon: Receipt },
  { value: 'margem', label: 'Margem', icon: TrendingUp },
  { value: 'agenda', label: 'Agenda', icon: Calendar },
  { value: 'pacientes', label: 'Pacientes', icon: Users },
  { value: 'convenios', label: 'Convênios', icon: Building2 },
  { value: 'profissionais', label: 'Profissionais', icon: User },
  { value: 'estoque', label: 'Estoque', icon: Package },
  { value: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
];

export default function Relatorios() {
  const today = new Date();
  
  // Filtros gerais para outros relatórios
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  });

  // Filtros específicos para vendas
  const [salesFilters, setSalesFilters] = useState<SalesFiltersType>({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
    status: 'all',
  });

  // Filtros específicos para margem
  const [marginFilters, setMarginFilters] = useState<MarginFiltersType>({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
    status: 'all',
  });

  const [activeTab, setActiveTab] = useState('gerencial');

  const data = useReportsRealData(filters);
  const salesReport = useSalesReport(salesFilters);
  const marginReport = useProductMarginReport(marginFilters);
  const costReport = useProcedureCostReport(filters);
  const salesOptions = useSalesReportOptions();
  const marginOptions = useProductMarginReportOptions();
  const { exportCSV, exportPDF } = useSalesReportExport();
  const { exportCSV: exportMarginCSV, exportPDF: exportMarginPDF } = useProductMarginReportExport();

  const handleExportSalesCSV = () => {
    exportCSV({
      salesList: salesReport.salesList,
      summary: salesReport.summary,
      filters: salesFilters,
    });
  };

  const handleExportSalesPDF = () => {
    exportPDF({
      salesList: salesReport.salesList,
      summary: salesReport.summary,
      filters: salesFilters,
    });
  };

  const handleExportMarginCSV = () => {
    exportMarginCSV({
      items: marginReport.items,
      summary: marginReport.summary,
      filters: marginFilters,
    });
  };

  const handleExportMarginPDF = () => {
    exportMarginPDF({
      items: marginReport.items,
      summary: marginReport.summary,
      filters: marginFilters,
    });
  };
  const handleExportPDF = () => {
    const periodStr = `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    
    // Preparar dados para exportação
    const reportData = {
      periodo: periodStr,
      faturamento: data.totals.faturamento,
      recebido: data.totals.recebido,
      atendimentos: data.totals.atendimentos,
      realizados: data.totals.realizados,
      taxaOcupacao: data.totals.taxaOcupacao,
    };
    
    // Criar conteúdo do relatório
    const content = `
RELATÓRIO GERENCIAL - YESCLIN
Período: ${periodStr}
Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

===== RESUMO FINANCEIRO =====
Faturamento Total: R$ ${reportData.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Recebido: R$ ${reportData.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

===== ATENDIMENTOS =====
Total de Atendimentos: ${reportData.atendimentos}
Realizados: ${reportData.realizados}
Taxa de Ocupação: ${reportData.taxaOcupacao}%

===== PROFISSIONAIS =====
${data.professionalPerformance.map(p => `${p.professionalName}: ${p.appointmentsRealized} atendimentos - R$ ${p.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n')}
    `.trim();

    // Criar e baixar arquivo
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${format(filters.startDate, 'yyyy-MM-dd')}-${format(filters.endDate, 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const handleExportExcel = () => {
    const periodStr = `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    
    // Criar CSV
    let csv = 'RELATÓRIO GERENCIAL - YESCLIN\n';
    csv += `Período:,${periodStr}\n\n`;
    
    // Resumo
    csv += 'RESUMO FINANCEIRO\n';
    csv += 'Indicador,Valor\n';
    csv += `Faturamento Total,"R$ ${data.totals.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"\n`;
    csv += `Valor Recebido,"R$ ${data.totals.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"\n`;
    csv += `Total Atendimentos,${data.totals.atendimentos}\n`;
    csv += `Realizados,${data.totals.realizados}\n`;
    csv += `Taxa de Ocupação,${data.totals.taxaOcupacao}%\n\n`;
    
    // Profissionais
    csv += 'DESEMPENHO POR PROFISSIONAL\n';
    csv += 'Profissional,Especialidade,Atendimentos,Faturamento,Ticket Médio,Ocupação\n';
    data.professionalPerformance.forEach(p => {
      csv += `"${p.professionalName}","${p.specialty}",${p.appointmentsRealized},"R$ ${p.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}","R$ ${p.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}",${p.occupancyRate}%\n`;
    });
    csv += '\n';
    
    // Procedimentos
    csv += 'FATURAMENTO POR PROCEDIMENTO\n';
    csv += 'Procedimento,Quantidade,Faturamento,Valor Médio\n';
    data.revenueByProcedure.forEach(p => {
      csv += `"${p.procedureName}",${p.quantity},"R$ ${p.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}","R$ ${p.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"\n`;
    });

    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${format(filters.startDate, 'yyyy-MM-dd')}-${format(filters.endDate, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado em Excel (CSV)!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Visualize relatórios de atendimento, financeiro e indicadores da clínica
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Filtros - condicional baseado na tab */}
        {activeTab === 'vendas' ? (
          <SalesReportFilters
            filters={salesFilters}
            onFiltersChange={setSalesFilters}
            products={salesOptions.products}
            patients={salesOptions.patients}
            users={salesOptions.users}
            onExportCSV={handleExportSalesCSV}
            onExportPDF={handleExportSalesPDF}
          />
        ) : activeTab === 'margem' ? (
          <ProductMarginFilters
            filters={marginFilters}
            onFiltersChange={setMarginFilters}
            products={marginOptions.products}
            categories={marginOptions.categories}
            onExportCSV={handleExportMarginCSV}
            onExportPDF={handleExportMarginPDF}
          />
        ) : (
          <ReportFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            professionals={data.professionals}
            insurances={data.insurances}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        )}

        <TabsContent value="gerencial">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.financialData.length === 0 ? (
            <ReportEmptyState title="Sem dados gerenciais" />
          ) : (
            <ExecutiveReport summary={data.executiveSummary} financialTrend={data.financialData} />
          )}
        </TabsContent>

        <TabsContent value="financeiro">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.financialData.length === 0 ? (
            <ReportEmptyState title="Sem dados financeiros" />
          ) : (
            <FinancialReports
              financialData={data.financialData}
              revenueByProfessional={data.revenueByProfessional}
              revenueByProcedure={data.revenueByProcedure}
              revenueByPaymentMethod={data.revenueByPaymentMethod}
              packagesReport={data.packagesReport}
              totals={data.totals}
              filters={filters}
            />
          )}
        </TabsContent>

        <TabsContent value="vendas">
          <SalesReports
            summary={salesReport.summary}
            salesByPeriod={salesReport.salesByPeriod}
            salesByPaymentMethod={salesReport.salesByPaymentMethod}
            salesList={salesReport.salesList}
            isLoading={salesReport.isLoading}
          />
        </TabsContent>

        <TabsContent value="custos">
          <ProcedureCostReport
            data={costReport.data}
            summary={costReport.summary}
            isLoading={costReport.isLoading}
          />
        </TabsContent>

        <TabsContent value="margem">
          <ProductMarginReport
            items={marginReport.items}
            summary={marginReport.summary}
            isLoading={marginReport.isLoading}
          />
        </TabsContent>

        <TabsContent value="agenda">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.appointmentData.length === 0 ? (
            <ReportEmptyState title="Sem dados de agenda" />
          ) : (
            <AppointmentReports
              appointmentData={data.appointmentData}
              attendanceByProfessional={data.attendanceByProfessional}
              attendanceBySpecialty={data.attendanceBySpecialty}
              totals={data.totals}
            />
          )}
        </TabsContent>

        <TabsContent value="pacientes">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.patientData.length === 0 ? (
            <ReportEmptyState title="Sem dados de pacientes" />
          ) : (
            <PatientReports
              patientData={data.patientData}
              patientRetention={data.patientRetention}
              patientsByInsurance={data.patientsByInsurance}
            />
          )}
        </TabsContent>

        <TabsContent value="convenios">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.insuranceReport.length === 0 ? (
            <ReportEmptyState title="Sem dados de convênios" />
          ) : (
            <InsuranceReports insuranceReport={data.insuranceReport} />
          )}
        </TabsContent>

        <TabsContent value="profissionais">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.professionalPerformance.length === 0 ? (
            <ReportEmptyState title="Sem dados de profissionais" />
          ) : (
            <ProfessionalReports professionalPerformance={data.professionalPerformance} />
          )}
        </TabsContent>

        <TabsContent value="estoque">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.stockConsumption.length === 0 ? (
            <ReportEmptyState title="Sem dados de estoque" />
          ) : (
            <StockReports stockConsumption={data.stockConsumption} />
          )}
        </TabsContent>

        <TabsContent value="comunicacao">
          {data.isLoading ? (
            <ReportSkeleton />
          ) : data.communicationData.length === 0 ? (
            <ReportEmptyState title="Sem dados de comunicação" />
          ) : (
            <CommunicationReports communicationData={data.communicationData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
